import { describe, test, expect, beforeEach } from 'vitest';

// Import types we'll create
import type {
  ValidatedMessageType,
  AgentId,
  MessagePattern,
  MessageId,
  Timestamp
} from '../../../src/core/types/branded-types';

import {
  createValidatedMessageType,
  createAgentId,
  createMessagePattern,
  createMessageId,
  createTimestamp,
  isValidAgentId,
  isValidMessageType,
  isValidMessagePattern
} from '../../../src/core/types/branded-types';

describe('Branded Types', () => {
  describe('ValidatedMessageType', () => {
    test('should not accept plain string', () => {
      const plain: string = 'test';
      // @ts-expect-error - should not be assignable
      const typed: ValidatedMessageType = plain;
      expect(typeof plain).toBe('string'); // Keep compiler happy
    });

    test('should work with proper factory function', () => {
      const typed = createValidatedMessageType('test.message');
      expect(typeof typed).toBe('string');
      expect(typed).toBe('test.message');
    });

    test('should validate message type format', () => {
      expect(() => createValidatedMessageType('valid.type')).not.toThrow();
      expect(() => createValidatedMessageType('valid.sub.type')).not.toThrow();
      expect(() => createValidatedMessageType('')).toThrow();
      expect(() => createValidatedMessageType('invalid space')).toThrow();
      expect(() => createValidatedMessageType('invalid@symbol')).toThrow();
    });

    test('should work with type guards', () => {
      const valid = createValidatedMessageType('test.message');
      expect(isValidMessageType('test.message')).toBe(true);
      expect(isValidMessageType('')).toBe(false);
      expect(isValidMessageType('invalid space')).toBe(false);
    });
  });

  describe('AgentId', () => {
    test('should create valid UUID-based agent ID', () => {
      const agentId = createAgentId();
      expect(typeof agentId).toBe('string');
      // Should be UUID v4 format
      expect(agentId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('should create agent ID from existing UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const agentId = createAgentId(uuid);
      expect(agentId).toBe(uuid);
    });

    test('should validate agent ID format', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const invalidId = 'not-a-uuid';
      
      expect(isValidAgentId(validUuid)).toBe(true);
      expect(isValidAgentId(invalidId)).toBe(false);
    });

    test('should reject invalid UUIDs', () => {
      expect(() => createAgentId('invalid-uuid')).toThrow();
      expect(() => createAgentId('')).toThrow();
    });
  });

  describe('MessagePattern', () => {
    test('should create valid patterns', () => {
      expect(() => createMessagePattern('user.*')).not.toThrow();
      expect(() => createMessagePattern('user.login')).not.toThrow();
      expect(() => createMessagePattern('system.*.alert')).not.toThrow();
    });

    test('should validate pattern depth limit', () => {
      const validPattern = 'a.b.c.d.e'; // 5 levels
      const invalidPattern = 'a.b.c.d.e.f'; // 6 levels
      
      expect(() => createMessagePattern(validPattern)).not.toThrow();
      expect(() => createMessagePattern(invalidPattern)).toThrow();
    });

    test('should validate pattern format', () => {
      expect(isValidMessagePattern('valid.pattern')).toBe(true);
      expect(isValidMessagePattern('valid.*')).toBe(true);
      expect(isValidMessagePattern('invalid space')).toBe(false);
      expect(isValidMessagePattern('')).toBe(false);
    });
  });

  describe('MessageId', () => {
    test('should create unique message IDs', () => {
      const id1 = createMessageId();
      const id2 = createMessageId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    test('should accept existing UUID', () => {
      const existingId = '987fcdeb-51a2-4321-9876-123456789abc';
      const messageId = createMessageId(existingId);
      expect(messageId).toBe(existingId);
    });
  });

  describe('Timestamp', () => {
    test('should create current timestamp', () => {
      const timestamp = createTimestamp();
      expect(timestamp).toBeInstanceOf(Date);
      expect(Date.now() - timestamp.getTime()).toBeLessThan(100); // Created within 100ms
    });

    test('should accept existing Date', () => {
      const date = new Date('2025-01-01');
      const timestamp = createTimestamp(date);
      expect(timestamp).toBe(date);
    });
  });

  describe('Performance', () => {
    test('should execute type conversions within 1ms', async () => {
      const iterations = 1000;
      
      const start = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        createValidatedMessageType(`test.message.${i}`);
        createAgentId();
        createMessagePattern(`pattern.${i}.*`);
        createMessageId();
        createTimestamp();
      }
      
      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000; // Convert to ms
      const averageTime = totalTime / iterations;
      
      expect(averageTime).toBeLessThan(1); // < 1ms per operation
    });
  });
});