# 第1段階：独立したメモリ空間を持つエージェントの実装 - 開発設計書

## 1. 概要

本設計書は、エージェントネットワークシステムの第1段階として、独立したメモリ空間を持つエージェントの基本実装に関する開発設計を定義します。voltagentフレームワークの概念を参考にしつつ、要件に合わせた独自のエージェントシステムを構築します。

## 2. 設計方針

### 2.1 基本方針
- **メモリ分離**: JavaScriptのクロージャを使用した真のプライベートメモリ実現
- **メッセージング**: イベントドリブンアーキテクチャによる非同期通信
- **エラーハンドリング**: 包括的なエラーコードと詳細なロギング
- **性能保証**: 計測機能を組み込み、要件の性能目標を達成

### 2.2 voltagentとの関係
- voltagentのAgent概念を参考にするが、LLM関連機能は除外
- メッセージングとエージェント管理の基本アーキテクチャを採用
- 独自のメモリ管理とセキュリティ機能を実装

## 3. システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                         Agent System                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      AgentManager                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │   Registry   │  │   Message    │  │ Performance  │ │   │
│  │  │    (Map)     │  │   Router     │  │   Monitor    │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │   │
│  │  ┌──────────────┐  ┌──────────────┐                   │   │
│  │  │    Error     │  │   Security   │                   │   │
│  │  │   Handler    │  │   Monitor    │                   │   │
│  │  └──────────────┘  └──────────────┘                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │    Agent 1     │  │    Agent 2     │  │    Agent N     │   │
│  │ ┌────────────┐ │  │ ┌────────────┐ │  │ ┌────────────┐ │   │
│  │ │  Private   │ │  │ │  Private   │ │  │ │  Private   │ │   │
│  │ │  Memory    │ │  │ │  Memory    │ │  │ │  Memory    │ │   │
│  │ └────────────┘ │  │ └────────────┘ │  │ └────────────┘ │   │
│  │ ┌────────────┐ │  │ ┌────────────┐ │  │ ┌────────────┐ │   │
│  │ │  Message   │ │  │ │  Message   │ │  │ │  Message   │ │   │
│  │ │   Queue    │ │  │ │   Queue    │ │  │ │   Queue    │ │   │
│  │ └────────────┘ │  │ └────────────┘ │  │ └────────────┘ │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 4. コンポーネント詳細設計

### 4.1 Agent クラス

```typescript
// src/core/agent.ts
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { SecurityMonitor } from './security-monitor';
import { PerformanceMonitor } from './performance-monitor';

export interface AgentOptions {
  id?: string;
  name: string;
}

export interface Message<T = unknown> {
  id: string;
  from: string;
  to: string;
  type: string;
  payload: T;
  timestamp: Date;
}

export class Agent {
  public readonly id: string;
  public readonly name: string;
  
  // Private memory storage using closure
  private readonly getPrivateStorage: () => {
    memory: Map<string, unknown>;
    messageQueue: Message[];
  };
  
  private eventEmitter: EventEmitter;
  private destroyed: boolean = false;
  private createdAt: Date;

  constructor(options: AgentOptions) {
    this.id = options.id || uuidv4();
    this.name = options.name;
    this.eventEmitter = new EventEmitter();
    this.createdAt = new Date();
    
    // Create truly private memory using closure - fixed implementation
    const privateMemory = new Map<string, unknown>();
    const privateMessageQueue: Message[] = [];
    
    this.getPrivateStorage = () => ({
      memory: privateMemory,
      messageQueue: privateMessageQueue
    });
    
    // Register with security monitor
    SecurityMonitor.getInstance().registerAgent(this.id);
  }

  // Memory access methods with security checks
  public setMemory<T = unknown>(key: string, value: T): void {
    this.checkNotDestroyed();
    SecurityMonitor.getInstance().logMemoryAccess(this.id, 'write', key);
    
    const { memory } = this.getPrivateStorage();
    memory.set(key, value);
  }

  public getMemory<T = unknown>(key: string): T | undefined {
    this.checkNotDestroyed();
    SecurityMonitor.getInstance().logMemoryAccess(this.id, 'read', key);
    
    const { memory } = this.getPrivateStorage();
    return memory.get(key) as T | undefined;
  }

  // Message handling
  public receiveMessage(message: Message): void {
    this.checkNotDestroyed();
    const { messageQueue } = this.getPrivateStorage();
    messageQueue.push(message);
    this.eventEmitter.emit('message', message);
  }

  public getNextMessage(): Message | undefined {
    this.checkNotDestroyed();
    const { messageQueue } = this.getPrivateStorage();
    return messageQueue.shift();
  }

  public hasMessages(): boolean {
    const { messageQueue } = this.getPrivateStorage();
    return messageQueue.length > 0;
  }

  // Lifecycle methods
  public async destroy(): Promise<void> {
    const startTime = Date.now();
    
    this.destroyed = true;
    this.eventEmitter.removeAllListeners();
    
    const { memory, messageQueue } = this.getPrivateStorage();
    memory.clear();
    messageQueue.length = 0;
    
    SecurityMonitor.getInstance().unregisterAgent(this.id);
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.getInstance().recordDestruction(this.id, duration);
  }

  private checkNotDestroyed(): void {
    if (this.destroyed) {
      throw new Error(`Agent ${this.id} has been destroyed`);
    }
  }

  public isDestroyed(): boolean {
    return this.destroyed;
  }
}
```

