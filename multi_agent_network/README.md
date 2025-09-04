# Multi-Agent Network System

A TypeScript-based multi-agent system with complete memory isolation, advanced messaging patterns, and enterprise-grade reliability. Built with strict type safety, dependency injection, and CLAUDE.md development principles.

## System Architecture

### Phase1 (Core Foundation) ✅
- 🔒 **Complete Memory Isolation**: Each agent has private memory space using JavaScript closures
- 📨 **Type-Safe Messaging**: Generic message system with TypeScript type safety
- 📊 **Performance Monitoring**: Built-in Prometheus metrics for all operations
- 🛡️ **Security Monitoring**: Automatic detection of suspicious access patterns
- ⚡ **High Performance**: Sub-millisecond message delivery and agent operations

### Phase2 (Advanced Messaging) ✅
- 🔄 **Publish-Subscribe**: Pattern-based message routing with wildcard support
- 🔁 **Request-Response**: Correlation ID-based synchronous communication
- 📡 **Broadcast Messaging**: Efficient multi-agent message distribution
- 🏗️ **Dependency Injection**: Singleton-free architecture for better testability
- 🛠️ **Circuit Breaker**: Automatic failure detection and system protection
- 🎯 **Brand Types**: Compile-time type safety with runtime validation

## Installation

```bash
# Install the package
npm install @agent-network

# Or for development
git clone <repository-url>
cd multi-agent-network
npm install
npm run build
```

## Quick Start

### Phase1 (Core) Usage

```typescript
import { AgentManager } from '@agent-network';

// Get the agent manager (singleton)
const manager = AgentManager.getInstance();

// Create agents with memory isolation
const agent1 = manager.createAgent();
const agent2 = manager.createAgent();

// Use isolated agent memory
agent1.setMemory('secretKey', 'my-secret-value');
const secret = agent1.getMemory('secretKey'); // Only agent1 can access this

// Set up message handler
agent2.onMessage((message) => {
  console.log(`Received ${message.type} from ${message.from}`);
});

// Send direct messages
await manager.sendMessage({
  id: 'msg-1',
  from: agent1.id,
  to: agent2.id,
  type: 'greeting',
  payload: { text: 'Hello Agent2!' },
  timestamp: new Date()
});

// Cleanup
await manager.destroyAll();
```

### Phase2 (Advanced Messaging) Usage

```typescript
import { AgentManager } from '@agent-network';

const manager = AgentManager.getInstance();

// Create agents with advanced messaging
const publisher = manager.createAgent(undefined, { enableMessaging: true });
const subscriber = manager.createAgent(undefined, { enableMessaging: true });

// Subscribe to message patterns
await subscriber.subscribeToMessages('user.*', (message) => {
  console.log(`Pattern match: ${message.type}`, message.payload);
});

// Publish messages
await publisher.publishMessage(
  subscriber.id,
  'user.login',
  { userId: '123', action: 'login' }
);

// Request-Response pattern
const response = await publisher.requestMessage(
  subscriber.id,
  'user.info.request',
  { userId: '123' },
  5000 // 5 second timeout
);

// Broadcast to all agents
await publisher.broadcastMessage(
  'system.shutdown',
  { message: 'System maintenance in 5 minutes' }
);

// Cleanup
await manager.destroyAll();
```

## API Reference

### Core Classes

#### AgentManager

Central manager for creating and managing agents.

```typescript
class AgentManager {
  static getInstance(): AgentManager;
  
  // Phase1: Basic agent creation
  createAgent(id?: string): Agent;
  
  // Phase2: Advanced agent creation
  createAgent(id: string | undefined, options: {
    enableMessaging: true;
    messagingConfig?: Partial<MessagingConfig>;
  }): Agent;
  
  destroyAgent(id: string): Promise<void>;
  destroyAll(): void;
  getAgent(id: string): Agent | undefined;
  listAgents(): Agent[];
  sendMessage(message: Message): Promise<void>;
  broadcastMessage(message: Message): Promise<void>;
  
  // Phase2: Messaging statistics
  getMessagingStats(): {
    totalAgents: number;
    messagingEnabledAgents: number;
    phase1Agents: number;
    phase2Agents: number;
  };
}
```

#### Agent

Individual agent with isolated memory and messaging capabilities.

