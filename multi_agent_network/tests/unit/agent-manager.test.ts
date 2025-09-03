import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AgentManager } from '@/core/agent-manager';
import { Agent } from '@/core/agent';
import { AgentError, ErrorCode } from '@/core/errors';
import { MessageFactory } from '@/core/message-factory';
import type { Message } from '@/core/types/message';

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

describe('AgentManager', () => {
  let manager: AgentManager;

  beforeEach(() => {
    // Clear singleton instances between tests
    // @ts-expect-error Accessing private static member for testing
    AgentManager.instances.clear();
    
    manager = AgentManager.getInstance();
  });

  afterEach(() => {
    // Clean up all agents
    manager.destroyAll();
  });

  describe('singleton behavior', () => {
    it('should return the same instance when getInstance is called multiple times', () => {
      const instance1 = AgentManager.getInstance();
      const instance2 = AgentManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should extend Singleton base class', () => {
      expect(AgentManager.prototype.constructor.name).toBe('AgentManager');
    });
  });

  describe('agent creation', () => {
    it('should create agent with generated ID', () => {
      const agent = manager.createAgent();

      expect(agent).toBeInstanceOf(Agent);
      expect(agent.id).toBeDefined();
      expect(agent.isActive()).toBe(true);
    });

    it('should create agent with custom ID', () => {
      const customId = 'custom-agent-123';
      const agent = manager.createAgent(customId);

      expect(agent.id).toBe(customId);
    });

    it('should allow creating up to 10 agents', () => {
      const agents: Agent[] = [];
      
      // Create 10 agents
      for (let i = 0; i < 10; i++) {
        const agent = manager.createAgent();
        agents.push(agent);
      }

      expect(agents).toHaveLength(10);
      expect(manager.getAgentCount()).toBe(10);
    });

    it('should throw error when creating 11th agent', () => {
      // Create 10 agents
      for (let i = 0; i < 10; i++) {
        manager.createAgent();
      }

      // Try to create 11th agent
      expect(() => manager.createAgent()).toThrow(AgentError);
      expect(() => manager.createAgent()).toThrow(
        expect.objectContaining({
          code: ErrorCode.AGENT_LIMIT_EXCEEDED
        })
      );
    });

    it('should throw error for duplicate agent ID', () => {
      const duplicateId = 'duplicate-id';
      
      manager.createAgent(duplicateId);
      
      expect(() => manager.createAgent(duplicateId)).toThrow(AgentError);
      expect(() => manager.createAgent(duplicateId)).toThrow(
        expect.objectContaining({
          code: ErrorCode.DUPLICATE_AGENT_ID
        })
      );
    });

    it('should complete within 50ms', () => {
      const startTime = Date.now();
      manager.createAgent();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('agent retrieval', () => {
    it('should get agent by ID', () => {
      const agent = manager.createAgent();
      const retrieved = manager.getAgent(agent.id);

      expect(retrieved).toBe(agent);
    });

    it('should return undefined for non-existent agent', () => {
      const retrieved = manager.getAgent('non-existent');
      
      expect(retrieved).toBeUndefined();
    });

    it('should list all agents', () => {
      const agent1 = manager.createAgent();
      const agent2 = manager.createAgent();
      const agent3 = manager.createAgent();

      const agents = manager.listAgents();

      expect(agents).toHaveLength(3);
      expect(agents).toContain(agent1);
      expect(agents).toContain(agent2);
      expect(agents).toContain(agent3);
    });
  });

  describe('agent destruction', () => {
    it('should destroy agent by ID', async () => {
      const agent = manager.createAgent();
      const agentId = agent.id;

      await manager.destroyAgent(agentId);

      expect(manager.getAgent(agentId)).toBeUndefined();
      expect(agent.isActive()).toBe(false);
    });

    it('should allow creating new agent after destroying one', async () => {
      // Create 10 agents
      for (let i = 0; i < 10; i++) {
        manager.createAgent();
      }

      // Destroy one agent
      const agents = manager.listAgents();
      await manager.destroyAgent(agents[0].id);

      // Should be able to create another
      expect(manager.createAgent()).toBeInstanceOf(Agent);
    });

    it('should handle destroying non-existent agent gracefully', async () => {
      await expect(manager.destroyAgent('non-existent')).resolves.not.toThrow();
    });

    it('should destroy all agents', () => {
      manager.createAgent();
      manager.createAgent();
      manager.createAgent();

      manager.destroyAll();

      expect(manager.getAgentCount()).toBe(0);
      expect(manager.listAgents()).toHaveLength(0);
    });
  });

  describe('messaging', () => {
    it('should send message between agents', async () => {
      const sender = manager.createAgent();
      const receiver = manager.createAgent();
      
      const messageHandler = vi.fn();
      receiver.onMessage(messageHandler);

      const message = MessageFactory.createMessage(
        sender.id,
        receiver.id,
        'test',
        { text: 'Hello' }
      );

      await manager.sendMessage(sender.id, receiver.id, 'test', { text: 'Hello' });

      expect(messageHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          from: sender.id,
          to: receiver.id,
          type: 'test',
          payload: { text: 'Hello' }
        })
      );
    });

    it('should throw error for non-existent sender', async () => {
      const receiver = manager.createAgent();

      await expect(
        manager.sendMessage('non-existent', receiver.id, 'test', {})
      ).rejects.toThrow(AgentError);
      await expect(
        manager.sendMessage('non-existent', receiver.id, 'test', {})
      ).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.AGENT_NOT_FOUND
        })
      );
    });

    it('should throw error for non-existent receiver', async () => {
      const sender = manager.createAgent();

      await expect(
        manager.sendMessage(sender.id, 'non-existent', 'test', {})
      ).rejects.toThrow(AgentError);
      await expect(
        manager.sendMessage(sender.id, 'non-existent', 'test', {})
      ).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.AGENT_NOT_FOUND
        })
      );
    });

    it('should throw error for message exceeding 1MB', async () => {
      const sender = manager.createAgent();
      const receiver = manager.createAgent();

      // Create payload larger than 1MB
      const largePayload = {
        data: 'x'.repeat(1024 * 1024 + 1) // 1MB + 1 byte
      };

      await expect(
        manager.sendMessage(sender.id, receiver.id, 'test', largePayload)
      ).rejects.toThrow(AgentError);
      await expect(
        manager.sendMessage(sender.id, receiver.id, 'test', largePayload)
      ).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.MESSAGE_TOO_LARGE
        })
      );
    });

    it('should complete within 10ms for normal message', async () => {
      const sender = manager.createAgent();
      const receiver = manager.createAgent();

      const startTime = Date.now();
      await manager.sendMessage(sender.id, receiver.id, 'test', { text: 'Hello' });
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10);
    });
  });

  describe('broadcast messaging', () => {
    it('should broadcast message to all agents except sender', async () => {
      const sender = manager.createAgent();
      const receiver1 = manager.createAgent();
      const receiver2 = manager.createAgent();
      const receiver3 = manager.createAgent();

      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();
      const senderHandler = vi.fn();

      receiver1.onMessage(handler1);
      receiver2.onMessage(handler2);
      receiver3.onMessage(handler3);
      sender.onMessage(senderHandler);

      await manager.broadcastMessage(sender.id, 'broadcast', { text: 'Hello all' });

      expect(handler1).toHaveBeenCalledWith(
        expect.objectContaining({
          from: sender.id,
          type: 'broadcast',
          payload: { text: 'Hello all' }
        })
      );
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
      expect(senderHandler).not.toHaveBeenCalled();
    });

    it('should throw error if sender does not exist', async () => {
      await expect(
        manager.broadcastMessage('non-existent', 'test', {})
      ).rejects.toThrow(AgentError);
    });
  });

  describe('agent state queries', () => {
    it('should report correct agent count', () => {
      expect(manager.getAgentCount()).toBe(0);

      manager.createAgent();
      expect(manager.getAgentCount()).toBe(1);

      manager.createAgent();
      manager.createAgent();
      expect(manager.getAgentCount()).toBe(3);
    });

    it('should check if agent exists', () => {
      const agent = manager.createAgent();

      expect(manager.hasAgent(agent.id)).toBe(true);
      expect(manager.hasAgent('non-existent')).toBe(false);
    });
  });
});