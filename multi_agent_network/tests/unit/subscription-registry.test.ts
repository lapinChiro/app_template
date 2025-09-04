import { describe, test, expect, beforeEach } from 'vitest';
import { AgentError, ErrorCode } from '../../src/core/errors';

// Import types and implementation we'll create
import type {
  ISubscriptionRegistry,
  SubscriptionInfo
} from '../../src/core/subscription-registry';

import {
  SubscriptionRegistry
} from '../../src/core/subscription-registry';

import { CachedPatternMatcher } from '../../src/core/pattern-matcher';
import type { AgentId, MessagePattern, ValidatedMessageType } from '../../src/core/types/branded-types';
import { 
  createAgentId, 
  createMessagePattern, 
  createValidatedMessageType 
} from '../../src/core/types/branded-types';

describe('SubscriptionRegistry', () => {
  let registry: SubscriptionRegistry;
  let patternMatcher: CachedPatternMatcher;
  let agentId1: AgentId;
  let agentId2: AgentId;

  beforeEach(() => {
    patternMatcher = new CachedPatternMatcher();
    registry = new SubscriptionRegistry(patternMatcher);
    agentId1 = createAgentId('11111111-1111-1111-1111-111111111111');
    agentId2 = createAgentId('22222222-2222-2222-2222-222222222222');
  });

  describe('Basic Subscription Management', () => {
    test('should allow agent to subscribe to patterns', async () => {
      const pattern = createMessagePattern('user.*');
      
      await expect(registry.subscribe(agentId1, pattern)).resolves.not.toThrow();
      
      const agentSubscriptions = registry.getAgentSubscriptions(agentId1);
      expect(agentSubscriptions).toContain(pattern);
    });

    test('should allow agent to unsubscribe from patterns', async () => {
      const pattern = createMessagePattern('user.*');
      
      await registry.subscribe(agentId1, pattern);
      await registry.unsubscribe(agentId1, pattern);
      
      const agentSubscriptions = registry.getAgentSubscriptions(agentId1);
      expect(agentSubscriptions).not.toContain(pattern);
    });

    test('should handle unsubscribe from non-existent subscription gracefully', async () => {
      const pattern = createMessagePattern('nonexistent.*');
      
      // Should not throw
      await expect(registry.unsubscribe(agentId1, pattern)).resolves.not.toThrow();
    });

    test('should support multiple subscriptions per agent', async () => {
      const patterns = [
        createMessagePattern('user.*'),
        createMessagePattern('system.alert.*'),
        createMessagePattern('notification.urgent')
      ];
      
      for (const pattern of patterns) {
        await registry.subscribe(agentId1, pattern);
      }
      
      const agentSubscriptions = registry.getAgentSubscriptions(agentId1);
      expect(agentSubscriptions).toHaveLength(3);
      patterns.forEach(pattern => {
        expect(agentSubscriptions).toContain(pattern);
      });
    });
  });

  describe('Subscription Limits', () => {
    test('should enforce 100 subscription limit per agent', async () => {
      // Add 100 subscriptions
      for (let i = 0; i < 100; i++) {
        const pattern = createMessagePattern(`test.pattern.${i}`);
        await registry.subscribe(agentId1, pattern);
      }
      
      // 101st subscription should fail
      const overLimitPattern = createMessagePattern('test.pattern.101');
      await expect(registry.subscribe(agentId1, overLimitPattern))
        .rejects
        .toThrow(AgentError);
      
      await expect(registry.subscribe(agentId1, overLimitPattern))
        .rejects
        .toThrow(/subscription limit exceeded/i);
    });

    test('should allow different agents to have independent limits', async () => {
      // Agent1: 100 subscriptions
      for (let i = 0; i < 100; i++) {
        await registry.subscribe(agentId1, createMessagePattern(`agent1.pattern.${i}`));
      }
      
      // Agent2 should still be able to subscribe
      const agent2Pattern = createMessagePattern('agent2.pattern.*');
      await expect(registry.subscribe(agentId2, agent2Pattern)).resolves.not.toThrow();
    });
  });

  describe('Subscriber Lookup', () => {
    test('should find subscribers for exact matches (O(1) lookup)', () => {
      const pattern = createMessagePattern('user.login');
      const messageType = createValidatedMessageType('user.login');
      
      // Subscribe agent1
      registry.subscribe(agentId1, pattern);
      
      const subscribers = registry.getSubscribers(messageType);
      expect(subscribers).toContain(agentId1);
      expect(subscribers).toHaveLength(1);
    });

    test('should find subscribers for wildcard patterns', async () => {
      const pattern = createMessagePattern('user.*');
      await registry.subscribe(agentId1, pattern);
      await registry.subscribe(agentId2, pattern);
      
      const messageType = createValidatedMessageType('user.login');
      const subscribers = registry.getSubscribers(messageType);
      
      expect(subscribers).toHaveLength(2);
      expect(subscribers).toContain(agentId1);
      expect(subscribers).toContain(agentId2);
    });

    test('should return empty array when no subscribers match', () => {
      const messageType = createValidatedMessageType('unsubscribed.message');
      const subscribers = registry.getSubscribers(messageType);
      
      expect(subscribers).toHaveLength(0);
      expect(Array.isArray(subscribers)).toBe(true);
    });

    test('should handle complex pattern matching correctly', async () => {
      await registry.subscribe(agentId1, createMessagePattern('system.*.alert'));
      await registry.subscribe(agentId2, createMessagePattern('system.security.*'));
      
      // Should match both patterns
      const securityAlert = createValidatedMessageType('system.security.alert');
      const subscribers1 = registry.getSubscribers(securityAlert);
      expect(subscribers1).toHaveLength(2);
      
      // Should match only second pattern
      const securityInfo = createValidatedMessageType('system.security.info');
      const subscribers2 = registry.getSubscribers(securityInfo);
      expect(subscribers2).toContain(agentId2);
      expect(subscribers2).not.toContain(agentId1);
    });

    test('should deduplicate agents with multiple matching patterns', async () => {
      await registry.subscribe(agentId1, createMessagePattern('user.*'));
      await registry.subscribe(agentId1, createMessagePattern('user.login.*'));
      
      const messageType = createValidatedMessageType('user.login.success');
      const subscribers = registry.getSubscribers(messageType);
      
      // Should contain agentId1 only once, despite matching both patterns
      expect(subscribers).toHaveLength(1);
      expect(subscribers[0]).toBe(agentId1);
    });
  });

  describe('Agent Lifecycle Management', () => {
    test('should register and track active agents', () => {
      registry.registerAgent(agentId1);
      registry.registerAgent(agentId2);
      
      const activeAgents = registry.getAllActiveAgents();
      expect(activeAgents).toContain(agentId1);
      expect(activeAgents).toContain(agentId2);
      expect(activeAgents).toHaveLength(2);
    });

    test('should cleanup all subscriptions when agent is removed', async () => {
      const patterns = [
        createMessagePattern('user.*'),
        createMessagePattern('system.*'),
        createMessagePattern('notification.urgent')
      ];
      
      // Subscribe agent to multiple patterns
      for (const pattern of patterns) {
        await registry.subscribe(agentId1, pattern);
      }
      
      expect(registry.getAgentSubscriptions(agentId1)).toHaveLength(3);
      
      // Cleanup agent
      await registry.cleanup(agentId1);
      
      expect(registry.getAgentSubscriptions(agentId1)).toHaveLength(0);
      expect(registry.getAllActiveAgents()).not.toContain(agentId1);
    });

    test('should not affect other agents during cleanup', async () => {
      const pattern1 = createMessagePattern('shared.*');
      const pattern2 = createMessagePattern('private.*');
      
      await registry.subscribe(agentId1, pattern1);
      await registry.subscribe(agentId1, pattern2);
      await registry.subscribe(agentId2, pattern1);
      
      // Cleanup agent1
      await registry.cleanup(agentId1);
      
      // Agent2 subscriptions should remain
      expect(registry.getAgentSubscriptions(agentId2)).toContain(pattern1);
      
      // Shared pattern should still work for agent2
      const messageType = createValidatedMessageType('shared.message');
      const subscribers = registry.getSubscribers(messageType);
      expect(subscribers).toContain(agentId2);
      expect(subscribers).not.toContain(agentId1);
    });
  });

  describe('Atomic Operations', () => {
    test('should handle concurrent subscriptions atomically', async () => {
      const pattern = createMessagePattern('concurrent.*');
      
      // Simulate concurrent subscriptions
      const subscriptionPromises = [
        registry.subscribe(agentId1, pattern),
        registry.subscribe(agentId2, pattern),
        registry.subscribe(agentId1, createMessagePattern('other.*'))
      ];
      
      await Promise.all(subscriptionPromises);
      
      // All should be successful
      expect(registry.getAgentSubscriptions(agentId1)).toHaveLength(2);
      expect(registry.getAgentSubscriptions(agentId2)).toHaveLength(1);
    });

    test('should maintain consistency during concurrent operations', async () => {
      const patterns = Array.from({length: 50}, (_, i) => 
        createMessagePattern(`load.test.${i}`)
      );
      
      // Concurrent subscribe and unsubscribe operations
      const operations = patterns.flatMap(pattern => [
        registry.subscribe(agentId1, pattern),
        registry.unsubscribe(agentId1, pattern)
      ]);
      
      await Promise.allSettled(operations);
      
      // Should end up with no subscriptions
      expect(registry.getAgentSubscriptions(agentId1)).toHaveLength(0);
    });
  });

  describe('Performance Requirements', () => {
    test('should complete subscription operations within 5ms', async () => {
      const pattern = createMessagePattern('performance.*');
      const iterations = 100;
      
      const start = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        await registry.subscribe(agentId1, createMessagePattern(`perf.${i}.*`));
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000; // Convert to ms
      const averageTime = totalTime / iterations;
      
      expect(averageTime).toBeLessThan(5); // < 5ms per subscription
    });

    test('should handle large scale operations efficiently', async () => {
      // 100 agents × 100 subscriptions
      const agents = Array.from({length: 10}, () => createAgentId()); // Reduce for test speed
      const patterns = Array.from({length: 10}, (_, i) => 
        createMessagePattern(`scale.${i}.*`)
      );
      
      const start = process.hrtime.bigint();
      
      for (const agent of agents) {
        registry.registerAgent(agent);
        for (const pattern of patterns) {
          await registry.subscribe(agent, pattern);
        }
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000;
      
      // Should handle 10×10=100 operations in reasonable time
      expect(totalTime).toBeLessThan(100); // < 100ms total
      
      // Verify all subscriptions work
      const messageType = createValidatedMessageType('scale.1.test');
      const subscribers = registry.getSubscribers(messageType);
      expect(subscribers).toHaveLength(10); // All agents subscribed
    });
  });

  describe('Memory Management', () => {
    test('should not leak memory with subscription operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create and remove many subscriptions
      for (let i = 0; i < 1000; i++) {
        const agent = createAgentId();
        const pattern = createMessagePattern(`temp.${i}.*`);
        
        registry.registerAgent(agent);
        await registry.subscribe(agent, pattern);
        await registry.cleanup(agent);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);
      
      expect(memoryIncrease).toBeLessThan(5); // < 5MB increase
    });
  });

  describe('Interface Implementation', () => {
    test('should implement ISubscriptionRegistry interface correctly', () => {
      expect(typeof registry.subscribe).toBe('function');
      expect(typeof registry.unsubscribe).toBe('function'); 
      expect(typeof registry.getSubscribers).toBe('function');
      expect(typeof registry.cleanup).toBe('function');
      expect(typeof registry.getAgentSubscriptions).toBe('function');
      expect(typeof registry.getAllActiveAgents).toBe('function');
      expect(typeof registry.getSubscriptionCount).toBe('function');
    });

    test('should work with injected pattern matcher', async () => {
      const pattern = createMessagePattern('injection.*');
      const messageType = createValidatedMessageType('injection.test');
      
      await registry.subscribe(agentId1, pattern);
      const subscribers = registry.getSubscribers(messageType);
      
      expect(subscribers).toContain(agentId1);
      
      // Verify pattern matcher was used (check cache)
      expect(patternMatcher.getCacheSize()).toBeGreaterThan(0);
    });
  });
});