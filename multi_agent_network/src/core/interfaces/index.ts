// Centralized interface exports for Phase2 messaging system
// CLAUDE.md DRY Principle: Single source of truth for all interfaces

// Pattern matching interfaces
export type { 
  IPatternMatcher,
  CompiledPattern,
  PatternMatchResult,
  CacheStats
} from '../pattern-matcher';

// Subscription management interfaces  
export type {
  ISubscriptionRegistry,
  SubscriptionInfo
} from '../subscription-registry';

// Message delivery interfaces
export type {
  IDeliveryEngine,
  DeliveryResult,
  ExtendedMessage,
  DeliveryFailure,
  DeliveryStats
} from '../delivery-engine';

// Health monitoring interfaces
export type {
  IHealthMonitor,
  ComponentHealth,
  HealthReport
} from '../health-monitor';

// Correlation management interfaces
export type {
  ICorrelationManager,
  PendingRequest,
  RequestConfig,
  CorrelationStats
} from '../correlation-manager';

// Message routing interfaces
export type {
  IMessageRouter,
  RoutingResult,
  RoutingConfig,
  RouterStats,
  RouterHealth
} from '../message-router';

// Messaging system container interfaces
export type {
  MessagingSystemContainer,
  MessagingConfig
} from '../messaging-system-container';

// Message validation interfaces
export type {
  ValidatedMessage,
  MessageValidationError
} from '../message-validator';

// Type definitions
export type {
  ValidatedMessageType,
  MessageType,
  AgentId,
  MessagePattern,
  MessageId,
  Timestamp
} from '../types';

// Enums
export { MessagePriority } from '../delivery-engine';
export { CircuitBreakerState } from '../health-monitor';