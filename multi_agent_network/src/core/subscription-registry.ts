import { AgentError, ErrorCode } from './errors';
import type { IPatternMatcher } from './pattern-matcher';
import type { AgentId, MessagePattern, ValidatedMessageType } from './types/branded-types';

// Subscription information for monitoring
export interface SubscriptionInfo {
  agentId: AgentId;
  pattern: MessagePattern;
  isWildcard: boolean;
  createdAt: Date;
  accessCount: number;
}

/**
 * Interface for subscription registry (CLAUDE.md SOLID: Interface Segregation)
 */
export interface ISubscriptionRegistry {
  subscribe(agentId: AgentId, pattern: MessagePattern): Promise<void>;
  unsubscribe(agentId: AgentId, pattern: MessagePattern): Promise<void>;
  getSubscribers(messageType: ValidatedMessageType): AgentId[];
  cleanup(agentId: AgentId): Promise<void>;
  
  // Additional methods for management
  registerAgent(agentId: AgentId): void;
  getAgentSubscriptions(agentId: AgentId): MessagePattern[];
  getAllActiveAgents(): AgentId[];
  getSubscriptionCount(): number;
}

/**
 * High-performance subscription registry with pattern matching
 * Implements CLAUDE.md principles: Single Responsibility, DRY, Performance
 */
export class SubscriptionRegistry implements ISubscriptionRegistry {
  // O(1) lookup for direct subscriptions (exact matches)
  private readonly directSubscriptions = new Map<ValidatedMessageType, Set<AgentId>>();
  
  // Agent -> Patterns mapping for cleanup and limits
  private readonly patternSubscriptions = new Map<AgentId, Set<MessagePattern>>();
  
  // Wildcard patterns (requires O(p) search where p = pattern count)
  private readonly wildcardSubscriptions = new Map<MessagePattern, Set<AgentId>>();
  
  // Active agents tracking
  private readonly activeAgents = new Set<AgentId>();
  
  // Configuration
  private readonly MAX_SUBSCRIPTIONS_PER_AGENT = 100;

  constructor(
    private readonly patternMatcher: IPatternMatcher // CLAUDE.md SOLID: Dependency Injection
  ) {}

  /**
   * Subscribes an agent to a message pattern
   * @param agentId - The agent to subscribe
   * @param pattern - The pattern to subscribe to
   * @throws AgentError if subscription limit exceeded
   */
  async subscribe(agentId: AgentId, pattern: MessagePattern): Promise<void> {
    // Atomic operation: check limits first
    const agentPatterns = this.patternSubscriptions.get(agentId) ?? new Set<MessagePattern>();
    
    // Enforce subscription limit (CLAUDE.md: Prevent resource exhaustion)
    if (agentPatterns.size >= this.MAX_SUBSCRIPTIONS_PER_AGENT) {
      throw new AgentError(
        ErrorCode.SUBSCRIPTION_LIMIT_EXCEEDED,
        `Agent ${agentId} subscription limit exceeded`,
        { 
          agentId, 
          currentCount: agentPatterns.size, 
          limit: this.MAX_SUBSCRIPTIONS_PER_AGENT 
        }
      );
    }

    // Check if already subscribed (idempotent operation)
    if (agentPatterns.has(pattern)) {
      return; // Already subscribed, no-op
    }

    // Atomic update: add to agent's pattern set
    const updatedPatterns = new Set(agentPatterns);
    updatedPatterns.add(pattern);
    this.patternSubscriptions.set(agentId, updatedPatterns);

    // Update subscription indices
    if (this.isWildcardPattern(pattern)) {
      // Wildcard pattern: add to wildcard index
      const wildcardSubscribers = this.wildcardSubscriptions.get(pattern) ?? new Set<AgentId>();
      wildcardSubscribers.add(agentId);
      this.wildcardSubscriptions.set(pattern, wildcardSubscribers);
    } else {
      // Direct pattern: add to direct index for O(1) lookup
      const messageType = pattern as unknown as ValidatedMessageType; // Safe cast for exact patterns
      const directSubscribers = this.directSubscriptions.get(messageType) ?? new Set<AgentId>();
      directSubscribers.add(agentId);
      this.directSubscriptions.set(messageType, directSubscribers);
    }

    // Ensure agent is registered
    this.activeAgents.add(agentId);
  }