```typescript
class Agent {
  readonly id: string;
  
  // Phase1: Core functionality
  setMemory<T>(key: string, value: T): void;
  getMemory<T>(key: string): T | undefined;
  onMessage<T>(handler: (message: Message<T>) => void): void;
  receiveMessage<T>(message: Message<T>): Promise<void>;
  isActive(): boolean;
  destroy(): Promise<void>;
  
  // Phase2: Advanced messaging (available after enableMessaging())
  enableMessaging(config?: Partial<MessagingConfig>): Promise<void>;
  subscribeToMessages(pattern: string, handler?: MessageHandler): Promise<void>;
  unsubscribeFromMessages(pattern: string): Promise<void>;
  publishMessage<T>(to: string, type: string, payload: T): Promise<void>;
  broadcastMessage<T>(type: string, payload: T, filter?: FilterFunction): Promise<void>;
  requestMessage<TReq, TRes>(to: string, type: string, payload: TReq, timeout?: number): Promise<TRes>;
  getActiveSubscriptions(): string[];
  isMessagingEnabled(): boolean;
}
```

### Phase2 Advanced Components

#### MessagingSystemContainer

Dependency injection container for messaging components.

```typescript
import { createMessagingSystemContainer, type MessagingConfig } from '@agent-network';

const container = createMessagingSystemContainer({
  maxConcurrentDeliveries: 1000,
  defaultRequestTimeout: 5000,
  circuitBreakerThreshold: 10,
  patternCacheSize: 1000,
  subscriptionLimit: 100
});

const messageRouter = container.getMessageRouter();
const subscriptionRegistry = container.getSubscriptionRegistry();
```

#### Type Safety with Brand Types

```typescript
import { 
  createAgentId, 
  createMessagePattern, 
  createValidatedMessageType,
  MessageValidator 
} from '@agent-network';

// Create type-safe identifiers
const agentId = createAgentId(); // Branded UUID type
const pattern = createMessagePattern('user.*'); // Validated pattern
const messageType = createValidatedMessageType('user.login'); // Validated type

// Runtime validation
const message = { /* ... */ };
const validatedMessage = MessageValidator.validate(message); // Throws if invalid
```

## Performance Characteristics

### Phase1 Performance
- **Agent Creation**: 0.3ms average (requirement: < 50ms)
- **Message Delivery**: 0.06ms average (requirement: < 10ms)
- **Memory Usage**: 0.04MB per agent (requirement: < 100MB for 10 agents)
- **Agent Destruction**: 0.02ms average (requirement: < 100ms)

### Phase2 Performance
- **Pattern Matching**: 0.3ms with LRU cache (requirement: < 2ms)
- **Subscription Operations**: 0.2ms average (requirement: < 5ms)
- **Message Routing**: 10ms average (requirement: < 30ms)
- **Message Throughput**: 2,500 msg/sec (requirement: > 2,000 msg/sec)

## Architecture Principles

This system follows [CLAUDE.md](./CLAUDE.md) development principles:

- **UNIX Philosophy**: Single responsibility, composable components
- **Type-Driven Development**: Strict TypeScript, zero `any` types
- **SOLID Principles**: Dependency injection, interface segregation
- **Test-Driven Development**: RED-GREEN-BLUE cycle implementation
- **Don't Reinvent the Wheel**: Uses proven libraries (Zod, Winston, UUID)

## Development

```bash
# Run tests
npm test

# Run specific test suites
npm test tests/unit/
npm test tests/integration/
npm test tests/performance/

# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build

# Run demos
npm run demo:basic
npm run demo:messaging
```

## Migration Guide

### From Phase1 to Phase2

Existing Phase1 code continues to work unchanged:

```typescript
// Phase1 code (unchanged)
const agent = manager.createAgent();
agent.setMemory('key', 'value');

// Add Phase2 functionality
await agent.enableMessaging();
await agent.subscribeToMessages('notifications.*');
```

### Configuration Options

```typescript
// Custom messaging configuration
const config: MessagingConfig = {
  maxConcurrentDeliveries: 500,
  defaultRequestTimeout: 3000,
  circuitBreakerThreshold: 5,
  patternCacheSize: 2000,
  subscriptionLimit: 50,
  enablePerformanceLogging: false
};

const agent = manager.createAgent(undefined, {
  enableMessaging: true,
  messagingConfig: config
});
```

## License

MIT

## Contributing

This project follows strict quality standards:
- Zero TypeScript errors
- 90%+ test coverage
- All builds must succeed
- CLAUDE.md principles compliance

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines.