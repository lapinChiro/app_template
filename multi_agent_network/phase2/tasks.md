# 第2段階 実装タスク一覧

## 概要
本文書は、エージェント間通信システム（第2段階）実装における具体的なタスクを定義します。各タスクはTDDアプローチに従い、依存関係を明確にして順次実装可能な構成になっています。

## タスク一覧

### TASK-201: プロジェクト拡張設定

**概要**: 第2段階に必要な新規依存関係とビルド設定を追加する

**前提条件**:
- 第1段階が完全に完了している
- package.jsonが存在する

**実装内容**:
1. 新規依存パッケージの追加:
   - `zod@^3.22.0` (型検証)
   - `@types/zod@^3.22.0`
2. package.jsonのスクリプト拡張:
   - `npm run type-check:phase2` (Phase2専用型チェック)
   - `npm run test:phase2` (Phase2専用テスト)
3. tsconfig.json拡張設定:
   - strict型チェック強化
   - branded型サポート

**完了条件**:
- `npm install` が成功する
- 既存のPhase1テストが引き続き通る
- TypeScript strict modeが維持される
- eslintの`no-any`ルールが維持される

**成果物**:
- 更新された `/package.json`
- 拡張された `/tsconfig.json`

**依存関係**: 第1段階完了

**関連要件**: 品質基準全般

**工数見積もり**: 1時間

---

### TASK-202: 型定義システムの実装

**概要**: TypeScriptのブランド型を使用した強い型制約システムを実装する

**前提条件**:
- TASK-201が完了している
- TypeScript 5.0+のブランド型について理解している

**実装内容**（TDDアプローチ）:

1. **RED**: テストファイル作成
   - `/tests/unit/types/branded-types.test.ts`を作成
   - 具体的テストケース:
     ```typescript
     describe('ValidatedMessageType', () => {
       test('should not accept plain string', () => {
         const plain: string = 'test';
         // @ts-expect-error - should not be assignable
         const typed: ValidatedMessageType = plain;
       });
       
       test('should work with proper factory function', () => {
         const typed = createValidatedMessageType('test.message');
         expect(typeof typed).toBe('string');
       });
     });
     ```

2. **GREEN**: 実装
   - `/src/core/types/branded-types.ts`を作成
   - 正確なブランド型定義:
     ```typescript
     export type ValidatedMessageType = string & { readonly __messageTypeBrand: unique symbol };
     export type AgentId = string & { readonly __agentIdBrand: unique symbol };
     export type MessagePattern = string & { readonly __patternBrand: unique symbol };
     ```
   - ファクトリ関数の実装
   - 型ガード関数の実装

3. **BLUE**: リファクタリング
   - 型変換関数の最適化
   - JSDoc詳細化（使用例含む）

**完了条件**:
- 全テストがパスする
- `npm run type-check:phase2`で型エラー0件
- ブランド型が正しく制約として機能する
- 型変換関数が1ms以内で実行される
- any型・type assertion未使用

**成果物**:
- `/src/core/types/branded-types.ts`
- `/src/core/types/index.ts` (型定義の再エクスポート)
- `/tests/unit/types/branded-types.test.ts`

**依存関係**: TASK-201

**関連要件**: 型安全性要件、CLAUDE.md Type-Driven Development

**工数見積もり**: 10時間

---

### TASK-203: Zod型検証システムの実装

**概要**: Zodライブラリを活用した堅牢な実行時型検証システムを実装する

**前提条件**:
- TASK-202が完了している
- Zodライブラリの基本的な使用方法を理解している
- 既存のMessageFactory（phase1）の実装を理解している

**実装内容**（TDDアプローチ）:

1. **RED**: テストファイル作成
   - `/tests/unit/message-validator.test.ts`を作成
   - 詳細なテストケース:
     ```typescript
     describe('MessageValidator', () => {
       test('should validate correct message format', () => {
         const validMessage = {
           id: '123e4567-e89b-12d3-a456-426614174000',
           from: '987fcdeb-51a2-4321-9876-123456789abc',
           to: '456789ab-cdef-1234-5678-90abcdef1234', 
           type: 'test.message',
           payload: { data: 'test' },
           timestamp: new Date()
         };
         expect(() => MessageValidator.validate(validMessage)).not.toThrow();
       });
       
       test('should reject invalid UUID format', () => {
         const invalidMessage = { /* invalid UUID */ };
         expect(() => MessageValidator.validate(invalidMessage)).toThrow(ZodError);
       });
     });
     ```

