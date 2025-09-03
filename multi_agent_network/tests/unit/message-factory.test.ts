import { describe, it, expect, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { MessageFactory } from '@/core/message-factory';
import type { Message } from '@/core/types/message';

// Mock uuid to test automatic ID generation
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-12345')
}));

describe('MessageFactory', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createMessage', () => {
    it('should create a message with generic type support', () => {
      interface CustomPayload {
        text: string;
        value: number;
      }

      const message = MessageFactory.createMessage<CustomPayload>(
        'agent1',
        'agent2',
        'custom',
        { text: 'hello', value: 42 }
      );

      expect(message.from).toBe('agent1');
      expect(message.to).toBe('agent2');
      expect(message.type).toBe('custom');
      expect(message.payload.text).toBe('hello');
      expect(message.payload.value).toBe(42);
    });

    it('should automatically generate UUID', () => {
      const message = MessageFactory.createMessage(
        'agent1',
        'agent2',
        'test',
        { data: 'test' }
      );

      expect(message.id).toBe('test-uuid-12345');
      expect(uuidv4).toHaveBeenCalledOnce();
    });

    it('should set timestamp to current date', () => {
      const beforeCreate = new Date();
      
      const message = MessageFactory.createMessage(
        'agent1',
        'agent2',
        'test',
        { data: 'test' }
      );
      
      const afterCreate = new Date();

      expect(message.timestamp).toBeInstanceOf(Date);
      expect(message.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(message.timestamp.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should work with complex payload types', () => {
      const payload = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' }
        },
        nullValue: null,
        boolValue: true
      };

      const message = MessageFactory.createMessage(
        'agent1',
        'agent2',
        'complex',
        payload
      );

      expect(message.payload).toEqual(payload);
    });
  });

  describe('validateMessage', () => {
    it('should return true for valid message', () => {
      const validMessage: Message = {
        id: 'msg-123',
        from: 'agent1',
        to: 'agent2',
        type: 'test',
        payload: { data: 'test' },
        timestamp: new Date()
      };

      expect(MessageFactory.validateMessage(validMessage)).toBe(true);
    });

    it('should return false for message without id', () => {
      const invalidMessage = {
        from: 'agent1',
        to: 'agent2',
        type: 'test',
        payload: { data: 'test' },
        timestamp: new Date()
      } as unknown as Message;

      expect(MessageFactory.validateMessage(invalidMessage)).toBe(false);
    });

    it('should return false for message without from field', () => {
      const invalidMessage = {
        id: 'msg-123',
        to: 'agent2',
        type: 'test',
        payload: { data: 'test' },
        timestamp: new Date()
      } as unknown as Message;

      expect(MessageFactory.validateMessage(invalidMessage)).toBe(false);
    });

    it('should return false for message without to field', () => {
      const invalidMessage = {
        id: 'msg-123',
        from: 'agent1',
        type: 'test',
        payload: { data: 'test' },
        timestamp: new Date()
      } as unknown as Message;

      expect(MessageFactory.validateMessage(invalidMessage)).toBe(false);
    });

    it('should return false for message without type', () => {
      const invalidMessage = {
        id: 'msg-123',
        from: 'agent1',
        to: 'agent2',
        payload: { data: 'test' },
        timestamp: new Date()
      } as unknown as Message;

      expect(MessageFactory.validateMessage(invalidMessage)).toBe(false);
    });

    it('should return false for message without timestamp', () => {
      const invalidMessage = {
        id: 'msg-123',
        from: 'agent1',
        to: 'agent2',
        type: 'test',
        payload: { data: 'test' }
      } as unknown as Message;

      expect(MessageFactory.validateMessage(invalidMessage)).toBe(false);
    });

    it('should validate message with undefined payload', () => {
      const messageWithUndefinedPayload: Message<undefined> = {
        id: 'msg-123',
        from: 'agent1',
        to: 'agent2',
        type: 'test',
        payload: undefined,
        timestamp: new Date()
      };

      expect(MessageFactory.validateMessage(messageWithUndefinedPayload)).toBe(true);
    });
  });

  describe('getMessageSize', () => {
    it('should return byte size of payload', () => {
      const message: Message = {
        id: 'msg-123',
        from: 'agent1',
        to: 'agent2',
        type: 'test',
        payload: { text: 'hello' },
        timestamp: new Date()
      };

      // JSON.stringify({ text: 'hello' }) = '{"text":"hello"}' = 16 bytes
      const expectedSize = JSON.stringify(message.payload).length;
      expect(MessageFactory.getMessageSize(message)).toBe(expectedSize);
    });

    it('should handle empty payload', () => {
      const message: Message = {
        id: 'msg-123',
        from: 'agent1',
        to: 'agent2',
        type: 'test',
        payload: {},
        timestamp: new Date()
      };

      // JSON.stringify({}) = '{}' = 2 bytes
      expect(MessageFactory.getMessageSize(message)).toBe(2);
    });

    it('should handle complex payload', () => {
      const complexPayload = {
        array: [1, 2, 3, 4, 5],
        nested: {
          deep: {
            value: 'test'
          }
        },
        string: 'a'.repeat(100)
      };

      const message: Message = {
        id: 'msg-123',
        from: 'agent1',
        to: 'agent2',
        type: 'test',
        payload: complexPayload,
        timestamp: new Date()
      };

      const expectedSize = JSON.stringify(complexPayload).length;
      expect(MessageFactory.getMessageSize(message)).toBe(expectedSize);
    });

    it('should handle unicode characters correctly', () => {
      const message: Message = {
        id: 'msg-123',
        from: 'agent1',
        to: 'agent2',
        type: 'test',
        payload: { text: '日本語テスト' },
        timestamp: new Date()
      };

      const expectedSize = JSON.stringify(message.payload).length;
      expect(MessageFactory.getMessageSize(message)).toBe(expectedSize);
    });

    it('should handle null and undefined in payload', () => {
      const message: Message = {
        id: 'msg-123',
        from: 'agent1',
        to: 'agent2',
        type: 'test',
        payload: { nullValue: null, undefinedValue: undefined },
        timestamp: new Date()
      };

      // undefined values are omitted in JSON.stringify
      const expectedSize = JSON.stringify(message.payload).length;
      expect(MessageFactory.getMessageSize(message)).toBe(expectedSize);
    });
  });
});