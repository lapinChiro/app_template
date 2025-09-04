import { v4 as uuidv4 } from 'uuid';
import { AgentError, ErrorCode } from './errors';
import type { ValidatedMessage } from './message-validator';
import type { AgentId, MessageId } from './types/branded-types';

// Pending request information
export interface PendingRequest {
  correlationId: MessageId;
  originalMessage: ValidatedMessage;
  requesterId: AgentId;
  createdAt: Date;
  timeout: NodeJS.Timeout;
  resolve: (response: unknown) => void;
  reject: (error: Error) => void;
}

// Request configuration
export interface RequestConfig {
  timeout: number;
  retries?: number;
  metadata?: Record<string, unknown>;
}

// Correlation statistics
export interface CorrelationStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  timedoutRequests: number;
  cancelledRequests: number;
  averageRequestAge: number;
  oldestRequestAge: number;
}

/**
 * Interface for correlation ID management (CLAUDE.md SOLID: Interface Segregation)
 */
export interface ICorrelationManager {
  generateCorrelationId(): string;
  registerRequest(correlationId: MessageId, message: ValidatedMessage, timeout: number, requesterId: AgentId): Promise<unknown>;
  handleResponse(response: ValidatedMessage): void;
  cancelRequest(correlationId: MessageId): void;
  cancelPendingRequests(agentId: AgentId): void;
  hasPendingRequest(correlationId: MessageId): boolean;
  getPendingRequestCount(): number;
  getRequestAge(correlationId: MessageId): number | null;
  getStats(): CorrelationStats;
}

/**
 * High-performance correlation ID manager for request-response patterns
 * Implements CLAUDE.md principles: Single Responsibility, Performance, Memory Management
 */
export class CorrelationManager implements ICorrelationManager {
  private readonly pendingRequests = new Map<string, PendingRequest>();
  
  // Statistics tracking
  private totalRequestCount = 0;
  private completedRequestCount = 0;
  private timedoutRequestCount = 0;
  private cancelledRequestCount = 0;

