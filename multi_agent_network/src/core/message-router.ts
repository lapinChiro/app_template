import type { ISubscriptionRegistry } from './subscription-registry';
import type { IDeliveryEngine } from './delivery-engine'; 
import type { IHealthMonitor } from './health-monitor';
import type { ValidatedMessage } from './message-validator';
import type { AgentId, MessageId } from './types/branded-types';

// Routing result information
export interface RoutingResult {
  success: boolean;
  messageId: MessageId;
  routedTo: AgentId[];
  subscriberCount: number;
  routingTime: number;
  lookupTime: number;
  deliveryTime: number;
  noSubscribersFound: boolean;
  patternMatchesFound: number;
  deliveryFailures: number;
  error?: Error;
}

// Routing configuration
export interface RoutingConfig {
  routingTimeoutMs: number;
  maxSubscribersPerMessage: number;
  enablePerformanceLogging: boolean;
}

// Router statistics
export interface RouterStats {
  totalRoutedMessages: number;
  averageRoutingTime: number;
  successfulRoutes: number;
  failedRoutes: number;
  averageSubscribersPerMessage: number;
  noSubscriberMessages: number;
}

// Router health status
export interface RouterHealth {
  isHealthy: boolean;
  lastRoutingTime: number;
  totalRoutes: number;
  errorRate: number;
  lastError?: Error;
}

/**
 * Interface for message routing (CLAUDE.md SOLID: Interface Segregation)
 */
export interface IMessageRouter {
  route(message: ValidatedMessage): Promise<RoutingResult>;
  getStats(): RouterStats;
  getHealth(): RouterHealth;
}

/**
 * High-performance message router with dependency injection
 * Implements CLAUDE.md principles: Single Responsibility, Dependency Inversion
 */
export class MessageRouter implements IMessageRouter {
  private readonly config: RoutingConfig;
  
  // Statistics tracking
  private totalMessages = 0;
  private successfulRoutes = 0;
  private failedRoutes = 0;
  private totalSubscribers = 0;
  private noSubscriberCount = 0;
  private routingTimes: number[] = [];
  private lastError?: Error;

  // Health monitoring constants
  private readonly COMPONENT_ID = 'MessageRouter';
  private readonly ROUTING_TIMEOUT_MS = 30;
  private readonly MAX_ROUTING_TIME_SAMPLES = 1000;

  constructor(
    private readonly subscriptionRegistry: ISubscriptionRegistry,
    private readonly deliveryEngine: IDeliveryEngine,
    private readonly healthMonitor: IHealthMonitor,
    config?: Partial<RoutingConfig>
  ) {
    this.config = {
      routingTimeoutMs: 30,
      maxSubscribersPerMessage: 1000,
      enablePerformanceLogging: true,
      ...config
    };

    // Initialize health monitoring
    this.healthMonitor.setCircuitBreakerThreshold(this.COMPONENT_ID, 5);
  }

  /**
   * Routes a message to all matching subscribers
   * @param message - The validated message to route
   * @returns RoutingResult with detailed routing information
   */
  async route(message: ValidatedMessage): Promise<RoutingResult> {
    const startTime = process.hrtime.bigint();
    
    try {
      // Lookup subscribers
      const lookupStart = process.hrtime.bigint();
      const subscribers = this.subscriptionRegistry.getSubscribers(message.type as any); // Type assertion needed for branded type
      const lookupEnd = process.hrtime.bigint();
      const lookupTime = Number(lookupEnd - lookupStart) / 1000000;

      // Handle case with no subscribers
      if (subscribers.length === 0) {
        const endTime = process.hrtime.bigint();
        const routingTime = Number(endTime - startTime) / 1000000;
        
        this.updateStats(true, routingTime, 0, true);
        this.recordHealthSuccess(routingTime);

        return {
          success: true,
          messageId: message.id as MessageId,
          routedTo: [],
          subscriberCount: 0,
          routingTime,
          lookupTime,
          deliveryTime: 0,
          noSubscribersFound: true,
          patternMatchesFound: 0,
          deliveryFailures: 0
        };
      }

      // Check subscriber limit
      if (subscribers.length > this.config.maxSubscribersPerMessage) {
        console.warn(`Large routing operation: ${subscribers.length} subscribers for message ${message.id}`);
      }

      // Deliver message
      const deliveryStart = process.hrtime.bigint();
      const deliveryResult = await this.deliveryEngine.deliver(message, subscribers);
      const deliveryEnd = process.hrtime.bigint();
      const deliveryTime = Number(deliveryEnd - deliveryStart) / 1000000;

      const endTime = process.hrtime.bigint();
      const totalRoutingTime = Number(endTime - startTime) / 1000000;

      // Update statistics and health
      this.updateStats(deliveryResult.success, totalRoutingTime, subscribers.length, false);
      
      if (deliveryResult.success) {
        this.recordHealthSuccess(totalRoutingTime);
      } else {
        this.recordHealthFailure(new Error(`Delivery failed: ${deliveryResult.failedDeliveries.length} failures`));
      }

      // Log performance if enabled
      if (this.config.enablePerformanceLogging && totalRoutingTime > this.ROUTING_TIMEOUT_MS) {
        console.warn(`Message routing exceeded threshold: ${totalRoutingTime}ms > ${this.ROUTING_TIMEOUT_MS}ms`, {
          messageId: message.id,
          messageType: message.type,
          subscriberCount: subscribers.length
        });
      }

      return {
        success: deliveryResult.success,
        messageId: message.id as MessageId,
        routedTo: deliveryResult.deliveredTo,
        subscriberCount: subscribers.length,
        routingTime: totalRoutingTime,
        lookupTime,
        deliveryTime,
        noSubscribersFound: false,
        patternMatchesFound: subscribers.length,
        deliveryFailures: deliveryResult.failedDeliveries.length
      };

    } catch (error) {
      const endTime = process.hrtime.bigint();
      const routingTime = Number(endTime - startTime) / 1000000;
      const routingError = error instanceof Error ? error : new Error(String(error));
      
      this.updateStats(false, routingTime, 0, false);
      this.recordHealthFailure(routingError);

      return {
        success: false,
        messageId: message.id as MessageId,
        routedTo: [],
        subscriberCount: 0,
        routingTime,
        lookupTime: 0,
        deliveryTime: 0,
        noSubscribersFound: false,
        patternMatchesFound: 0,
        deliveryFailures: 1,
        error: routingError
      };
    }
  }

