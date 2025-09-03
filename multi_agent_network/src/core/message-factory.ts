import { v4 as uuidv4 } from 'uuid';
import type { Message } from './types/message';

/* eslint-disable @typescript-eslint/no-extraneous-class */
/**
 * Factory class for creating and working with messages
 * 
 * Provides utilities for:
 * - Creating messages with automatic ID and timestamp
 * - Validating message structure
 * - Calculating message size for transmission limits
 * 
 * This class uses static methods and does not require instantiation.
 */
export class MessageFactory {
  // Private constructor to prevent instantiation
  private constructor() {}
  
  /**
   * Creates a new message with automatic ID generation and timestamp
   * 
   * @template T The type of the message payload
   * @param from - Sender agent ID
   * @param to - Recipient agent ID
   * @param type - Message type for routing
   * @param payload - Message content (must be JSON-serializable)
   * @returns A new Message instance
   * 
   * @example
   * ```typescript
   * // Simple message
   * const message = MessageFactory.createMessage(
   *   'agent1',
   *   'agent2',
   *   'greeting',
   *   { text: 'Hello!' }
   * );
   * 
   * // Typed message
   * interface TradeRequest {
   *   tokenId: string;
   *   amount: number;
   * }
   * const tradeMsg = MessageFactory.createMessage<TradeRequest>(
   *   'trader1',
   *   'trader2',
   *   'trade_request',
   *   { tokenId: 'TOK1', amount: 100 }
   * );
   * ```
   */
  public static createMessage<T = unknown>(
    from: string,
    to: string,
    type: string,
    payload: T
  ): Message<T> {
    return {
      id: uuidv4(),
      from,
      to,
      type,
      payload,
      timestamp: new Date()
    };
  }

  /**
   * Validates if an object is a valid Message
   * 
   * Checks for presence of all required fields.
   * Does not validate field contents or payload structure.
   * 
   * @template T The type of the message payload
   * @param message - Object to validate
   * @returns true if the object has all required Message fields
   * 
   * @example
   * ```typescript
   * const obj = { id: '123', from: 'a1', to: 'a2', type: 'test', payload: {}, timestamp: new Date() };
   * if (MessageFactory.validateMessage(obj)) {
   *   // obj is now typed as Message
   *   console.log(obj.id);
   * }
   * ```
   */
  public static validateMessage<T = unknown>(message: unknown): message is Message<T> {
    if (!message || typeof message !== 'object') {
      return false;
    }
    
    const msg = message as Record<string, unknown>;
    
    return !!(
      msg['id'] &&
      typeof msg['id'] === 'string' &&
      msg['from'] &&
      typeof msg['from'] === 'string' &&
      msg['to'] &&
      typeof msg['to'] === 'string' &&
      msg['type'] &&
      typeof msg['type'] === 'string' &&
      msg['timestamp'] &&
      msg['timestamp'] instanceof Date
    );
  }

  /**
   * Calculates the size of a message payload in bytes
   * 
   * Uses JSON.stringify to serialize the payload and measures the resulting string length.
   * This represents the approximate size when transmitted as JSON.
   * 
   * @template T The type of the message payload
   * @param message - The message to measure
   * @returns Size of the serialized payload in bytes
   * 
   * @example
   * ```typescript
   * const message = MessageFactory.createMessage('a1', 'a2', 'data', { text: 'Hello' });
   * const size = MessageFactory.getMessageSize(message);
   * if (size > 1024 * 1024) { // 1MB limit
   *   throw new Error('Message too large');
   * }
   * ```
   */
  public static getMessageSize<T = unknown>(message: Message<T>): number {
    return JSON.stringify(message.payload).length;
  }
}