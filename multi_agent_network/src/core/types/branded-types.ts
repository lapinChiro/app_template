import { v4 as uuidv4 } from 'uuid';

// Branded types for compile-time safety (CLAUDE.md Type-Driven Development)
export type ValidatedMessageType = string & { readonly __messageTypeBrand: unique symbol };
export type AgentId = string & { readonly __agentIdBrand: unique symbol };
export type MessagePattern = string & { readonly __patternBrand: unique symbol };
export type MessageId = string & { readonly __messageIdBrand: unique symbol };
export type Timestamp = Date & { readonly __timestampBrand: unique symbol };

// Constants for validation
const MESSAGE_TYPE_REGEX = /^[a-zA-Z0-9._-]+$/;
const MAX_PATTERN_DEPTH = 5;

/**
 * Creates a validated message type with format validation
 * @param type - The message type string to validate
 * @returns ValidatedMessageType if valid
 * @throws Error if format is invalid
 */
export function createValidatedMessageType(type: string): ValidatedMessageType {
  if (!type || type.trim().length === 0) {
    throw new Error('Message type cannot be empty');
  }
  
  if (!MESSAGE_TYPE_REGEX.test(type)) {
    throw new Error(`Invalid message type format: ${type}. Must contain only alphanumeric characters, dots, hyphens, and underscores`);
  }
  
  if (type.length > 100) {
    throw new Error(`Message type too long: ${type.length} characters. Maximum 100 allowed`);
  }
  
  return type as ValidatedMessageType;
}

/**
 * Creates an AgentId from UUID string or generates new one
 * @param uuid - Optional existing UUID string
 * @returns AgentId with UUID format
 * @throws Error if provided UUID is invalid
 */
export function createAgentId(uuid?: string): AgentId {
  const id = uuid ?? uuidv4();
  
  // Validate UUID format (permissive for testing, strict for structure)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error(`Invalid UUID format: ${id}`);
  }
  
  return id as AgentId;
}

/**
 * Creates a validated message pattern with depth validation
 * @param pattern - The pattern string to validate
 * @returns MessagePattern if valid
 * @throws Error if format or depth is invalid
 */
export function createMessagePattern(pattern: string): MessagePattern {
  if (!pattern || pattern.trim().length === 0) {
    throw new Error('Message pattern cannot be empty');
  }
  
  // Check depth (number of dots + 1)
  const depth = pattern.split('.').length;
  if (depth > MAX_PATTERN_DEPTH) {
    throw new Error(`Pattern depth ${depth} exceeds maximum of ${MAX_PATTERN_DEPTH} levels`);
  }
  
  // Validate pattern format (allow wildcards)
  const patternRegex = /^[a-zA-Z0-9._*-]+$/;
  if (!patternRegex.test(pattern)) {
    throw new Error(`Invalid pattern format: ${pattern}`);
  }
  
  return pattern as MessagePattern;
}

/**
 * Creates a MessageId from UUID string or generates new one
 * @param uuid - Optional existing UUID string
 * @returns MessageId with UUID format
 * @throws Error if provided UUID is invalid
 */
export function createMessageId(uuid?: string): MessageId {
  const id = uuid ?? uuidv4();
  
  // Validate UUID format (same as AgentId)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error(`Invalid UUID format: ${id}`);
  }
  
  return id as MessageId;
}

/**
 * Creates a branded timestamp from Date object or current time
 * @param date - Optional existing Date object
 * @returns Timestamp branded type
 */
export function createTimestamp(date?: Date): Timestamp {
  const timestamp = date ?? new Date();
  return timestamp as Timestamp;
}

// Type guards for runtime validation
/**
 * Type guard to check if a string is a valid AgentId format
 * @param value - Value to check
 * @returns true if valid AgentId format
 */
export function isValidAgentId(value: string): value is AgentId {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Type guard to check if a string is a valid message type format
 * @param value - Value to check
 * @returns true if valid message type format
 */
export function isValidMessageType(value: string): value is ValidatedMessageType {
  return value.length > 0 && 
         value.length <= 100 && 
         MESSAGE_TYPE_REGEX.test(value);
}

/**
 * Type guard to check if a string is a valid message pattern format
 * @param value - Value to check
 * @returns true if valid message pattern format
 */
export function isValidMessagePattern(value: string): value is MessagePattern {
  if (!value || value.length === 0) {
    return false;
  }
  
  const depth = value.split('.').length;
  if (depth > MAX_PATTERN_DEPTH) {
    return false;
  }
  
  const patternRegex = /^[a-zA-Z0-9._*-]+$/;
  return patternRegex.test(value);
}

// Re-export for convenience
export type { ValidatedMessageType as MessageType };
export { createValidatedMessageType as createMessageType };