### 4.2 AgentManager クラス

```typescript
// src/core/agent-manager.ts
import { Agent, Message } from './agent';
import { createLogger } from './logger';
import { AgentError, ErrorCode } from './errors';
import { PerformanceMonitor } from './performance-monitor';
import { MessageFactory } from './message-factory';
import { Singleton } from './base/singleton';

export class AgentManager extends Singleton<AgentManager> {
  private agents: Map<string, Agent>;
  private logger = createLogger('AgentManager');
  private performanceMonitor: PerformanceMonitor;
  
  private readonly MAX_AGENTS = 10;
  private readonly MESSAGE_SIZE_LIMIT = 1024 * 1024; // 1MB
  private readonly MESSAGE_DELIVERY_TIMEOUT = 10; // 10ms

  protected constructor() {
    super();
    this.agents = new Map();
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  public async createAgent(name: string, id?: string): Promise<Agent> {
    const startTime = Date.now();
    
    try {
      if (this.agents.size >= this.MAX_AGENTS) {
        throw new AgentError(
          ErrorCode.AGENT_LIMIT_EXCEEDED,
          `Agent limit of ${this.MAX_AGENTS} exceeded`
        );
      }

      const agent = new Agent({ id, name });
      
      if (this.agents.has(agent.id)) {
        throw new AgentError(
          ErrorCode.DUPLICATE_AGENT_ID,
          `Agent with ID ${agent.id} already exists`
        );
      }

      this.agents.set(agent.id, agent);
      
      const duration = Date.now() - startTime;
      this.performanceMonitor.recordCreation(agent.id, duration);
      this.logger.info(`Agent created: ${agent.id} in ${duration}ms`);
      
      return agent;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Failed to create agent', { error: error.message, stack: error.stack });
      } else {
        this.logger.error('Failed to create agent', { error });
      }
      throw error;
    }
  }

  public async destroyAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new AgentError(
        ErrorCode.AGENT_NOT_FOUND,
        `Agent ${agentId} not found`
      );
    }

    await agent.destroy();
    this.agents.delete(agentId);
    this.logger.info(`Agent destroyed: ${agentId}`);
  }

  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  public listAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  public async sendMessage(message: Message): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Validate message size
      const messageSize = JSON.stringify(message.payload).length;
      if (messageSize > this.MESSAGE_SIZE_LIMIT) {
        throw new AgentError(
          ErrorCode.MESSAGE_TOO_LARGE,
          `Message exceeds size limit of ${this.MESSAGE_SIZE_LIMIT} bytes`
        );
      }

      // Validate recipient exists
      const recipient = this.agents.get(message.to);
      if (!recipient) {
        throw new AgentError(
          ErrorCode.AGENT_NOT_FOUND,
          `Recipient agent ${message.to} not found`
        );
      }

      // Deliver message with performance tracking
      recipient.receiveMessage(message);
      
      const duration = Date.now() - startTime;
      this.performanceMonitor.recordMessageDelivery(
        message.from,
        message.to,
        duration
      );
      
      if (duration > this.MESSAGE_DELIVERY_TIMEOUT) {
        this.logger.warn(
          `Message delivery exceeded timeout: ${duration}ms > ${this.MESSAGE_DELIVERY_TIMEOUT}ms`
        );
      }
      
      this.logger.debug(
        `Message delivered from ${message.from} to ${message.to} in ${duration}ms`
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Failed to send message', { error: error.message, stack: error.stack });
      } else {
        this.logger.error('Failed to send message', { error });
      }
      throw error;
    }
  }
}
```

