import { v4 as uuidv4 } from 'uuid';
import { createLogger } from './logger';
import { SecurityMonitor } from './security-monitor';
import { PerformanceMonitor } from './performance-monitor';
import { AgentError, ErrorCode } from './errors';
import type { Message } from './types/message';
import type { Logger } from 'winston';

// Phase2 imports (only loaded when messaging is enabled)
import type { MessagingSystemContainer, MessagingConfig } from './messaging-system-container';
import type { MessagePattern, AgentId } from './types/branded-types';

/**
 * Message handler function type
 * @template T The type of the message payload
 */
export type MessageHandler<T = unknown> = (message: Message<T>) => void | Promise<void>;

/**
 * Core agent class implementing isolated memory and messaging capabilities
 * 
 * Each agent has:
 * - Unique identifier (UUID)
 * - Isolated private memory (using JavaScript closures)
 * - Message handling capabilities
 * - Lifecycle management with proper cleanup
 * 
 * Security features:
 * - Memory access is logged to SecurityMonitor
 * - Performance metrics are tracked
 * - Destroyed agents reject all operations
 * 
 * @example
 * ```typescript
 * const agent = new Agent();
 * 
 * // Store data in private memory
 * agent.setMemory('config', { apiKey: 'secret' });
 * 
 * // Handle incoming messages
 * agent.onMessage((message) => {
 *   console.log('Received:', message);
 * });
 * 
 * // Clean up when done
 * await agent.destroy();
 * ```
 */
export class Agent {
  /** Unique identifier for this agent */
  public readonly id: string;
  
  /** Logger instance */
  private readonly logger: Logger;
  
  /** Private memory storage (closure) */
  private readonly memory: Map<string, unknown>;
  
  /** Message handlers */
  private readonly messageHandlers: Set<MessageHandler>;
  
  /** Agent active state */
  private isDestroyed: boolean;
  
  /** Security monitor instance */
  private readonly securityMonitor: SecurityMonitor;
  
  /** Performance monitor instance */
  private readonly performanceMonitor: PerformanceMonitor;

  // Phase2: Optional messaging system components (null when disabled)
  /** Messaging system container for Phase2 functionality */
  private messagingSystem: MessagingSystemContainer | null = null;
  
  /** Active message subscriptions for this agent */
  private subscriptions: Set<string> | null = null;
  
  /** Flag indicating if Phase2 messaging is enabled */
  private messagingEnabled = false;
  
  /**
   * Creates a new agent with unique ID and isolated memory
   * 
   * @param id - Optional custom ID for the agent. If not provided, a UUID will be generated
   */
  constructor(id?: string) {
    const creationStartTime = Date.now();
    
    this.id = id ?? uuidv4();
    this.logger = createLogger(`Agent:${this.id}`);
    this.memory = new Map();
    this.messageHandlers = new Set();
    this.isDestroyed = false;
    
    // Get singleton instances
    // @ts-expect-error Protected constructor type issue with Singleton pattern
    this.securityMonitor = SecurityMonitor.getInstance();
    // @ts-expect-error Protected constructor type issue with Singleton pattern
    this.performanceMonitor = PerformanceMonitor.getInstance();
    
    // Register with security monitor
    this.securityMonitor.registerAgent(this.id);
    
    // Record creation time
    const creationDuration = Date.now() - creationStartTime;
    this.performanceMonitor.recordCreation(this.id, creationDuration);
    
    this.logger.info('Agent created', { agentId: this.id });
  }
  
  /**
   * Get a value from the agent's private memory
   * 
   * @param key - The key to retrieve
   * @returns The stored value, or undefined if not found
   * @throws {AgentError} If the agent has been destroyed
   */
  public getMemory(key: string): unknown {
    this.ensureActive();
    
    // Log memory access for security monitoring
    this.securityMonitor.logMemoryAccess(this.id, 'read', key);
    
    return this.memory.get(key);
  }
  
  /**
   * Store a value in the agent's private memory
   * 
   * @param key - The key to store under
   * @param value - The value to store
   * @throws {AgentError} If the agent has been destroyed
   */
  public setMemory(key: string, value: unknown): void {
    this.ensureActive();
    
    // Log memory access for security monitoring
    this.securityMonitor.logMemoryAccess(this.id, 'write', key);
    
    this.memory.set(key, value);
  }
  