  // Performance constants
  private readonly CLEANUP_INTERVAL_MS = 30000; // Clean up every 30 seconds
  private readonly MAX_PENDING_REQUESTS = 10000; // Prevent memory exhaustion
  
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startPeriodicCleanup();
  }

  /**
   * Generates a unique correlation ID
   * @returns UUID v4 string for correlation
   */
  generateCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Registers a request and returns a promise that resolves with the response
   * @param correlationId - Unique ID for correlating request and response
   * @param message - The original request message
   * @param timeout - Timeout in milliseconds
   * @param requesterId - ID of the requesting agent
   * @returns Promise that resolves with response payload
   */
  async registerRequest(
    correlationId: MessageId,
    message: ValidatedMessage,
    timeout: number,
    requesterId: AgentId
  ): Promise<unknown> {
    // Check if we've exceeded the maximum pending requests
    if (this.pendingRequests.size >= this.MAX_PENDING_REQUESTS) {
      throw new AgentError(
        ErrorCode.MESSAGE_TOO_LARGE, // Reuse existing error code for resource limits
        `Maximum pending requests exceeded: ${this.MAX_PENDING_REQUESTS}`,
        { correlationId, requesterId, pendingCount: this.pendingRequests.size }
      );
    }

    return new Promise<unknown>((resolve, reject) => {
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(correlationId as string);
        this.timedoutRequestCount++;
        reject(new AgentError(
          ErrorCode.REQUEST_TIMEOUT,
          `Request timeout after ${timeout}ms`,
          { 
            correlationId, 
            requesterId, 
            originalMessage: message,
            timeout 
          }
        ));
      }, timeout);

      // Store pending request
      const pendingRequest: PendingRequest = {
        correlationId,
        originalMessage: message,
        requesterId,
        createdAt: new Date(),
        timeout: timeoutHandle,
        resolve,
        reject
      };

      this.pendingRequests.set(correlationId as string, pendingRequest);
      this.totalRequestCount++;
    });
  }

  /**
   * Handles an incoming response message
   * @param response - The response message with correlation ID
   */
  handleResponse(response: ValidatedMessage): void {
    const correlationId = response.id as string;
    const pendingRequest = this.pendingRequests.get(correlationId);

    if (!pendingRequest) {
      console.warn(`Received response for unknown correlation ID: ${correlationId}`);
      return;
    }

    // Clean up timeout and remove from pending
    clearTimeout(pendingRequest.timeout);
    this.pendingRequests.delete(correlationId);
    this.completedRequestCount++;

    // Check if this is an error response
    if (response.type.includes('error')) {
      const error = new AgentError(
        ErrorCode.REQUEST_FAILED,
        `Request failed: ${JSON.stringify(response.payload)}`,
        { 
          correlationId: pendingRequest.correlationId, 
          response,
          originalMessage: pendingRequest.originalMessage 
        }
      );
      pendingRequest.reject(error);
    } else {
      pendingRequest.resolve(response.payload);
    }
  }

  /**
   * Cancels a specific pending request
   * @param correlationId - ID of the request to cancel
   */
  cancelRequest(correlationId: MessageId): void {
    const pendingRequest = this.pendingRequests.get(correlationId as string);
    
    if (pendingRequest) {
      clearTimeout(pendingRequest.timeout);
      this.pendingRequests.delete(correlationId as string);
      this.cancelledRequestCount++;
      
      pendingRequest.reject(new AgentError(
        ErrorCode.AGENT_DESTROYED,
        'Request cancelled',
        { correlationId }
      ));
    }
  }

  /**
   * Cancels all pending requests for a specific agent
   * @param agentId - ID of the agent whose requests to cancel
   */
  cancelPendingRequests(agentId: AgentId): void {
    const toCancel: string[] = [];
    
    // Find all requests from this agent
    this.pendingRequests.forEach((request, correlationId) => {
      if (request.requesterId === agentId) {
        toCancel.push(correlationId);
      }
    });

    // Cancel all found requests
    toCancel.forEach(correlationId => {
      const request = this.pendingRequests.get(correlationId);
      if (request) {
        clearTimeout(request.timeout);
        this.pendingRequests.delete(correlationId);
        this.cancelledRequestCount++;
        
        request.reject(new AgentError(
          ErrorCode.AGENT_DESTROYED,
          'Request cancelled due to agent destruction',
          { correlationId: request.correlationId, agentId }
        ));
      }
    });

    if (toCancel.length > 0) {
      console.info(`Cancelled ${toCancel.length} pending requests for agent ${agentId}`);
    }
  }

  /**
   * Checks if a request is still pending
   * @param correlationId - ID of the request to check
   * @returns true if request is pending
   */
  hasPendingRequest(correlationId: MessageId): boolean {
    return this.pendingRequests.has(correlationId as string);
  }

  /**
   * Gets the current number of pending requests
   * @returns Number of pending requests
   */
  getPendingRequestCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Gets the age of a pending request in milliseconds
   * @param correlationId - ID of the request
   * @returns Request age in ms, or null if not found
   */
  getRequestAge(correlationId: MessageId): number | null {
    const request = this.pendingRequests.get(correlationId as string);
    return request ? Date.now() - request.createdAt.getTime() : null;
  }

  /**
   * Gets comprehensive correlation statistics
   * @returns CorrelationStats object
   */
  getStats(): CorrelationStats {
    const now = Date.now();
    let totalAge = 0;
    let oldestAge = 0;

    this.pendingRequests.forEach(request => {
      const age = now - request.createdAt.getTime();
      totalAge += age;
      if (age > oldestAge) {
        oldestAge = age;
      }
    });

    return {
      totalRequests: this.totalRequestCount,
      pendingRequests: this.pendingRequests.size,
      completedRequests: this.completedRequestCount,
      timedoutRequests: this.timedoutRequestCount,
      cancelledRequests: this.cancelledRequestCount,
      averageRequestAge: this.pendingRequests.size > 0 ? totalAge / this.pendingRequests.size : 0,
      oldestRequestAge: oldestAge
    };
  }

  /**
   * Cleans up expired or stale requests periodically
   * @private
   */
  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const expiredRequests: string[] = [];

      // Find requests that are suspiciously old (> 5 minutes)
      this.pendingRequests.forEach((request, correlationId) => {
        const age = now - request.createdAt.getTime();
        if (age > 300000) { // 5 minutes
          expiredRequests.push(correlationId);
        }
      });

      // Clean up expired requests
      expiredRequests.forEach(correlationId => {
        const request = this.pendingRequests.get(correlationId);
        if (request) {
          clearTimeout(request.timeout);
          this.pendingRequests.delete(correlationId);
          console.warn(`Cleaned up stale request: ${correlationId}, age: ${now - request.createdAt.getTime()}ms`);
        }
      });

    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Stops the periodic cleanup (for testing/shutdown)
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}