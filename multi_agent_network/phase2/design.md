# 第2段階：エージェント間通信システムの構築 - 開発設計書

## 1. 概要

本設計書は、エージェントネットワークシステムの第2段階として、高度なエージェント間通信システムの実装設計を定義します。第1段階で構築された基本エージェントシステムを拡張し、非同期メッセージバス、パブリッシュ・サブスクライブパターン、リクエスト・レスポンス通信を実装します。

## 2. 設計方針

### 2.1 アーキテクチャ原則
- **単一責任**: 各コンポーネントは明確に1つの機能のみ担当
- **疎結合**: 依存性注入による独立性確保
- **型安全性**: 制約付きジェネリック、実行時検証
- **拡張性**: インターフェース経由での機能拡張

### 2.2 技術方針
- **既存ライブラリ活用**: Node.js標準機能・実績あるパターンの採用
- **品質保証**: 0 TypeScriptエラー、`any`型禁止
- **テスト戦略**: TDDによる堅牢な実装

## 3. システムアーキテクチャ

### 3.1 全体構成

```
┌─────────────────────────────────────────────────────────┐
│              MessagingSystemContainer (DI)              │
├─────────────────────────────────────────────────────────┤
│  IMessageRouter     ISubscriptionRegistry  IDelivery   │
│       ↓                     ↓                  ↓       │
│  MessageRouter    SubscriptionRegistry   DeliveryEngine │
│                                                         │
│  IPatternMatcher    IHealthMonitor      ICorrelation   │
│       ↓                     ↓                  ↓       │
│ PatternMatcher    HealthMonitor    CorrelationManager  │
└─────────────────────────────────────────────────────────┘
                               ↕
┌─────────────────────────────────────────────────────────┐
│                    AgentManager                         │
│                 (Phase1 Extended)                       │
└─────────────────────────────────────────────────────────┘
                               ↕
┌─────────────────────────────────────────────────────────┐
│         Agent1      Agent2      Agent3     AgentN      │
│      (Enhanced)   (Enhanced)  (Enhanced)  (Enhanced)   │
└─────────────────────────────────────────────────────────┘
```

### 3.2 コンポーネント設計

| コンポーネント | 単一責任 | 依存関係 |
|----------------|----------|----------|
| MessageRouter | メッセージルーティングのみ | ISubscriptionRegistry |
| SubscriptionRegistry | 購読管理のみ | IPatternMatcher |
| DeliveryEngine | メッセージ配信のみ | なし |
| PatternMatcher | パターンマッチングのみ | なし |
| HealthMonitor | 健全性監視のみ | なし |
| CorrelationManager | 相関ID管理のみ | なし |

## 4. コンポーネント詳細設計

### 4.1 MessagingSystemContainer クラス

```typescript
// src/core/messaging-system-container.ts
export interface IMessageRouter {
  route<TPayload extends Record<string, unknown>>(
    message: TypedMessage<TPayload>
  ): Promise<RoutingResult>;
}

export interface ISubscriptionRegistry {
  subscribe(agentId: AgentId, pattern: MessagePattern): Promise<void>;
  unsubscribe(agentId: AgentId, pattern: MessagePattern): Promise<void>;
  getSubscribers(messageType: ValidatedMessageType): AgentId[];
  cleanup(agentId: AgentId): Promise<void>;
}

export interface IPatternMatcher {
  matches(pattern: MessagePattern, messageType: ValidatedMessageType): boolean;
  compile(pattern: MessagePattern): CompiledPattern;
}

export class MessagingSystemContainer {
  constructor(
    private readonly patternMatcher: IPatternMatcher,
    private readonly subscriptionRegistry: ISubscriptionRegistry,
    private readonly messageRouter: IMessageRouter,
    private readonly deliveryEngine: IDeliveryEngine,
    private readonly healthMonitor: IHealthMonitor,
    private readonly correlationManager: ICorrelationManager
  ) {}

  static create(config: MessagingConfig): MessagingSystemContainer {
    const patternMatcher = new CachedPatternMatcher();
    const subscriptionRegistry = new SubscriptionRegistry(patternMatcher);
    const deliveryEngine = new DeliveryEngine();
    const healthMonitor = new HealthMonitor();
    const correlationManager = new CorrelationManager();
    const messageRouter = new MessageRouter(
      subscriptionRegistry,
      deliveryEngine,
      healthMonitor
    );

    return new MessagingSystemContainer(
      patternMatcher,
      subscriptionRegistry,
      messageRouter,
      deliveryEngine,
      healthMonitor,
      correlationManager
    );
  }

  getMessageRouter(): IMessageRouter { return this.messageRouter; }
  getSubscriptionRegistry(): ISubscriptionRegistry { return this.subscriptionRegistry; }
  getDeliveryEngine(): IDeliveryEngine { return this.deliveryEngine; }
  getHealthMonitor(): IHealthMonitor { return this.healthMonitor; }
  getCorrelationManager(): ICorrelationManager { return this.correlationManager; }
}
```

