// Type definitions re-export (CLAUDE.md DRY Principle)
export type {
  ValidatedMessageType,
  MessageType, // Alias for convenience
  AgentId,
  MessagePattern,
  MessageId,
  Timestamp
} from './branded-types';

export {
  createValidatedMessageType,
  createMessageType, // Alias for convenience  
  createAgentId,
  createMessagePattern,
  createMessageId,
  createTimestamp,
  isValidAgentId,
  isValidMessageType,
  isValidMessagePattern
} from './branded-types';