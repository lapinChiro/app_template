import { describe, test, expect, beforeEach, vi } from 'vitest';

// Import Phase1 AgentManager and Agent
import { AgentManager } from '../../src/core/agent-manager';
import { Agent } from '../../src/core/agent';
import { AgentError, ErrorCode } from '../../src/core/errors';

// Mock the logger and performance monitoring
vi.mock('../../src/core/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(), 
    error: vi.fn(),
    debug: vi.fn()
  }))
}));

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

describe('AgentManager Phase2 Extensions', () => {
  let agentManager: AgentManager;

  beforeEach(async () => {
    // Clear singleton instances for clean tests
    // @ts-expect-error Accessing private static member for testing
    AgentManager.instances?.clear();
    
    // @ts-expect-error Accessing private static member for testing  
    const { SecurityMonitor } = await import('../../src/core/security-monitor');
    SecurityMonitor.instances?.clear();
    
    // @ts-expect-error Accessing private static member for testing
    const { PerformanceMonitor } = await import('../../src/core/performance-monitor');
    PerformanceMonitor.instances?.clear();

    agentManager = AgentManager.getInstance();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up all agents
    await agentManager.destroyAll();
  });

  describe('Phase1 Compatibility (Critical)', () => {
    test('should create Phase1 agents unchanged', () => {
      // Original Phase1 agent creation should work (synchronous)
      const agent = agentManager.createAgent();
      
      expect(agent).toBeDefined();
      expect(typeof agent.id).toBe('string');
      expect(agent.isActive()).toBe(true);
      
      // Should be listed in agents
      const agentList = agentManager.listAgents();
      expect(agentList).toContain(agent); // Phase1 expects Agent object, not ID
      
      // Should be retrievable
      const retrieved = agentManager.getAgent(agent.id);
      expect(retrieved).toBe(agent);
    });

    test('should maintain Phase1 messaging functionality', async () => {
      const sender = await agentManager.createAgent();
      const receiver = await agentManager.createAgent();
      
      const testMessage = {
        id: 'test-message-id',
        from: sender.id,
        to: receiver.id,
        type: 'test.message',
        payload: { data: 'phase1 message' },
        timestamp: new Date()
      };
      
      let receivedMessage: any = null;
      receiver.onMessage((message) => {
        receivedMessage = message;
      });
      
      // Use AgentManager sendMessage (Phase1 functionality)
      await agentManager.sendMessage(testMessage);
      
      expect(receivedMessage).toEqual(testMessage);
    });

    test('should maintain Phase1 performance characteristics', async () => {
      const iterations = 10;
      const start = process.hrtime.bigint();
      
      const agents = [];
      for (let i = 0; i < iterations; i++) {
        agents.push(await agentManager.createAgent());
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000;
      const averageTime = totalTime / iterations;
      
      expect(averageTime).toBeLessThan(50); // Phase1 requirement was < 50ms
      expect(agents).toHaveLength(iterations);
    });

    test('should maintain agent limit enforcement', () => {
      // Create 10 agents (Phase1 limit)
      const agents = [];
      for (let i = 0; i < 10; i++) {
        agents.push(agentManager.createAgent());
      }
      
      // 11th agent should fail
      expect(() => agentManager.createAgent()).toThrow(AgentError);
      expect(() => agentManager.createAgent()).toThrow(/limit.*exceeded/i);
    });
  });

  describe('Phase2 Enhanced Agent Creation', () => {
    test('should support creating messaging-enabled agents', async () => {
      const messagingAgent = await agentManager.createAgent(undefined, {
        enableMessaging: true
      });
      
      expect(messagingAgent).toBeDefined();
      expect((messagingAgent as any).isMessagingEnabled()).toBe(true);
      expect(typeof (messagingAgent as any).subscribeToMessages).toBe('function');
    });

    test('should support creating agents with custom messaging config', async () => {
      const customConfig = {
        defaultRequestTimeout: 3000,
        subscriptionLimit: 50
      };
      
      const customAgent = await agentManager.createAgent(undefined, {
        enableMessaging: true,
        messagingConfig: customConfig
      });
      
      expect(customAgent).toBeDefined();
      expect((customAgent as any).isMessagingEnabled()).toBe(true);
    });

    test('should create agents without messaging by default', async () => {
      const defaultAgent = await agentManager.createAgent();
      
      expect(defaultAgent).toBeDefined();
      expect(() => (defaultAgent as any).isMessagingEnabled()).not.toThrow();
      expect((defaultAgent as any).isMessagingEnabled()).toBe(false);
    });
  });

  describe('Phase2 Agent Lifecycle Management', () => {
    test('should register messaging agents with messaging system', async () => {
      const messagingAgent = await agentManager.createAgent(undefined, {
        enableMessaging: true
      });
      
      // Should be able to use messaging features immediately
      await expect(
        (messagingAgent as any).subscribeToMessages('test.*')
      ).resolves.not.toThrow();
      
      expect((messagingAgent as any).getActiveSubscriptions()).toContain('test.*');
    });

    test('should clean up messaging subscriptions on agent destruction', async () => {
      const messagingAgent = await agentManager.createAgent(undefined, {
        enableMessaging: true
      });
      
      await (messagingAgent as any).subscribeToMessages('cleanup.*');
      expect((messagingAgent as any).getActiveSubscriptions()).toHaveLength(1);
      
      // Destroy through AgentManager
      await agentManager.destroyAgent(messagingAgent.id);
      
      // Agent should be removed from registry
      expect(agentManager.getAgent(messagingAgent.id)).toBeUndefined();
      expect(agentManager.listAgents()).not.toContain(messagingAgent.id);
    });

    test('should handle mixed Phase1/Phase2 agents', async () => {
      const phase1Agent = await agentManager.createAgent();
      const phase2Agent = await agentManager.createAgent(undefined, {
        enableMessaging: true
      });
      
      expect(phase1Agent.isActive()).toBe(true);
      expect(phase2Agent.isActive()).toBe(true);
      expect((phase1Agent as any).isMessagingEnabled()).toBe(false);
      expect((phase2Agent as any).isMessagingEnabled()).toBe(true);
      
      // Both should be managed equally
      const agentList = agentManager.listAgents();
      expect(agentList).toContain(phase1Agent.id);
      expect(agentList).toContain(phase2Agent.id);
    });
  });

  describe('Phase2 Messaging Integration', () => {
    test('should support inter-agent messaging through subscriptions', async () => {
      const publisher = await agentManager.createAgent(undefined, {
        enableMessaging: true
      });
      const subscriber = await agentManager.createAgent(undefined, {
        enableMessaging: true
      });
      
      // Set up subscription
      await (subscriber as any).subscribeToMessages('test.*');
      
      // This would be tested fully in integration tests
      expect((subscriber as any).getActiveSubscriptions()).toContain('test.*');
      
      // Publish message
      await expect(
        (publisher as any).publishMessage(
          subscriber.id,
          'test.message',
          { data: 'inter-agent message' }
        )
      ).resolves.not.toThrow();
    });

    test('should coordinate messaging system cleanup', async () => {
      const agent1 = await agentManager.createAgent(undefined, { enableMessaging: true });
      const agent2 = await agentManager.createAgent(undefined, { enableMessaging: true });
      
      await (agent1 as any).subscribeToMessages('coordination.*');
      await (agent2 as any).subscribeToMessages('coordination.*');
      
      // Destroy all agents
      await agentManager.destroyAll();
      
      // All agents should be cleaned up
      expect(agentManager.listAgents()).toHaveLength(0);
    });
  });

  describe('Performance Requirements', () => {
    test('should create messaging agents within performance limits', async () => {
      const iterations = 5; // Smaller number for messaging agents
      const start = process.hrtime.bigint();
      
      const agents = [];
      for (let i = 0; i < iterations; i++) {
        agents.push(await agentManager.createAgent(undefined, {
          enableMessaging: true
        }));
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000;
      const averageTime = totalTime / iterations;
      
      expect(averageTime).toBeLessThan(100); // < 100ms for messaging agents
      expect(agents).toHaveLength(iterations);
      
      // Verify all are messaging enabled
      agents.forEach(agent => {
        expect((agent as any).isMessagingEnabled()).toBe(true);
      });
    });

    test('should not degrade Phase1 performance', async () => {
      // Create mix of Phase1 and Phase2 agents
      const phase1Start = process.hrtime.bigint();
      
      const phase1Agents = [];
      for (let i = 0; i < 5; i++) {
        phase1Agents.push(await agentManager.createAgent());
      }
      
      const phase1End = process.hrtime.bigint();
      const phase1Time = Number(phase1End - phase1Start) / 1000000;
      
      expect(phase1Time / 5).toBeLessThan(1); // Should still be fast
      
      // Phase2 agents 
      const phase2Start = process.hrtime.bigint();
      
      const phase2Agents = [];
      for (let i = 0; i < 3; i++) { // Fewer due to agent limit
        phase2Agents.push(await agentManager.createAgent(undefined, {
          enableMessaging: true
        }));
      }
      
      const phase2End = process.hrtime.bigint();
      const phase2Time = Number(phase2End - phase2Start) / 1000000;
      
      expect(phase2Time / 3).toBeLessThan(100); // Reasonable for messaging agents
      
      // Total should still be within limits
      expect(agentManager.listAgents()).toHaveLength(8); // 5 + 3
    });
  });

  describe('Error Handling', () => {
    test('should handle messaging enablement failures gracefully', async () => {
      // This would be tested with invalid configurations
      const agent = await agentManager.createAgent();
      
      // Try to enable with invalid config
      await expect(
        (agent as any).enableMessaging({ subscriptionLimit: -1 })
      ).rejects.toThrow();
      
      // Agent should still be functional for Phase1 operations
      expect(agent.isActive()).toBe(true);
      expect(() => agent.setMemory('key', 'value')).not.toThrow();
    });

    test('should handle destruction errors gracefully', async () => {
      const messagingAgent = await agentManager.createAgent(undefined, {
        enableMessaging: true
      });
      
      await (messagingAgent as any).subscribeToMessages('test.*');
      
      // Destruction should succeed even if messaging cleanup fails
      await expect(agentManager.destroyAgent(messagingAgent.id)).resolves.not.toThrow();
      
      expect(agentManager.getAgent(messagingAgent.id)).toBeUndefined();
    });
  });

  describe('Interface Compatibility', () => {
    test('should maintain all Phase1 AgentManager methods', () => {
      // Verify all Phase1 methods still exist
      expect(typeof agentManager.createAgent).toBe('function');
      expect(typeof agentManager.destroyAgent).toBe('function');
      expect(typeof agentManager.getAgent).toBe('function');
      expect(typeof agentManager.listAgents).toBe('function');
      expect(typeof agentManager.sendMessage).toBe('function');
      expect(typeof agentManager.broadcastMessage).toBe('function');
      expect(typeof agentManager.destroyAll).toBe('function');
    });

    test('should maintain singleton behavior', () => {
      const instance1 = AgentManager.getInstance();
      const instance2 = AgentManager.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(agentManager);
    });
  });
});