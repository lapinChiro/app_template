# Multi-Agent Network System

A TypeScript-based multi-agent system with complete memory isolation, secure message passing, and high performance. Each agent operates in its own isolated memory space with monitored inter-agent communication.

## Features

- 🔒 **Complete Memory Isolation**: Each agent has private memory space using JavaScript closures
- 📨 **Type-Safe Messaging**: Generic message system with TypeScript type safety
- 📊 **Performance Monitoring**: Built-in Prometheus metrics for all operations
- 🛡️ **Security Monitoring**: Automatic detection of suspicious access patterns
- ⚡ **High Performance**: Sub-millisecond message delivery and agent operations
- 🎯 **Zero Dependencies**: Minimal external dependencies for core functionality

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd multi-agent-network

# Install dependencies
npm install

# Build the project
npm run build
```

## Quick Start

```typescript
import { AgentManager, Agent } from '@agent-network';

// Get the agent manager (singleton)
const manager = AgentManager.getInstance();

// Create agents
const agent1 = manager.createAgent('agent-1');
const agent2 = manager.createAgent('agent-2');

// Use agent memory
agent1.setMemory('data', { value: 42 });
const data = agent1.getMemory('data');

// Set up message handler
agent2.onMessage((message) => {
  console.log(`Received ${message.type} from ${message.from}`);
});

// Send messages
await manager.sendMessage(
  agent1.id,
  agent2.id,
  'greeting',
  { text: 'Hello!' }
);

// Clean up
await manager.destroyAgent(agent1.id);
```

## API Reference

### AgentManager

The central manager for creating and managing agents.

```typescript
class AgentManager {
  // Get the singleton instance
  static getInstance(): AgentManager;
  
  // Create a new agent
  createAgent(id: string): Agent;
  
  // Destroy an agent
  destroyAgent(id: string): Promise<void>;
  
  // Destroy all agents
  destroyAll(): void;
  
  // Get agent by ID
  getAgent(id: string): Agent | undefined;
  
  // List all active agents
  listAgents(): Agent[];
  
  // Get current agent count
  getAgentCount(): number;
  
  // Send a message between agents
  sendMessage<T = any>(
    from: string,
    to: string,
    type: string,
    payload: T
  ): Promise<void>;
  
  // Broadcast a message to all agents except sender
  broadcastMessage<T = any>(
    from: string,
    type: string,
    payload: T
  ): Promise<void>;
}
```

### Agent

Individual agent with isolated memory and messaging capabilities.

```typescript
class Agent {
  readonly id: string;
  
  // Check if agent is active
  isActive(): boolean;
  
  // Memory operations
  setMemory(key: string, value: any): void;
  getMemory(key: string): any;
  deleteMemory(key: string): void;
  clearMemory(): void;
  
  // Message handling
  onMessage(handler: (message: Message) => void): void;
  receiveMessage(message: Message): void;
  
  // Lifecycle
  destroy(): Promise<void>;
}
```

### Message Types

```typescript
interface Message<T = any> {
  id: string;
  from: string;
  to: string;
  type: string;
  payload: T;
  timestamp: Date;
}
```

### Error Handling

```typescript
enum ErrorCode {
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  AGENT_LIMIT_EXCEEDED = 'AGENT_LIMIT_EXCEEDED',
  DUPLICATE_AGENT_ID = 'DUPLICATE_AGENT_ID',
  MESSAGE_TOO_LARGE = 'MESSAGE_TOO_LARGE',
  INVALID_MESSAGE_FORMAT = 'INVALID_MESSAGE_FORMAT',
  AGENT_DESTROYED = 'AGENT_DESTROYED',
  AGENT_NOT_ACTIVE = 'AGENT_NOT_ACTIVE'
}

class AgentError extends Error {
  code: ErrorCode;
  context?: Record<string, unknown>;
  timestamp: Date;
}
```

## Usage Examples

### Basic Agent Communication

```typescript
// Create a network of trading agents
const trader1 = manager.createAgent('trader-alice');
const trader2 = manager.createAgent('trader-bob');
const monitor = manager.createAgent('market-monitor');

// Set up message handlers
trader1.onMessage((msg) => {
  if (msg.type === 'price-update') {
    const prices = msg.payload;
    trader1.setMemory('current-prices', prices);
  }
});

// Monitor broadcasts price updates
await manager.broadcastMessage(
  monitor.id,
  'price-update',
  { BTC: 45000, ETH: 3000 }
);
```

### Memory Isolation

```typescript
// Each agent has isolated memory
agent1.setMemory('secret', 'agent1-data');
agent2.setMemory('secret', 'agent2-data');

console.log(agent1.getMemory('secret')); // 'agent1-data'
console.log(agent2.getMemory('secret')); // 'agent2-data'

// Memory is completely isolated - no cross-access possible
```

### Error Handling

```typescript
try {
  // Attempting to create too many agents
  for (let i = 0; i < 11; i++) {
    manager.createAgent(`agent-${i}`);
  }
} catch (error) {
  if (error instanceof AgentError) {
    console.log(`Error: ${error.message}`);
    console.log(`Code: ${error.code}`);
  }
}
```

## Performance Characteristics

Based on comprehensive benchmarks:

| Operation | Requirement | Actual Performance |
|-----------|-------------|-------------------|
| Agent Creation | < 50ms | ~0.29ms |
| Message Delivery | < 10ms | ~0.06ms |
| Agent Destruction | < 100ms | ~0.02ms |
| Memory (10 agents) | < 100MB | ~0.40MB |

### Scaling

- Linear memory scaling with agent count
- Consistent performance up to 10 agents (system limit)
- No memory leaks detected in lifecycle tests
- Efficient message broadcasting to multiple recipients

## Security Considerations

### Memory Isolation

- Agents cannot access each other's memory spaces
- Memory is implemented using JavaScript closures
- No shared state between agents
- SecurityMonitor tracks all memory access attempts

### Message Security

- Messages are validated before delivery
- 1MB message size limit enforced
- No direct agent-to-agent references
- All communication goes through AgentManager

### Monitoring

```typescript
// Security monitoring is automatic
const agent = manager.createAgent('monitored-agent');

// All operations are logged
agent.setMemory('data', 'value'); // Logged by SecurityMonitor
agent.getMemory('data'); // Access tracked

// Suspicious patterns are detected and logged
```

## Configuration

### Environment Variables

```bash
# Set log level (debug, info, warn, error)
LOG_LEVEL=info

# Run with garbage collection exposed (for memory tests)
node --expose-gc your-script.js
```

### Limits

- Maximum agents: 10 (configurable in source)
- Maximum message size: 1MB
- Agent ID: Must be unique string

## Running Demos

```bash
# Run basic functionality demo
npm run demo:basic

# Run messaging demo
npm run demo:messaging
```

## Development

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

## Architecture

```
┌─────────────────┐
│  AgentManager   │ ← Singleton, manages all agents
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ Agent1 │ │ Agent2 │ ← Isolated memory spaces
└────────┘ └────────┘
    ▲         ▲
    └────┬────┘
         │
┌─────────────────┐
│ SecurityMonitor │ ← Monitors all operations
└─────────────────┘
```

## License

MIT

## Contributing

1. Ensure all tests pass (`npm test`)
2. Maintain 0 TypeScript errors
3. Follow TDD approach
4. No `any` types without proper justification
5. Update documentation for API changes