2. **GREEN**: 実装
   - `/src/core/message-validator.ts`を作成
   - 詳細なZodスキーマ定義:
     ```typescript
     const MessageSchema = z.object({
       id: z.string().uuid(),
       from: z.string().uuid(),
       to: z.string().uuid(), 
       type: z.string().min(1).max(100).regex(/^[a-zA-Z0-9._-]+$/),
       payload: z.record(z.string(), z.unknown()),
       timestamp: z.date()
     });
     ```
   - エラーハンドリング強化
   - 既存MessageFactoryとの統合

3. **BLUE**: リファクタリング
   - スキーマキャッシュによる性能最適化
   - エラーメッセージのローカライズ
   - 型アサーション関数の追加

**完了条件**:
- 全テストがパスする（カバレッジ100%）
- 無効なメッセージで適切なZodErrorが発生する
- 型検証が平均1ms以内で実行される
- 既存MessageFactoryとの統合が正しく動作する
- Phase1のMessage型との互換性が保持される

**成果物**:
- `/src/core/message-validator.ts`
- `/tests/unit/message-validator.test.ts`
- `/src/core/types/message.ts` (型定義拡張)

**依存関係**: TASK-202

**関連要件**: R3.1-R3.7、CLAUDE.md Don't Reinvent the Wheel

**工数見積もり**: 8時間

---

### TASK-204: パターンマッチング システムの実装

**概要**: メモリ効率の良いLRUキャッシュ機能付きパターンマッチングシステムを実装する

**前提条件**:
- TASK-202が完了している
- LRU（Least Recently Used）キャッシュアルゴリズムを理解している
- 正規表現の性能特性を理解している

**実装内容**（TDDアプローチ）:

1. **RED**: テストファイル作成
   - `/tests/unit/pattern-matcher.test.ts`を作成
   - 詳細なテストケース:
     ```typescript
     describe('CachedPatternMatcher', () => {
       test('should match exact patterns', () => {
         const matcher = new CachedPatternMatcher();
         expect(matcher.matches('user.login', 'user.login')).toBe(true);
         expect(matcher.matches('user.login', 'user.logout')).toBe(false);
       });
       
       test('should match wildcard patterns', () => {
         expect(matcher.matches('user.*', 'user.login')).toBe(true);
         expect(matcher.matches('user.*', 'admin.login')).toBe(false);
       });
       
       test('should cache compiled patterns', () => {
         const pattern = 'test.*';
         matcher.matches(pattern, 'test.message');
         expect(matcher.getCacheSize()).toBe(1);
       });
       
       test('should evict old patterns when cache is full', () => {
         // 1000個のパターンでキャッシュ満杯にする
         for(let i = 0; i < 1001; i++) {
           matcher.matches(`pattern${i}.*`, `pattern${i}.test`);
         }
         expect(matcher.getCacheSize()).toBe(1000);
       });
     });
     ```

2. **GREEN**: 実装
   - `/src/core/pattern-matcher.ts`を作成
   - IPatternMatcherインターフェースの詳細定義
   - CachedPatternMatcherクラス:
     ```typescript
     export class CachedPatternMatcher implements IPatternMatcher {
       private readonly cache = new Map<string, { regex: RegExp, lastUsed: number }>();
       private readonly maxSize = 1000;
       private accessCount = 0;
     }
     ```
   - 正確なLRUアルゴリズム実装
   - 安全な正規表現エスケープ処理

3. **BLUE**: リファクタリング
   - キャッシュヒット率の最適化
   - メモリ使用量の最小化
   - パフォーマンス計測の追加

**完了条件**:
- 全テストがパスする（カバレッジ100%）
- LRUキャッシュが仕様通り動作する（FIFO eviction）
- パターンマッチング処理が2ms以下で完了する
- 1000パターンでメモリ使用量が10MB以下
- メモリリークが検出されない（GCテスト後）
- 悪意のある正規表現でReDoS攻撃が不可能

**成果物**:
- `/src/core/pattern-matcher.ts`
- `/tests/unit/pattern-matcher.test.ts`
- `/src/core/types/pattern.ts` (パターン関連型定義)

**依存関係**: TASK-202

**関連要件**: R2.4, R2.5、CLAUDE.md DRY原則

**工数見積もり**: 12時間

---

### TASK-205: 購読レジストリシステムの実装

**概要**: エージェントの購読管理を行うレジストリシステムを実装する

**前提条件**:
- TASK-203（型検証）が完了している
- TASK-204（パターンマッチング）が完了している

**実装内容**（TDDアプローチ）:

1. **RED**: テストファイル作成
   - `/tests/unit/subscription-registry.test.ts`を作成
   - テストケース:
     - エージェントの購読/購読解除ができる
     - 購読制限（100件）が適用される
     - 直接購読がO(1)で検索できる
     - パターン購読が正しくマッチする
     - エージェント削除時にクリーンアップされる
     - 原子性が保証される

2. **GREEN**: 実装
   - `/src/core/subscription-registry.ts`を作成
   - ISubscriptionRegistryインターフェースの定義
   - SubscriptionRegistryクラスの実装
   - 依存性注入によるIPatternMatcher利用

3. **BLUE**: リファクタリング
   - インデックスの最適化
   - エラーハンドリングの改善

**完了条件**:
- 全テストがパスする
- 購読操作が5ms以下で完了する
- メモリリークがない
- 100エージェント×100購読で正常動作する

**成果物**:
- `/src/core/subscription-registry.ts`
- `/tests/unit/subscription-registry.test.ts`

**依存関係**: TASK-203, TASK-204

**関連要件**: R2.1-R2.7

**工数見積もり**: 10時間

---

### TASK-206: 配信エンジンの実装

**概要**: メッセージ配信の中核となるDeliveryEngineを実装する

**前提条件**:
- TASK-203（型検証）が完了している

**実装内容**（TDDアプローチ）:

1. **RED**: テストファイル作成
   - `/tests/unit/delivery-engine.test.ts`を作成
   - テストケース:
     - 単一エージェントへの配信ができる
     - 複数エージェントへの同時配信ができる
     - 優先度付きキューが動作する
     - バッチ配信が正しく動作する
     - エラー時のリトライ機能が動作する

2. **GREEN**: 実装
   - `/src/core/delivery-engine.ts`を作成
   - IDeliveryEngineインターフェースの定義
   - DeliveryEngineクラスの実装
   - 優先度キューとバッチ処理

3. **BLUE**: リファクタリング
   - 配信性能の最適化
   - エラー処理の強化

**完了条件**:
- 全テストがパスする
- メッセージ配信が20ms以下
- バッチ処理が正しく動作する
- リトライ機能が正しく動作する

**成果物**:
- `/src/core/delivery-engine.ts`
- `/tests/unit/delivery-engine.test.ts`

**依存関係**: TASK-203

**関連要件**: R3.1-R3.7

**工数見積もり**: 12時間

---

### TASK-207: ヘルス監視システムの実装

**概要**: システム健全性を監視するHealthMonitorを実装する

**前提条件**:
- TASK-201が完了している

**実装内容**（TDDアプローチ）:

1. **RED**: テストファイル作成
   - `/tests/unit/health-monitor.test.ts`を作成
   - テストケース:
     - コンポーネント健全性が記録される
     - 障害カウントが正しく管理される
     - 閾値超過時にサーキットブレーカーが動作する
     - 健全性レポートが生成される

2. **GREEN**: 実装
   - `/src/core/health-monitor.ts`を作成
   - IHealthMonitorインターフェースの定義
   - HealthMonitorクラスの実装
   - サーキットブレーカーロジック

3. **BLUE**: リファクタリング
   - 監視精度の向上
   - ログ出力の最適化

**完了条件**:
- 全テストがパスする
- サーキットブレーカーが正しく動作する
- 健全性チェックが1ms以下
- メモリリークがない

**成果物**:
- `/src/core/health-monitor.ts`
- `/tests/unit/health-monitor.test.ts`

**依存関係**: TASK-201

**関連要件**: R8.1-R8.6

**工数見積もり**: 4時間

---

### TASK-208: 相関ID管理システムの実装

**概要**: リクエスト・レスポンスパターン用の相関ID管理を実装する

**前提条件**:
- TASK-202（型定義）が完了している

**実装内容**（TDDアプローチ）:

1. **RED**: テストファイル作成
   - `/tests/unit/correlation-manager.test.ts`を作成
   - テストケース:
     - 相関IDが正しく生成される
     - リクエスト登録・削除が動作する
     - タイムアウト処理が正しく動作する
     - 重複レスポンスが無視される
     - エージェント削除時にクリーンアップされる

2. **GREEN**: 実装
   - `/src/core/correlation-manager.ts`を作成
   - ICorrelationManagerインターフェースの定義
   - CorrelationManagerクラスの実装
   - タイムアウト機能とクリーンアップ

3. **BLUE**: リファクタリング
   - タイムアウト処理の最適化
   - メモリ管理の改善

**完了条件**:
- 全テストがパスする
- 相関ID操作が1ms以下
- タイムアウト処理が正確
- メモリリークがない

**成果物**:
- `/src/core/correlation-manager.ts`
- `/tests/unit/correlation-manager.test.ts`

**依存関係**: TASK-202