### 4.3 シングルトン基底クラス

```typescript
// src/core/base/singleton.ts
export abstract class Singleton<T extends Singleton<T>> {
  private static instances = new Map<string, unknown>();
  
  protected constructor() {}
  
  public static getInstance<U extends Singleton<U>>(
    this: new () => U,
    key: string = 'default'
  ): U {
    const className = this.name;
    const instanceKey = `${className}_${key}`;
    
    if (!Singleton.instances.has(instanceKey)) {
      Singleton.instances.set(instanceKey, new this());
    }
    
    return Singleton.instances.get(instanceKey) as U;
  }
}
```

### 4.4 セキュリティ監視

```typescript
// src/core/security-monitor.ts
import { createLogger } from './logger';
import { Singleton } from './base/singleton';

interface MemoryAccessLog {
  agentId: string;
  operation: 'read' | 'write';
  key: string;
  timestamp: Date;
  callStack?: string;
}

export class SecurityMonitor extends Singleton<SecurityMonitor> {
  private registeredAgents: Set<string>;
  private accessLogs: MemoryAccessLog[];
  private logger = createLogger('SecurityMonitor');
  
  protected constructor() {
    super();
    this.registeredAgents = new Set();
    this.accessLogs = [];
  }

  public registerAgent(agentId: string): void {
    this.registeredAgents.add(agentId);
  }

  public unregisterAgent(agentId: string): void {
    this.registeredAgents.delete(agentId);
  }

  public logMemoryAccess(
    agentId: string,
    operation: 'read' | 'write',
    key: string
  ): void {
    const accessLog: MemoryAccessLog = {
      agentId,
      operation,
      key,
      timestamp: new Date()
    };

    // Detect suspicious access patterns
    const callStack = new Error().stack;
    if (callStack && this.isSuspiciousAccess(callStack, agentId)) {
      accessLog.callStack = callStack;
      this.logger.error('Security violation: Potential unauthorized memory access attempt', {
        accessLog
      });
    }

    this.accessLogs.push(accessLog);
  }

  private isSuspiciousAccess(callStack: string, agentId: string): boolean {
    // Check if the call stack contains references to other agents
    const otherAgentIds = Array.from(this.registeredAgents).filter(
      id => id !== agentId
    );
    
    return otherAgentIds.some(id => callStack.includes(id));
  }

  public getAccessLogs(agentId?: string): MemoryAccessLog[] {
    if (agentId) {
      return this.accessLogs.filter(log => log.agentId === agentId);
    }
    return [...this.accessLogs];
  }
}
```

### 4.5 性能監視