  /**
   * Unsubscribes an agent from a message pattern
   * @param agentId - The agent to unsubscribe
   * @param pattern - The pattern to unsubscribe from
   */
  async unsubscribe(agentId: AgentId, pattern: MessagePattern): Promise<void> {
    const agentPatterns = this.patternSubscriptions.get(agentId);
    if (!agentPatterns?.has(pattern)) {
      return; // Not subscribed, idempotent operation
    }

    // Atomic removal from agent's patterns
    const updatedPatterns = new Set(agentPatterns);
    updatedPatterns.delete(pattern);
    
    if (updatedPatterns.size === 0) {
      this.patternSubscriptions.delete(agentId);
    } else {
      this.patternSubscriptions.set(agentId, updatedPatterns);
    }

    // Remove from subscription indices
    if (this.isWildcardPattern(pattern)) {
      // Remove from wildcard index
      const wildcardSubscribers = this.wildcardSubscriptions.get(pattern);
      if (wildcardSubscribers) {
        wildcardSubscribers.delete(agentId);
        if (wildcardSubscribers.size === 0) {
          this.wildcardSubscriptions.delete(pattern);
        }
      }
    } else {
      // Remove from direct index
      const messageType = pattern as unknown as ValidatedMessageType;
      const directSubscribers = this.directSubscriptions.get(messageType);
      if (directSubscribers) {
        directSubscribers.delete(agentId);
        if (directSubscribers.size === 0) {
          this.directSubscriptions.delete(messageType);
        }
      }
    }
  }

  /**
   * Gets all agents subscribed to a specific message type
   * @param messageType - The message type to check
   * @returns Array of subscribed agent IDs
   */
  getSubscribers(messageType: ValidatedMessageType): AgentId[] {
    const subscribers = new Set<AgentId>();

    // O(1) lookup for direct subscriptions
    const directSubscribers = this.directSubscriptions.get(messageType);
    if (directSubscribers) {
      directSubscribers.forEach(agentId => subscribers.add(agentId));
    }

    // O(p) lookup for wildcard patterns (p = number of wildcard patterns)  
    for (const [pattern, patternSubscribers] of this.wildcardSubscriptions) {
      if (this.patternMatcher.matches(pattern, messageType)) {
        patternSubscribers.forEach(agentId => subscribers.add(agentId));
      }
    }

    return Array.from(subscribers);
  }

  /**
   * Completely removes an agent and all its subscriptions
   * @param agentId - The agent to clean up
   */
  async cleanup(agentId: AgentId): Promise<void> {
    // Get all patterns for this agent
    const agentPatterns = this.patternSubscriptions.get(agentId);
    if (agentPatterns) {
      // Unsubscribe from all patterns
      for (const pattern of agentPatterns) {
        await this.unsubscribe(agentId, pattern);
      }
    }

    // Remove from active agents
    this.activeAgents.delete(agentId);
  }

  /**
   * Registers an agent as active
   * @param agentId - The agent to register
   */
  registerAgent(agentId: AgentId): void {
    this.activeAgents.add(agentId);
  }

  /**
   * Gets all patterns an agent is subscribed to
   * @param agentId - The agent to check
   * @returns Array of subscribed patterns
   */
  getAgentSubscriptions(agentId: AgentId): MessagePattern[] {
    const patterns = this.patternSubscriptions.get(agentId);
    return patterns ? Array.from(patterns) : [];
  }

  /**
   * Gets all active agent IDs
   * @returns Array of active agent IDs
   */
  getAllActiveAgents(): AgentId[] {
    return Array.from(this.activeAgents);
  }

  /**
   * Gets the total number of active subscriptions across all agents
   * @returns Total subscription count
   */
  getSubscriptionCount(): number {
    let total = 0;
    this.patternSubscriptions.forEach(patterns => {
      total += patterns.size;
    });
    return total;
  }

  /**
   * Gets detailed statistics about subscriptions
   * @returns Subscription statistics
   */
  getSubscriptionStats(): {
    totalSubscriptions: number;
    activeAgents: number;
    directSubscriptions: number;
    wildcardSubscriptions: number;
    averageSubscriptionsPerAgent: number;
  } {
    const totalSubscriptions = this.getSubscriptionCount();
    const activeAgentCount = this.activeAgents.size;
    
    return {
      totalSubscriptions,
      activeAgents: activeAgentCount,
      directSubscriptions: this.directSubscriptions.size,
      wildcardSubscriptions: this.wildcardSubscriptions.size,
      averageSubscriptionsPerAgent: activeAgentCount > 0 ? totalSubscriptions / activeAgentCount : 0
    };
  }

  /**
   * Checks if a pattern contains wildcards
   * @param pattern - The pattern to check
   * @returns true if pattern contains wildcards
   * @private
   */
  private isWildcardPattern(pattern: MessagePattern): boolean {
    return (pattern as string).includes('*');
  }
}