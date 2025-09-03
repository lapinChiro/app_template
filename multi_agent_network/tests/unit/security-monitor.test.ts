import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecurityMonitor } from '@/core/security-monitor';
import type { Logger } from 'winston';

// Mock the logger module
vi.mock('@/core/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn()
  }))
}));

describe('SecurityMonitor', () => {
  let securityMonitor: SecurityMonitor;
  let mockLogger: Logger;

  beforeEach(() => {
    // Clear singleton instances between tests
    // @ts-expect-error Accessing private static member for testing
    SecurityMonitor.instances.clear();
    
    securityMonitor = SecurityMonitor.getInstance();
    // @ts-expect-error Accessing private member for testing
    mockLogger = securityMonitor.logger as Logger;
  });

  describe('singleton behavior', () => {
    it('should return the same instance when getInstance is called multiple times', () => {
      const instance1 = SecurityMonitor.getInstance();
      const instance2 = SecurityMonitor.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should extend Singleton base class', () => {
      expect(SecurityMonitor.prototype.constructor.name).toBe('SecurityMonitor');
    });
  });

  describe('registerAgent', () => {
    it('should register an agent', () => {
      securityMonitor.registerAgent('agent1');
      
      // @ts-expect-error Accessing private member for testing
      expect(securityMonitor.registeredAgents.has('agent1')).toBe(true);
    });

    it('should allow registering multiple agents', () => {
      securityMonitor.registerAgent('agent1');
      securityMonitor.registerAgent('agent2');
      securityMonitor.registerAgent('agent3');
      
      // @ts-expect-error Accessing private member for testing
      expect(securityMonitor.registeredAgents.size).toBe(3);
    });
  });

  describe('unregisterAgent', () => {
    it('should unregister an agent', () => {
      securityMonitor.registerAgent('agent1');
      securityMonitor.unregisterAgent('agent1');
      
      // @ts-expect-error Accessing private member for testing
      expect(securityMonitor.registeredAgents.has('agent1')).toBe(false);
    });

    it('should handle unregistering non-existent agent gracefully', () => {
      expect(() => {
        securityMonitor.unregisterAgent('non-existent');
      }).not.toThrow();
    });
  });

  describe('logMemoryAccess', () => {
    it('should log memory access', () => {
      securityMonitor.registerAgent('agent1');
      
      securityMonitor.logMemoryAccess('agent1', 'read', 'config.token');
      
      const logs = securityMonitor.getAccessLogs('agent1');
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        agentId: 'agent1',
        operation: 'read',
        key: 'config.token'
      });
      expect(logs[0]?.timestamp).toBeInstanceOf(Date);
    });

    it('should log write operations', () => {
      securityMonitor.registerAgent('agent1');
      
      securityMonitor.logMemoryAccess('agent1', 'write', 'state.value');
      
      const logs = securityMonitor.getAccessLogs();
      expect(logs[0]?.operation).toBe('write');
    });
  });

  describe('suspicious access detection', () => {
    it('should detect suspicious access patterns', () => {
      securityMonitor.registerAgent('agent1');
      securityMonitor.registerAgent('agent2');
      
      // Simulate access from agent1's context that references agent2
      const originalError = Error;
      const mockStack = `Error
    at Agent.getMemory (src/core/agent.ts:50:10)
    at agent2.someMethod (src/core/agent.ts:100:5)
    at test (test.ts:10:5)`;
      
      // Mock Error constructor to return custom stack
      global.Error = class extends originalError {
        stack = mockStack;
      } as ErrorConstructor;
      
      const errorSpy = vi.spyOn(mockLogger, 'error');
      
      securityMonitor.logMemoryAccess('agent1', 'read', 'secret');
      
      expect(errorSpy).toHaveBeenCalledWith(
        'Security violation: Potential unauthorized memory access attempt',
        expect.objectContaining({
          accessLog: expect.objectContaining({
            callStack: mockStack
          })
        })
      );
      
      // Restore original Error
      global.Error = originalError;
    });

    it('should not flag normal access as suspicious', () => {
      securityMonitor.registerAgent('agent1');
      
      const errorSpy = vi.spyOn(mockLogger, 'error');
      
      securityMonitor.logMemoryAccess('agent1', 'read', 'normalData');
      
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('getAccessLogs', () => {
    it('should return logs for specific agent', () => {
      securityMonitor.registerAgent('agent1');
      securityMonitor.registerAgent('agent2');
      
      securityMonitor.logMemoryAccess('agent1', 'read', 'key1');
      securityMonitor.logMemoryAccess('agent2', 'write', 'key2');
      securityMonitor.logMemoryAccess('agent1', 'write', 'key3');
      
      const agent1Logs = securityMonitor.getAccessLogs('agent1');
      expect(agent1Logs).toHaveLength(2);
      expect(agent1Logs.every(log => log.agentId === 'agent1')).toBe(true);
    });

    it('should return all logs when no agentId specified', () => {
      securityMonitor.registerAgent('agent1');
      securityMonitor.registerAgent('agent2');
      
      securityMonitor.logMemoryAccess('agent1', 'read', 'key1');
      securityMonitor.logMemoryAccess('agent2', 'write', 'key2');
      
      const allLogs = securityMonitor.getAccessLogs();
      expect(allLogs).toHaveLength(2);
    });

    it('should return a copy of logs array', () => {
      securityMonitor.registerAgent('agent1');
      securityMonitor.logMemoryAccess('agent1', 'read', 'key1');
      
      const logs1 = securityMonitor.getAccessLogs();
      const logs2 = securityMonitor.getAccessLogs();
      
      expect(logs1).not.toBe(logs2);
      expect(logs1).toEqual(logs2);
    });
  });

  describe('memory access tracking', () => {
    it('should track multiple access operations in order', () => {
      securityMonitor.registerAgent('agent1');
      
      const beforeFirst = new Date();
      securityMonitor.logMemoryAccess('agent1', 'read', 'key1');
      
      const betweenAccess = new Date();
      securityMonitor.logMemoryAccess('agent1', 'write', 'key2');
      
      const afterLast = new Date();
      
      const logs = securityMonitor.getAccessLogs('agent1');
      
      expect(logs[0]?.timestamp.getTime()).toBeGreaterThanOrEqual(beforeFirst.getTime());
      expect(logs[0]?.timestamp.getTime()).toBeLessThanOrEqual(betweenAccess.getTime());
      expect(logs[1]?.timestamp.getTime()).toBeGreaterThanOrEqual(betweenAccess.getTime());
      expect(logs[1]?.timestamp.getTime()).toBeLessThanOrEqual(afterLast.getTime());
    });
  });
});