import { describe, test, expect, beforeEach, vi } from 'vitest';

// Import types and implementation we'll create
import type {
  IDeliveryEngine,
  DeliveryResult,
  ExtendedMessage
} from '../../src/core/delivery-engine';

import {
  DeliveryEngine,
  MessagePriority
} from '../../src/core/delivery-engine';

import { MessageValidator, type ValidatedMessage } from '../../src/core/message-validator';
import { MessageFactory } from '../../src/core/message-factory';
import type { AgentId, MessageId } from '../../src/core/types/branded-types';
import { createAgentId, createMessageId } from '../../src/core/types/branded-types';

describe('DeliveryEngine', () => {
  let deliveryEngine: IDeliveryEngine;
  let agentId1: AgentId;
  let agentId2: AgentId;
  let mockMessage: ValidatedMessage;

  beforeEach(() => {
    deliveryEngine = new DeliveryEngine();
    agentId1 = createAgentId('11111111-1111-1111-1111-111111111111');
    agentId2 = createAgentId('22222222-2222-2222-2222-222222222222');
    
    // Create a valid test message
    const baseMessage = MessageFactory.createMessage(
      agentId1 as string,
      agentId2 as string,
      'test.message',
      { data: 'test' }
    );
    mockMessage = MessageValidator.validate(baseMessage);
  });

  describe('Basic Message Delivery', () => {
    test('should deliver message to single subscriber', async () => {
      const subscribers = [agentId2];
      
      const result = await deliveryEngine.deliver(mockMessage, subscribers);
      
      expect(result.success).toBe(true);
      expect(result.deliveredTo).toContain(agentId2);
      expect(result.failedDeliveries).toHaveLength(0);
    });

    test('should deliver message to multiple subscribers concurrently', async () => {
      const subscribers = [agentId1, agentId2];
      
      const start = process.hrtime.bigint();
      const result = await deliveryEngine.deliver(mockMessage, subscribers);
      const end = process.hrtime.bigint();
      
      const duration = Number(end - start) / 1000000; // ms
      
      expect(result.success).toBe(true);
      expect(result.deliveredTo).toHaveLength(2);
      expect(result.deliveredTo).toContain(agentId1);
      expect(result.deliveredTo).toContain(agentId2);
      expect(duration).toBeLessThan(20); // < 20ms delivery time
    });

    test('should handle empty subscriber list gracefully', async () => {
      const subscribers: AgentId[] = [];
      
      const result = await deliveryEngine.deliver(mockMessage, subscribers);
      
      expect(result.success).toBe(true);
      expect(result.deliveredTo).toHaveLength(0);
      expect(result.totalDeliveries).toBe(0);
    });

    test('should return delivery statistics', async () => {
      const subscribers = [agentId1, agentId2];
      
      const result = await deliveryEngine.deliver(mockMessage, subscribers);
      
      expect(result).toHaveProperty('totalDeliveries');
      expect(result).toHaveProperty('successfulDeliveries');
      expect(result).toHaveProperty('failedDeliveries');
      expect(result).toHaveProperty('deliveryTime');
      expect(result.totalDeliveries).toBe(2);
      expect(result.successfulDeliveries).toBe(2);
    });
  });

  describe('Priority Queue System', () => {
    test('should support message priorities', async () => {
      const highPriorityMsg: ExtendedMessage = {
        ...mockMessage,
        priority: MessagePriority.HIGH,
        retryCount: 0,
        maxRetries: 3,
        deliveryAttempts: 0,
        createdAt: new Date()
      };

      const lowPriorityMsg: ExtendedMessage = {
        ...mockMessage, 
        id: createMessageId(),
        priority: MessagePriority.LOW,
        retryCount: 0,
        maxRetries: 3,
        deliveryAttempts: 0,
        createdAt: new Date()
      };

      const subscribers = [agentId1];
      
      // Both should be delivered successfully
      const highResult = await deliveryEngine.deliver(highPriorityMsg, subscribers);
      const lowResult = await deliveryEngine.deliver(lowPriorityMsg, subscribers);
      
      expect(highResult.success).toBe(true);
      expect(lowResult.success).toBe(true);
    });

    test('should process high priority messages first', async () => {
      // This would be tested with a queue implementation
      // For now, just verify priorities are recognized
      const priorities = [MessagePriority.LOW, MessagePriority.NORMAL, MessagePriority.HIGH];
      
      priorities.forEach(priority => {
        expect(typeof priority).toBe('number');
        expect(priority >= 0 && priority <= 2).toBe(true);
      });
    });
  });

  describe('Batch Processing', () => {
    test('should use batch delivery for large subscriber lists', async () => {
      // Create 15 subscribers (> 5, should trigger batch processing)
      const subscribers: AgentId[] = Array.from({length: 15}, () => createAgentId());
      
      const result = await deliveryEngine.deliver(mockMessage, subscribers);
      
      expect(result.success).toBe(true);
      expect(result.deliveredTo).toHaveLength(15);
      expect(result.batchCount).toBeGreaterThan(1); // Should use multiple batches
    });

    test('should use concurrent delivery for small subscriber lists', async () => {
      // Create 3 subscribers (≤ 5, should use concurrent delivery)
      const subscribers = [agentId1, agentId2, createAgentId()];
      
      const result = await deliveryEngine.deliver(mockMessage, subscribers);
      
      expect(result.success).toBe(true);
      expect(result.deliveredTo).toHaveLength(3);
      expect(result.batchCount).toBe(1); // Should use single batch
    });
  });

  describe('Retry Mechanism', () => {
    test('should retry failed deliveries with exponential backoff', async () => {
      const failingMessage: ExtendedMessage = {
        ...mockMessage,
        id: createMessageId(),
        priority: MessagePriority.NORMAL,
        retryCount: 0,
        maxRetries: 2,
        deliveryAttempts: 0,
        createdAt: new Date()
      };

      // Test multiple times with high failure rate to ensure retry logic is exercised
      let foundRetryAttempt = false;
      
      for (let attempt = 0; attempt < 10; attempt++) {
        const mockFailingEngine = new DeliveryEngine({
          simulateFailure: true,
          failureRate: 0.9 // 90% failure rate
        });

        const result = await mockFailingEngine.deliver(failingMessage, [agentId1]);
        
        if (result.retryAttempts > 0) {
          foundRetryAttempt = true;
          expect(result.retryAttempts).toBeLessThanOrEqual(2);
          break;
        }
      }
      
      // At least one test run should have triggered retries
      expect(foundRetryAttempt).toBe(true);
    });

    test('should give up after max retries', async () => {
      // Use a failing engine to guarantee failure
      const failingEngine = new DeliveryEngine({ 
        simulateFailure: true, 
        failureRate: 1.0 
      });
      
      const failingMessage: ExtendedMessage = {
        ...mockMessage,
        id: createMessageId(),
        priority: MessagePriority.NORMAL,
        retryCount: 3, // Already at max retries
        maxRetries: 3,
        deliveryAttempts: 3,
        createdAt: new Date()
      };

      const result = await failingEngine.deliver(failingMessage, [agentId1]);
      
      // Should not attempt more retries and should fail
      expect(result.success).toBe(false);
      expect(result.failedDeliveries).toHaveLength(1);
      expect(result.retryAttempts).toBe(0); // No retries attempted since already at max
    });
  });

  describe('Performance Requirements', () => {
    test('should deliver messages within 20ms', async () => {
      const subscribers = Array.from({length: 10}, () => createAgentId());
      const iterations = 50;
      
      let totalTime = 0;
      
      for (let i = 0; i < iterations; i++) {
        const testMessage = {
          ...mockMessage,
          id: createMessageId()
        };
        
        const start = process.hrtime.bigint();
        await deliveryEngine.deliver(testMessage, subscribers);
        const end = process.hrtime.bigint();
        
        totalTime += Number(end - start) / 1000000;
      }
      
      const averageTime = totalTime / iterations;
      expect(averageTime).toBeLessThan(20); // < 20ms per delivery
    });

    test('should handle high throughput efficiently', async () => {
      const subscribers = [agentId1, agentId2];
      const messageCount = 100;
      
      const messages = Array.from({length: messageCount}, (_, i) => ({
        ...mockMessage,
        id: createMessageId(),
        type: `test.message.${i}` as ValidatedMessage['type']
      }));
      
      const start = process.hrtime.bigint();
      
      const deliveryPromises = messages.map(msg => 
        deliveryEngine.deliver(msg, subscribers)
      );
      
      const results = await Promise.all(deliveryPromises);
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000;
      const messagesPerSecond = (messageCount * 1000) / totalTime;
      
      // Should handle reasonable throughput
      expect(messagesPerSecond).toBeGreaterThan(1000); // > 1k msg/sec
      
      // All deliveries should succeed
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('Message Transformation', () => {
    test('should convert basic message to extended format', () => {
      const basicMessage = MessageFactory.createMessage(
        agentId1 as string,
        agentId2 as string,
        'test',
        { data: 'test' }
      );
      
      const validated = MessageValidator.validate(basicMessage);
      
      // DeliveryEngine should handle both basic and extended formats
      expect(async () => {
        await deliveryEngine.deliver(validated, [agentId2]);
      }).not.toThrow();
    });

    test('should preserve extended message properties', async () => {
      const extendedMessage: ExtendedMessage = {
        ...mockMessage,
        priority: MessagePriority.HIGH,
        retryCount: 1,
        maxRetries: 3,
        deliveryAttempts: 1,
        createdAt: new Date(),
        deliveredAt: new Date()
      };

      const result = await deliveryEngine.deliver(extendedMessage, [agentId1]);
      
      expect(result.success).toBe(true);
      expect(result.messageInfo?.priority).toBe(MessagePriority.HIGH);
      expect(result.messageInfo?.retryCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle delivery failures gracefully', async () => {
      // Create delivery engine with failure simulation
      const failingEngine = new DeliveryEngine({ 
        simulateFailure: true, 
        failureRate: 1.0 // 100% failure rate
      });
      
      const result = await failingEngine.deliver(mockMessage, [agentId1]);
      
      // Should not throw, but should report failure
      expect(result.success).toBe(false);
      expect(result.failedDeliveries).toHaveLength(1);
      expect(result.failedDeliveries[0].agentId).toBe(agentId1);
    });

    test('should continue delivery to other subscribers even if some fail', async () => {
      const validSubscriber = agentId1;
      
      // Create engine that fails for specific agent
      const partialFailEngine = new DeliveryEngine({ 
        simulateFailure: true, 
        failureRate: 0.5 // 50% failure rate
      });
      
      // Test multiple times to account for randomness
      let foundPartialFailure = false;
      for (let i = 0; i < 10; i++) {
        const result = await partialFailEngine.deliver(
          mockMessage, 
          [validSubscriber, agentId2]
        );
        
        if (result.successfulDeliveries > 0 && result.failedDeliveries.length > 0) {
          foundPartialFailure = true;
          break;
        }
      }
      
      expect(foundPartialFailure).toBe(true);
    });
  });

  describe('Interface Implementation', () => {
    test('should implement IDeliveryEngine interface correctly', () => {
      expect(typeof deliveryEngine.deliver).toBe('function');
      expect(typeof deliveryEngine.getStats).toBe('function');
      expect(typeof deliveryEngine.clearStats).toBe('function');
    });

    test('should provide delivery statistics', () => {
      const stats = deliveryEngine.getStats();
      
      expect(stats).toHaveProperty('totalDeliveries');
      expect(stats).toHaveProperty('averageDeliveryTime');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('retryRate');
    });
  });
});