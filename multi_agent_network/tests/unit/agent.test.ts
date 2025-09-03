import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Agent } from '@/core/agent';
import { SecurityMonitor } from '@/core/security-monitor';
import { PerformanceMonitor } from '@/core/performance-monitor';
import type { Message } from '@/core/types/message';
import { MessageFactory } from '@/core/message-factory';
import { AgentError, ErrorCode } from '@/core/errors';

// Mock the logger module
vi.mock('@/core/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }))
}));

// Mock prom-client to avoid metric registration conflicts
vi.mock('prom-client', () => ({
  Histogram: vi.fn().mockImplementation(() => ({
    labels: vi.fn().mockReturnThis(),
    observe: vi.fn(),
    reset: vi.fn()
  })),
  register: {
    metrics: vi.fn().mockResolvedValue('# metrics')
  }
}));

describe('Agent', () => {
  let securityMonitor: SecurityMonitor;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    // Clear singleton instances
    // @ts-expect-error Accessing private static member for testing
    SecurityMonitor.instances.clear();
    // @ts-expect-error Accessing private static member for testing
    PerformanceMonitor.instances.clear();
    
    securityMonitor = SecurityMonitor.getInstance();
    performanceMonitor = PerformanceMonitor.getInstance();
    
    vi.clearAllMocks();
  });

  describe('agent creation', () => {
    it('should create agent with unique ID', () => {
      const agent = new Agent();
      
      expect(agent.id).toBeDefined();
      expect(agent.id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    it('should create agents with different IDs', () => {
      const agent1 = new Agent();
      const agent2 = new Agent();
      
      expect(agent1.id).not.toBe(agent2.id);
    });

    it('should register agent with SecurityMonitor on creation', () => {
      const registerSpy = vi.spyOn(securityMonitor, 'registerAgent');
      
      const agent = new Agent();
      
      expect(registerSpy).toHaveBeenCalledWith(agent.id);
    });

    it('should record creation time with PerformanceMonitor', () => {
      const recordCreationSpy = vi.spyOn(performanceMonitor, 'recordCreation');
      
      const beforeCreation = Date.now();
      const agent = new Agent();
      const afterCreation = Date.now();
      
      expect(recordCreationSpy).toHaveBeenCalledWith(
        agent.id,
        expect.any(Number)
      );
      
      // Check that recorded duration is reasonable
      const duration = recordCreationSpy.mock.calls[0]?.[1];
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThanOrEqual(afterCreation - beforeCreation);
    });
  });

  describe('memory management', () => {
    it('should have isolated private memory', () => {
      const agent1 = new Agent();
      const agent2 = new Agent();
      
      agent1.setMemory('key1', 'value1');
      agent2.setMemory('key1', 'value2');
      
      expect(agent1.getMemory('key1')).toBe('value1');
      expect(agent2.getMemory('key1')).toBe('value2');
    });

    it('should log memory access with SecurityMonitor on read', () => {
      const logSpy = vi.spyOn(securityMonitor, 'logMemoryAccess');
      const agent = new Agent();
      
      agent.setMemory('testKey', 'testValue');
      agent.getMemory('testKey');
      
      expect(logSpy).toHaveBeenCalledWith(agent.id, 'read', 'testKey');
    });

    it('should log memory access with SecurityMonitor on write', () => {
      const logSpy = vi.spyOn(securityMonitor, 'logMemoryAccess');
      const agent = new Agent();
      
      agent.setMemory('testKey', 'testValue');
      
      expect(logSpy).toHaveBeenCalledWith(agent.id, 'write', 'testKey');
    });

    it('should return undefined for non-existent keys', () => {
      const agent = new Agent();
      
      expect(agent.getMemory('nonexistent')).toBeUndefined();
    });

    it('should allow storing various data types', () => {
      const agent = new Agent();
      
      agent.setMemory('string', 'hello');
      agent.setMemory('number', 42);
      agent.setMemory('boolean', true);
      agent.setMemory('object', { foo: 'bar' });
      agent.setMemory('array', [1, 2, 3]);
      
      expect(agent.getMemory('string')).toBe('hello');
      expect(agent.getMemory('number')).toBe(42);
      expect(agent.getMemory('boolean')).toBe(true);
      expect(agent.getMemory('object')).toEqual({ foo: 'bar' });
      expect(agent.getMemory('array')).toEqual([1, 2, 3]);
    });
  });

  describe('messaging', () => {
    it('should receive messages', async () => {
      const agent = new Agent();
      const message = MessageFactory.createMessage(
        'sender',
        agent.id,
        'test',
        { text: 'Hello' }
      );
      
      const onMessageSpy = vi.fn();
      agent.onMessage(onMessageSpy);
      
      await agent.receiveMessage(message);
      
      expect(onMessageSpy).toHaveBeenCalledWith(message);
    });

    it('should handle multiple message handlers', async () => {
      const agent = new Agent();
      const message = MessageFactory.createMessage(
        'sender',
        agent.id,
        'test',
        { text: 'Hello' }
      );
      
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      agent.onMessage(handler1);
      agent.onMessage(handler2);
      
      await agent.receiveMessage(message);
      
      expect(handler1).toHaveBeenCalledWith(message);
      expect(handler2).toHaveBeenCalledWith(message);
    });

    it('should record message delivery time', async () => {
      const recordDeliverySpy = vi.spyOn(performanceMonitor, 'recordMessageDelivery');
      const agent = new Agent();
      const message = MessageFactory.createMessage(
        'sender',
        agent.id,
        'test',
        { text: 'Hello' }
      );
      
      await agent.receiveMessage(message);
      
      expect(recordDeliverySpy).toHaveBeenCalledWith(
        'sender',
        agent.id,
        expect.any(Number)
      );
    });
  });

  describe('agent lifecycle', () => {
    it('should unregister from SecurityMonitor on destroy', async () => {
      const unregisterSpy = vi.spyOn(securityMonitor, 'unregisterAgent');
      const agent = new Agent();
      
      await agent.destroy();
      
      expect(unregisterSpy).toHaveBeenCalledWith(agent.id);
    });

    it('should record destruction time', async () => {
      const recordDestructionSpy = vi.spyOn(performanceMonitor, 'recordDestruction');
      const agent = new Agent();
      
      await agent.destroy();
      
      expect(recordDestructionSpy).toHaveBeenCalledWith(
        agent.id,
        expect.any(Number)
      );
    });

    it('should clear memory on destroy', async () => {
      const agent = new Agent();
      
      agent.setMemory('key1', 'value1');
      agent.setMemory('key2', 'value2');
      
      await agent.destroy();
      
      // Memory should be inaccessible after destroy
      expect(() => agent.getMemory('key1')).toThrow(AgentError);
    });

    it('should prevent operations after destroy', async () => {
      const agent = new Agent();
      await agent.destroy();
      
      // All operations should throw
      expect(() => agent.getMemory('key')).toThrow(AgentError);
      expect(() => agent.setMemory('key', 'value')).toThrow(AgentError);
      await expect(agent.receiveMessage(
        MessageFactory.createMessage('sender', agent.id, 'test', {})
      )).rejects.toThrow(AgentError);
    });

    it('should throw correct error code after destroy', async () => {
      const agent = new Agent();
      await agent.destroy();
      
      try {
        agent.getMemory('key');
      } catch (error) {
        expect(error).toBeInstanceOf(AgentError);
        expect((error as AgentError).code).toBe(ErrorCode.AGENT_DESTROYED);
      }
    });

    it('should be idempotent on multiple destroy calls', async () => {
      const agent = new Agent();
      
      await agent.destroy();
      await expect(agent.destroy()).resolves.not.toThrow();
    });
  });

  describe('state management', () => {
    it('should report active state initially', () => {
      const agent = new Agent();
      expect(agent.isActive()).toBe(true);
    });

    it('should report inactive state after destroy', async () => {
      const agent = new Agent();
      await agent.destroy();
      expect(agent.isActive()).toBe(false);
    });
  });

  describe('memory isolation verification', () => {
    it('should not share memory between agents', () => {
      const agent1 = new Agent();
      const agent2 = new Agent();
      
      const testObj = { shared: 'value' };
      agent1.setMemory('obj', testObj);
      
      // Modify the object
      testObj.shared = 'modified';
      
      // Agent1 should see the modification (reference)
      expect(agent1.getMemory('obj')).toEqual({ shared: 'modified' });
      
      // Agent2 should not have this key
      expect(agent2.getMemory('obj')).toBeUndefined();
    });
  });
});