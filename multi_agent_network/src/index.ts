/**
 * Multi-Agent Network System
 * 
 * This package provides a secure, isolated agent system with:
 * 
 * Phase1 (Core):
 * - Complete memory isolation between agents
 * - Type-safe message passing
 * - Performance monitoring
 * - Security monitoring
 * 
 * Phase2 (Advanced Messaging):
 * - Publish-Subscribe pattern messaging
 * - Request-Response communication
 * - Pattern-based message routing
 * - Circuit breaker and health monitoring
 * - Dependency injection architecture
 * 
 * @packageDocumentation
 */

// ========================
// Phase1 Core Exports
// ========================

// Core classes
export { Agent } from './core/agent';
export { AgentManager } from './core/agent-manager';

// Error handling
export { AgentError, ErrorCode } from './core/errors';

// Message types and factory
export type { Message } from './core/types/message';
export { MessageFactory } from './core/message-factory';

// Optional: Logger factory for external use
export { createLogger } from './core/logger';

// ========================
// Phase2 Advanced Exports
// ========================

// Messaging system container and configuration
export { 
  MessagingSystemContainer,
  createMessagingSystemContainer,
  defaultMessagingConfig,
  type MessagingConfig 
} from './core/messaging-system-container';

// Type system
export type {
  ValidatedMessageType,
  MessageType,
  AgentId,
  MessagePattern,
  MessageId,
  Timestamp
} from './core/types';

export {
  createValidatedMessageType,
  createMessageType,
  createAgentId,
  createMessagePattern,
  createMessageId,
  createTimestamp,
  isValidAgentId,
  isValidMessageType,
  isValidMessagePattern
} from './core/types';

// Message validation
export { 
  MessageValidator,
  type ValidatedMessage,
  type MessageValidationError
} from './core/message-validator';

// Component interfaces for advanced usage
export type {
  IPatternMatcher,
  ISubscriptionRegistry,
  IDeliveryEngine,
  IHealthMonitor,
  ICorrelationManager,
  IMessageRouter
} from './core/interfaces';

// Messaging enums
export { MessagePriority } from './core/delivery-engine';
export { CircuitBreakerState } from './core/health-monitor';

// Individual components for advanced customization
export { CachedPatternMatcher } from './core/pattern-matcher';
export { SubscriptionRegistry } from './core/subscription-registry';
export { DeliveryEngine } from './core/delivery-engine';
export { HealthMonitor } from './core/health-monitor';
export { CorrelationManager } from './core/correlation-manager';
export { MessageRouter } from './core/message-router';