**関連要件**: R4.1-R4.7

**工数見積もり**: 5時間

---

### TASK-209: メッセージルーターの実装

**概要**: メッセージルーティングの中核となるMessageRouterを実装する

**前提条件**:
- TASK-205（購読レジストリ）が完了している
- TASK-206（配信エンジン）が完了している
- TASK-207（ヘルス監視）が完了している

**実装内容**（TDDアプローチ）:

1. **RED**: テストファイル作成
   - `/tests/unit/message-router.test.ts`を作成
   - テストケース:
     - メッセージルーティングが正しく動作する
     - 購読者がいない場合の処理
     - エラー時の健全性記録
     - 性能計測が動作する
     - 複数配信パターンのサポート

2. **GREEN**: 実装
   - `/src/core/message-router.ts`を作成
   - IMessageRouterインターフェースの定義
   - MessageRouterクラスの実装
   - 依存性注入による各サービス利用

3. **BLUE**: リファクタリング
   - ルーティング性能の最適化
   - エラーハンドリングの統一

**完了条件**:
- 全テストがパスする
- ルーティング時間が30ms以下
- 依存関係が正しく動作する
- エラー処理が適切

**成果物**:
- `/src/core/message-router.ts`
- `/tests/unit/message-router.test.ts`

**依存関係**: TASK-205, TASK-206, TASK-207

**関連要件**: R1.1-R1.6

**工数見積もり**: 6時間

---

### TASK-210: MessagingSystemContainer DIコンテナの実装

**概要**: 複雑な依存関係を管理する依存性注入コンテナを実装し、Singletonパターンを完全に撤廃する

**前提条件**:
- TASK-204〜TASK-209が完了している
- 依存性注入パターンの理解
- **重要**: 既存のSingleton使用箇所（SecurityMonitor、PerformanceMonitor）の調査完了

**実装内容**（TDDアプローチ）:

1. **RED**: テストファイル作成（高複雑性）
   - `/tests/unit/messaging-system-container.test.ts`を作成
   - 詳細なテストケース:
     ```typescript
     describe('MessagingSystemContainer', () => {
       test('should create all components with proper dependencies', () => {
         const container = MessagingSystemContainer.create(defaultConfig);
         expect(container.getMessageRouter()).toBeInstanceOf(MessageRouter);
         expect(container.getSubscriptionRegistry()).toBeInstanceOf(SubscriptionRegistry);
       });
       
       test('should create isolated instances', () => {
         const container1 = MessagingSystemContainer.create(config1);
         const container2 = MessagingSystemContainer.create(config2);
         expect(container1.getMessageRouter()).not.toBe(container2.getMessageRouter());
       });
       
       test('should properly inject dependencies', () => {
         const container = MessagingSystemContainer.create(defaultConfig);
         const registry = container.getSubscriptionRegistry();
         // Dependency injection verification
         expect(registry).toHaveProperty('patternMatcher');
       });
     });
     ```

2. **GREEN**: 実装（段階的統合）
   - `/src/core/messaging-system-container.ts`を作成
   - 全インターフェース定義の統合:
     ```typescript
     export interface MessagingConfig {
       maxConcurrentDeliveries: number;
       defaultRequestTimeout: number; 
       circuitBreakerThreshold: number;
       patternCacheSize: number;
       subscriptionLimit: number;
     }
     ```
   - 複雑なファクトリメソッド実装
   - 各コンポーネントの正確な依存関係解決
   - **Phase1との統合**: 既存Singletonとの共存戦略

3. **BLUE**: リファクタリング（統合最適化）
   - 循環依存の解決
   - 設定検証の追加
   - エラーハンドリングの統一
   - パフォーマンス最適化

**完了条件**:
- 全テストがパスする（統合テスト含む）
- 各コンポーネントが完全に独立してテスト可能
- **Critical**: Phase1の既存Singletonとの競合がない
- コンテナ作成時間が5ms以内
- メモリ使用量が期待範囲内（+20MB以下）
- 設定の注入が全コンポーネントで正しく動作する
- 循環依存エラーが発生しない

**成果物**:
- `/src/core/messaging-system-container.ts`
- `/src/core/interfaces/index.ts` (全インターフェース統合)
- `/tests/unit/messaging-system-container.test.ts`
- `/tests/integration/container-integration.test.ts`

**依存関係**: TASK-204, TASK-205, TASK-206, TASK-207, TASK-208, TASK-209

**関連要件**: CLAUDE.md Orthogonality、SOLID Dependency Inversion

**工数見積もり**: 20時間

---

### TASK-211: MessagingError拡張の実装

