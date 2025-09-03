import { v4 as uuidv4 } from 'uuid';
import { Agent } from './agent';
import { AgentError, ErrorCode } from './errors';
import { MessageFactory } from './message-factory';
import { createLogger } from './logger';
import { Singleton } from './base/singleton';
import type { Logger } from 'winston';

/**
 * AgentManager manages the lifecycle of agents and messaging between them
 * 
 * Key responsibilities:
 * - Create and destroy agents (max 10 agents)
 * - Route messages between agents
 * - Enforce message size limits (1MB)
 * - Track agent lifecycle metrics
 * - Provide broadcast messaging
 * 
 * This is a singleton class that should be accessed via getInstance()
 * 
 * @example
 * ```typescript
 * const manager = AgentManager.getInstance();
 * 
 * // Create agents
 * const agent1 = await manager.createAgent();
 * const agent2 = await manager.createAgent('custom-id');
 * 
 * // Send message
 * await manager.sendMessage(agent1.id, agent2.id, 'greeting', { text: 'Hello' });
 * 
 * // Broadcast to all
 * await manager.broadcastMessage(agent1.id, 'announcement', { text: 'Hello all' });
 * 
 * // Clean up
 * await manager.destroyAgent(agent1.id);
 * ```
 */
export class AgentManager extends Singleton<AgentManager> {
  /** Maximum number of agents that can be created */
  private static readonly MAX_AGENTS = 10;
  
  /** Maximum message size in bytes (1MB) */
  private static readonly MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB
  
  /** Map of agent ID to agent instance */
  private readonly agents: Map<string, Agent>;
  
  /** Logger instance */
  private readonly logger: Logger;
  
  protected constructor() {
    super();
    this.agents = new Map();
    this.logger = createLogger('AgentManager');
  }

  
  /**
   * Create a new agent with optional custom ID
   * 
   * @param id - Optional custom ID for the agent. If not provided, a UUID will be generated
   * @returns The created agent instance
   * @throws {AgentError} If agent limit is exceeded or ID is duplicate
   */
  public createAgent(id?: string): Agent {
    const agentId = id ?? uuidv4();
    
    // Check agent limit
    if (this.agents.size >= AgentManager.MAX_AGENTS) {
      throw new AgentError(
        ErrorCode.AGENT_LIMIT_EXCEEDED,
        `Cannot create more than ${AgentManager.MAX_AGENTS} agents`
      );
    }
    
    // Check for duplicate ID
    if (this.agents.has(agentId)) {
      throw new AgentError(
        ErrorCode.DUPLICATE_AGENT_ID,
        `Agent with ID '${agentId}' already exists`
      );
    }
    
    // Create the agent with the specified ID
    const agent = new Agent(agentId);
    
    // Store the agent
    this.agents.set(agent.id, agent);
    
    // Log creation
    this.logger.info('Agent created', {
      agentId: agent.id,
      totalAgents: this.agents.size
    });
    
    // Note: Agent constructor already records its own creation time,
    // so we don't need additional performance metrics here
    
    return agent;
  }
  