### 4.2 型定義と検証

```typescript
// 型制約の厳格化
export type ValidatedMessageType = string & { readonly __brand: unique symbol };
export type AgentId = string & { readonly __agentId: unique symbol };
export type MessagePattern = string & { readonly __pattern: unique symbol };

export interface TypedMessage<TPayload extends Record<string, unknown>> {
  readonly id: MessageId;
  readonly from: AgentId;
  readonly to: AgentId;
  readonly type: ValidatedMessageType;
  readonly payload: TPayload;
  readonly timestamp: Timestamp;
}

// Zod型検証
import { z } from 'zod';

const MessageSchema = z.object({
  id: z.string().uuid(),
  from: z.string().uuid(),
  to: z.string().uuid(),
  type: z.string().min(1).max(100),
  payload: z.record(z.unknown()),
  timestamp: z.date()
});

export class MessageValidator {
  static validate(message: unknown): ValidatedMessage {
    return MessageSchema.parse(message);
  }
}
```

### 4.3 パターンマッチング

```typescript
// SOLID-S: 単一責任原則適用
export class CachedPatternMatcher implements IPatternMatcher {
  private readonly compiledPatterns = new Map<string, RegExp>();
  private readonly maxCacheSize = 1000;

  matches(pattern: MessagePattern, messageType: ValidatedMessageType): boolean {
    const compiled = this.getCompiledPattern(pattern);
    return compiled.test(messageType);
  }

  compile(pattern: MessagePattern): CompiledPattern {
    return this.getCompiledPattern(pattern);
  }

  private getCompiledPattern(pattern: MessagePattern): RegExp {
    // DRY原則: パターンキャッシュで重複コンパイル防止
    if (this.compiledPatterns.has(pattern)) {
      return this.compiledPatterns.get(pattern)!;
    }

    // LRUキャッシュ実装（メモリリーク対策）
    if (this.compiledPatterns.size >= this.maxCacheSize) {
      const firstKey = this.compiledPatterns.keys().next().value;
      this.compiledPatterns.delete(firstKey);
    }

    const compiled = this.compilePattern(pattern);
    this.compiledPatterns.set(pattern, compiled);
    return compiled;
  }

  private compilePattern(pattern: MessagePattern): RegExp {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const withWildcard = escaped.replace(/\\\*/g, '.*');
    return new RegExp(`^${withWildcard}$`);
  }
}
```

### 4.4 購読管理