**概要**: 第2段階用のエラー処理システムを既存ErrorCodeに追加する

**前提条件**:
- 第1段階のエラーシステムが完了している

**実装内容**（TDDアプローチ）:

1. **RED**: テストファイル作成
   - `/tests/unit/messaging-errors.test.ts`を作成
   - テストケース:
     - 新しいエラーコードが正しく動作する
     - MessagingErrorクラスが適切に継承される
     - エラー重要度が正しく設定される
     - context情報が保持される

2. **GREEN**: 実装
   - `/src/core/errors.ts`を拡張
   - 新しいErrorCodeの追加:
     - SUBSCRIPTION_LIMIT_EXCEEDED
     - INVALID_SUBSCRIPTION_PATTERN
     - REQUEST_TIMEOUT
     - REQUEST_FAILED
     - MESSAGE_ROUTING_FAILED
   - MessagingErrorクラスの実装

3. **BLUE**: リファクタリング
   - エラー階層の整理
   - コンテキスト情報の標準化

**完了条件**:
- 全テストがパスする
- 既存のPhase1エラーに影響しない
- エラー情報が十分詳細
- 型安全性が保たれる

**成果物**:
- 拡張された `/src/core/errors.ts`
- `/tests/unit/messaging-errors.test.ts`

**依存関係**: なし（既存機能拡張）

**関連要件**: R8.1-R8.2

**工数見積もり**: 3時間

---

### TASK-212: Agentクラスの慎重な拡張

**概要**: 既存Agentクラスの完全な後方互換性を保ちながら、第2段階通信機能を段階的に追加する

**前提条件**:
- TASK-210（DIコンテナ）が完了している
- TASK-211（エラー拡張）が完了している
- **Critical**: Phase1の全167テストが通ることを確認済み
- 既存Agentクラスの内部実装を完全に理解している

**実装内容**（TDDアプローチ + Phase1保護戦略）:

1. **RED**: 包括的テスト作成
   - `/tests/unit/agent-phase2.test.ts`を作成
   - **Phase1回帰テスト**:
     ```typescript
     describe('Phase1 Compatibility', () => {
       test('existing constructor should work unchanged', () => {
         const agent = new Agent({ name: 'test' }); // 既存signature
         expect(agent.id).toBeDefined();
         expect(agent.setMemory('key', 'value')).not.toThrow();
       });
       
       test('all Phase1 methods should work', () => {
         // Phase1の全メソッドの動作確認
       });
     });
     ```
   - **Phase2新機能テスト**:
     ```typescript
     describe('Phase2 New Features', () => {
       test('should support messaging when enabled', () => {
         const agent = new Agent({ name: 'test', enableMessaging: true });
         expect(agent.subscribeToMessages('test.*')).toBeDefined();
       });
       
       test('should throw when messaging disabled', () => {
         const agent = new Agent({ name: 'test' }); // messaging disabled by default
         expect(agent.subscribeToMessages('test.*')).rejects.toThrow();
       });
     });
     ```

2. **GREEN**: 慎重な実装（非破壊的拡張）
   - 既存`/src/core/agent.ts`をバックアップ作成
   - 段階的コード拡張:
     ```typescript
     export interface AgentOptions {
       id?: string;
       name: string;
       // Phase2: Optional messaging support
       enableMessaging?: boolean;
       messagingConfig?: MessagingConfig;
     }
     
     export class Agent {
       // Phase1: 既存プロパティは一切変更しない
       
       // Phase2: 新しいプロパティ（optional）
       private messagingSystem?: MessagingSystemContainer;
       private subscriptions?: Set<string>;
       
       constructor(options: AgentOptions) {
         // Phase1: 既存constructor logic完全保持
         
         // Phase2: オプショナル初期化
         if (options.enableMessaging) {
           this.messagingSystem = MessagingSystemContainer.create(
             options.messagingConfig ?? defaultMessagingConfig
           );
           this.subscriptions = new Set();
           this.setupPhase2Integration();
         }
       }
     }
     ```

3. **BLUE**: 統合最適化とリスク軽減
   - Phase1/Phase2機能の適切分離
   - エラーハンドリング統一
   - メモリ使用量最適化

**完了条件**:
- **必須**: 既存のPhase1全167テストが変更なく通る
- 新しいPhase2テスト全てがパスする
- `npm run build`が成功する（型エラー0件）
- Phase2機能有効時のエージェント作成が100ms以内
- Phase1機能の性能劣化が5%以内
- メモリ使用量増加が+10MB以内
- 後方互換性が100%保持される