  /**
   * Get an agent by ID
   * 
   * @param id - The agent ID to retrieve
   * @returns The agent instance or undefined if not found
   */
  public getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }
  
  /**
   * Check if an agent exists
   * 
   * @param id - The agent ID to check
   * @returns true if the agent exists, false otherwise
   */
  public hasAgent(id: string): boolean {
    return this.agents.has(id);
  }
  
  /**
   * List all active agents
   * 
   * @returns Array of all agent instances
   */
  public listAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Get the number of active agents
   * 
   * @returns The count of active agents
   */
  public getAgentCount(): number {
    return this.agents.size;
  }
  
  /**
   * Destroy an agent by ID
   * 
   * @param id - The agent ID to destroy
   */
  public async destroyAgent(id: string): Promise<void> {
    const agent = this.agents.get(id);
    
    if (!agent) {
      this.logger.warn('Attempted to destroy non-existent agent', { agentId: id });
      return;
    }
    
    // Remove from map first to prevent race conditions
    this.agents.delete(id);
    
    // Destroy the agent
    await agent.destroy();
    
    this.logger.info('Agent destroyed', {
      agentId: id,
      remainingAgents: this.agents.size
    });
  }
  
  /**
   * Destroy all agents
   * 
   * This is useful for cleanup in tests or shutdown scenarios
   */
  public destroyAll(): void {
    const agents = Array.from(this.agents.values());
    
    this.logger.info('Destroying all agents', { count: agents.length });
    
    // Clear the map first
    this.agents.clear();
    
    // Destroy all agents directly
    agents.forEach(agent => {
      // Call destroy directly on each agent
      agent.destroy().catch((error: unknown) => {
        this.logger.error('Error destroying agent during destroyAll', {
          agentId: agent.id,
          error
        });
      });
    });
  }
  
  /**
   * Send a message from one agent to another
   * 
   * @param fromId - The sender agent ID
   * @param toId - The receiver agent ID
   * @param type - The message type
   * @param payload - The message payload
   * @throws {AgentError} If sender/receiver not found or message too large
   */
  public async sendMessage<T = unknown>(
    fromId: string,
    toId: string,
    type: string,
    payload: T
  ): Promise<void> {
    const startTime = Date.now();
    
    // Validate sender exists
    const sender = this.agents.get(fromId);
    if (!sender) {
      throw new AgentError(
        ErrorCode.AGENT_NOT_FOUND,
        `Sender agent '${fromId}' not found`
      );
    }
    
    // Validate receiver exists
    const receiver = this.agents.get(toId);
    if (!receiver) {
      throw new AgentError(
        ErrorCode.AGENT_NOT_FOUND,
        `Receiver agent '${toId}' not found`
      );
    }
    
    // Create message
    const message = MessageFactory.createMessage(fromId, toId, type, payload);
    
    // Check message size
    const messageSize = MessageFactory.getMessageSize(message);
    if (messageSize > AgentManager.MAX_MESSAGE_SIZE) {
      throw new AgentError(
        ErrorCode.MESSAGE_TOO_LARGE,
        `Message size (${messageSize} bytes) exceeds limit (${AgentManager.MAX_MESSAGE_SIZE} bytes)`
      );
    }
    
    // Deliver message
    await receiver.receiveMessage(message);
    
    // Log delivery
    this.logger.debug('Message delivered', {
      messageId: message.id,
      from: fromId,
      to: toId,
      type,
      size: messageSize
    });
    
    // Record performance (Note: Agent already records its own metrics)
    const duration = Date.now() - startTime;
    if (duration > 10) {
      this.logger.warn('Message delivery exceeded 10ms threshold', {
        duration,
        from: fromId,
        to: toId
      });
    }
  }
  
  /**
   * Broadcast a message from one agent to all other agents
   * 
   * @param fromId - The sender agent ID
   * @param type - The message type
   * @param payload - The message payload
   * @throws {AgentError} If sender not found
   */
  public async broadcastMessage<T = unknown>(
    fromId: string,
    type: string,
    payload: T
  ): Promise<void> {
    // Validate sender exists
    const sender = this.agents.get(fromId);
    if (!sender) {
      throw new AgentError(
        ErrorCode.AGENT_NOT_FOUND,
        `Sender agent '${fromId}' not found`
      );
    }
    
    // Get all agents except sender
    const receivers = Array.from(this.agents.entries())
      .filter(([id, _]) => id !== fromId)
      .map(([_, agent]) => agent);
    
    this.logger.info('Broadcasting message', {
      from: fromId,
      type,
      recipientCount: receivers.length
    });
    
    // Send to all receivers in parallel
    const promises = receivers.map(receiver => 
      this.sendMessage(fromId, receiver.id, type, payload).catch((error: unknown) => {
        this.logger.error('Error delivering broadcast message', {
          from: fromId,
          to: receiver.id,
          error
        });
      })
    );
    
    await Promise.all(promises);
  }
}