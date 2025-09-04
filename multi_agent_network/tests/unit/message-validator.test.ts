import { describe, test, expect, beforeEach } from 'vitest';
import { ZodError } from 'zod';

// Import the validator we'll create
import {
  MessageValidator,
  type ValidatedMessage,
  type MessageValidationError
} from '../../src/core/message-validator';

describe('MessageValidator', () => {
  describe('validate', () => {
    test('should validate correct message format', () => {
      const validMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        from: '987fcdeb-51a2-4321-9876-123456789abc',
        to: '456789ab-cdef-1234-5678-90abcdef1234',
        type: 'test.message',
        payload: { data: 'test', count: 42 },
        timestamp: new Date('2025-09-04T12:00:00.000Z')
      };

      expect(() => MessageValidator.validate(validMessage)).not.toThrow();
      const result = MessageValidator.validate(validMessage);
      expect(result.id).toBe(validMessage.id);
      expect(result.type).toBe(validMessage.type);
    });

    test('should reject invalid UUID format', () => {
      const invalidMessage = {
        id: 'invalid-uuid',
        from: 'also-invalid',
        to: '456789ab-cdef-1234-5678-90abcdef1234',
        type: 'test.message',
        payload: { data: 'test' },
        timestamp: new Date()
      };

      expect(() => MessageValidator.validate(invalidMessage)).toThrow(ZodError);
    });

    test('should reject missing required fields', () => {
      const incompleteMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        from: '987fcdeb-51a2-4321-9876-123456789abc',
        // missing 'to', 'type', 'payload', 'timestamp'
      };

      expect(() => MessageValidator.validate(incompleteMessage)).toThrow(ZodError);
    });

    test('should reject invalid message type format', () => {
      const invalidMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        from: '987fcdeb-51a2-4321-9876-123456789abc',
        to: '456789ab-cdef-1234-5678-90abcdef1234',
        type: 'invalid type with spaces',
        payload: { data: 'test' },
        timestamp: new Date()
      };

      expect(() => MessageValidator.validate(invalidMessage)).toThrow(ZodError);
    });

    test('should reject too long message type', () => {
      const longType = 'a'.repeat(101); // > 100 characters
      const invalidMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        from: '987fcdeb-51a2-4321-9876-123456789abc',
        to: '456789ab-cdef-1234-5678-90abcdef1234',
        type: longType,
        payload: { data: 'test' },
        timestamp: new Date()
      };

      expect(() => MessageValidator.validate(invalidMessage)).toThrow(ZodError);
    });

    test('should accept various payload types', () => {
      const testPayloads = [
        { string: 'test', number: 42, boolean: true },
        { nested: { deep: { value: 'test' } } },
        { array: [1, 2, 3], object: { a: 'b' } },
        {}  // Empty object should be valid
      ];

      testPayloads.forEach((payload, index) => {
        const message = {
          id: `123e4567-e89b-12d3-a456-42661417400${index}`,
          from: '987fcdeb-51a2-4321-9876-123456789abc',
          to: '456789ab-cdef-1234-5678-90abcdef1234',
          type: `test.payload.${index}`,
          payload,
          timestamp: new Date()
        };

        expect(() => MessageValidator.validate(message)).not.toThrow();
      });
    });

    test('should reject non-object payload', () => {
      const invalidMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        from: '987fcdeb-51a2-4321-9876-123456789abc',
        to: '456789ab-cdef-1234-5678-90abcdef1234',
        type: 'test.message',
        payload: 'string-payload', // Should be object
        timestamp: new Date()
      };

      expect(() => MessageValidator.validate(invalidMessage)).toThrow(ZodError);
    });
  });

  describe('isValid', () => {
    test('should return true for valid message', () => {
      const validMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        from: '987fcdeb-51a2-4321-9876-123456789abc',
        to: '456789ab-cdef-1234-5678-90abcdef1234',
        type: 'test.message',
        payload: { data: 'test' },
        timestamp: new Date()
      };

      expect(MessageValidator.isValid(validMessage)).toBe(true);
    });

    test('should return false for invalid message', () => {
      const invalidMessage = {
        id: 'invalid-uuid',
        from: 'also-invalid',
        to: 'still-invalid',
        type: 'test.message',
        payload: { data: 'test' },
        timestamp: new Date()
      };

      expect(MessageValidator.isValid(invalidMessage)).toBe(false);
    });

    test('should handle null and undefined gracefully', () => {
      expect(MessageValidator.isValid(null)).toBe(false);
      expect(MessageValidator.isValid(undefined)).toBe(false);
      expect(MessageValidator.isValid({})).toBe(false);
      expect(MessageValidator.isValid('string')).toBe(false);
    });
  });

  describe('Performance', () => {
    test('should validate messages within 1ms on average', () => {
      const validMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        from: '987fcdeb-51a2-4321-9876-123456789abc',
        to: '456789ab-cdef-1234-5678-90abcdef1234',
        type: 'test.message',
        payload: { data: 'test' },
        timestamp: new Date()
      };

      const iterations = 1000;
      const start = process.hrtime.bigint();

      for (let i = 0; i < iterations; i++) {
        MessageValidator.validate({
          ...validMessage,
          id: `123e4567-e89b-12d3-a456-42661417${i.toString().padStart(4, '0')}`
        });
      }

      const end = process.hrtime.bigint();
      const totalTime = Number(end - start) / 1000000; // Convert to ms
      const averageTime = totalTime / iterations;

      expect(averageTime).toBeLessThan(1); // < 1ms per validation
    });
  });

  describe('Integration with Phase1', () => {
    test('should work with existing MessageFactory', async () => {
      // Import existing MessageFactory
      const { MessageFactory } = await import('../../src/core/message-factory');
      
      const message = MessageFactory.createMessage(
        '987fcdeb-51a2-4321-9876-123456789abc',
        '456789ab-cdef-1234-5678-90abcdef1234',
        'test.message',
        { data: 'test' }
      );

      expect(() => MessageValidator.validate(message)).not.toThrow();
    });

    test('should maintain compatibility with Phase1 Message type', () => {
      // Import Phase1 Message type
      const phase1Message = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        from: '987fcdeb-51a2-4321-9876-123456789abc',
        to: '456789ab-cdef-1234-5678-90abcdef1234',
        type: 'test.message',
        payload: { data: 'test' },
        timestamp: new Date()
      };

      // Should validate successfully
      expect(() => MessageValidator.validate(phase1Message)).not.toThrow();
      expect(MessageValidator.isValid(phase1Message)).toBe(true);
    });
  });
});