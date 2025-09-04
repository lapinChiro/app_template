import { describe, test, expect, beforeEach } from 'vitest';

// Import types and implementation we'll create
import type {
  MessagingSystemContainer,
  MessagingConfig
} from '../../src/core/messaging-system-container';

import {
  createMessagingSystemContainer,
  defaultMessagingConfig
} from '../../src/core/messaging-system-container';

// Import individual interfaces to verify DI
import type { IPatternMatcher } from '../../src/core/pattern-matcher';
import type { ISubscriptionRegistry } from '../../src/core/subscription-registry';
import type { IDeliveryEngine } from '../../src/core/delivery-engine';
import type { IHealthMonitor } from '../../src/core/health-monitor';
import type { ICorrelationManager } from '../../src/core/correlation-manager';
import type { IMessageRouter } from '../../src/core/message-router';

describe('MessagingSystemContainer', () => {
  let container1: MessagingSystemContainer;
  let container2: MessagingSystemContainer;
  let customConfig: MessagingConfig;

  beforeEach(() => {
    customConfig = {
      maxConcurrentDeliveries: 500,
      defaultRequestTimeout: 3000,
      circuitBreakerThreshold: 15,
      patternCacheSize: 2000,
      subscriptionLimit: 50,
      enablePerformanceLogging: false
    };
  });

  describe('Container Creation and Isolation', () => {
    test('should create container with default configuration', () => {
      container1 = createMessagingSystemContainer();
      
      expect(container1).toBeDefined();
      expect(typeof container1.getMessageRouter).toBe('function');
      expect(typeof container1.getSubscriptionRegistry).toBe('function');
      expect(typeof container1.getDeliveryEngine).toBe('function');
      expect(typeof container1.getHealthMonitor).toBe('function');
      expect(typeof container1.getCorrelationManager).toBe('function');
      expect(typeof container1.getPatternMatcher).toBe('function');
    });

    test('should create container with custom configuration', () => {
      container1 = createMessagingSystemContainer(customConfig);
      
      expect(container1).toBeDefined();
      
      // Configuration should be passed through (test indirectly)
      const healthMonitor = container1.getHealthMonitor();
      expect(healthMonitor).toBeDefined();
    });

    test('should create completely isolated instances', () => {
      container1 = createMessagingSystemContainer();
      container2 = createMessagingSystemContainer(customConfig);
      
      // All components should be different instances
      expect(container1.getMessageRouter()).not.toBe(container2.getMessageRouter());
      expect(container1.getSubscriptionRegistry()).not.toBe(container2.getSubscriptionRegistry());
      expect(container1.getDeliveryEngine()).not.toBe(container2.getDeliveryEngine());
      expect(container1.getHealthMonitor()).not.toBe(container2.getHealthMonitor());
      expect(container1.getCorrelationManager()).not.toBe(container2.getCorrelationManager());
      expect(container1.getPatternMatcher()).not.toBe(container2.getPatternMatcher());
    });

    test('should create instances within performance limits', () => {
      const iterations = 10;
      const start = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        const container = createMessagingSystemContainer();
        expect(container).toBeDefined();
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000; // Convert to ms
      const averageTime = totalTime / iterations;
      
      expect(averageTime).toBeLessThan(5); // < 5ms per container creation
    });
  });

  describe('Dependency Injection Verification', () => {
    test('should properly inject all dependencies', () => {
      container1 = createMessagingSystemContainer();
      
      const messageRouter = container1.getMessageRouter();
      const subscriptionRegistry = container1.getSubscriptionRegistry();
      const deliveryEngine = container1.getDeliveryEngine();
      const healthMonitor = container1.getHealthMonitor();
      const correlationManager = container1.getCorrelationManager();
      const patternMatcher = container1.getPatternMatcher();
      
      // All should be proper instances of their interfaces
      expect(messageRouter).toBeDefined();
      expect(subscriptionRegistry).toBeDefined();
      expect(deliveryEngine).toBeDefined();
      expect(healthMonitor).toBeDefined();
      expect(correlationManager).toBeDefined();
      expect(patternMatcher).toBeDefined();
    });

    test('should verify component interconnections work', async () => {
      container1 = createMessagingSystemContainer();
      
      const subscriptionRegistry = container1.getSubscriptionRegistry();
      const messageRouter = container1.getMessageRouter();
      
      // Test that injected dependencies work together
      const agentId = '11111111-1111-1111-1111-111111111111';
      subscriptionRegistry.registerAgent(agentId as any);
      await subscriptionRegistry.subscribe(agentId as any, 'test.*' as any);
      
      // Should be able to get subscribers (verifies pattern matcher injection)
      const subscribers = subscriptionRegistry.getSubscribers('test.message' as any);
      expect(subscribers).toHaveLength(1);
      expect(subscribers[0]).toBe(agentId);
    });

    test('should maintain proper dependency hierarchy', () => {
      container1 = createMessagingSystemContainer();
      
      // MessageRouter should have been injected with other components
      const messageRouter = container1.getMessageRouter();
      expect(messageRouter).toBeDefined();
      
      // SubscriptionRegistry should have PatternMatcher injected
      const subscriptionRegistry = container1.getSubscriptionRegistry();
      expect(subscriptionRegistry).toBeDefined();
      
      // Pattern matcher should work independently
      const patternMatcher = container1.getPatternMatcher();
      expect(patternMatcher.matches('test.*' as any, 'test.message' as any)).toBe(true);
    });
  });

  describe('No Singleton Dependencies', () => {
    test('should not use any Singleton pattern', () => {
      container1 = createMessagingSystemContainer();
      container2 = createMessagingSystemContainer();
      
      // Verify that each container has completely independent components
      const health1 = container1.getHealthMonitor();
      const health2 = container2.getHealthMonitor();
      
      // Record different health status with different component IDs
      health1.recordHealth('test1', true, 'Container 1');
      health2.recordHealth('test2', false, 'Container 2');
      health2.recordHealth('test3', false, 'Container 2 Extra');
      
      const report1 = health1.getHealthReport();
      const report2 = health2.getHealthReport();
      
      // Should be completely independent
      expect(report1.totalComponents).not.toBe(report2.totalComponents);
      
      const component1 = report1.componentDetails.find(c => c.componentId === 'test1');
      const component2 = report2.componentDetails.find(c => c.componentId === 'test2');
      
      expect(component1?.isHealthy).toBe(true);
      expect(component2?.isHealthy).toBe(false);
    });

    test('should allow multiple containers to coexist with Phase1 Singletons', async () => {
      // Import Phase1 singletons using ES import
      const { PerformanceMonitor } = await import('../../src/core/performance-monitor');
      
      // Create Phase2 containers
      container1 = createMessagingSystemContainer();
      container2 = createMessagingSystemContainer();
      
      // Phase1 singletons should still work
      const perfMon1 = PerformanceMonitor.getInstance();
      const perfMon2 = PerformanceMonitor.getInstance();
      expect(perfMon1).toBe(perfMon2); // Same instance (Singleton)
      
      // Phase2 containers should be independent
      expect(container1.getHealthMonitor()).not.toBe(container2.getHealthMonitor());
      
      // Should not interfere with each other
      expect(() => {
        perfMon1.recordCreation('test-agent', 5);
        container1.getHealthMonitor().recordHealth('test', true, 'test');
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    test('should consume memory within expected limits', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create multiple containers
      const containers = [];
      for (let i = 0; i < 10; i++) {
        containers.push(createMessagingSystemContainer());
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);
      
      expect(memoryIncrease).toBeLessThan(20); // < 20MB for 10 containers
      expect(containers).toHaveLength(10);
    });

    test('should not leak memory on repeated container creation', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create and discard many containers
      for (let i = 0; i < 100; i++) {
        const container = createMessagingSystemContainer();
        expect(container).toBeDefined();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);
      
      expect(memoryIncrease).toBeLessThan(30); // < 30MB for 100 containers
    });
  });

  describe('Configuration Management', () => {
    test('should use default configuration when none provided', () => {
      container1 = createMessagingSystemContainer();
      
      // Should work with defaults
      const messageRouter = container1.getMessageRouter();
      const health = messageRouter.getHealth();
      
      expect(health.isHealthy).toBe(true);
    });

    test('should respect custom configuration settings', () => {
      const testConfig: MessagingConfig = {
        maxConcurrentDeliveries: 100,
        defaultRequestTimeout: 1000,
        circuitBreakerThreshold: 3,
        patternCacheSize: 500,
        subscriptionLimit: 25,
        enablePerformanceLogging: false
      };
      
      container1 = createMessagingSystemContainer(testConfig);
      
      // Configuration should be passed to components
      const healthMonitor = container1.getHealthMonitor();
      expect(healthMonitor).toBeDefined();
      
      // Test that custom thresholds are applied (indirectly)
      healthMonitor.setCircuitBreakerThreshold('test', testConfig.circuitBreakerThreshold);
      
      for (let i = 0; i < testConfig.circuitBreakerThreshold; i++) {
        healthMonitor.recordFailure('test', new Error(`Failure ${i}`));
      }
      
      const health = healthMonitor.getComponentHealth('test');
      expect(health.circuitBreakerState).toBe('OPEN');
    });

    test('should validate configuration parameters', () => {
      const invalidConfigs = [
        { maxConcurrentDeliveries: -1 },
        { defaultRequestTimeout: 0 },
        { circuitBreakerThreshold: 0 },
        { patternCacheSize: -5 },
        { subscriptionLimit: 0 }
      ];

      invalidConfigs.forEach(invalidConfig => {
        expect(() => {
          createMessagingSystemContainer(invalidConfig as any);
        }).toThrow(/Invalid configuration/);
      });
    });
  });

  describe('Circular Dependency Prevention', () => {
    test('should not have circular dependencies', () => {
      // Should create successfully without stack overflow or infinite recursion
      container1 = createMessagingSystemContainer();
      
      // All components should be accessible
      expect(() => {
        container1.getMessageRouter();
        container1.getSubscriptionRegistry();
        container1.getDeliveryEngine();
        container1.getHealthMonitor();
        container1.getCorrelationManager();
        container1.getPatternMatcher();
      }).not.toThrow();
    });

    test('should maintain proper dependency order', () => {
      container1 = createMessagingSystemContainer();
      
      // Components should be created in proper order
      // (This is tested implicitly by successful creation)
      const components = {
        patternMatcher: container1.getPatternMatcher(),
        subscriptionRegistry: container1.getSubscriptionRegistry(),
        deliveryEngine: container1.getDeliveryEngine(),
        healthMonitor: container1.getHealthMonitor(),
        correlationManager: container1.getCorrelationManager(),
        messageRouter: container1.getMessageRouter()
      };
      
      Object.values(components).forEach(component => {
        expect(component).toBeDefined();
        expect(component.constructor.name).toBeTruthy();
      });
    });
  });

  describe('Integration Testing', () => {
    test('should support full end-to-end messaging workflow', async () => {
      container1 = createMessagingSystemContainer();
      
      const subscriptionRegistry = container1.getSubscriptionRegistry();
      const messageRouter = container1.getMessageRouter();
      
      // Set up agents and subscriptions
      const agentId1 = '11111111-1111-1111-1111-111111111111' as any;
      const agentId2 = '22222222-2222-2222-2222-222222222222' as any;
      
      subscriptionRegistry.registerAgent(agentId1);
      subscriptionRegistry.registerAgent(agentId2);
      await subscriptionRegistry.subscribe(agentId2, 'test.*');
      
      // Create and route message
      const { MessageFactory } = await import('../../src/core/message-factory');
      const { MessageValidator } = await import('../../src/core/message-validator');
      
      const message = MessageFactory.createMessage(
        agentId1,
        agentId2,
        'test.integration',
        { integration: true }
      );
      const validatedMessage = MessageValidator.validate(message);
      
      const result = await messageRouter.route(validatedMessage);
      
      expect(result.success).toBe(true);
      expect(result.routedTo).toContain(agentId2);
    });
  });

  describe('Performance Requirements', () => {
    test('should meet container creation performance requirements', () => {
      const start = process.hrtime.bigint();
      
      container1 = createMessagingSystemContainer();
      
      const end = process.hrtime.bigint();
      const creationTime = Number(end - start) / 1000000;
      
      expect(creationTime).toBeLessThan(5); // < 5ms creation time
    });

    test('should maintain performance with multiple containers', () => {
      const containerCount = 5;
      const start = process.hrtime.bigint();
      
      const containers = [];
      for (let i = 0; i < containerCount; i++) {
        containers.push(createMessagingSystemContainer());
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000;
      const averageTime = totalTime / containerCount;
      
      expect(averageTime).toBeLessThan(10); // < 10ms average per container
      expect(containers).toHaveLength(containerCount);
    });
  });

  describe('Interface Implementation', () => {
    test('should provide all required interface access methods', () => {
      container1 = createMessagingSystemContainer();
      
      // Test interface method presence
      const methods = [
        'getMessageRouter',
        'getSubscriptionRegistry', 
        'getDeliveryEngine',
        'getHealthMonitor',
        'getCorrelationManager',
        'getPatternMatcher'
      ];
      
      methods.forEach(method => {
        expect(typeof container1[method as keyof MessagingSystemContainer]).toBe('function');
      });
    });

    test('should return consistent interface implementations', () => {
      container1 = createMessagingSystemContainer();
      
      // Multiple calls should return same instances
      const router1 = container1.getMessageRouter();
      const router2 = container1.getMessageRouter();
      
      expect(router1).toBe(router2); // Same instance within container
      
      // But different containers should have different instances
      container2 = createMessagingSystemContainer();
      const router3 = container2.getMessageRouter();
      
      expect(router1).not.toBe(router3); // Different instances across containers
    });
  });
});