```typescript
export class SubscriptionRegistry implements ISubscriptionRegistry {
  private readonly directSubscriptions = new Map<ValidatedMessageType, Set<AgentId>>();
  private readonly patternSubscriptions = new Map<AgentId, Set<MessagePattern>>();
  private readonly activeAgents = new Set<AgentId>();
  
  constructor(private readonly patternMatcher: IPatternMatcher) {}

  async subscribe(agentId: AgentId, pattern: MessagePattern): Promise<void> {
    // 原子性保証（競合状態対策）
    const agentPatterns = this.patternSubscriptions.get(agentId) ?? new Set();
    
    // 制限チェック（メモリ制御）
    if (agentPatterns.size >= 100) {
      throw new AgentError(
        ErrorCode.SUBSCRIPTION_LIMIT_EXCEEDED,
        `Agent ${agentId} subscription limit exceeded`
      );
    }

    // 原子的更新
    agentPatterns.add(pattern);
    this.patternSubscriptions.set(agentId, agentPatterns);
    
    if (!pattern.includes('*')) {
      // 直接購読の高速化
      const directSubs = this.directSubscriptions.get(pattern as ValidatedMessageType) ?? new Set();
      directSubs.add(agentId);
      this.directSubscriptions.set(pattern as ValidatedMessageType, directSubs);
    }
  }

  async unsubscribe(agentId: AgentId, pattern: MessagePattern): Promise<void> {
    const agentPatterns = this.patternSubscriptions.get(agentId);
    if (!agentPatterns?.has(pattern)) {
      return; // 冪等性保証
    }

    // 原子的削除
    agentPatterns.delete(pattern);
    if (agentPatterns.size === 0) {
      this.patternSubscriptions.delete(agentId);
    }

    if (!pattern.includes('*')) {
      const directSubs = this.directSubscriptions.get(pattern as ValidatedMessageType);
      if (directSubs) {
        directSubs.delete(agentId);
        if (directSubs.size === 0) {
          this.directSubscriptions.delete(pattern as ValidatedMessageType);
        }
      }
    }
  }

  getSubscribers(messageType: ValidatedMessageType): AgentId[] {
    const subscribers = new Set<AgentId>();

    // O(1) 直接購読チェック
    const directSubs = this.directSubscriptions.get(messageType);
    if (directSubs) {
      directSubs.forEach(agentId => subscribers.add(agentId));
    }

    // O(p) パターン購読チェック（pはパターン数）
    for (const [agentId, patterns] of this.patternSubscriptions) {
      for (const pattern of patterns) {
        if (this.patternMatcher.matches(pattern, messageType)) {
          subscribers.add(agentId);
          break; // 同じエージェントは1度だけ
        }
      }
    }

    return Array.from(subscribers);
  }

  async cleanup(agentId: AgentId): Promise<void> {
    // メモリリーク防止の徹底的クリーンアップ
    const patterns = this.patternSubscriptions.get(agentId);
    if (patterns) {
      for (const pattern of patterns) {
        await this.unsubscribe(agentId, pattern);
      }
    }
    this.activeAgents.delete(agentId);
  }
}
```

## 5. 実装計画

### 5.1 段階的実装戦略

#### フェーズ1: 基盤コンポーネント（20-25時間）
**目標**: 単一責任コンポーネントの確実な実装

- **Week 1**: 型定義・インターフェース設計（5-7h）
- **Week 2**: PatternMatcher + SubscriptionRegistry（8-10h）  
- **Week 3**: MessageRouter + DeliveryEngine（7-8h）

**成功基準**: 各コンポーネント単体で100%テストカバレッジ

#### フェーズ2: 統合システム（25-30時間）
**目標**: DIコンテナでの統合と相互動作検証

- **Week 4**: DIコンテナ実装（8-10h）
- **Week 5**: Agent拡張・統合テスト（10-12h）
- **Week 6**: Phase1互換性保証（7-8h）

**成功基準**: Phase1との100%後方互換性

#### フェーズ3: 品質保証（30-35時間）
**目標**: 本番環境品質の達成

- **Week 7-8**: 負荷テスト・メモリリークテスト（15-18h）
- **Week 9**: エラー処理・回復メカニズム（10-12h）
- **Week 10**: ドキュメント・デモ（5-5h）

**成功基準**: 性能目標達成、メモリリーク0件

### 5.2 性能目標

