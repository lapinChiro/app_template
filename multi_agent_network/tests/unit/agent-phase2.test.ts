import { describe, test, expect, beforeEach, afterEach } from 'vitest';

// Import Phase1 Agent and Phase2 enhancements we'll create
import { Agent, type AgentOptions } from '../../src/core/agent';
import type { MessagingConfig } from '../../src/core/messaging-system-container';

// Import Phase2 types
import type { 
  AgentId, 
  MessagePattern,
  ValidatedMessageType
} from '../../src/core/types/branded-types';

import { 
  createAgentId, 
  createMessagePattern,
  createValidatedMessageType
} from '../../src/core/types/branded-types';

// Enhanced AgentOptions for Phase2 (extending the base constructor)
interface AgentEnhancedOptions {
  id?: string; // Phase1 existing
  enableMessaging?: boolean; // Phase2 new
  messagingConfig?: Partial<MessagingConfig>; // Phase2 new
}

describe('Agent Phase2 Extensions', () => {
  let agentId1: string;
  let agentId2: string;

  beforeEach(() => {
    agentId1 = createAgentId() as string;
    agentId2 = createAgentId() as string;
  });

  afterEach(() => {
    // Clean up any created agents to prevent test interference
  });

  describe('Phase1 Compatibility (Critical)', () => {
    test('existing constructor should work unchanged', () => {
      // Original Phase1 constructor signatures must work
      const agent1 = new Agent(); // No ID (auto-generated)
      const agent2 = new Agent(agentId1); // Custom ID
      
      expect(agent1.id).toBeDefined();
      expect(typeof agent1.id).toBe('string');
      expect(agent1.isActive()).toBe(true);
      
      expect(agent2.id).toBe(agentId1);
      expect(typeof agent2.id).toBe('string');
      expect(agent2.isActive()).toBe(true);
    });

    test('all Phase1 memory methods should work unchanged', () => {
      const agent = new Agent(); // Phase1 constructor style
      
      // Memory operations
      expect(() => agent.setMemory('key1', 'value1')).not.toThrow();
      expect(agent.getMemory('key1')).toBe('value1');
      expect(agent.getMemory('nonexistent')).toBeUndefined();
      
      // Type safety for memory operations  
      agent.setMemory('typed-key', 'typed-value');
      expect(agent.getMemory('typed-key')).toBe('typed-value');
    });

    test('Phase1 message handling should work unchanged', async () => {
      const agent = new Agent(); // Phase1 constructor style
      
      const testMessage = {
        id: createAgentId() as string,
        from: agentId1,
        to: agentId2,
        type: 'test.message',
        payload: { data: 'test' },
        timestamp: new Date()
      };
      
      // Phase1 message handling through onMessage
      let receivedMessage: any = null;
      agent.onMessage((message) => {
        receivedMessage = message;
      });
      
      await expect(agent.receiveMessage(testMessage)).resolves.not.toThrow();
      expect(receivedMessage).toEqual(testMessage);
    });

    test('Phase1 lifecycle should work unchanged', async () => {
      const agent = new Agent(); // Phase1 constructor style
      
      expect(agent.isActive()).toBe(true); // Phase1 uses isActive()
      
      // Destruction should work as before
      await expect(agent.destroy()).resolves.not.toThrow();
      expect(agent.isActive()).toBe(false); // Should be false after destroy
      
      // Post-destruction behavior should be unchanged
      expect(() => agent.setMemory('key', 'value')).toThrow(/destroyed/);
    });

    test('Phase1 performance should be maintained', async () => {
      const iterations = 100;
      const agents: Agent[] = [];
      
      const start = process.hrtime.bigint();
      
      // Create agents (should be as fast as Phase1)
      for (let i = 0; i < iterations; i++) {
        agents.push(new Agent()); // Phase1 constructor style
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000;
      const averageTime = totalTime / iterations;
      
      expect(averageTime).toBeLessThan(1); // Should be < 1ms (Phase1 was ~0.3ms)
      
      // Cleanup
      await Promise.all(agents.map(agent => agent.destroy()));
    });
  });

  describe('Phase2 Optional Features', () => {
    test('should support enabling messaging after creation', async () => {
      const agent = new Agent(); // Phase1 constructor
      
      expect(agent).toBeDefined();
      
      // Enable Phase2 messaging capabilities
      await expect((agent as any).enableMessaging()).resolves.not.toThrow();
      
      // Should now have Phase2 messaging capabilities
      expect(typeof (agent as any).subscribeToMessages).toBe('function');
      
      await agent.destroy();
    });

    test('should work without messaging by default (backward compatibility)', async () => {
      const agent = new Agent(); // Phase1 constructor
      
      expect(agent).toBeDefined();
      
      // Should not have Phase2 capabilities when disabled
      await expect((agent as any).subscribeToMessages('test.*')).rejects.toThrow(/messaging not enabled/i);
    });

    test('should accept custom messaging configuration', async () => {
      const customConfig: Partial<MessagingConfig> = {
        defaultRequestTimeout: 3000,
        subscriptionLimit: 50,
        enablePerformanceLogging: false
      };

      const agent = new Agent(); // Phase1 constructor
      
      // Enable with custom config
      await (agent as any).enableMessaging(customConfig);
      
      expect(agent).toBeDefined();
      expect(typeof (agent as any).subscribeToMessages).toBe('function');
      
      await agent.destroy();
    });
  });

  describe('Phase2 Subscription Management', () => {
    test('should support subscription to message patterns', async () => {
      const agent = new Agent(); // Phase1 constructor
      await (agent as any).enableMessaging(); // Enable Phase2
      
      const pattern = 'user.*' as any;
      
      await expect((agent as any).subscribeToMessages(pattern)).resolves.not.toThrow();
      
      const subscriptions = (agent as any).getActiveSubscriptions();
      expect(subscriptions).toContain(pattern);
      
      await agent.destroy();
    });

    test('should support unsubscription from patterns', async () => {
      const agent = new Agent(); // Phase1 constructor
      await (agent as any).enableMessaging(); // Enable Phase2
      
      const pattern = 'test.*' as any;
      
      await (agent as any).subscribeToMessages(pattern);
      expect((agent as any).getActiveSubscriptions()).toContain(pattern);
      
      await (agent as any).unsubscribeFromMessages(pattern);
      expect((agent as any).getActiveSubscriptions()).not.toContain(pattern);
      
      await agent.destroy();
    });

    test('should support subscription with message handlers', async () => {
      const agent = new Agent(); // Phase1 constructor
      await (agent as any).enableMessaging(); // Enable Phase2
      
      let receivedMessage: any = null;
      const handler = (message: any) => {
        receivedMessage = message;
      };
      
      await (agent as any).subscribeToMessages('handler.*', handler);
      
      // This would be tested with actual message routing in integration tests
      expect((agent as any).getActiveSubscriptions()).toContain('handler.*');
      
      await agent.destroy();
    });
  });

  describe('Phase2 Enhanced Messaging', () => {
    test('should support publishing messages through messaging system', async () => {
      const sender = new Agent(); // Phase1 constructor
      await (sender as any).enableMessaging(); // Enable Phase2
      
      const receiverId = createAgentId() as string;
      const messageType = 'test.publish' as any;
      const payload = { data: 'published message' };
      
      await expect(
        (sender as any).publishMessage(receiverId, messageType, payload)
      ).resolves.not.toThrow();
      
      await sender.destroy();
    });

    test('should support broadcast messaging', async () => {
      const broadcaster = new Agent(); // Phase1 constructor
      await (broadcaster as any).enableMessaging(); // Enable Phase2
      
      const messageType = 'broadcast.test' as any;
      const payload = { announcement: 'hello all' };
      
      await expect(
        (broadcaster as any).broadcastMessage(messageType, payload)
      ).resolves.not.toThrow();
      
      await broadcaster.destroy();
    });

    test('should support request-response messaging', async () => {
      const requester = new Agent(); // Phase1 constructor
      await (requester as any).enableMessaging(); // Enable Phase2
      
      const responderId = createAgentId() as string;
      const requestType = 'test.request' as any;
      const requestPayload = { question: 'ping' };
      
      // This would timeout in isolation, but we're testing the API
      const requestPromise = (requester as any).requestMessage(
        responderId, 
        requestType, 
        requestPayload,
        100 // Short timeout for test
      );
      
      // Should properly handle timeout
      await expect(requestPromise).rejects.toThrow(/timeout/i);
      
      await requester.destroy();
    });
  });

  describe('Phase2 Lifecycle Integration', () => {
    test('should properly clean up subscriptions on destruction', async () => {
      const agent = new Agent(); // Phase1 constructor
      await (agent as any).enableMessaging(); // Enable Phase2
      
      // Subscribe to multiple patterns
      await (agent as any).subscribeToMessages('cleanup.*');
      await (agent as any).subscribeToMessages('test.*');
      
      expect((agent as any).getActiveSubscriptions()).toHaveLength(2);
      
      // Destroy should clean up subscriptions
      await agent.destroy();
      
      // Verify destroyed state
      expect(agent.isActive()).toBe(false); // Phase1 uses isActive()
    });

    test('should handle messaging system failures gracefully', async () => {
      const agent = new Agent(); // Phase1 constructor
      await (agent as any).enableMessaging(); // Enable Phase2
      
      // Agent should handle messaging system issues without affecting Phase1 functionality
      expect(() => agent.setMemory('test', 'value')).not.toThrow();
      expect(() => agent.getMemory('test')).not.toThrow();
      
      await agent.destroy();
    });
  });

  describe('Performance Requirements', () => {
    test('should create Phase2 agents within 100ms', async () => {
      const iterations = 10;
      const start = process.hrtime.bigint();
      
      const agents = [];
      for (let i = 0; i < iterations; i++) {
        const agent = new Agent(); // Phase1 constructor
        await (agent as any).enableMessaging(); // Enable Phase2
        agents.push(agent);
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000;
      const averageTime = totalTime / iterations;
      
      expect(averageTime).toBeLessThan(100); // < 100ms per agent
      
      // Cleanup
      await Promise.all(agents.map(agent => agent.destroy()));
    });

    test('should maintain Phase1 performance when messaging disabled', async () => {
      const iterations = 100;
      const start = process.hrtime.bigint();
      
      const agents = [];
      for (let i = 0; i < iterations; i++) {
        agents.push(new Agent()); // Phase1 constructor
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000;
      const averageTime = totalTime / iterations;
      
      expect(averageTime).toBeLessThan(1); // Should maintain Phase1 speed
      
      // Cleanup
      await Promise.all(agents.map(agent => agent.destroy()));
    });
  });

  describe('Memory Management', () => {
    test('should not increase memory significantly when messaging disabled', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      const agents = [];
      for (let i = 0; i < 50; i++) {
        agents.push(new Agent()); // Phase1 constructor
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);
      
      expect(memoryIncrease).toBeLessThan(5); // < 5MB for 50 agents
      
      await Promise.all(agents.map(agent => agent.destroy()));
    });

    test('should handle messaging system memory efficiently', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      const agents = [];
      for (let i = 0; i < 10; i++) {
        const agent = new Agent(); // Phase1 constructor
        await (agent as any).enableMessaging(); // Enable Phase2
        agents.push(agent);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);
      
      expect(memoryIncrease).toBeLessThan(10); // < 10MB for 10 messaging agents
      
      await Promise.all(agents.map(agent => agent.destroy()));
    });
  });

  describe('Error Handling', () => {
    test('should throw appropriate errors when messaging disabled', async () => {
      const agent = new Agent(); // Phase1 constructor (messaging disabled by default)
      
      await expect((agent as any).subscribeToMessages('test.*')).rejects.toThrow(/messaging not enabled/i);
      await expect((agent as any).publishMessage('target', 'type', {})).rejects.toThrow(/messaging not enabled/i);
      await expect((agent as any).requestMessage('target', 'type', {})).rejects.toThrow(/messaging not enabled/i);
    });

    test('should handle messaging system errors gracefully', async () => {
      const agent = new Agent(); // Phase1 constructor
      await (agent as any).enableMessaging(); // Enable Phase2
      
      // Invalid subscription patterns should be handled
      await expect(
        (agent as any).subscribeToMessages('invalid pattern with spaces')
      ).rejects.toThrow();
      
      await agent.destroy();
    });
  });

  describe('Integration Points', () => {
    test('should maintain Phase1 message handling integration', async () => {
      const agent = new Agent(); // Phase1 constructor
      
      const phase1Message = {
        id: createAgentId() as string,
        from: agentId1,
        to: agent.id,
        type: 'integration.test',
        payload: { source: 'phase1' },
        timestamp: new Date()
      };
      
      // Phase1 receiveMessage should still work
      let receivedMessage: any = null;
      agent.onMessage((message) => {
        receivedMessage = message;
      });
      
      await agent.receiveMessage(phase1Message);
      expect(receivedMessage).toEqual(phase1Message);
    });

    test('should support mixed Phase1/Phase2 message handling', async () => {
      const agent = new Agent(); // Phase1 constructor
      await (agent as any).enableMessaging(); // Enable Phase2
      
      // Both Phase1 and Phase2 message handling should coexist
      const phase1Message = {
        id: createAgentId() as string,
        from: agentId1,
        to: agent.id,
        type: 'phase1.message',
        payload: { version: 1 },
        timestamp: new Date()
      };
      
      let receivedMessage: any = null;
      agent.onMessage((message) => {
        receivedMessage = message;
      });
      
      await agent.receiveMessage(phase1Message);
      expect(receivedMessage).toEqual(phase1Message);
      
      // Phase2 subscriptions should also work
      await (agent as any).subscribeToMessages('phase2.*');
      expect((agent as any).getActiveSubscriptions()).toContain('phase2.*');
      
      await agent.destroy();
    });
  });
});