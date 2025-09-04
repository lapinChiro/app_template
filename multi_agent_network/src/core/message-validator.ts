import { z } from 'zod';

// Zod schema for message validation (CLAUDE.md Don't Reinvent the Wheel)
const MessageSchema = z.object({
  id: z.string().uuid('Invalid message ID: must be UUID format'),
  from: z.string().uuid('Invalid sender ID: must be UUID format'), 
  to: z.string().uuid('Invalid recipient ID: must be UUID format'),
  type: z.string()
    .min(1, 'Message type cannot be empty')
    .max(100, 'Message type too long (max 100 characters)')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Message type must contain only alphanumeric characters, dots, hyphens, and underscores'),
  payload: z.record(z.string(), z.unknown())
    .refine((obj) => typeof obj === 'object' && obj !== null, 'Payload must be a non-null object'),
  timestamp: z.date({
    required_error: 'Timestamp is required',
    invalid_type_error: 'Invalid timestamp: must be Date object'
  })
});

// Infer the validated message type from schema
export type ValidatedMessage = z.infer<typeof MessageSchema>;

// Custom error type for better error handling
export interface MessageValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Message validator using Zod for runtime type safety
 * Provides comprehensive validation for inter-agent messages
 */
export class MessageValidator {
  private static readonly schema = MessageSchema;

  /**
   * Validates a message object against the schema
   * @param message - The message object to validate
   * @returns ValidatedMessage if validation succeeds
   * @throws ZodError if validation fails with detailed error information
   */
  static validate(message: unknown): ValidatedMessage {
    return MessageValidator.schema.parse(message);
  }

  /**
   * Checks if a message object is valid without throwing
   * @param message - The message object to validate
   * @returns true if valid, false otherwise
   */
  static isValid(message: unknown): message is ValidatedMessage {
    return MessageValidator.schema.safeParse(message).success;
  }

  /**
   * Validates a message and returns detailed error information if invalid
   * @param message - The message object to validate
   * @returns Object with success flag and either data or detailed errors
   */
  static validateWithDetails(message: unknown): {
    success: true;
    data: ValidatedMessage;
  } | {
    success: false;
    errors: MessageValidationError[];
  } {
    const result = MessageValidator.schema.safeParse(message);
    
    if (result.success) {
      return { success: true, data: result.data };
    }

    // Convert Zod errors to more user-friendly format
    const errors: MessageValidationError[] = result.error.issues.map(issue => ({
      field: issue.path.join('.') || 'root',
      message: issue.message,
      value: issue.path.reduce((obj: any, key) => obj?.[key], message)
    }));

    return { success: false, errors };
  }

  /**
   * Gets the message size in bytes for payload validation
   * @param message - The validated message
   * @returns Size in bytes
   */
  static getMessageSize(message: ValidatedMessage): number {
    return Buffer.from(JSON.stringify(message.payload)).length;
  }

  /**
   * Validates message size against 1MB limit (Phase1 compatibility)
   * @param message - The validated message
   * @returns true if within size limit
   */
  static isWithinSizeLimit(message: ValidatedMessage): boolean {
    const sizeInBytes = MessageValidator.getMessageSize(message);
    return sizeInBytes <= 1024 * 1024; // 1MB limit
  }

  /**
   * Creates a sanitized version of the message for logging
   * @param message - The validated message  
   * @returns Message with sensitive data redacted
   */
  static sanitizeForLogging(message: ValidatedMessage): Partial<ValidatedMessage> {
    return {
      id: message.id,
      from: message.from.substring(0, 8) + '...',
      to: message.to.substring(0, 8) + '...',
      type: message.type,
      timestamp: message.timestamp
      // payload omitted for security
    };
  }
}