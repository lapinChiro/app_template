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

describe('Messaging Integration Tests', () => {
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

  describe('message exchange between 2 agents', () => {
    it('should exchange messages bidirectionally between agents', async () => {
      const agent1 = manager.createAgent('agent1');
      const agent2 = manager.createAgent('agent2');
      
      const agent1Messages: Message[] = [];
      const agent2Messages: Message[] = [];
      
      agent1.onMessage((msg) => agent1Messages.push(msg));
      agent2.onMessage((msg) => agent2Messages.push(msg));
      
      // Send from agent1 to agent2
      await manager.sendMessage(agent1.id, agent2.id, 'greeting', { text: 'Hello from agent1' });
      
      // Send from agent2 to agent1
      await manager.sendMessage(agent2.id, agent1.id, 'response', { text: 'Hello back from agent2' });
      
      // Verify messages received
      expect(agent2Messages).toHaveLength(1);
      expect(agent2Messages[0]).toMatchObject({
        from: 'agent1',
        to: 'agent2',
        type: 'greeting',
        payload: { text: 'Hello from agent1' }
      });
      
      expect(agent1Messages).toHaveLength(1);
      expect(agent1Messages[0]).toMatchObject({
        from: 'agent2',
        to: 'agent1',
        type: 'response',
        payload: { text: 'Hello back from agent2' }
      });
    });

    it('should handle multiple message types between agents', async () => {
      const agent1 = manager.createAgent('agent1');
      const agent2 = manager.createAgent('agent2');
      
      const messages: Message[] = [];
      agent2.onMessage((msg) => messages.push(msg));
      
      // Send different message types
      await manager.sendMessage(agent1.id, agent2.id, 'data', { value: 123 });
      await manager.sendMessage(agent1.id, agent2.id, 'command', { action: 'start' });
      await manager.sendMessage(agent1.id, agent2.id, 'status', { ready: true });
      
      expect(messages).toHaveLength(3);
      expect(messages[0].type).toBe('data');
      expect(messages[1].type).toBe('command');
      expect(messages[2].type).toBe('status');
    });

    it('should preserve payload integrity including complex types', async () => {
      const agent1 = manager.createAgent('agent1');
      const agent2 = manager.createAgent('agent2');
      
      let receivedMessage: Message | null = null;
      agent2.onMessage((msg) => { receivedMessage = msg; });
      
      const complexPayload = {
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        nested: {
          deep: {
            value: 'nested value'
          }
        },
        date: new Date().toISOString()
      };
      
      await manager.sendMessage(agent1.id, agent2.id, 'complex', complexPayload);
      
      expect(receivedMessage).not.toBeNull();
      expect(receivedMessage!.payload).toEqual(complexPayload);
    });
  });

  describe('sequential sending to multiple agents', () => {
    it('should send messages sequentially to multiple agents', async () => {
      const sender = manager.createAgent('sender');
      const receiver1 = manager.createAgent('receiver1');
      const receiver2 = manager.createAgent('receiver2');
      const receiver3 = manager.createAgent('receiver3');
      
      const messages1: Message[] = [];
      const messages2: Message[] = [];
      const messages3: Message[] = [];
      
      receiver1.onMessage((msg) => messages1.push(msg));
      receiver2.onMessage((msg) => messages2.push(msg));
      receiver3.onMessage((msg) => messages3.push(msg));
      
      // Send to each receiver sequentially
      await manager.sendMessage(sender.id, receiver1.id, 'msg', { seq: 1 });
      await manager.sendMessage(sender.id, receiver2.id, 'msg', { seq: 2 });
      await manager.sendMessage(sender.id, receiver3.id, 'msg', { seq: 3 });
      
      // Each receiver should have exactly one message
      expect(messages1).toHaveLength(1);
      expect(messages2).toHaveLength(1);
      expect(messages3).toHaveLength(1);
      
      expect(messages1[0].payload).toEqual({ seq: 1 });
      expect(messages2[0].payload).toEqual({ seq: 2 });
      expect(messages3[0].payload).toEqual({ seq: 3 });
    });

    it('should handle sending multiple messages to the same agent', async () => {
      const sender = manager.createAgent('sender');
      const receiver = manager.createAgent('receiver');
      
      const messages: Message[] = [];
      receiver.onMessage((msg) => messages.push(msg));
      
      // Send multiple messages
      for (let i = 0; i < 10; i++) {
        await manager.sendMessage(sender.id, receiver.id, 'sequence', { index: i });
      }
      
      expect(messages).toHaveLength(10);
      // Verify all messages were received in order
      messages.forEach((msg, index) => {
        expect(msg.payload).toEqual({ index });
      });
    });

    it('should handle concurrent broadcast and direct messages', async () => {
      const sender = manager.createAgent('sender');
      const receiver1 = manager.createAgent('receiver1');
      const receiver2 = manager.createAgent('receiver2');
      const receiver3 = manager.createAgent('receiver3');
      
      const messages1: Message[] = [];
      const messages2: Message[] = [];
      const messages3: Message[] = [];
      
      receiver1.onMessage((msg) => messages1.push(msg));
      receiver2.onMessage((msg) => messages2.push(msg));
      receiver3.onMessage((msg) => messages3.push(msg));
      
      // Send direct message to receiver1
      await manager.sendMessage(sender.id, receiver1.id, 'direct', { target: 'receiver1' });
      
      // Broadcast to all
      await manager.broadcastMessage(sender.id, 'broadcast', { message: 'to all' });
      
      // Send direct message to receiver2
      await manager.sendMessage(sender.id, receiver2.id, 'direct', { target: 'receiver2' });
      
      // Verify receiver1 got both direct and broadcast
      expect(messages1).toHaveLength(2);
      expect(messages1[0].type).toBe('direct');
      expect(messages1[1].type).toBe('broadcast');
      
      // Verify receiver2 got broadcast then direct
      expect(messages2).toHaveLength(2);
      expect(messages2[0].type).toBe('broadcast');
      expect(messages2[1].type).toBe('direct');
      
      // Verify receiver3 got only broadcast
      expect(messages3).toHaveLength(1);
      expect(messages3[0].type).toBe('broadcast');
    });
  });

  describe('FIFO message processing order', () => {
    it('should process messages in FIFO order for each agent', async () => {
      const sender = manager.createAgent('sender');
      const receiver = manager.createAgent('receiver');
      
      const processedOrder: number[] = [];
      
      receiver.onMessage((msg) => {
        const { order } = msg.payload as { order: number };
        processedOrder.push(order);
      });
      
      // Send messages with order information
      const messageCount = 20;
      for (let i = 0; i < messageCount; i++) {
        await manager.sendMessage(sender.id, receiver.id, 'ordered', { order: i });
      }
      
      // Wait a bit for all messages to be processed
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify FIFO order
      expect(processedOrder).toHaveLength(messageCount);
      for (let i = 0; i < messageCount; i++) {
        expect(processedOrder[i]).toBe(i);
      }
    });

    it('should maintain FIFO order with multiple senders', async () => {
      const sender1 = manager.createAgent('sender1');
      const sender2 = manager.createAgent('sender2');
      const sender3 = manager.createAgent('sender3');
      const receiver = manager.createAgent('receiver');
      
      const messages: Array<{ sender: string; seq: number }> = [];
      
      receiver.onMessage((msg) => {
        const { seq } = msg.payload as { seq: number };
        messages.push({ sender: msg.from, seq });
      });
      
      // Interleave messages from different senders
      await manager.sendMessage(sender1.id, receiver.id, 'msg', { seq: 1 });
      await manager.sendMessage(sender2.id, receiver.id, 'msg', { seq: 1 });
      await manager.sendMessage(sender1.id, receiver.id, 'msg', { seq: 2 });
      await manager.sendMessage(sender3.id, receiver.id, 'msg', { seq: 1 });
      await manager.sendMessage(sender2.id, receiver.id, 'msg', { seq: 2 });
      await manager.sendMessage(sender1.id, receiver.id, 'msg', { seq: 3 });
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Verify order matches send order
      expect(messages).toHaveLength(6);
      expect(messages[0]).toEqual({ sender: 'sender1', seq: 1 });
      expect(messages[1]).toEqual({ sender: 'sender2', seq: 1 });
      expect(messages[2]).toEqual({ sender: 'sender1', seq: 2 });
      expect(messages[3]).toEqual({ sender: 'sender3', seq: 1 });
      expect(messages[4]).toEqual({ sender: 'sender2', seq: 2 });
      expect(messages[5]).toEqual({ sender: 'sender1', seq: 3 });
    });

    it('should handle rapid message sending while maintaining order', async () => {
      const sender = manager.createAgent('sender');
      const receiver = manager.createAgent('receiver');
      
      const timestamps: number[] = [];
      
      receiver.onMessage((msg) => {
        const { timestamp } = msg.payload as { timestamp: number };
        timestamps.push(timestamp);
      });
      
      // Send messages rapidly
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          manager.sendMessage(sender.id, receiver.id, 'rapid', { timestamp: i })
        );
      }
      
      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verify all messages were received in order
      expect(timestamps).toHaveLength(100);
      for (let i = 0; i < 100; i++) {
        expect(timestamps[i]).toBe(i);
      }
    });
  });

  describe('large payload rejection', () => {
    it('should reject payload exceeding 1MB limit', async () => {
      const sender = manager.createAgent('sender');
      const receiver = manager.createAgent('receiver');
      
      // Create payload just over 1MB
      const largePayload = {
        data: 'x'.repeat(1024 * 1024 + 1)
      };
      
      await expect(
        manager.sendMessage(sender.id, receiver.id, 'large', largePayload)
      ).rejects.toThrow(AgentError);
      
      await expect(
        manager.sendMessage(sender.id, receiver.id, 'large', largePayload)
      ).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.MESSAGE_TOO_LARGE
        })
      );
    });

    it('should accept payload just under 1MB limit', async () => {
      const sender = manager.createAgent('sender');
      const receiver = manager.createAgent('receiver');
      
      let received = false;
      receiver.onMessage(() => { received = true; });
      
      // Create payload just under 1MB (leaving room for message metadata)
      const almostLargePayload = {
        data: 'x'.repeat(1024 * 1024 - 1000)
      };
      
      await expect(
        manager.sendMessage(sender.id, receiver.id, 'almost-large', almostLargePayload)
      ).resolves.not.toThrow();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(received).toBe(true);
    });

    it('should calculate size correctly for complex payloads', async () => {
      const sender = manager.createAgent('sender');
      const receiver = manager.createAgent('receiver');
      
      // Create a complex payload that definitely exceeds 1MB
      // Each 'x'.repeat(1050) is 1050 bytes, and we have 1050 of them = 1,102,500 bytes
      const complexPayload = {
        strings: Array(1050).fill('x'.repeat(1050)),
        metadata: {
          type: 'large-complex-payload',
          nested: {
            deep: {
              arrays: [[1, 2, 3], [4, 5, 6]],
              objects: { a: 1, b: 2 }
            }
          }
        }
      };
      
      // This should exceed 1MB when serialized
      await expect(
        manager.sendMessage(sender.id, receiver.id, 'complex-large', complexPayload)
      ).rejects.toThrow(AgentError);
    });

    it('should handle size limit on broadcast messages gracefully', async () => {
      const sender = manager.createAgent('sender');
      const receiver1 = manager.createAgent('receiver1');
      const receiver2 = manager.createAgent('receiver2');
      
      const messages1: Message[] = [];
      const messages2: Message[] = [];
      
      receiver1.onMessage((msg) => messages1.push(msg));
      receiver2.onMessage((msg) => messages2.push(msg));
      
      const largePayload = {
        data: 'x'.repeat(1024 * 1024 + 1)
      };
      
      // Broadcast with large payload should not throw but should fail to deliver
      // because broadcastMessage catches individual sendMessage errors
      await expect(
        manager.broadcastMessage(sender.id, 'broadcast-large', largePayload)
      ).resolves.not.toThrow();
      
      // No messages should be delivered due to size limit
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(messages1).toHaveLength(0);
      expect(messages2).toHaveLength(0);
    });
  });

  describe('error handling in messaging', () => {
    it('should handle agent destruction during message delivery', async () => {
      const sender = manager.createAgent('sender');
      const receiver = manager.createAgent('receiver');
      
      const messages: Message[] = [];
      receiver.onMessage((msg) => messages.push(msg));
      
      // Send first message successfully
      await manager.sendMessage(sender.id, receiver.id, 'test', { seq: 1 });
      expect(messages).toHaveLength(1);
      
      // Destroy receiver
      await manager.destroyAgent(receiver.id);
      
      // Try to send another message
      await expect(
        manager.sendMessage(sender.id, receiver.id, 'test', { seq: 2 })
      ).rejects.toThrow(AgentError);
    });

    it('should continue broadcast even if some agents fail', async () => {
      const sender = manager.createAgent('sender');
      const receiver1 = manager.createAgent('receiver1');
      const receiver2 = manager.createAgent('receiver2');
      const receiver3 = manager.createAgent('receiver3');
      
      const messages1: Message[] = [];
      const messages3: Message[] = [];
      
      receiver1.onMessage((msg) => messages1.push(msg));
      receiver3.onMessage((msg) => messages3.push(msg));
      
      // Destroy receiver2 to simulate failure
      await manager.destroyAgent(receiver2.id);
      
      // Broadcast should still reach other agents
      await manager.broadcastMessage(sender.id, 'broadcast', { data: 'test' });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(messages1).toHaveLength(1);
      expect(messages3).toHaveLength(1);
    });
  });
});