  /**
   * Register a message handler
   * 
   * Multiple handlers can be registered and will all be called
   * when a message is received.
   * 
   * @param handler - The message handler function
   * @throws {AgentError} If the agent has been destroyed
   */
  public onMessage(handler: MessageHandler): void {
    this.ensureActive();
    this.messageHandlers.add(handler);
  }
  
  /**
   * Receive and process a message
   * 
   * All registered handlers will be called with the message.
   * Performance metrics are recorded.
   * 
   * @param message - The message to process
   * @throws {AgentError} If the agent has been destroyed
   */
  public async receiveMessage(message: Message): Promise<void> {
    this.ensureActive();
    
    const receiveStartTime = Date.now();
    
    this.logger.debug('Received message', {
      messageId: message.id,
      from: message.from,
      type: message.type
    });
    
    // Call all registered handlers
    const handlerPromises = Array.from(this.messageHandlers).map(handler => 
      Promise.resolve(handler(message))
    );
    
    await Promise.all(handlerPromises);
    
    // Record delivery time
    const deliveryDuration = Date.now() - receiveStartTime;
    this.performanceMonitor.recordMessageDelivery(
      message.from,
      this.id,
      deliveryDuration
    );
  }
  
  /**
   * Check if the agent is still active
   * 
   * @returns true if the agent is active, false if destroyed
   */
  public isActive(): boolean {
    return !this.isDestroyed;
  }
  
  /**
   * Destroy the agent and clean up resources
   * 
   * This method:
   * - Unregisters from SecurityMonitor
   * - Records destruction metrics
   * - Clears memory
   * - Prevents further operations
   * 
   * Safe to call multiple times (idempotent)
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  // eslint-disable-next-line @typescript-eslint/require-await
  public async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }
    
    const destructionStartTime = Date.now();
    
    this.logger.info('Destroying agent', { agentId: this.id });
    
    // Mark as destroyed first to prevent race conditions
    this.isDestroyed = true;
    
    // Phase2: Clean up messaging subscriptions if enabled
    if (this.messagingEnabled && this.messagingSystem) {
      try {
        // Clean up all subscriptions
        if (this.subscriptions) {
          for (const pattern of this.subscriptions) {
            try {
              await this.messagingSystem
                .getSubscriptionRegistry()
                .unsubscribe(this.id as AgentId, pattern as MessagePattern);
            } catch (error) {
              this.logger.warn('Error cleaning up subscription', { 
                pattern, 
                error: error instanceof Error ? error.message : error 
              });
            }
          }
        }
        
        // Clean up from messaging system
        this.messagingSystem.getSubscriptionRegistry().registerAgent = () => {}; // Prevent further registration
        
        this.logger.debug('Phase2 messaging cleanup completed', { agentId: this.id });
      } catch (error) {
        this.logger.error('Error during Phase2 cleanup', { 
          agentId: this.id, 
          error: error instanceof Error ? error.message : error 
        });
      }
    }

    // Unregister from security monitor
    this.securityMonitor.unregisterAgent(this.id);
    
    // Clear memory
    this.memory.clear();
    
    // Clear message handlers
    this.messageHandlers.clear();
    
    // Phase2: Clear messaging state
    this.subscriptions?.clear();
    this.messagingSystem = null;
    this.messagingEnabled = false;
    
    // Record destruction time
    const destructionDuration = Date.now() - destructionStartTime;
    this.performanceMonitor.recordDestruction(this.id, destructionDuration);
    
    this.logger.info('Agent destroyed', { agentId: this.id });
  }
  
  /**
   * Ensure the agent is still active
   * @throws {AgentError} If the agent has been destroyed
   */
  private ensureActive(): void {
    if (this.isDestroyed) {
      throw new AgentError(
        ErrorCode.AGENT_DESTROYED,
        `Agent ${this.id} has been destroyed and cannot perform operations`
      );
    }
  }

  // ========================
  // Phase2 Messaging Methods
  // ========================