**成果物**:
- 拡張された `/src/core/agent.ts`
- `/tests/unit/agent-phase2.test.ts`
- `/tests/integration/agent-compatibility.test.ts`
- `/src/core/agent.ts.backup` (安全のため)

**依存関係**: TASK-210, TASK-211

**関連要件**: R1.1, R2.1-R2.3、Phase1後方互換性

**工数見積もり**: 15時間

---

### TASK-213: AgentManagerクラスの拡張

**概要**: 既存のAgentManagerにMessage Bus機能統合を追加する

**前提条件**:
- TASK-212（Agent拡張）が完了している

**実装内容**（TDDアプローチ）:

1. **RED**: テストファイル作成
   - `/tests/unit/agent-manager-phase2.test.ts`を作成
   - テストケース:
     - Phase1機能が引き続き動作する
     - エージェント作成時のMessage Bus登録
     - エージェント削除時のクリーンアップ
     - メッセージングモードの管理
     - 統合されたエラーハンドリング

2. **GREEN**: 実装
   - `/src/core/agent-manager.ts`を拡張
   - Phase2 Agentの作成サポート
   - Message Busとの統合
   - 既存APIの完全保持

3. **BLUE**: リファクタリング
   - Phase1/Phase2モードの統合
   - 性能計測の統一

**完了条件**:
- 全テストがパスする
- Phase1のテストが全て通る
- メッセージング機能が統合される
- エージェント作成が引き続き50ms以内

**成果物**:
- 拡張された `/src/core/agent-manager.ts`
- `/tests/unit/agent-manager-phase2.test.ts`

**依存関係**: TASK-212

**関連要件**: R1.4, R2.7

**工数見積もり**: 12時間

---

### TASK-214: 統合テスト - パブリッシュ・サブスクライブ機能

**概要**: エージェント間のパブリッシュ・サブスクライブ機能の統合テストを作成する

**前提条件**:
- TASK-213（AgentManager拡張）が完了している

**実装内容**:
1. `/tests/integration/pubsub-integration.test.ts`を作成
2. テストケース:
   - 複数エージェント間でのパブリッシュ・サブスクライブ
   - パターンマッチングによる選択的受信
   - 購読制限の動作確認
   - エージェント削除時の自動購読解除
   - 高負荷時の安定性

**完了条件**:
- 全テストがパスする
- パブリッシュ・サブスクライブが正しく動作する
- 性能要件を満たす

**成果物**:
- `/tests/integration/pubsub-integration.test.ts`

**依存関係**: TASK-213

**関連要件**: R2.1-R2.7, R3.1-R3.2

**工数見積もり**: 5時間

---

### TASK-215: 統合テスト - リクエスト・レスポンス機能

**概要**: エージェント間のリクエスト・レスポンス通信の統合テストを作成する

**前提条件**:
- TASK-208（相関ID管理）が完了している
- TASK-213（AgentManager拡張）が完了している

**実装内容**:
1. `/tests/integration/request-response-integration.test.ts`を作成
2. テストケース:
   - リクエスト・レスポンス通信の完全フロー
   - タイムアウト処理の動作
   - 複数同時リクエストの処理
   - エラーレスポンスの処理
   - 相関IDマッチングの正確性

**完了条件**:
- 全テストがパスする
- リクエスト・レスポンスが正しく動作する
- タイムアウトが適切に処理される

**成果物**:
- `/tests/integration/request-response-integration.test.ts`

**依存関係**: TASK-208, TASK-213

**関連要件**: R4.1-R4.7

**工数見積もり**: 6時間

---

### TASK-216: 統合テスト - ブロードキャスト機能

**概要**: ブロードキャスト機能の統合テストを作成する

**前提条件**:
- TASK-213（AgentManager拡張）が完了している

**実装内容**:
1. `/tests/integration/broadcast-integration.test.ts`を作成
2. テストケース:
   - 全エージェントへのブロードキャスト
   - 条件付きブロードキャスト（フィルタ機能）
   - 大量エージェントでの警告機能
   - ブロードキャスト性能の測定
   - エラー時の部分配信継続

**完了条件**:
- 全テストがパスする
- ブロードキャスト機能が正しく動作する
- 性能要件を満たす（50ms/10エージェント）

**成果物**:
- `/tests/integration/broadcast-integration.test.ts`

**依存関係**: TASK-213

**関連要件**: R6.1-R6.6

**工数見積もり**: 4時間

---

### TASK-217: 統合テスト - Phase1互換性検証

**概要**: 第1段階との完全な互換性を検証する統合テストを作成する

**前提条件**:
- TASK-213（AgentManager拡張）が完了している