  /**
   * Gets comprehensive routing statistics
   * @returns RouterStats object
   */
  getStats(): RouterStats {
    const averageRoutingTime = this.routingTimes.length > 0
      ? this.routingTimes.reduce((sum, time) => sum + time, 0) / this.routingTimes.length
      : 0;

    const averageSubscribers = this.totalMessages > 0
      ? this.totalSubscribers / this.totalMessages
      : 0;

    return {
      totalRoutedMessages: this.totalMessages,
      averageRoutingTime,
      successfulRoutes: this.successfulRoutes,
      failedRoutes: this.failedRoutes,
      averageSubscribersPerMessage: averageSubscribers,
      noSubscriberMessages: this.noSubscriberCount
    };
  }

  /**
   * Gets current router health status
   * @returns RouterHealth object
   */
  getHealth(): RouterHealth {
    const lastRoutingTime = this.routingTimes.length > 0 
      ? (this.routingTimes[this.routingTimes.length - 1] ?? 0)
      : 0;

    const errorRate = this.totalMessages > 0
      ? (this.failedRoutes / this.totalMessages) * 100
      : 0;

    const result: RouterHealth = {
      isHealthy: errorRate < 5, // Less than 5% error rate
      lastRoutingTime,
      totalRoutes: this.totalMessages,
      errorRate
    };
    
    if (this.lastError) {
      result.lastError = this.lastError;
    }
    
    return result;
  }

  /**
   * Updates routing statistics
   * @param success - Whether the routing was successful
   * @param routingTime - Time taken for routing
   * @param subscriberCount - Number of subscribers
   * @param noSubscribers - Whether there were no subscribers
   * @private
   */
  private updateStats(
    success: boolean, 
    routingTime: number, 
    subscriberCount: number, 
    noSubscribers: boolean
  ): void {
    this.totalMessages++;
    
    if (success) {
      this.successfulRoutes++;
    } else {
      this.failedRoutes++;
    }
    
    if (noSubscribers) {
      this.noSubscriberCount++;
    }
    
    this.totalSubscribers += subscriberCount;
    
    // Keep routing time history (with limit to prevent memory growth)
    this.routingTimes.push(routingTime);
    if (this.routingTimes.length > this.MAX_ROUTING_TIME_SAMPLES) {
      this.routingTimes.shift(); // Remove oldest sample
    }
  }

  /**
   * Records successful routing in health monitor
   * @param routingTime - Time taken for routing
   * @private
   */
  private recordHealthSuccess(routingTime: number): void {
    this.healthMonitor.recordHealth(
      this.COMPONENT_ID,
      true,
      `Routing successful in ${routingTime.toFixed(2)}ms`
    );
  }

  /**
   * Records failed routing in health monitor
   * @param error - The error that occurred
   * @private
   */
  private recordHealthFailure(error: Error): void {
    this.lastError = error;
    this.healthMonitor.recordFailure(this.COMPONENT_ID, error);
  }
}