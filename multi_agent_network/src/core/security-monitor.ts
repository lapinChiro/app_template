import { createLogger } from './logger';
import { Singleton } from './base/singleton';
import type { Logger } from 'winston';

/**
 * Types of memory operations that can be logged
 */
export type MemoryOperation = 'read' | 'write';

/**
 * Memory access log entry
 * Records details about each memory access for security analysis
 */
export interface MemoryAccessLog {
  /** ID of the agent accessing memory */
  agentId: string;
  /** Type of memory operation */
  operation: MemoryOperation;
  /** Memory key being accessed */
  key: string;
  /** When the access occurred */
  timestamp: Date;
  /** Call stack for suspicious access detection */
  callStack?: string;
}

/**
 * Security monitor for tracking and analyzing memory access patterns
 * 
 * Provides security monitoring capabilities for the agent system:
 * - Tracks all memory access operations
 * - Detects potential cross-agent memory access violations
 * - Maintains an audit log of all memory operations
 * - Identifies suspicious access patterns through call stack analysis
 * 
 * This is a singleton class that should be accessed via getInstance()
 * 
 * @example
 * ```typescript
 * const monitor = SecurityMonitor.getInstance();
 * monitor.registerAgent('agent1');
 * monitor.logMemoryAccess('agent1', 'read', 'config.apiKey');
 * ```
 */
export class SecurityMonitor extends Singleton<SecurityMonitor> {
  private readonly registeredAgents: Set<string>;
  private readonly accessLogs: MemoryAccessLog[];
  private readonly logger: Logger;
  
  /** Maximum number of access logs to keep in memory */
  private static readonly MAX_LOG_ENTRIES = 10000;
  
  protected constructor() {
    super();
    this.registeredAgents = new Set();
    this.accessLogs = [];
    this.logger = createLogger('SecurityMonitor');
  }

  /**
   * Register an agent for monitoring
   * @param agentId - The agent ID to register
   */
  public registerAgent(agentId: string): void {
    this.registeredAgents.add(agentId);
  }

  /**
   * Unregister an agent from monitoring
   * @param agentId - The agent ID to unregister
   */
  public unregisterAgent(agentId: string): void {
    this.registeredAgents.delete(agentId);
  }

  /**
   * Log a memory access operation
   * 
   * Records the access and analyzes it for potential security violations.
   * If the call stack indicates cross-agent access, a security warning is logged.
   * 
   * @param agentId - The agent performing the access
   * @param operation - Type of operation (read/write)
   * @param key - The memory key being accessed
   * 
   * @example
   * ```typescript
   * monitor.logMemoryAccess('agent1', 'write', 'state.balance');
   * ```
   */
  public logMemoryAccess(
    agentId: string,
    operation: MemoryOperation,
    key: string
  ): void {
    const accessLog: MemoryAccessLog = {
      agentId,
      operation,
      key,
      timestamp: new Date()
    };

    // Detect suspicious access patterns
    const callStack = new Error().stack;
    if (callStack && this.isSuspiciousAccess(callStack, agentId)) {
      accessLog.callStack = callStack;
      this.logger.error('Security violation: Potential unauthorized memory access attempt', {
        accessLog
      });
    }

    this.accessLogs.push(accessLog);
    
    // Prevent unbounded memory growth
    if (this.accessLogs.length > SecurityMonitor.MAX_LOG_ENTRIES) {
      this.accessLogs.shift(); // Remove oldest entry
    }
  }

  /**
   * Check if the call stack indicates suspicious cross-agent access
   * @param callStack - The call stack to analyze
   * @param agentId - The agent supposedly making the access
   * @returns true if the access pattern is suspicious
   */
  private isSuspiciousAccess(callStack: string, agentId: string): boolean {
    // Check if the call stack contains references to other agents
    const otherAgentIds = Array.from(this.registeredAgents).filter(
      id => id !== agentId
    );
    
    return otherAgentIds.some(id => callStack.includes(id));
  }

  /**
   * Get access logs, optionally filtered by agent
   * @param agentId - Optional agent ID to filter logs
   * @returns Copy of access logs array
   * 
   * @example
   * ```typescript
   * // Get all logs
   * const allLogs = monitor.getAccessLogs();
   * 
   * // Get logs for specific agent
   * const agent1Logs = monitor.getAccessLogs('agent1');
   * ```
   */
  public getAccessLogs(agentId?: string): MemoryAccessLog[] {
    if (agentId) {
      return this.accessLogs.filter(log => log.agentId === agentId);
    }
    return [...this.accessLogs];
  }

  /**
   * Get access statistics for an agent
   * @param agentId - The agent ID to analyze
   * @returns Statistics about the agent's memory access patterns
   */
  public getAccessStats(agentId: string): {
    totalAccess: number;
    readCount: number;
    writeCount: number;
    suspiciousCount: number;
  } {
    const agentLogs = this.accessLogs.filter(log => log.agentId === agentId);
    
    return {
      totalAccess: agentLogs.length,
      readCount: agentLogs.filter(log => log.operation === 'read').length,
      writeCount: agentLogs.filter(log => log.operation === 'write').length,
      suspiciousCount: agentLogs.filter(log => log.callStack !== undefined).length
    };
  }

  /**
   * Clear all access logs
   * Useful for testing or when starting a new monitoring session
   */
  public clearLogs(): void {
    this.accessLogs.length = 0;
  }

  /**
   * Get the number of registered agents
   * @returns Number of currently registered agents
   */
  public getRegisteredAgentCount(): number {
    return this.registeredAgents.size;
  }
}