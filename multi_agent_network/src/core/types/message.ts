/**
 * Generic message interface for agent communication
 * 
 * Messages are the primary communication mechanism between agents.
 * They carry typed payloads and include metadata for routing and tracking.
 * 
 * @template T The type of the message payload
 * 
 * @example
 * ```typescript
 * // Simple text message
 * type TextMessage = Message<{ text: string }>;
 * 
 * // Complex data message
 * interface TradeData {
 *   tokenId: string;
 *   amount: number;
 *   price: number;
 * }
 * type TradeMessage = Message<TradeData>;
 * ```
 */
export interface Message<T = unknown> {
  /** 
   * Unique identifier for the message (UUID v4)
   * Used for tracking and preventing duplicate processing
   */
  id: string;
  
  /** 
   * ID of the sender agent
   * Must be a valid agent ID registered in the system
   */
  from: string;
  
  /** 
   * ID of the recipient agent
   * Must be a valid agent ID registered in the system
   */
  to: string;
  
  /** 
   * Type of the message for routing and handling
   * Examples: 'text', 'trade', 'status', 'error'
   */
  type: string;
  
  /** 
   * The actual message content
   * Can be any JSON-serializable data
   */
  payload: T;
  
  /** 
   * Timestamp when the message was created
   * Used for ordering and timeout calculations
   */
  timestamp: Date;
}