```typescript
// src/core/performance-monitor.ts
import { createLogger } from './logger';
import { Counter, Histogram } from 'prom-client';
import { Singleton } from './base/singleton';

interface PerformanceMetric {
  operation: string;
  agentId?: string;
  duration: number;
  timestamp: Date;
}

export class PerformanceMonitor extends Singleton<PerformanceMonitor> {
  private logger = createLogger('PerformanceMonitor');
  private creationHistogram: Histogram<string>;
  private destructionHistogram: Histogram<string>;
  private messageDeliveryHistogram: Histogram<string>;
  
  // Performance thresholds (ms)
  private readonly AGENT_CREATION_THRESHOLD = 50;
  private readonly AGENT_DESTRUCTION_THRESHOLD = 100;
  private readonly MESSAGE_DELIVERY_THRESHOLD = 10;

  protected constructor() {
    super();
    
    // Initialize Prometheus metrics
    this.creationHistogram = new Histogram({
      name: 'agent_creation_duration_ms',
      help: 'Agent creation duration in milliseconds',
      labelNames: ['agent_id'],
      buckets: [10, 25, 50, 100, 250, 500, 1000]
    });
    
    this.destructionHistogram = new Histogram({
      name: 'agent_destruction_duration_ms',
      help: 'Agent destruction duration in milliseconds',
      labelNames: ['agent_id'],
      buckets: [25, 50, 100, 250, 500, 1000, 2000]
    });
    
    this.messageDeliveryHistogram = new Histogram({
      name: 'message_delivery_duration_ms',
      help: 'Message delivery duration in milliseconds',
      labelNames: ['from_agent', 'to_agent'],
      buckets: [1, 5, 10, 25, 50, 100]
    });
  }

  public recordCreation(agentId: string, duration: number): void {
    this.creationHistogram.labels({ agent_id: agentId }).observe(duration);
    
    if (duration > this.AGENT_CREATION_THRESHOLD) {
      this.logger.warn('Agent creation exceeded threshold', {
        agentId,
        duration,
        threshold: this.AGENT_CREATION_THRESHOLD
      });
    }
  }

  public recordDestruction(agentId: string, duration: number): void {
    this.destructionHistogram.labels({ agent_id: agentId }).observe(duration);
    
    if (duration > this.AGENT_DESTRUCTION_THRESHOLD) {
      this.logger.warn('Agent destruction exceeded threshold', {
        agentId,
        duration,
        threshold: this.AGENT_DESTRUCTION_THRESHOLD
      });
    }
  }

  public recordMessageDelivery(
    fromAgent: string,
    toAgent: string,
    duration: number
  ): void {
    this.messageDeliveryHistogram
      .labels({ from_agent: fromAgent, to_agent: toAgent })
      .observe(duration);
    
    if (duration > this.MESSAGE_DELIVERY_THRESHOLD) {
      this.logger.warn('Message delivery exceeded threshold', {
        fromAgent,
        toAgent,
        duration,
        threshold: this.MESSAGE_DELIVERY_THRESHOLD
      });
    }
  }

  public getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }
}
```

### 4.6 エラー処理

```typescript
// src/core/errors.ts
export enum ErrorCode {
  DUPLICATE_AGENT_ID = 'DUPLICATE_AGENT_ID',
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  AGENT_LIMIT_EXCEEDED = 'AGENT_LIMIT_EXCEEDED',
  MESSAGE_TOO_LARGE = 'MESSAGE_TOO_LARGE',
  MEMORY_ACCESS_VIOLATION = 'MEMORY_ACCESS_VIOLATION',
  PERFORMANCE_THRESHOLD_EXCEEDED = 'PERFORMANCE_THRESHOLD_EXCEEDED',
  AGENT_DESTROYED = 'AGENT_DESTROYED'
}

export class AgentError extends Error {
  public readonly timestamp: Date;
  
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgentError';
    this.timestamp = new Date();
  }

  public toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      context: this.context
    };
  }
}
```

### 4.7 ロギング

```typescript
// src/core/logger.ts
import winston from 'winston';

export function createLogger(service: string): winston.Logger {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.metadata({
        fillExcept: ['message', 'level', 'timestamp', 'service']
      })
    ),
    defaultMeta: { service },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      new winston.transports.File({
        filename: 'error.log',
        level: 'error'
      }),
      new winston.transports.File({
        filename: 'combined.log'
      })
    ]
  });
}
```

### 4.8 メッセージファクトリ

```typescript
// src/core/message-factory.ts
import { v4 as uuidv4 } from 'uuid';
import { Message } from './agent';

export class MessageFactory {
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

  public static validateMessage<T = unknown>(message: Message<T>): message is Message<T> {
    return !!(
      message.id &&
      message.from &&
      message.to &&
      message.type &&
      message.timestamp
    );
  }

  public static getMessageSize<T = unknown>(message: Message<T>): number {
    return JSON.stringify(message.payload).length;
  }
}
```

## 5. プロジェクト構造

