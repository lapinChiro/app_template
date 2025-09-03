import { v4 as uuidv4 } from 'uuid';
import { createLogger } from './logger';
import { SecurityMonitor } from './security-monitor';
import { PerformanceMonitor } from './performance-monitor';
import { AgentError, ErrorCode } from './errors';
import type { Message } from './types/message';
import type { Logger } from 'winston';

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
  public async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }
    
    const destructionStartTime = Date.now();
    
    this.logger.info('Destroying agent', { agentId: this.id });
    
    // Mark as destroyed first to prevent race conditions
    this.isDestroyed = true;
    
    // Unregister from security monitor
    this.securityMonitor.unregisterAgent(this.id);
    
    // Clear memory
    this.memory.clear();
    
    // Clear message handlers
    this.messageHandlers.clear();
    
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
}