**実装内容**:
1. `/tests/integration/phase1-compatibility.test.ts`を作成
2. テストケース:
   - Phase1のAPIが全て動作する
   - 既存のメッセージング機能が影響されない
   - Phase1エージェントとPhase2エージェントの混在
   - Phase1のテストケースが全て通る
   - パフォーマンス劣化がない

**完了条件**:
- 全テストがパスする
- Phase1機能が100%保持される
- 性能劣化がない

**成果物**:
- `/tests/integration/phase1-compatibility.test.ts`

**依存関係**: TASK-213

**関連要件**: 後方互換性全般

**工数見積もり**: 7時間

---

### TASK-218: 性能ベンチマークテスト

**概要**: 第2段階の性能要件を検証するベンチマークテストを作成する

**前提条件**:
- TASK-217（互換性検証）が完了している

**実装内容**:
1. `/tests/performance/messaging-benchmark.test.ts`を作成
2. テストケース:
   - メッセージルーティング時間 < 30ms
   - スループット測定（目標: 2000 msg/sec）
   - 購読操作時間 < 5ms
   - ブロードキャスト時間 < 50ms/10エージェント
   - パターンマッチング性能

**完了条件**:
- 全性能要件を満たす
- ベンチマーク結果がレポートされる
- Phase1性能が維持される

**成果物**:
- `/tests/performance/messaging-benchmark.test.ts`

**依存関係**: TASK-217

**関連要件**: R7.1-R7.5

**工数見積もり**: 5時間

---

### TASK-219: メモリ使用量拡張テスト

**概要**: 第2段階のメモリ使用量要件を検証するテストを作成する

**前提条件**:
- TASK-210（DIコンテナ）が完了している

**実装内容**:
1. `/tests/performance/memory-usage-phase2.test.ts`を作成
2. テストケース:
   - Phase2機能追加でのメモリ増加量（+100MB以内）
   - 100エージェント×100購読での動作
   - LRUキャッシュの効果測定
   - メモリリーク検出
   - ガベージコレクション後の状態

**完了条件**:
- メモリ増加が+100MB以内
- メモリリークがない
- 大規模構成での安定動作

**成果物**:
- `/tests/performance/memory-usage-phase2.test.ts`

**依存関係**: TASK-210

**関連要件**: R7.3

**工数見積もり**: 4時間

---

### TASK-220: エラー処理統合テスト

**概要**: 第2段階のエラー処理・回復機能の統合テストを作成する

**前提条件**:
- TASK-211（エラー拡張）が完了している
- TASK-210（DIコンテナ）が完了している

**実装内容**:
1. `/tests/integration/error-handling-phase2.test.ts`を作成
2. テストケース:
   - 新しいエラーコードの動作
   - サーキットブレーカーの動作
   - 段階的縮退運転
   - エラー時の部分機能継続
   - 回復機能のテスト

**完了条件**:
- 全テストがパスする
- エラー処理が堅牢
- システムが部分障害で停止しない

**成果物**:
- `/tests/integration/error-handling-phase2.test.ts`

**依存関係**: TASK-210, TASK-211

**関連要件**: R8.1-R8.6

**工数見積もり**: 6時間

---

### TASK-221: 負荷テスト・耐障害性テスト

**概要**: 高負荷時とシステム障害時の動作を検証するテストを作成する

**前提条件**:
- TASK-218（性能ベンチマーク）が完了している
- TASK-220（エラー処理）が完了している

**実装内容**:
1. `/tests/performance/load-test.test.ts`を作成
2. `/tests/integration/fault-tolerance.test.ts`を作成
3. テストケース:
   - 2000 msg/sec での安定動作
   - 大量エージェント（100）での動作
   - コンポーネント障害時の分離
   - メモリ制限近辺での動作
   - 長時間動作でのメモリリーク検証

**完了条件**:
- 高負荷テストをパスする
- 障害分離が正しく動作する
- 長時間動作が安定

**成果物**:
- `/tests/performance/load-test.test.ts`
- `/tests/integration/fault-tolerance.test.ts`

**依存関係**: TASK-218, TASK-220

**関連要件**: R5.7, R8.3-R8.4

**工数見積もり**: 8時間

---

### TASK-222: エクスポート設定の更新

**概要**: package.jsonとindex.tsを更新して第2段階機能をエクスポートする

**前提条件**:
- TASK-212（Agent拡張）が完了している
- TASK-213（AgentManager拡張）が完了している

**実装内容**:
1. `/src/index.ts`を拡張
2. 新しい公開APIのエクスポート:
   - MessagingSystemContainer
   - 新しいインターフェース群
   - 新しいエラータイプ
   - 型定義（ブランド型）