  /**
   * Enables Phase2 messaging capabilities for this agent
   * @param config - Optional custom messaging configuration
   * @throws {AgentError} If the agent has been destroyed
   */
  public async enableMessaging(config?: Partial<MessagingConfig>): Promise<void> {
    this.ensureActive();

    if (this.messagingEnabled) {
      this.logger.warn('Messaging already enabled for agent', { agentId: this.id });
      return;
    }

    try {
      // Dynamic import to avoid loading Phase2 components when not needed
      const { createMessagingSystemContainer, defaultMessagingConfig } = 
        await import('./messaging-system-container');

      const finalConfig = { ...defaultMessagingConfig, ...config };
      
      // Create messaging system container
      this.messagingSystem = createMessagingSystemContainer(finalConfig);
      this.subscriptions = new Set<string>();
      this.messagingEnabled = true;

      // Register with messaging system
      this.messagingSystem.getSubscriptionRegistry().registerAgent(this.id as AgentId);

      this.logger.info('Phase2 messaging enabled', { agentId: this.id });

    } catch (error) {
      this.logger.error('Failed to enable messaging', {
        agentId: this.id,
        error: error instanceof Error ? error.message : error
      });
      throw new AgentError(
        ErrorCode.MESSAGE_ROUTING_FAILED,
        `Failed to enable messaging for agent ${this.id}`,
        { agentId: this.id, cause: error }
      );
    }
  }

