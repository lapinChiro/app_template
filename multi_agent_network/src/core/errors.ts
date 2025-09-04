/**
 * Error codes for the agent system
 */
export enum ErrorCode {
  /** Agent ID already exists in the system */
  DUPLICATE_AGENT_ID = 'DUPLICATE_AGENT_ID',
  /** Agent with the specified ID was not found */
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  /** Maximum number of agents has been exceeded */
  AGENT_LIMIT_EXCEEDED = 'AGENT_LIMIT_EXCEEDED',
  /** Message payload exceeds the size limit */
  MESSAGE_TOO_LARGE = 'MESSAGE_TOO_LARGE',
  /** Unauthorized memory access detected */
  MEMORY_ACCESS_VIOLATION = 'MEMORY_ACCESS_VIOLATION',
  /** Performance metric exceeded threshold */
  PERFORMANCE_THRESHOLD_EXCEEDED = 'PERFORMANCE_THRESHOLD_EXCEEDED',
  /** Operation attempted on a destroyed agent */
  AGENT_DESTROYED = 'AGENT_DESTROYED',
  
  // Phase 2 error codes
  /** Agent has exceeded the maximum number of subscriptions */
  SUBSCRIPTION_LIMIT_EXCEEDED = 'SUBSCRIPTION_LIMIT_EXCEEDED',
  /** Invalid subscription pattern format */
  INVALID_SUBSCRIPTION_PATTERN = 'INVALID_SUBSCRIPTION_PATTERN',
  /** Request timed out waiting for response */
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  /** Request failed with error response */
  REQUEST_FAILED = 'REQUEST_FAILED',
  /** Message routing operation failed */
  MESSAGE_ROUTING_FAILED = 'MESSAGE_ROUTING_FAILED'
}

/**
 * Custom error class for agent-related errors
 * Extends the standard Error class with additional context and error codes
 */
export class AgentError extends Error {
  /** Timestamp when the error occurred */
  public readonly timestamp: Date;
  
  /**
   * Creates a new AgentError instance
   * @param code - The error code from ErrorCode enum
   * @param message - Human-readable error message
   * @param context - Optional additional context about the error
   */
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgentError';
    this.timestamp = new Date();
    
    // Ensures proper stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AgentError);
    }
  }

  /**
   * Convert error to JSON format for logging and serialization
   * @returns JSON representation of the error
   */
  public toJSON(): {
    name: string;
    code: ErrorCode;
    message: string;
    timestamp: Date;
    context?: Record<string, unknown>;
  } {
    const result: {
      name: string;
      code: ErrorCode;
      message: string;
      timestamp: Date;
      context?: Record<string, unknown>;
    } = {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp
    };
    
    if (this.context !== undefined) {
      result.context = this.context;
    }
    
    return result;
  }
}