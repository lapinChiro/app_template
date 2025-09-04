import { describe, test, expect, beforeEach, vi } from 'vitest';

// Import types and implementation we'll create
import type {
  ICorrelationManager,
  PendingRequest,
  RequestConfig,
  CorrelationStats
} from '../../src/core/correlation-manager';

import {
  CorrelationManager
} from '../../src/core/correlation-manager';

import { MessageValidator, type ValidatedMessage } from '../../src/core/message-validator';
import { MessageFactory } from '../../src/core/message-factory';
import { AgentError, ErrorCode } from '../../src/core/errors';
import type { AgentId, MessageId } from '../../src/core/types/branded-types';
import { createAgentId, createMessageId } from '../../src/core/types/branded-types';

describe('CorrelationManager', () => {
  let correlationManager: ICorrelationManager;
  let agentId1: AgentId;
  let agentId2: AgentId;
  let mockMessage: ValidatedMessage;

  beforeEach(() => {
    correlationManager = new CorrelationManager();
    agentId1 = createAgentId('11111111-1111-1111-1111-111111111111');
    agentId2 = createAgentId('22222222-2222-2222-2222-222222222222');
    
    const baseMessage = MessageFactory.createMessage(
      agentId1 as string,
      agentId2 as string,
      'test.request',
      { data: 'test request' }
    );
    mockMessage = MessageValidator.validate(baseMessage);
  });

  afterEach(async () => {
    // Clean up any remaining pending requests to prevent unhandled rejections
    const pendingCount = correlationManager.getPendingRequestCount();
    if (pendingCount > 0) {
      correlationManager.cancelPendingRequests(agentId1);
      correlationManager.cancelPendingRequests(agentId2);
      
      // Wait a bit for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  });

  describe('Correlation ID Generation', () => {
    test('should generate unique correlation IDs', () => {
      const id1 = correlationManager.generateCorrelationId();
      const id2 = correlationManager.generateCorrelationId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      
      // Should be UUID v4 format
      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(id2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    test('should generate correlation IDs within performance limits', () => {
      const iterations = 10000;
      const start = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        correlationManager.generateCorrelationId();
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000; // Convert to ms
      const averageTime = totalTime / iterations;
      
      expect(averageTime).toBeLessThan(0.1); // < 0.1ms per ID generation
    });
  });

  describe('Request Registration and Tracking', () => {
    test('should register pending requests correctly', async () => {
      const correlationId = createMessageId();
      const timeout = 5000;
      
      const requestPromise = correlationManager.registerRequest(
        correlationId,
        mockMessage,
        timeout,
        agentId1
      );
      
      expect(correlationManager.hasPendingRequest(correlationId)).toBe(true);
      expect(correlationManager.getPendingRequestCount()).toBe(1);
      
      // Cleanup to prevent timeout
      correlationManager.cancelRequest(correlationId);
    });

    test('should handle request timeouts correctly', async () => {
      const correlationId = createMessageId();
      const shortTimeout = 50; // 50ms timeout
      
      const requestPromise = correlationManager.registerRequest(
        correlationId,
        mockMessage,
        shortTimeout,
        agentId1
      );
      
      // Should timeout and reject with appropriate error
      await expect(requestPromise).rejects.toThrow(AgentError);
      await expect(requestPromise).rejects.toThrow(/timeout/i);
      
      // Should be automatically removed from pending requests
      expect(correlationManager.hasPendingRequest(correlationId)).toBe(false);
    });

    test('should resolve requests when responses arrive', async () => {
      const correlationId = createMessageId();
      const timeout = 5000;
      
      const requestPromise = correlationManager.registerRequest(
        correlationId,
        mockMessage,
        timeout,
        agentId1
      );
      
      // Send response
      const responsePayload = { result: 'success' };
      const responseMessage = MessageFactory.createMessage(
        agentId2 as string,
        agentId1 as string,
        'test.response',
        responsePayload
      );
      
      // Set the correlation ID
      const correlatedResponse = {
        ...responseMessage,
        id: correlationId as string
      };
      
      const validatedResponse = MessageValidator.validate(correlatedResponse);
      correlationManager.handleResponse(validatedResponse);
      
      // Should resolve with response payload
      const result = await requestPromise;
      expect(result).toEqual(responsePayload);
      
      // Should be removed from pending requests
      expect(correlationManager.hasPendingRequest(correlationId)).toBe(false);
    });

    test('should handle error responses correctly', async () => {
      const correlationId = createMessageId();
      const timeout = 5000;
      
      const requestPromise = correlationManager.registerRequest(
        correlationId,
        mockMessage,
        timeout,
        agentId1
      );
      
      // Send error response
      const errorResponse = {
        ...mockMessage,
        id: correlationId as string,
        type: 'test.error',
        payload: { error: 'Request failed' }
      };
      
      const validatedErrorResponse = MessageValidator.validate(errorResponse);
      correlationManager.handleResponse(validatedErrorResponse);
      
      // Should reject with AgentError
      await expect(requestPromise).rejects.toThrow(AgentError);
      await expect(requestPromise).rejects.toThrow(/Request failed/);
    });
  });

  describe('Duplicate Response Handling', () => {
    test('should accept first response and ignore subsequent ones', async () => {
      const correlationId = createMessageId();
      const timeout = 5000;
      
      const requestPromise = correlationManager.registerRequest(
        correlationId,
        mockMessage,
        timeout,
        agentId1
      );
      
      const responsePayload = { result: 'first' };
      const response1 = {
        ...mockMessage,
        id: correlationId as string,
        type: 'test.response',
        payload: responsePayload
      };
      
      const response2 = {
        ...mockMessage,
        id: correlationId as string,
        type: 'test.response',
        payload: { result: 'second' }
      };
      
      // Send first response
      correlationManager.handleResponse(MessageValidator.validate(response1));
      
      // Send second response (should be ignored)
      correlationManager.handleResponse(MessageValidator.validate(response2));
      
      const result = await requestPromise;
      expect(result).toEqual(responsePayload); // Should be first response
    });

    test('should log duplicate responses', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const correlationId = createMessageId();
      
      const response = {
        ...mockMessage,
        id: correlationId as string,
        type: 'test.response',
        payload: { result: 'duplicate' }
      };
      
      const validatedResponse = MessageValidator.validate(response);
      
      // Send response for non-existent request (duplicate scenario)
      correlationManager.handleResponse(validatedResponse);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`unknown correlation ID: ${correlationId}`)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Agent Cleanup', () => {
    test('should cancel all pending requests for an agent', async () => {
      const correlationId1 = createMessageId();
      const correlationId2 = createMessageId();
      const timeout = 5000;
      
      const request1 = correlationManager.registerRequest(correlationId1, mockMessage, timeout, agentId1);
      const request2 = correlationManager.registerRequest(correlationId2, mockMessage, timeout, agentId1);
      
      expect(correlationManager.getPendingRequestCount()).toBe(2);
      
      // Cancel all requests for agent1
      correlationManager.cancelPendingRequests(agentId1);
      
      expect(correlationManager.getPendingRequestCount()).toBe(0);
      
      // Both requests should be rejected
      await expect(request1).rejects.toThrow('Request cancelled due to agent destruction');
      await expect(request2).rejects.toThrow('Request cancelled due to agent destruction');
    });

    test('should not affect other agents when canceling requests', async () => {
      const correlationId1 = createMessageId();
      const correlationId2 = createMessageId();
      const timeout = 5000;
      
      const request1 = correlationManager.registerRequest(correlationId1, mockMessage, timeout, agentId1);
      const request2 = correlationManager.registerRequest(correlationId2, mockMessage, timeout, agentId2);
      
      // Cancel requests for agent1 only
      correlationManager.cancelPendingRequests(agentId1);
      
      expect(correlationManager.hasPendingRequest(correlationId1)).toBe(false);
      expect(correlationManager.hasPendingRequest(correlationId2)).toBe(true);
      
      // Cleanup
      correlationManager.cancelRequest(correlationId2);
    });
  });

  describe('Request Age and Statistics', () => {
    test('should track request age correctly', async () => {
      const correlationId = createMessageId();
      const timeout = 5000;
      
      const requestPromise = correlationManager.registerRequest(
        correlationId,
        mockMessage,
        timeout,
        agentId1
      );
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const age = correlationManager.getRequestAge(correlationId);
      expect(age).toBeGreaterThan(8); // Should be at least ~10ms
      expect(age).toBeLessThan(100); // But not too old
      
      // Cleanup properly
      correlationManager.cancelRequest(correlationId);
      
      // Handle the rejected promise
      try {
        await requestPromise;
      } catch (error) {
        // Expected cancellation error - ignore
      }
    });

    test('should return null for non-existent request age', () => {
      const nonExistentId = createMessageId();
      const age = correlationManager.getRequestAge(nonExistentId);
      expect(age).toBeNull();
    });

    test('should provide correlation statistics', async () => {
      // Create some requests and let them age
      const requests = [];
      for (let i = 0; i < 5; i++) {
        const id = createMessageId();
        const request = correlationManager.registerRequest(id, mockMessage, 5000, agentId1);
        requests.push({ id, request });
      }
      
      // Wait for requests to age
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const stats = correlationManager.getStats();
      expect(stats.totalRequests).toBeGreaterThanOrEqual(5);
      expect(stats.pendingRequests).toBe(5);
      expect(stats.averageRequestAge).toBeGreaterThan(0);
      
      // Properly cleanup with error handling
      const cleanupPromises = requests.map(async ({ request }) => {
        try {
          await request;
        } catch (error) {
          // Expected cancellation error - ignore
        }
      });
      
      correlationManager.cancelPendingRequests(agentId1);
      await Promise.allSettled(cleanupPromises);
    });
  });

  describe('Performance Requirements', () => {
    test('should handle correlation operations within 1ms', () => {
      const iterations = 1000;
      const start = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        const id = correlationManager.generateCorrelationId();
        correlationManager.hasPendingRequest(createMessageId(id));
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000;
      const averageTime = totalTime / iterations;
      
      expect(averageTime).toBeLessThan(1); // < 1ms per operation
    });

    test('should handle high volume of concurrent requests', async () => {
      const requestCount = 100; // Reduce count for test stability
      const timeout = 10000;
      const requests = [];
      
      const start = process.hrtime.bigint();
      
      // Create many concurrent requests
      for (let i = 0; i < requestCount; i++) {
        const id = createMessageId();
        const request = correlationManager.registerRequest(id, mockMessage, timeout, agentId1);
        requests.push({ id, request });
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000;
      
      expect(totalTime).toBeLessThan(50); // < 50ms for 100 requests
      expect(correlationManager.getPendingRequestCount()).toBe(requestCount);
      
      // Proper cleanup with error handling
      const cleanupPromises = requests.map(async ({ request }) => {
        try {
          await request;
        } catch (error) {
          // Expected cancellation error - ignore
        }
      });
      
      correlationManager.cancelPendingRequests(agentId1);
      await Promise.allSettled(cleanupPromises);
    });
  });

  describe('Memory Management', () => {
    test('should not leak memory with many requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create and clean up many requests
      for (let i = 0; i < 1000; i++) {
        const id = createMessageId();
        const request = correlationManager.registerRequest(id, mockMessage, 1000, agentId1);
        
        // Immediately cancel to clean up
        correlationManager.cancelRequest(id);
        
        try {
          await request;
        } catch (error) {
          // Expected cancellation error
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);
      
      expect(memoryIncrease).toBeLessThan(5); // < 5MB increase
    });
  });

  describe('Interface Implementation', () => {
    test('should implement ICorrelationManager interface correctly', () => {
      expect(typeof correlationManager.generateCorrelationId).toBe('function');
      expect(typeof correlationManager.registerRequest).toBe('function');
      expect(typeof correlationManager.handleResponse).toBe('function');
      expect(typeof correlationManager.cancelRequest).toBe('function');
      expect(typeof correlationManager.cancelPendingRequests).toBe('function');
      expect(typeof correlationManager.hasPendingRequest).toBe('function');
      expect(typeof correlationManager.getPendingRequestCount).toBe('function');
      expect(typeof correlationManager.getRequestAge).toBe('function');
      expect(typeof correlationManager.getStats).toBe('function');
    });

    test('should provide consistent correlation ID format', () => {
      const ids = Array.from({ length: 100 }, () => correlationManager.generateCorrelationId());
      
      ids.forEach(id => {
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      });
      
      // All should be unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);
    });
  });
});