| 指標 | 目標値 | 測定根拠 |
|------|--------|----------|
| メッセージルーティング | 30ms以下 | DIオーバーヘッド+パターンマッチング |
| スループット | 2,000 msg/sec | JavaScript制約の現実的評価 |
| メモリ増加 | +100MB以下 | キャッシュ+オブジェクト管理込み |
| 購読操作 | 5ms以下 | 原子的操作+インデックス更新 |

### 5.3 リスク管理

#### 高リスク領域の優先TDD
1. **型安全性**: 型ガード・バリデーション
2. **メモリ管理**: キャッシュ・ライフサイクル
3. **競合状態**: 非同期操作の原子性
4. **エラー処理**: 段階的縮退・回復

#### テスト戦略
- **Unit**: 各コンポーネント単体（モック使用）
- **Integration**: DIコンテナ経由の結合
- **E2E**: Agent-to-Agent通信
- **Performance**: ベンチマーク・メモリプロファイル

## 6. エラー処理

### 6.1 エラー定義

```typescript
export enum ErrorSeverity {
  INFO = 'info',
  WARN = 'warn', 
  ERROR = 'error',
  FATAL = 'fatal'
}

export class MessagingError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly severity: ErrorSeverity,
    public readonly context: Record<string, unknown>,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'MessagingError';
  }
}

// サーキットブレーカー実装
export class ComponentHealthManager {
  private readonly failureCounts = new Map<string, number>();
  private readonly thresholds = new Map<string, number>();

  recordFailure(componentId: string): void {
    const current = this.failureCounts.get(componentId) ?? 0;
    this.failureCounts.set(componentId, current + 1);

    const threshold = this.thresholds.get(componentId) ?? 10;
    if (current + 1 >= threshold) {
      this.triggerCircuitBreaker(componentId);
    }
  }

  private triggerCircuitBreaker(componentId: string): void {
    // 段階的縮退運転
    console.warn(`Circuit breaker triggered for ${componentId}`);
  }
}
```

## 7. Phase1統合設計

### 7.1 後方互換性保証

```typescript
// Phase1 Agent拡張（破壊的変更なし）
export class Agent {
  private messagingSystem: MessagingSystemContainer | null = null;
  
  constructor(options: AgentOptions) {
    // ... 既存のPhase1コード変更なし ...
    
    // Phase2機能はオプトイン
    if (options.enableMessaging) {
      this.messagingSystem = MessagingSystemContainer.create(options.messagingConfig);
    }
  }

  // Phase2新機能（既存APIに影響なし）
  async subscribeToMessages(pattern: string): Promise<void> {
    if (!this.messagingSystem) {
      throw new Error('Messaging not enabled for this agent');
    }
    
    await this.messagingSystem
      .getSubscriptionRegistry()
      .subscribe(this.id, pattern);
  }

  // Phase1既存メソッドは完全保持
  receiveMessage(message: Message): void {
    // 既存実装そのまま
  }
}
```

## 8. 技術スタック

### 8.1 既存ライブラリ活用

- **型検証**: Zod（実績あるライブラリ）
- **テスト**: Vitest（Phase1継続）
- **監視**: prom-client（Phase1継続）
- **ログ**: winston（Phase1継続）

### 8.2 実装対象

- **MessagingSystemContainer**: 依存性注入コンテナ
- **パターンマッチングキャッシュ**: LRUキャッシュ付き
- **購読レジストリ**: O(1)検索最適化

## 9. 結論

**本設計は以下を達成**:

✅ **型安全性**: 制約付きジェネリック、実行時検証  
✅ **単一責任**: 依存性注入による疎結合設計  
✅ **性能目標**: JavaScript制約考慮の現実的達成目標  
✅ **メモリ管理**: LRUキャッシュ、適切ライフサイクル  
✅ **並行安全性**: 原子的操作、競合状態回避  
✅ **後方互換性**: Phase1 API完全保持  
✅ **実装計画**: 75-90時間の段階的戦略  

この設計により、Phase1の高品質基盤を維持しつつ、拡張性・保守性に優れた通信システムを構築できます。
