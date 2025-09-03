import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AgentManager } from '@/core/agent-manager';
import { Agent } from '@/core/agent';
import { AgentError, ErrorCode } from '@/core/errors';
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

describe('Error Handling Integration Tests', () => {
  let manager: AgentManager;

  beforeEach(() => {
    // Clear singleton instances
    // @ts-expect-error Accessing private static member for testing
    AgentManager.instances.clear();
    
    manager = AgentManager.getInstance();
  });

  afterEach(() => {
    manager.destroyAll();
  });

  describe('agent creation limit errors', () => {
    it('should throw error when creating 11th agent', () => {
      // Create 10 agents (the maximum allowed)
      for (let i = 0; i < 10; i++) {
        manager.createAgent(`agent-${i}`);
      }

      // Attempt to create 11th agent should throw
      expect(() => manager.createAgent('agent-11'))
        .toThrow(AgentError);
      
      expect(() => manager.createAgent('agent-11'))
        .toThrow(expect.objectContaining({
          code: ErrorCode.AGENT_LIMIT_EXCEEDED,
          message: expect.stringContaining('Cannot create more than 10 agents')
        }));
    });

    it('should allow creating new agent after destroying one when at limit', async () => {
      // Create 10 agents
      const agents: Agent[] = [];
      for (let i = 0; i < 10; i++) {
        agents.push(manager.createAgent(`agent-${i}`));
      }

      // Verify we're at the limit
      expect(() => manager.createAgent('agent-extra')).toThrow(AgentError);

      // Destroy one agent
      await manager.destroyAgent('agent-0');

      // Now we should be able to create another
      const newAgent = manager.createAgent('agent-new');
      expect(newAgent).toBeInstanceOf(Agent);
      expect(newAgent.id).toBe('agent-new');
    });

    it('should throw error for duplicate agent ID', () => {
      const firstAgent = manager.createAgent('duplicate-id');
      expect(firstAgent).toBeInstanceOf(Agent);

      // Try to create another agent with the same ID
      expect(() => manager.createAgent('duplicate-id'))
        .toThrow(AgentError);
      
      expect(() => manager.createAgent('duplicate-id'))
        .toThrow(expect.objectContaining({
          code: ErrorCode.DUPLICATE_AGENT_ID,
          message: expect.stringContaining("Agent with ID 'duplicate-id' already exists")
        }));
    });
  });

  describe('post-destruction access errors', () => {
    it('should throw error when accessing destroyed agent memory', async () => {
      const agent = manager.createAgent('test-agent');
      
      // Set some memory
      agent.setMemory('key', 'value');
      expect(agent.getMemory('key')).toBe('value');

      // Destroy the agent
      await manager.destroyAgent('test-agent');

      // Verify agent is destroyed
      expect(agent.isActive()).toBe(false);

      // Attempts to access memory should throw
      expect(() => agent.getMemory('key'))
        .toThrow(AgentError);
      
      expect(() => agent.getMemory('key'))
        .toThrow(expect.objectContaining({
          code: ErrorCode.AGENT_DESTROYED,
          message: expect.stringContaining('has been destroyed')
        }));
    });

    it('should throw error when setting memory on destroyed agent', async () => {
      const agent = manager.createAgent('test-agent');
      
      // Destroy the agent
      await manager.destroyAgent('test-agent');

      // Attempts to set memory should throw
      expect(() => agent.setMemory('key', 'value'))
        .toThrow(AgentError);
      
      expect(() => agent.setMemory('key', 'value'))
        .toThrow(expect.objectContaining({
          code: ErrorCode.AGENT_DESTROYED
        }));
    });

    it('should throw error when receiving message on destroyed agent', async () => {
      const sender = manager.createAgent('sender');
      const receiver = manager.createAgent('receiver');

      // Set up message handler
      const messageHandler = vi.fn();
      receiver.onMessage(messageHandler);

      // Destroy receiver
      await manager.destroyAgent('receiver');

      // Attempts to receive message should throw
      await expect(manager.sendMessage(sender.id, 'receiver', 'test', { data: 'test' }))
        .rejects.toThrow(AgentError);

      await expect(manager.sendMessage(sender.id, 'receiver', 'test', { data: 'test' }))
        .rejects.toThrow(expect.objectContaining({
          code: ErrorCode.AGENT_NOT_FOUND
        }));
    });

    it('should handle multiple destruction attempts gracefully', async () => {
      const agent = manager.createAgent('test-agent');
      
      // First destruction should work
      await manager.destroyAgent('test-agent');
      expect(agent.isActive()).toBe(false);

      // Second destruction should not throw but log warning
      await expect(manager.destroyAgent('test-agent')).resolves.not.toThrow();
      
      // Third destruction should also not throw
      await expect(manager.destroyAgent('test-agent')).resolves.not.toThrow();
    });
  });

  describe('invalid destination errors', () => {
    it('should throw error when sending message to non-existent agent', async () => {
      const sender = manager.createAgent('sender');

      await expect(
        manager.sendMessage(sender.id, 'non-existent', 'test', { data: 'test' })
      ).rejects.toThrow(AgentError);

      await expect(
        manager.sendMessage(sender.id, 'non-existent', 'test', { data: 'test' })
      ).rejects.toThrow(expect.objectContaining({
        code: ErrorCode.AGENT_NOT_FOUND,
        message: expect.stringContaining("Receiver agent 'non-existent' not found")
      }));
    });

    it('should throw error when sender does not exist', async () => {
      const receiver = manager.createAgent('receiver');

      await expect(
        manager.sendMessage('non-existent', receiver.id, 'test', { data: 'test' })
      ).rejects.toThrow(AgentError);

      await expect(
        manager.sendMessage('non-existent', receiver.id, 'test', { data: 'test' })
      ).rejects.toThrow(expect.objectContaining({
        code: ErrorCode.AGENT_NOT_FOUND,
        message: expect.stringContaining("Sender agent 'non-existent' not found")
      }));
    });

    it('should throw error when broadcasting from non-existent agent', async () => {
      manager.createAgent('receiver1');
      manager.createAgent('receiver2');

      await expect(
        manager.broadcastMessage('non-existent', 'broadcast', { data: 'test' })
      ).rejects.toThrow(AgentError);

      await expect(
        manager.broadcastMessage('non-existent', 'broadcast', { data: 'test' })
      ).rejects.toThrow(expect.objectContaining({
        code: ErrorCode.AGENT_NOT_FOUND,
        message: expect.stringContaining("Sender agent 'non-existent' not found")
      }));
    });

    it('should handle errors gracefully during broadcast', async () => {
      const sender = manager.createAgent('sender');
      const receiver1 = manager.createAgent('receiver1');
      const receiver2 = manager.createAgent('receiver2');
      const receiver3 = manager.createAgent('receiver3');

      const messages1: Message[] = [];
      const messages3: Message[] = [];

      receiver1.onMessage(msg => messages1.push(msg));
      receiver3.onMessage(msg => messages3.push(msg));

      // Destroy receiver2 to simulate failure
      await manager.destroyAgent('receiver2');

      // Broadcast should not throw but should deliver to active agents
      await expect(
        manager.broadcastMessage(sender.id, 'test', { data: 'broadcast' })
      ).resolves.not.toThrow();

      // Wait for message processing
      await new Promise(resolve => setTimeout(resolve, 10));

      // Messages should be delivered to active agents only
      expect(messages1).toHaveLength(1);
      expect(messages3).toHaveLength(1);
    });
  });

  describe('message size errors', () => {
    it('should throw error for message exceeding 1MB', async () => {
      const sender = manager.createAgent('sender');
      const receiver = manager.createAgent('receiver');

      // Create payload larger than 1MB
      const largePayload = {
        data: 'x'.repeat(1024 * 1024 + 1) // 1MB + 1 byte
      };

      await expect(
        manager.sendMessage(sender.id, receiver.id, 'large', largePayload)
      ).rejects.toThrow(AgentError);

      await expect(
        manager.sendMessage(sender.id, receiver.id, 'large', largePayload)
      ).rejects.toThrow(expect.objectContaining({
        code: ErrorCode.MESSAGE_TOO_LARGE,
        message: expect.stringMatching(/Message size .* exceeds limit/)
      }));
    });

    it('should calculate message size correctly including metadata', async () => {
      const sender = manager.createAgent('sender');
      const receiver = manager.createAgent('receiver');

      let received = false;
      receiver.onMessage(() => { received = true; });

      // Create payload just under 1MB considering message metadata
      // Message structure includes: id, from, to, type, payload, timestamp
      // We need to leave room for this metadata
      const almostLargePayload = {
        data: 'x'.repeat(1024 * 1024 - 500) // Leave 500 bytes for metadata
      };

      // This should succeed
      await expect(
        manager.sendMessage(sender.id, receiver.id, 'almost-large', almostLargePayload)
      ).resolves.not.toThrow();

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(received).toBe(true);
    });

    it('should enforce size limit for each message in broadcast', async () => {
      const sender = manager.createAgent('sender');
      const receiver1 = manager.createAgent('receiver1');
      const receiver2 = manager.createAgent('receiver2');

      const messages1: Message[] = [];
      const messages2: Message[] = [];
      
      receiver1.onMessage(msg => messages1.push(msg));
      receiver2.onMessage(msg => messages2.push(msg));

      const largePayload = {
        data: 'x'.repeat(1024 * 1024 + 1)
      };

      // Broadcast with large payload should not throw but no messages delivered
      await expect(
        manager.broadcastMessage(sender.id, 'large-broadcast', largePayload)
      ).resolves.not.toThrow();

      await new Promise(resolve => setTimeout(resolve, 10));

      // No messages should be delivered due to size limit
      expect(messages1).toHaveLength(0);
      expect(messages2).toHaveLength(0);
    });
  });

  describe('error propagation and recovery', () => {
    it('should maintain system stability after various errors', async () => {
      // Create some agents
      const agent1 = manager.createAgent('agent1');
      const agent2 = manager.createAgent('agent2');

      // Trigger various errors
      expect(() => manager.createAgent('agent1')).toThrow(AgentError); // Duplicate ID
      await expect(
        manager.sendMessage('fake', agent1.id, 'test', {})
      ).rejects.toThrow(AgentError); // Invalid sender

      // System should still be functional
      await manager.sendMessage(agent1.id, agent2.id, 'test', { data: 'works' });
      
      const newAgent = manager.createAgent('agent3');
      expect(newAgent.isActive()).toBe(true);
    });

    it('should provide meaningful error context', async () => {
      try {
        const agent = manager.createAgent('test');
        await manager.destroyAgent('test');
        agent.setMemory('key', 'value');
      } catch (error) {
        expect(error).toBeInstanceOf(AgentError);
        const agentError = error as AgentError;
        expect(agentError.code).toBe(ErrorCode.AGENT_DESTROYED);
        expect(agentError.timestamp).toBeInstanceOf(Date);
        expect(agentError.context).toBeUndefined();
      }
    });

    it('should handle concurrent error scenarios', async () => {
      const agents: Agent[] = [];
      
      // Create maximum agents
      for (let i = 0; i < 10; i++) {
        agents.push(manager.createAgent(`agent-${i}`));
      }

      // Attempt multiple operations that should fail
      const errors: Error[] = [];
      
      const operations = [
        // Try to exceed limit
        () => manager.createAgent('extra'),
        // Try duplicate ID
        () => manager.createAgent('agent-0'),
        // Try invalid message
        manager.sendMessage('fake', 'agent-1', 'test', {}),
        // Try large message
        manager.sendMessage('agent-0', 'agent-1', 'test', { data: 'x'.repeat(1024 * 1024 + 1) })
      ];

      for (const op of operations) {
        try {
          if (op instanceof Promise) {
            await op;
          } else {
            op();
          }
        } catch (error) {
          errors.push(error as Error);
        }
      }

      // All operations should have failed
      expect(errors).toHaveLength(4);
      expect(errors.every(e => e instanceof AgentError)).toBe(true);
      
      // System should still be stable
      expect(manager.getAgentCount()).toBe(10);
    });
  });
});