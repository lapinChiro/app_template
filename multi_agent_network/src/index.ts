/**
 * Multi-Agent Network System
 * 
 * This package provides a secure, isolated agent system with:
 * - Complete memory isolation between agents
 * - Type-safe message passing
 * - Performance monitoring
 * - Security monitoring
 * 
 * @packageDocumentation
 */

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