3. 型定義ファイルの整理

**完了条件**:
- パッケージとして正しく使用できる
- 型定義が正確にエクスポートされる
- Phase1のエクスポートが維持される

**成果物**:
- 拡張された `/src/index.ts`

**依存関係**: TASK-212, TASK-213

**関連要件**: なし

**工数見積もり**: 2時間

---

### TASK-223: パブリッシュ・サブスクライブデモ

**概要**: 第2段階のパブリッシュ・サブスクライブ機能を示すデモアプリケーションを作成する

**前提条件**:
- TASK-222（エクスポート設定）が完了している

**実装内容**:
1. `/src/demo/pubsub-demo.ts`を作成
2. 内容:
   - 複数エージェントでのパブリッシュ・サブスクライブ
   - パターンマッチング使用例
   - 購読制限のデモ
   - 性能計測表示

**完了条件**:
- `npm run demo:pubsub`で実行できる
- パブリッシュ・サブスクライブ機能が確認できる

**成果物**:
- `/src/demo/pubsub-demo.ts`

**依存関係**: TASK-222

**関連要件**: なし

**工数見積もり**: 3時間

---

### TASK-224: リクエスト・レスポンスデモ

**概要**: 第2段階のリクエスト・レスポンス機能を示すデモアプリケーションを作成する

**前提条件**:
- TASK-222（エクスポート設定）が完了している

**実装内容**:
1. `/src/demo/request-response-demo.ts`を作成
2. 内容:
   - エージェント間でのリクエスト・レスポンス
   - タイムアウト機能のデモ
   - エラーレスポンスの処理例
   - 相関IDの動作確認

**完了条件**:
- `npm run demo:request-response`で実行できる
- リクエスト・レスポンス機能が確認できる

**成果物**:
- `/src/demo/request-response-demo.ts`

**依存関係**: TASK-222

**関連要件**: なし

**工数見積もり**: 3時間

---

### TASK-225: ドキュメント更新

**概要**: 第2段階機能を含むAPIドキュメントとREADMEを更新する

**前提条件**:
- TASK-224が完了している

**実装内容**:
1. `/README.md`を更新
   - 第2段階機能の説明追加
   - 新しいAPIリファレンス
   - 使用例の更新
   - 性能特性の更新
   - Phase1/Phase2の使い分け説明

**完了条件**:
- 開発者が第2段階機能を理解できるドキュメント
- サンプルコードが動作する
- Phase1からの移行手順が明確

**成果物**:
- 更新された `/README.md`

**依存関係**: TASK-224

**関連要件**: なし

**工数見積もり**: 3時間

---

## 実装順序とマイルストーン

### Phase 2A: 基盤拡張（TASK-201〜TASK-211）
- 所要時間: 92時間
- 成果: 第2段階の基盤コンポーネント

### Phase 2B: エージェント統合（TASK-212〜TASK-213）
- 所要時間: 27時間
- 成果: Phase1との統合されたエージェントシステム

### Phase 2C: 品質保証（TASK-214〜TASK-221）
- 所要時間: 42時間
- 成果: 完全なテストカバレッジと性能検証

### Phase 2D: 仕上げ（TASK-222〜TASK-225）
- 所要時間: 13時間
- 成果: 使用可能なパッケージとドキュメント

**総工数**: 174時間（実装詳細・テスト複雑性・Phase1統合リスクを考慮した現実的見積もり）

## 注意事項

### Phase1保護の必須要件
- **絶対条件**: 第1段階の167個のテストが引き続き全て通ること
- **破壊的変更禁止**: 既存のAPI署名、動作仕様の変更は一切禁止
- **性能劣化制限**: Phase1機能の性能劣化は5%以内に制限
- **各タスク完了時**: 必ず`npm run test`を実行してPhase1テストを確認

### 技術的リスク管理
- **Singleton混在リスク**: Phase1のSingleton（SecurityMonitor、PerformanceMonitor）との競合に注意
- **メモリリーク対策**: EventEmitter、Map/Set、正規表現オブジェクトの適切な管理必須
- **非同期処理の複雑性**: Promise chain、エラー伝播、競合状態に細心の注意
- **型安全性**: unknown型、any型の使用は厳禁

### 実装順序の厳格遵守
- 依存関係のあるタスクは必ず順次実行
- 前提条件を満たさない場合は実装開始不可
- 完了条件を満たさない場合は次のタスクに進行不可

### 品質保証基準
- 各タスクでTypeScriptエラー0件を維持
- カバレッジ90%以上（単体テスト）
- メモリリーク0件（統合テスト）
- CLAUDE.md原則の遵守