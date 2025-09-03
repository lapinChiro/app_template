import { describe, it, expect } from 'vitest';
import { AgentError, ErrorCode } from '@/core/errors';

describe('AgentError', () => {
  it('should create an error with the correct error code', () => {
    const error = new AgentError(
      ErrorCode.AGENT_NOT_FOUND,
      'Agent not found'
    );
    
    expect(error.code).toBe(ErrorCode.AGENT_NOT_FOUND);
    expect(error.message).toBe('Agent not found');
    expect(error.name).toBe('AgentError');
  });

  it('should automatically set timestamp', () => {
    const beforeCreate = new Date();
    const error = new AgentError(
      ErrorCode.DUPLICATE_AGENT_ID,
      'Duplicate agent ID'
    );
    const afterCreate = new Date();
    
    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(error.timestamp.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });

  it('should return correct JSON format', () => {
    const error = new AgentError(
      ErrorCode.MESSAGE_TOO_LARGE,
      'Message too large',
      { size: 2048, limit: 1024 }
    );
    
    const json = error.toJSON();
    
    expect(json).toEqual({
      name: 'AgentError',
      code: ErrorCode.MESSAGE_TOO_LARGE,
      message: 'Message too large',
      timestamp: error.timestamp,
      context: { size: 2048, limit: 1024 }
    });
  });

  it('should have context as Record<string, unknown> type', () => {
    const context: Record<string, unknown> = {
      agentId: 'agent-123',
      action: 'create',
      count: 10
    };
    
    const error = new AgentError(
      ErrorCode.AGENT_LIMIT_EXCEEDED,
      'Agent limit exceeded',
      context
    );
    
    expect(error.context).toEqual(context);
  });

  it('should handle undefined context', () => {
    const error = new AgentError(
      ErrorCode.AGENT_DESTROYED,
      'Agent already destroyed'
    );
    
    const json = error.toJSON();
    
    expect(json.context).toBeUndefined();
  });
});

describe('ErrorCode', () => {
  it('should have all required error codes', () => {
    expect(ErrorCode.DUPLICATE_AGENT_ID).toBe('DUPLICATE_AGENT_ID');
    expect(ErrorCode.AGENT_NOT_FOUND).toBe('AGENT_NOT_FOUND');
    expect(ErrorCode.AGENT_LIMIT_EXCEEDED).toBe('AGENT_LIMIT_EXCEEDED');
    expect(ErrorCode.MESSAGE_TOO_LARGE).toBe('MESSAGE_TOO_LARGE');
    expect(ErrorCode.MEMORY_ACCESS_VIOLATION).toBe('MEMORY_ACCESS_VIOLATION');
    expect(ErrorCode.PERFORMANCE_THRESHOLD_EXCEEDED).toBe('PERFORMANCE_THRESHOLD_EXCEEDED');
    expect(ErrorCode.AGENT_DESTROYED).toBe('AGENT_DESTROYED');
  });
});