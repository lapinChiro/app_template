// Import all component interfaces and implementations
import { CachedPatternMatcher, type IPatternMatcher } from './pattern-matcher';
import { SubscriptionRegistry, type ISubscriptionRegistry } from './subscription-registry';
import { DeliveryEngine, type IDeliveryEngine } from './delivery-engine';
import { HealthMonitor, type IHealthMonitor } from './health-monitor';
import { CorrelationManager, type ICorrelationManager } from './correlation-manager';
import { MessageRouter, type IMessageRouter } from './message-router';

// Configuration for the messaging system
export interface MessagingConfig {
  maxConcurrentDeliveries: number;
  defaultRequestTimeout: number;
  circuitBreakerThreshold: number;
  patternCacheSize: number;
  subscriptionLimit: number;
  enablePerformanceLogging: boolean;
}

// Default configuration
export const defaultMessagingConfig: MessagingConfig = {
  maxConcurrentDeliveries: 1000,
  defaultRequestTimeout: 5000,
  circuitBreakerThreshold: 10,
  patternCacheSize: 1000,
  subscriptionLimit: 100,
  enablePerformanceLogging: true
};

/**
 * Dependency injection container for messaging system components
 * Implements CLAUDE.md principles: Dependency Inversion, Single Responsibility
 * Replaces Singleton pattern with proper DI for better testability
 */
export class MessagingSystemContainer {
  private readonly patternMatcher: IPatternMatcher;
  private readonly subscriptionRegistry: ISubscriptionRegistry;
  private readonly deliveryEngine: IDeliveryEngine;
  private readonly healthMonitor: IHealthMonitor;
  private readonly correlationManager: ICorrelationManager;
  private readonly messageRouter: IMessageRouter;
  private readonly config: MessagingConfig;

  constructor(
    patternMatcher: IPatternMatcher,
    subscriptionRegistry: ISubscriptionRegistry,
    deliveryEngine: IDeliveryEngine,
    healthMonitor: IHealthMonitor,
    correlationManager: ICorrelationManager,
    messageRouter: IMessageRouter,
    config: MessagingConfig
  ) {
    this.patternMatcher = patternMatcher;
    this.subscriptionRegistry = subscriptionRegistry;
    this.deliveryEngine = deliveryEngine;
    this.healthMonitor = healthMonitor;
    this.correlationManager = correlationManager;
    this.messageRouter = messageRouter;
    this.config = { ...config }; // Defensive copy
  }

  // Component access methods
  getPatternMatcher(): IPatternMatcher {
    return this.patternMatcher;
  }

  getSubscriptionRegistry(): ISubscriptionRegistry {
    return this.subscriptionRegistry;
  }

  getDeliveryEngine(): IDeliveryEngine {
    return this.deliveryEngine;
  }

  getHealthMonitor(): IHealthMonitor {
    return this.healthMonitor;
  }

  getCorrelationManager(): ICorrelationManager {
    return this.correlationManager;
  }

  getMessageRouter(): IMessageRouter {
    return this.messageRouter;
  }

  getConfig(): MessagingConfig {
    return { ...this.config }; // Return defensive copy
  }
}

/**
 * Factory function to create a fully configured messaging system container
 * Implements dependency injection pattern to replace Singleton usage
 * @param config - Optional custom configuration
 * @returns Configured MessagingSystemContainer
 */
export function createMessagingSystemContainer(
  config: Partial<MessagingConfig> = {}
): MessagingSystemContainer {
  // Validate and merge configuration
  const finalConfig = validateAndMergeConfig(config);

  // Create components in dependency order (no circular dependencies)
  
  // 1. Pattern matcher (no dependencies)
  const patternMatcher = new CachedPatternMatcher(finalConfig.patternCacheSize);

  // 2. Health monitor (no dependencies)
  const healthMonitor = new HealthMonitor();

  // 3. Delivery engine (no dependencies)
  const deliveryEngine = new DeliveryEngine();

  // 4. Correlation manager (no dependencies)
  const correlationManager = new CorrelationManager();

  // 5. Subscription registry (depends on pattern matcher)
  const subscriptionRegistry = new SubscriptionRegistry(patternMatcher);

  // 6. Message router (depends on subscription registry, delivery engine, health monitor)
  const messageRouter = new MessageRouter(
    subscriptionRegistry,
    deliveryEngine,
    healthMonitor,
    {
      routingTimeoutMs: 30,
      maxSubscribersPerMessage: 1000,
      enablePerformanceLogging: finalConfig.enablePerformanceLogging
    }
  );

  // Create and return container
  return new MessagingSystemContainer(
    patternMatcher,
    subscriptionRegistry,
    deliveryEngine,
    healthMonitor,
    correlationManager,
    messageRouter,
    finalConfig
  );
}

/**
 * Validates configuration and merges with defaults
 * @param config - Partial configuration to validate and merge
 * @returns Complete, validated configuration
 * @throws Error if configuration is invalid
 */
function validateAndMergeConfig(config: Partial<MessagingConfig>): MessagingConfig {
  const merged = { ...defaultMessagingConfig, ...config };

  // Validation rules
  const validations = [
    { field: 'maxConcurrentDeliveries', value: merged.maxConcurrentDeliveries, min: 1 },
    { field: 'defaultRequestTimeout', value: merged.defaultRequestTimeout, min: 100 },
    { field: 'circuitBreakerThreshold', value: merged.circuitBreakerThreshold, min: 1 },
    { field: 'patternCacheSize', value: merged.patternCacheSize, min: 10 },
    { field: 'subscriptionLimit', value: merged.subscriptionLimit, min: 1 }
  ];

  for (const validation of validations) {
    if (validation.value < validation.min) {
      throw new Error(
        `Invalid configuration: ${validation.field} must be at least ${validation.min}, got ${validation.value}`
      );
    }
  }

  return merged;
}

// MessagingSystemContainer is already exported as a class above