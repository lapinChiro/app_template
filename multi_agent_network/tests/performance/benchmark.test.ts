import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AgentManager } from '@/core/agent-manager';
import { Agent } from '@/core/agent';

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

/**
 * Performance benchmark tests for the agent system
 * 
 * Requirements:
 * - Agent creation < 50ms (R6.1)
 * - Agent destruction < 100ms (R6.2)
 * - Message delivery < 10ms (R6.3)
 */
describe('Performance Benchmark Tests', () => {
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

  /**
   * Helper function to measure operation time in milliseconds
   */
  const measureTime = async (operation: () => void | Promise<void>): Promise<number> => {
    const startTime = process.hrtime.bigint();
    await operation();
    const endTime = process.hrtime.bigint();
    
    // Convert nanoseconds to milliseconds with decimal precision
    return Number(endTime - startTime) / 1_000_000;
  };

  describe('agent creation performance', () => {
    it('should create agent in less than 50ms', async () => {
      const times: number[] = [];
      const iterations = 10;

      // Run multiple iterations to get average
      for (let i = 0; i < iterations; i++) {
        const time = await measureTime(() => {
          const agent = manager.createAgent(`perf-test-${i}`);
          expect(agent).toBeInstanceOf(Agent);
        });
        times.push(time);
      }

      const averageTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Agent creation - Average: ${averageTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);

      // Each creation should be under 50ms
      times.forEach((time, index) => {
        expect(time).toBeLessThan(50);
      });

      // Average should also be well under 50ms
      expect(averageTime).toBeLessThan(50);
    });

    it('should handle concurrent agent creation efficiently', async () => {
      const concurrentCreations = 5;
      
      const time = await measureTime(async () => {
        const promises = Array.from({ length: concurrentCreations }, (_, i) => 
          Promise.resolve(manager.createAgent(`concurrent-${i}`))
        );
        
        const agents = await Promise.all(promises);
        
        // Verify all agents were created
        agents.forEach(agent => {
          expect(agent).toBeInstanceOf(Agent);
          expect(agent.isActive()).toBe(true);
        });
      });

      console.log(`Concurrent creation of ${concurrentCreations} agents: ${time.toFixed(2)}ms`);
      
      // Should still be efficient even with concurrent creation
      // Allow slightly more time for concurrent operations
      expect(time).toBeLessThan(50 * concurrentCreations * 0.5); // 50% efficiency
    });
  });

  describe('agent destruction performance', () => {
    it('should destroy agent in less than 100ms', async () => {
      const times: number[] = [];
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        // Create agent first
        const agent = manager.createAgent(`destroy-test-${i}`);
        const agentId = agent.id;
        
        // Measure destruction time
        const time = await measureTime(() => 
          manager.destroyAgent(agentId)
        );
        times.push(time);
      }

      const averageTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Agent destruction - Average: ${averageTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);

      // Each destruction should be under 100ms
      times.forEach((time) => {
        expect(time).toBeLessThan(100);
      });

      // Average should also be under 100ms
      expect(averageTime).toBeLessThan(100);
    });

    it('should handle concurrent agent destruction efficiently', async () => {
      // Create multiple agents
      const agentCount = 5;
      const agentIds: string[] = [];
      
      for (let i = 0; i < agentCount; i++) {
        const agent = manager.createAgent(`concurrent-destroy-${i}`);
        agentIds.push(agent.id);
      }

      // Measure concurrent destruction
      const time = await measureTime(async () => {
        const promises = agentIds.map(id => manager.destroyAgent(id));
        await Promise.all(promises);
      });

      console.log(`Concurrent destruction of ${agentCount} agents: ${time.toFixed(2)}ms`);
      
      // Should be efficient for concurrent destruction
      expect(time).toBeLessThan(100 * agentCount * 0.5); // 50% efficiency
    });

    it('should clean up resources efficiently with destroyAll', async () => {
      // Create maximum number of agents
      for (let i = 0; i < 10; i++) {
        manager.createAgent(`bulk-destroy-${i}`);
      }

      const time = await measureTime(() => {
        manager.destroyAll();
      });

      console.log(`Bulk destruction of 10 agents: ${time.toFixed(2)}ms`);
      
      // Bulk destruction should be efficient
      expect(time).toBeLessThan(200); // Less than 20ms per agent
      expect(manager.getAgentCount()).toBe(0);
    });
  });

  describe('message delivery performance', () => {
    it('should deliver message in less than 10ms', async () => {
      const sender = manager.createAgent('sender');
      const receiver = manager.createAgent('receiver');
      
      // Set up message handler
      let messageReceived = false;
      receiver.onMessage(() => {
        messageReceived = true;
      });

      const times: number[] = [];
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        messageReceived = false;
        
        const time = await measureTime(async () => {
          await manager.sendMessage(
            sender.id,
            receiver.id,
            'performance-test',
            { iteration: i }
          );
        });
        
        times.push(time);
        expect(messageReceived).toBe(true);
      }

      const averageTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Message delivery - Average: ${averageTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);

      // Each delivery should be under 10ms
      times.forEach((time) => {
        expect(time).toBeLessThan(10);
      });

      // Average should also be under 10ms
      expect(averageTime).toBeLessThan(10);
    });

    it('should handle different payload sizes efficiently', async () => {
      const sender = manager.createAgent('payload-sender');
      const receiver = manager.createAgent('payload-receiver');
      
      receiver.onMessage(() => {});

      const payloadSizes = [
        { name: 'tiny', size: 10 },
        { name: 'small', size: 100 },
        { name: 'medium', size: 1000 },
        { name: 'large', size: 10000 },
        { name: 'huge', size: 100000 }
      ];

      for (const { name, size } of payloadSizes) {
        const payload = { data: 'x'.repeat(size) };
        
        const time = await measureTime(async () => {
          await manager.sendMessage(
            sender.id,
            receiver.id,
            `${name}-payload`,
            payload
          );
        });

        console.log(`Message delivery with ${name} payload (${size} bytes): ${time.toFixed(2)}ms`);
        
        // All sizes should still be under 10ms
        expect(time).toBeLessThan(10);
      }
    });

    it('should broadcast messages efficiently', async () => {
      const sender = manager.createAgent('broadcast-sender');
      const receiverCount = 5;
      let totalMessagesReceived = 0;
      
      // Create multiple receivers
      for (let i = 0; i < receiverCount; i++) {
        const receiver = manager.createAgent(`broadcast-receiver-${i}`);
        receiver.onMessage(() => {
          totalMessagesReceived++;
        });
      }

      const time = await measureTime(async () => {
        await manager.broadcastMessage(
          sender.id,
          'broadcast-performance',
          { message: 'Hello everyone' }
        );
      });

      // Wait a bit for async message processing
      await new Promise(resolve => setTimeout(resolve, 10));

      console.log(`Broadcast to ${receiverCount} receivers: ${time.toFixed(2)}ms`);
      
      // Verify all receivers got the message
      expect(totalMessagesReceived).toBe(receiverCount);
      
      // Broadcasting should be efficient
      expect(time).toBeLessThan(10 * receiverCount * 0.5); // 50% efficiency
    });

    it('should maintain performance under load', async () => {
      const agentPairs = 3;
      const messagesPerPair = 10;
      const agents: Array<{ sender: Agent; receiver: Agent }> = [];
      
      // Create agent pairs
      for (let i = 0; i < agentPairs; i++) {
        const sender = manager.createAgent(`load-sender-${i}`);
        const receiver = manager.createAgent(`load-receiver-${i}`);
        receiver.onMessage(() => {});
        agents.push({ sender, receiver });
      }

      const time = await measureTime(async () => {
        // Send messages concurrently
        const promises: Promise<void>[] = [];
        
        for (const { sender, receiver } of agents) {
          for (let i = 0; i < messagesPerPair; i++) {
            promises.push(
              manager.sendMessage(
                sender.id,
                receiver.id,
                'load-test',
                { index: i }
              )
            );
          }
        }
        
        await Promise.all(promises);
      });

      const totalMessages = agentPairs * messagesPerPair;
      const averageTimePerMessage = time / totalMessages;

      console.log(`Load test - ${totalMessages} messages in ${time.toFixed(2)}ms`);
      console.log(`Average time per message: ${averageTimePerMessage.toFixed(2)}ms`);
      
      // Average per message should still be under 10ms
      expect(averageTimePerMessage).toBeLessThan(10);
    });
  });

  describe('system performance summary', () => {
    it('should generate performance report', async () => {
      console.log('\n=== Performance Benchmark Summary ===');
      
      // Agent creation benchmark
      const creationTime = await measureTime(() => {
        manager.createAgent('summary-test');
      });
      
      // Message delivery benchmark
      const sender = manager.createAgent('summary-sender');
      const receiver = manager.createAgent('summary-receiver');
      receiver.onMessage(() => {});
      
      const messageTime = await measureTime(async () => {
        await manager.sendMessage(
          sender.id,
          receiver.id,
          'summary-test',
          { test: true }
        );
      });
      
      // Agent destruction benchmark
      const destroyAgent = manager.createAgent('summary-destroy');
      const destructionTime = await measureTime(() => 
        manager.destroyAgent(destroyAgent.id)
      );

      console.log(`Agent Creation: ${creationTime.toFixed(2)}ms (requirement: < 50ms) ✓`);
      console.log(`Message Delivery: ${messageTime.toFixed(2)}ms (requirement: < 10ms) ✓`);
      console.log(`Agent Destruction: ${destructionTime.toFixed(2)}ms (requirement: < 100ms) ✓`);
      console.log('=====================================\n');

      // Verify all requirements are met
      expect(creationTime).toBeLessThan(50);
      expect(messageTime).toBeLessThan(10);
      expect(destructionTime).toBeLessThan(100);
    });
  });
});