  /**
   * Subscribes to messages matching the specified pattern
   * @param pattern - Message pattern to subscribe to (supports wildcards)
   * @param handler - Optional message handler for this subscription
   * @throws {AgentError} If messaging not enabled or agent destroyed
   */
  public async subscribeToMessages(
    pattern: string, 
    handler?: (message: Message) => void
  ): Promise<void> {
    this.ensureActive();
    this.ensureMessagingEnabled();

    try {
      const { createMessagePattern } = await import('./types/branded-types');
      const validatedPattern = createMessagePattern(pattern);

      await this.messagingSystem!
        .getSubscriptionRegistry()
        .subscribe(this.id as AgentId, validatedPattern);

      this.subscriptions!.add(pattern);

      if (handler) {
        // Store handler for this pattern (implementation could be enhanced)
        this.onMessage(handler);
      }

      this.logger.debug('Subscribed to pattern', { agentId: this.id, pattern });

    } catch (error) {
      this.logger.error('Subscription failed', {
        agentId: this.id,
        pattern,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Unsubscribes from messages matching the specified pattern
   * @param pattern - Message pattern to unsubscribe from
   * @throws {AgentError} If messaging not enabled or agent destroyed
   */
  public async unsubscribeFromMessages(pattern: string): Promise<void> {
    this.ensureActive();
    this.ensureMessagingEnabled();

    if (!this.subscriptions!.has(pattern)) {
      this.logger.warn('Attempt to unsubscribe from non-existent pattern', {
        agentId: this.id,
        pattern
      });
      return;
    }

    try {
      const { createMessagePattern } = await import('./types/branded-types');
      const validatedPattern = createMessagePattern(pattern);

      await this.messagingSystem!
        .getSubscriptionRegistry()
        .unsubscribe(this.id as AgentId, validatedPattern);

      this.subscriptions!.delete(pattern);

      this.logger.debug('Unsubscribed from pattern', { agentId: this.id, pattern });

    } catch (error) {
      this.logger.error('Unsubscription failed', {
        agentId: this.id,
        pattern,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Publishes a message to a specific agent through the messaging system
   * @param to - Target agent ID
   * @param type - Message type
   * @param payload - Message payload
   * @throws {AgentError} If messaging not enabled or agent destroyed
   */
  public async publishMessage<T extends Record<string, unknown>>(
    to: string,
    type: string,
    payload: T
  ): Promise<void> {
    this.ensureActive();
    this.ensureMessagingEnabled();

    try {
      const { MessageFactory } = await import('./message-factory');
      const { MessageValidator } = await import('./message-validator');

      // Create and validate message
      const message = MessageFactory.createMessage(this.id, to, type, payload);
      const validatedMessage = MessageValidator.validate(message);

      // Route through messaging system
      const result = await this.messagingSystem!
        .getMessageRouter()
        .route(validatedMessage);

      if (!result.success) {
        throw new AgentError(
          ErrorCode.MESSAGE_ROUTING_FAILED,
          `Failed to publish message: ${result.error?.message}`,
          { messageId: message.id, to, type, routingResult: result }
        );
      }

      this.logger.debug('Message published', { 
        messageId: message.id, 
        to, 
        type,
        subscriberCount: result.subscriberCount 
      });

    } catch (error) {
      this.logger.error('Message publishing failed', {
        agentId: this.id,
        to,
        type,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Broadcasts a message to all agents matching the filter
   * @param type - Message type
   * @param payload - Message payload
   * @param filter - Optional filter function for agents
   * @throws {AgentError} If messaging not enabled or agent destroyed
   */
  public async broadcastMessage<T extends Record<string, unknown>>(
    type: string,
    payload: T,
    filter?: (agentId: string) => boolean
  ): Promise<void> {
    this.ensureActive();
    this.ensureMessagingEnabled();

    try {
      const { MessageFactory } = await import('./message-factory');
      const { MessageValidator } = await import('./message-validator');

      // Create broadcast message (use agent's own ID as 'to' for broadcast)
      const message = MessageFactory.createMessage(this.id, this.id, type, payload);
      const validatedMessage = MessageValidator.validate(message);

      // Get all active agents
      const allAgents = this.messagingSystem!
        .getSubscriptionRegistry()
        .getAllActiveAgents();

      const targetAgents = filter 
        ? allAgents.filter(agentId => filter(agentId as string))
        : allAgents;

      // Deliver to all target agents
      const deliveryPromises = targetAgents.map(async (agentId) => {
        const targetMessage = { ...validatedMessage, to: agentId as string };
        return this.messagingSystem!.getMessageRouter().route(targetMessage);
      });

      const results = await Promise.allSettled(deliveryPromises);
      
      const failures = results.filter(r => r.status === 'rejected' || !r.value.success).length;
      const successes = results.length - failures;

      this.logger.debug('Broadcast completed', { 
        agentId: this.id,
        type,
        targetCount: targetAgents.length,
        successes,
        failures
      });

    } catch (error) {
      this.logger.error('Broadcast failed', {
        agentId: this.id,
        type,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Sends a request message and waits for response
   * @param to - Target agent ID
   * @param type - Request type
   * @param payload - Request payload
   * @param timeout - Optional timeout in milliseconds (default: 5000)
   * @returns Promise resolving to response payload
   * @throws {AgentError} If messaging not enabled, agent destroyed, or request times out
   */
  public async requestMessage<TRequest extends Record<string, unknown>, TResponse = unknown>(
    to: string,
    type: string,
    payload: TRequest,
    timeout = 5000
  ): Promise<TResponse> {
    this.ensureActive();
    this.ensureMessagingEnabled();

    try {
      const { MessageFactory } = await import('./message-factory');
      const { MessageValidator } = await import('./message-validator');
      const { createMessageId } = await import('./types/branded-types');

      const message = MessageFactory.createMessage(this.id, to, type, payload);
      const validatedMessage = MessageValidator.validate(message);
      const correlationId = createMessageId();

      // Register request with correlation manager
      const responsePromise = this.messagingSystem!
        .getCorrelationManager()
        .registerRequest(
          correlationId,
          validatedMessage,
          timeout,
          this.id as AgentId
        );

      this.logger.debug('Request sent', { 
        correlationId: correlationId as string,
        to,
        type,
        timeout
      });

      return await responsePromise as TResponse;

    } catch (error) {
      this.logger.error('Request failed', {
        agentId: this.id,
        to,
        type,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Gets all active subscriptions for this agent
   * @returns Array of subscription patterns
   * @throws {AgentError} If messaging not enabled or agent destroyed
   */
  public getActiveSubscriptions(): string[] {
    this.ensureActive();
    this.ensureMessagingEnabled();

    return Array.from(this.subscriptions!);
  }

  /**
   * Checks if Phase2 messaging is enabled for this agent
   * @returns true if messaging is enabled
   */
  public isMessagingEnabled(): boolean {
    return this.messagingEnabled;
  }

  /**
   * Ensures that Phase2 messaging is enabled
   * @private
   * @throws {AgentError} If messaging not enabled
   */
  private ensureMessagingEnabled(): void {
    if (!this.messagingEnabled) {
      throw new AgentError(
        ErrorCode.MESSAGE_ROUTING_FAILED,
        `Phase2 messaging not enabled for agent ${this.id}. Call enableMessaging() first.`,
        { agentId: this.id }
      );
    }
  }
}