```
phase1/
├── src/
│   ├── core/
│   │   ├── base/
│   │   │   └── singleton.ts
│   │   ├── agent.ts
│   │   ├── agent-manager.ts
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   ├── message-factory.ts
│   │   ├── performance-monitor.ts
│   │   └── security-monitor.ts
│   ├── demo/
│   │   ├── basic-demo.ts
│   │   └── messaging-demo.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   │   ├── agent.test.ts
│   │   ├── agent-manager.test.ts
│   │   ├── message-factory.test.ts
│   │   ├── performance-monitor.test.ts
│   │   └── security-monitor.test.ts
│   ├── integration/
│   │   ├── messaging.test.ts
│   │   ├── memory-isolation.test.ts
│   │   └── error-handling.test.ts
│   └── performance/
│       ├── benchmark.test.ts
│       ├── memory-usage.test.ts
│       └── message-latency.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## 6. 技術スタック

- **言語**: TypeScript 5.x
- **ランタイム**: Node.js 20.x
- **パッケージ管理**: npm
- **テストフレームワーク**: Vitest
- **リンター**: ESLint
- **フォーマッター**: Prettier
- **依存パッケージ**:
  - uuid: UUID生成
  - events: EventEmitter（Node.js標準）
  - winston: プロダクショングレードのロギング
  - prom-client: Prometheusメトリクス収集

## 7. 実装計画（TDD アプローチ）

### フェーズ1: 基本実装（4-6時間）

#### TDDサイクル1: Agent クラス
1. **RED**: Agent作成・メモリアクセスのテストを書く
2. **GREEN**: 最小限のAgent実装
3. **BLUE**: リファクタリングと型安全性の向上

#### TDDサイクル2: AgentManager
1. **RED**: AgentManager機能のテストを書く
2. **GREEN**: AgentManager実装
3. **BLUE**: DRY原則の適用（Singletonパターン）

#### TDDサイクル3: エラーハンドリング
1. **RED**: エラーケースのテストを書く
2. **GREEN**: エラー処理実装
3. **BLUE**: 一貫性のあるエラーハンドリング

### フェーズ2: セキュリティと性能（3-4時間）

#### TDDサイクル4: SecurityMonitor
1. **RED**: セキュリティ違反検出のテスト
2. **GREEN**: SecurityMonitor実装
3. **BLUE**: 単一責任原則の適用

#### TDDサイクル5: PerformanceMonitor
1. **RED**: 性能計測のテスト
2. **GREEN**: Prometheusメトリクス実装
3. **BLUE**: 外部ライブラリの適切な活用

### フェーズ3: 統合とデモ（4-5時間）

#### TDDサイクル6: 統合テスト
1. **RED**: エンドツーエンドシナリオのテスト
2. **GREEN**: 統合の問題を修正
3. **BLUE**: インターフェースの最適化

#### 性能検証
1. ベンチマークテストの実装
2. 性能目標の達成確認
3. デモアプリケーションの作成

### フェーズ4: 最適化と文書化（2-3時間）
1. 性能最適化
2. APIドキュメント作成
3. 使用例の追加

## 8. 性能目標と測定

### 測定項目
- エージェント作成時間: 50ms以内
- エージェント破棄時間: 100ms以内
- メッセージ配信時間: 10ms以内
- 10エージェントでのメモリ使用量: 100MB以内

### 測定方法
- PerformanceMonitor による自動計測
- ベンチマークテストによる検証
- 継続的な性能監視とアラート

## 9. セキュリティ考慮事項

### メモリ分離
- クロージャによる完全なカプセル化
- 外部からのアクセス不可能性の保証

### アクセス監視
- 全メモリアクセスのログ記録
- 不正アクセスパターンの検出
- セキュリティ違反時の即座のアラート

### メッセージ検証
- サイズ制限の厳格な適用
- メッセージフォーマットの検証
- 送信者/受信者の存在確認

## 10. 今後の拡張性

### 第2段階以降の準備
- メッセージバスの抽象化（将来の非同期化に対応）
- プラグイン機構の検討
- 分散システムへの移行パス

### APIの安定性
- 公開インターフェースの最小化
- 後方互換性の維持
- バージョニング戦略

## 11. 開発上の注意点

### TypeScript設定
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### コーディング規約
- ESLintルールの厳格な適用（no-any ルール必須）
- 型ガードの使用（type assertionの禁止）
- 一貫したエラーハンドリング
- 包括的なJSDocコメント
- SOLID原則の遵守

### テスト方針
- カバレッジ目標: 90%以上
- E2Eテストの重視
- 性能リグレッションテスト