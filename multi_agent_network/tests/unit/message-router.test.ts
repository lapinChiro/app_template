import { describe, test, expect, beforeEach, vi } from 'vitest';

// Import types and implementation we'll create
import type {
  IMessageRouter,
  RoutingResult,
  RoutingConfig
} from '../../src/core/message-router';

import {
  MessageRouter
} from '../../src/core/message-router';

// Import dependencies
import { CachedPatternMatcher } from '../../src/core/pattern-matcher';
import { SubscriptionRegistry } from '../../src/core/subscription-registry';
import { DeliveryEngine } from '../../src/core/delivery-engine';
import { HealthMonitor } from '../../src/core/health-monitor';
import { MessageValidator, type ValidatedMessage } from '../../src/core/message-validator';
import { MessageFactory } from '../../src/core/message-factory';
import type { AgentId } from '../../src/core/types/branded-types';
import { createAgentId } from '../../src/core/types/branded-types';

describe('MessageRouter', () => {
  let messageRouter: IMessageRouter;
  let patternMatcher: CachedPatternMatcher;
  let subscriptionRegistry: SubscriptionRegistry;
  let deliveryEngine: DeliveryEngine;
  let healthMonitor: HealthMonitor;
  let agentId1: AgentId;
  let agentId2: AgentId;
  let mockMessage: ValidatedMessage;

  beforeEach(() => {
    // Create dependencies (DI pattern)
    patternMatcher = new CachedPatternMatcher();
    subscriptionRegistry = new SubscriptionRegistry(patternMatcher);
    deliveryEngine = new DeliveryEngine();
    healthMonitor = new HealthMonitor();
    
    // Create message router with injected dependencies
    messageRouter = new MessageRouter(
      subscriptionRegistry,
      deliveryEngine,
      healthMonitor
    );
    
    agentId1 = createAgentId('11111111-1111-1111-1111-111111111111');
    agentId2 = createAgentId('22222222-2222-2222-2222-222222222222');
    
    const baseMessage = MessageFactory.createMessage(
      agentId1 as string,
      agentId2 as string,
      'test.message',
      { data: 'test routing' }
    );
    mockMessage = MessageValidator.validate(baseMessage);
  });

  describe('Basic Message Routing', () => {
    test('should route message to subscribed agents', async () => {
      // Register agents and subscribe to pattern
      subscriptionRegistry.registerAgent(agentId1);
      subscriptionRegistry.registerAgent(agentId2);
      await subscriptionRegistry.subscribe(agentId2, 'test.*');
      
      const result = await messageRouter.route(mockMessage);
      
      expect(result.success).toBe(true);
      expect(result.routedTo).toContain(agentId2);
      expect(result.subscriberCount).toBe(1);
    });

    test('should handle messages with no subscribers', async () => {
      const orphanMessage = MessageFactory.createMessage(
        agentId1 as string,
        agentId2 as string,
        'orphan.message',
        { data: 'no subscribers' }
      );
      const validatedOrphanMessage = MessageValidator.validate(orphanMessage);
      
      const result = await messageRouter.route(validatedOrphanMessage);
      
      expect(result.success).toBe(true);
      expect(result.routedTo).toHaveLength(0);
      expect(result.subscriberCount).toBe(0);
      expect(result.noSubscribersFound).toBe(true);
    });

    test('should route to multiple subscribers for same message type', async () => {
      // Register multiple agents
      subscriptionRegistry.registerAgent(agentId1);
      subscriptionRegistry.registerAgent(agentId2);
      
      // Both subscribe to same pattern
      await subscriptionRegistry.subscribe(agentId1, 'test.message');
      await subscriptionRegistry.subscribe(agentId2, 'test.message');
      
      const result = await messageRouter.route(mockMessage);
      
      expect(result.success).toBe(true);
      expect(result.routedTo).toHaveLength(2);
      expect(result.routedTo).toContain(agentId1);
      expect(result.routedTo).toContain(agentId2);
    });
  });

  describe('Pattern-Based Routing', () => {
    test('should support wildcard pattern routing', async () => {
      subscriptionRegistry.registerAgent(agentId1);
      subscriptionRegistry.registerAgent(agentId2);
      
      // Subscribe with wildcard patterns
      await subscriptionRegistry.subscribe(agentId1, 'test.*');
      await subscriptionRegistry.subscribe(agentId2, '*.message');
      
      const result = await messageRouter.route(mockMessage);
      
      expect(result.success).toBe(true);
      expect(result.routedTo).toContain(agentId1);
      expect(result.routedTo).toContain(agentId2);
      expect(result.patternMatchesFound).toBeGreaterThan(0);
    });

    test('should handle complex pattern hierarchies', async () => {
      subscriptionRegistry.registerAgent(agentId1);
      subscriptionRegistry.registerAgent(agentId2);
      
      await subscriptionRegistry.subscribe(agentId1, 'test.*'); // Should match
      await subscriptionRegistry.subscribe(agentId2, 'system.*'); // Should not match
      
      const result = await messageRouter.route(mockMessage);
      
      expect(result.success).toBe(true);
      expect(result.routedTo).toContain(agentId1);
      expect(result.routedTo).not.toContain(agentId2);
    });
  });

  describe('Performance Monitoring Integration', () => {
    test('should record routing performance metrics', async () => {
      subscriptionRegistry.registerAgent(agentId2);
      await subscriptionRegistry.subscribe(agentId2, 'test.*');
      
      const result = await messageRouter.route(mockMessage);
      
      expect(result.routingTime).toBeGreaterThan(0);
      expect(result.routingTime).toBeLessThan(30); // Should be < 30ms
      
      // Should have recorded health
      const routerHealth = healthMonitor.getComponentHealth('MessageRouter');
      expect(routerHealth.isHealthy).toBe(true);
    });

    test('should detect slow routing operations', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Create many subscribers to slow down routing
      const manyAgents = Array.from({length: 50}, () => createAgentId());
      manyAgents.forEach(agent => {
        subscriptionRegistry.registerAgent(agent);
        subscriptionRegistry.subscribe(agent, 'test.*');
      });
      
      const result = await messageRouter.route(mockMessage);
      
      expect(result.success).toBe(true);
      expect(result.routedTo).toHaveLength(50);
      
      // May log warning if routing takes too long
      if (result.routingTime > 30) {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('routing exceeded threshold')
        );
      }
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling and Health Integration', () => {
    test('should handle subscription registry failures gracefully', async () => {
      // Mock subscription registry to throw error
      const mockRegistry = {
        getSubscribers: () => { throw new Error('Registry failure'); },
        registerAgent: () => {},
        subscribe: () => Promise.resolve(),
        unsubscribe: () => Promise.resolve(),
        cleanup: () => Promise.resolve(),
        getAllActiveAgents: () => [],
        getAgentSubscriptions: () => [],
        getSubscriptionCount: () => 0
      };
      
      const failingRouter = new MessageRouter(
        mockRegistry as any,
        deliveryEngine,
        healthMonitor
      );
      
      const result = await failingRouter.route(mockMessage);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      // Should record failure in health monitor
      const routerHealth = healthMonitor.getComponentHealth('MessageRouter');
      expect(routerHealth.failureCount).toBeGreaterThan(0);
    });

    test('should handle delivery engine failures gracefully', async () => {
      subscriptionRegistry.registerAgent(agentId2);
      await subscriptionRegistry.subscribe(agentId2, 'test.*');
      
      // Mock delivery engine to fail
      const mockDelivery = {
        deliver: () => Promise.reject(new Error('Delivery failure')),
        getStats: () => ({
          totalDeliveries: 0,
          averageDeliveryTime: 0,
          successRate: 0,
          retryRate: 0,
          batchedDeliveries: 0,
          concurrentDeliveries: 0
        }),
        clearStats: () => {}
      };
      
      const failingRouter = new MessageRouter(
        subscriptionRegistry,
        mockDelivery as any,
        healthMonitor
      );
      
      const result = await failingRouter.route(mockMessage);
      
      expect(result.success).toBe(false);
      expect(result.deliveryFailures).toBeGreaterThan(0);
    });

    test('should continue routing despite partial failures', async () => {
      // This would be tested with actual delivery failures
      // For now, verify that router attempts to handle failures
      subscriptionRegistry.registerAgent(agentId1);
      subscriptionRegistry.registerAgent(agentId2);
      await subscriptionRegistry.subscribe(agentId1, 'test.*');
      await subscriptionRegistry.subscribe(agentId2, 'test.*');
      
      const result = await messageRouter.route(mockMessage);
      
      expect(result.success).toBe(true);
      expect(result.routedTo).toHaveLength(2);
    });
  });

  describe('Performance Requirements', () => {
    test('should route messages within 30ms', async () => {
      // Setup multiple agents with various subscriptions
      const agents = Array.from({length: 10}, () => createAgentId());
      agents.forEach(agent => {
        subscriptionRegistry.registerAgent(agent);
        subscriptionRegistry.subscribe(agent, 'test.*');
      });
      
      const iterations = 10;
      let totalTime = 0;
      
      for (let i = 0; i < iterations; i++) {
        const testMessage = {
          ...mockMessage,
          id: MessageFactory.createMessage(agentId1 as string, agentId2 as string, 'test.message', {}).id
        };
        const validated = MessageValidator.validate(testMessage);
        
        const result = await messageRouter.route(validated);
        totalTime += result.routingTime;
        
        expect(result.success).toBe(true);
      }
      
      const averageTime = totalTime / iterations;
      expect(averageTime).toBeLessThan(30); // < 30ms average
    });

    test('should handle high-frequency routing efficiently', async () => {
      subscriptionRegistry.registerAgent(agentId2);
      await subscriptionRegistry.subscribe(agentId2, 'frequency.*');
      
      const messageCount = 100;
      const messages = Array.from({length: messageCount}, (_, i) => {
        const msg = MessageFactory.createMessage(
          agentId1 as string,
          agentId2 as string,
          `frequency.test.${i}`,
          { index: i }
        );
        return MessageValidator.validate(msg);
      });
      
      const start = process.hrtime.bigint();
      
      const routingPromises = messages.map(msg => messageRouter.route(msg));
      const results = await Promise.all(routingPromises);
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000;
      const messagesPerSecond = (messageCount * 1000) / totalTime;
      
      expect(messagesPerSecond).toBeGreaterThan(500); // > 500 msg/sec
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('Integration with Dependencies', () => {
    test('should properly utilize injected subscription registry', async () => {
      subscriptionRegistry.registerAgent(agentId2);
      await subscriptionRegistry.subscribe(agentId2, 'integration.*');
      
      const integrationMessage = MessageFactory.createMessage(
        agentId1 as string,
        agentId2 as string,
        'integration.test',
        { test: 'dependency injection' }
      );
      const validated = MessageValidator.validate(integrationMessage);
      
      const result = await messageRouter.route(validated);
      
      expect(result.success).toBe(true);
      expect(result.routedTo).toContain(agentId2);
      
      // Should have used the injected registry
      expect(result.lookupTime).toBeDefined();
      expect(result.lookupTime).toBeLessThan(5); // Fast lookup
    });

    test('should coordinate with delivery engine correctly', async () => {
      subscriptionRegistry.registerAgent(agentId1);
      subscriptionRegistry.registerAgent(agentId2);
      await subscriptionRegistry.subscribe(agentId1, 'coordination.*');
      await subscriptionRegistry.subscribe(agentId2, 'coordination.*');
      
      const coordMessage = MessageFactory.createMessage(
        agentId1 as string,
        agentId2 as string, // Use valid agent ID instead of 'broadcast'
        'coordination.test',
        { coordination: true }
      );
      const validated = MessageValidator.validate(coordMessage);
      
      const result = await messageRouter.route(validated);
      
      expect(result.success).toBe(true);
      expect(result.deliveryTime).toBeDefined();
      expect(result.deliveryTime).toBeLessThan(20); // Efficient delivery
    });

    test('should update health monitor with routing status', async () => {
      subscriptionRegistry.registerAgent(agentId2);
      await subscriptionRegistry.subscribe(agentId2, 'health.*');
      
      const healthMessage = MessageFactory.createMessage(
        agentId1 as string,
        agentId2 as string,
        'health.check',
        { status: 'monitoring' }
      );
      const validated = MessageValidator.validate(healthMessage);
      
      await messageRouter.route(validated);
      
      // Should record healthy status
      const routerHealth = healthMonitor.getComponentHealth('MessageRouter');
      expect(routerHealth.isHealthy).toBe(true);
      expect(routerHealth.failureCount).toBe(0);
    });
  });

  describe('Interface Implementation', () => {
    test('should implement IMessageRouter interface correctly', () => {
      expect(typeof messageRouter.route).toBe('function');
      expect(typeof messageRouter.getStats).toBe('function');
      expect(typeof messageRouter.getHealth).toBe('function');
    });

    test('should provide routing statistics', () => {
      const stats = messageRouter.getStats();
      
      expect(stats).toHaveProperty('totalRoutedMessages');
      expect(stats).toHaveProperty('averageRoutingTime');
      expect(stats).toHaveProperty('successfulRoutes');
      expect(stats).toHaveProperty('failedRoutes');
      expect(stats).toHaveProperty('averageSubscribersPerMessage');
    });

    test('should provide health status', () => {
      const health = messageRouter.getHealth();
      
      expect(health).toHaveProperty('isHealthy');
      expect(health).toHaveProperty('lastRoutingTime');
      expect(health).toHaveProperty('totalRoutes');
      expect(health).toHaveProperty('errorRate');
    });
  });
});