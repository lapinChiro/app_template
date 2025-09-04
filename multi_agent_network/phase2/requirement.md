# 第2段階：エージェント間通信システムの構築 - 要件定義書

## 概要

本文書は、エージェントネットワークシステムの第2段階として、エージェント間の高度な通信システムの実装に関する要件を定義します。第1段階で構築した基本的なエージェントシステムを拡張し、非同期メッセージバス、イベントドリブンアーキテクチャ、リクエスト・レスポンスパターンを実装します。すべての要件はEARS（Easy Approach to Requirements Syntax）記法に準拠して記述されています。

## 要件一覧

### R1: メッセージバスアーキテクチャ

**R1.1** [Ubiquitous] The Agent System shall provide a centralized Message Bus component that manages all inter-agent communications asynchronously.

**R1.2** [Event-driven] WHEN a message is sent to the Message Bus, the system shall route it to the appropriate recipient(s) based on routing rules in less than 5 milliseconds.

**R1.3** [Ubiquitous] The Message Bus shall support exactly three delivery patterns: point-to-point, broadcast, and conditional routing.

**R1.4** [State-driven] WHILE the Message Bus is operational, it shall maintain a registry of all active message routes and subscriptions with O(1) lookup performance.

**R1.5** [Unwanted behavior] IF the Message Bus becomes unavailable, THEN the system shall queue messages locally in agent-specific buffers and retry delivery when connectivity is restored.

**R1.6** [Ubiquitous] The Message Bus shall implement an event-driven architecture using Node.js EventEmitter as the core messaging mechanism.

### R2: メッセージ購読システム

**R2.1** [Ubiquitous] The Agent System shall allow agents to subscribe to specific message types or patterns for selective message reception.

**R2.2** [Event-driven] WHEN an agent subscribes to a message type, the Message Bus shall register the subscription within 1 millisecond and route matching messages to that agent.

**R2.3** [Event-driven] WHEN an agent unsubscribes from a message type, the Message Bus shall remove the subscription within 1 millisecond and stop routing matching messages.

**R2.4** [State-driven] WHILE an agent has active subscriptions, the Message Bus shall maintain the subscription mapping in memory with O(1) lookup performance using hash-based indexing.

**R2.5** [Ubiquitous] The Agent System shall support pattern-based subscriptions using dot-notation wildcards (e.g., "trade.*", "notification.urgent.*") with maximum pattern depth of 5 levels.

**R2.6** [Unwanted behavior] IF an agent attempts to create more than 100 active subscriptions, THEN the system shall reject additional subscriptions and return error code "SUBSCRIPTION_LIMIT_EXCEEDED".

**R2.7** [Event-driven] WHEN an agent is destroyed, the Message Bus shall automatically remove all subscriptions associated with that agent within 1 millisecond.

### R3: 非同期メッセージ配信

**R3.1** [Ubiquitous] The Message Bus shall deliver messages asynchronously using Promise-based APIs with async/await support.

**R3.2** [Event-driven] WHEN a message is published, the Message Bus shall deliver it to all matching subscribers concurrently within the routing latency limit.

**R3.3** [Ubiquitous] The Message Bus shall implement exactly-once delivery guarantee as default, with at-least-once delivery available for high-throughput scenarios.

**R3.4** [Event-driven] WHEN a message delivery fails, the system shall implement exponential backoff retry with initial delay of 10ms, multiplier of 2.0, and maximum of 3 attempts.

**R3.5** [State-driven] WHILE messages are being processed, the system shall maintain delivery status for each message with nanosecond-precision timestamps.

**R3.6** [Unwanted behavior] IF message delivery takes longer than 10 milliseconds, THEN the system shall log a warning with message ID and continue processing.

**R3.7** [Ubiquitous] The Message Bus shall provide delivery confirmation callbacks that execute within 1 millisecond of delivery completion.

### R4: リクエスト・レスポンスパターン

**R4.1** [Ubiquitous] The Agent System shall support request-response messaging pattern with correlation IDs for message matching.

**R4.2** [Event-driven] WHEN an agent sends a request message, the system shall generate a UUID v4 correlation ID and register the request for response matching.

**R4.3** [Event-driven] WHEN a response message is received, the system shall match it to the original request using correlation ID and resolve the corresponding Promise within 1 millisecond.

**R4.4** [State-driven] WHILE waiting for responses, the system shall maintain a registry of pending requests with configurable timeout values between 1 second and 60 seconds.

**R4.5** [Unwanted behavior] IF a response is not received within the timeout period (default: 5 seconds), THEN the system shall reject the request Promise with error code "REQUEST_TIMEOUT".

**R4.6** [Ubiquitous] The Agent System shall provide request-response APIs supporting both Promise-based (async/await) and callback-based response handling.

**R4.7** [Event-driven] WHEN multiple responses are received for the same correlation ID, the system shall accept only the first response and log subsequent duplicates as warnings.

### R5: メッセージキューイングとバッファリング

**R5.1** [Ubiquitous] The Message Bus shall implement memory-based message queues for each agent to handle temporary unavailability with persistent message ordering.

**R5.2** [State-driven] WHILE an agent is offline or busy, the Message Bus shall queue messages for that agent with a maximum queue size of 5000 messages to support high-throughput operations.

**R5.3** [Event-driven] WHEN an agent becomes available, the Message Bus shall deliver queued messages in strict FIFO order within priority levels.

**R5.4** [Unwanted behavior] IF an agent's message queue exceeds the maximum size, THEN the system shall discard the oldest low-priority messages and log a warning with message count and agent ID.

**R5.5** [Ubiquitous] The Message Bus shall implement message prioritization with exactly three levels: LOW (0), NORMAL (1), HIGH (2) using integer priority values.

**R5.6** [Event-driven] WHEN high-priority messages are queued, the system shall deliver them before lower-priority messages while maintaining FIFO order within each priority level.

**R5.7** [State-driven] WHILE the system operates under high load (>5000 messages/second), the Message Bus shall implement adaptive flow control to prevent memory exhaustion.

### R6: ブロードキャスト機能の拡張

**R6.1** [Ubiquitous] The Message Bus shall support conditional broadcast using agent property filters and state-based criteria.

**R6.2** [Event-driven] WHEN a broadcast message is sent, the system shall evaluate filter conditions in less than 2 milliseconds and deliver only to matching agents.

**R6.3** [Ubiquitous] The Agent System shall implement exactly four broadcast patterns: "all-agents", "by-type", "by-property", and "by-subscription" with filter expressions.

**R6.4** [State-driven] WHILE processing broadcasts to more than 5 agents, the system shall optimize delivery by batching messages in groups of 10 to reduce overhead.

**R6.5** [Unwanted behavior] IF a broadcast message would be delivered to more than 100 agents, THEN the system shall require explicit confirmation and log the operation with recipient count.

**R6.6** [Event-driven] WHEN an agent joins or leaves the system, the Message Bus shall update all broadcast recipient lists within 1 millisecond.

### R7: 性能要件

**R7.1** [Ubiquitous] The Message Bus shall route messages with an average latency of less than 5 milliseconds under normal load (up to 1000 messages per second).

**R7.2** [Ubiquitous] The Message Bus shall support a sustained throughput of at least 10,000 messages per second with 10 active agents.

**R7.3** [State-driven] WHILE operating with 100 concurrent subscriptions, the system shall consume less than 50MB of additional memory beyond the Phase 1 baseline of 0.40MB for 10 agents.

**R7.4** [Ubiquitous] The Message Bus shall complete subscription operations (subscribe/unsubscribe) in less than 1 millisecond each.

**R7.5** [Event-driven] WHEN delivering broadcast messages to 10 agents simultaneously, the complete operation shall finish within 20 milliseconds.

### R8: エラーハンドリングとロギング

**R8.1** [Ubiquitous] The Message Bus shall provide comprehensive error handling with specific error codes defined for each failure scenario including routing, delivery, and subscription errors.

**R8.2** [Event-driven] WHEN a message delivery fails permanently after all retry attempts, the system shall log the failure with severity "ERROR" including message ID and notify the sender if callback was provided.

**R8.3** [Ubiquitous] The Message Bus shall implement circuit breaker pattern with configurable failure thresholds to isolate failing components and prevent cascade failures.

**R8.4** [Event-driven] WHEN the circuit breaker is triggered by exceeding failure threshold, the system shall enter "degraded mode" and queue messages locally while attempting recovery.

**R8.5** [Ubiquitous] The Agent System shall log all Message Bus operations (routing, delivery, subscription) with appropriate severity levels for monitoring and debugging purposes.

**R8.6** [State-driven] WHILE in error recovery mode, the Message Bus shall perform health checks every 5 seconds and gradually restore normal operations when components become healthy.

## 検証基準

各要件は以下の方法で検証されます：

1. **機能テスト**: 各要件に対応する自動テストケース
2. **性能テスト**: R7の性能要件を検証するベンチマーク
3. **統合テスト**: 第1段階システムとの統合動作検証
4. **負荷テスト**: 高負荷条件下での安定性確認
5. **耐障害性テスト**: エラー状況での回復能力検証

## 用語定義

- **Message Bus**: 全エージェント間通信を仲介する中央集約型EventEmitterベースコンポーネント
- **Subscription**: エージェントが特定のメッセージタイプまたはパターンを受信するための登録（最大100件/エージェント）
- **Correlation ID**: UUID v4形式でリクエスト・レスポンスパターンのメッセージを関連付ける一意識別子
- **Delivery Guarantee**: メッセージ配信の信頼性レベル（exactly-once: デフォルト, at-least-once: 高スループット用）
- **Circuit Breaker**: 設定可能な障害閾値で障害連鎖を防ぐ自動遮断メカニズム
- **Flow Control**: 高負荷時（>5000 msg/sec）にメモリ枯渇を防ぐ適応的流量制御
- **Pattern Matching**: dot-notation wildcards（例: "trade.*"）による購読パターン（最大5階層）
- **Priority Queue**: LOW(0), NORMAL(1), HIGH(2)の3レベル優先度付きFIFOキュー

## 制約事項

1. 第2段階では同一プロセス内での実装を維持する（分散実装は第3段階以降）
2. メッセージの永続化は軽量なメモリベース実装とする（外部データベース不使用）
3. 第1段階との100%後方互換性を保持する（既存API変更禁止）
4. 外部依存関係の追加は最小限に抑制する（Node.js標準ライブラリ優先）
5. エージェント数上限を100に設定する（第1段階の10から段階的スケーリング）

## 第1段階との関係

本段階は第1段階で実装された以下の機能を拡張します：

- **Agent クラス**: メッセージ購読機能を追加
- **AgentManager**: メッセージバス機能と統合
- **Message システム**: 非同期配信とパターンマッチング対応
- **PerformanceMonitor**: メッセージバス性能メトリクス追加
- **SecurityMonitor**: 購読ベースアクセス監視

## 変更履歴

- 2025-09-04: 初版作成
- 要件分析結果を反映：
  - 非同期メッセージバスの詳細要件を追加（R1）
  - メッセージ購読システムの要件を定義（R2）
  - リクエスト・レスポンスパターンの詳細化（R4）
  - 性能要件を第1段階から継続・拡張（R7）
  - エラーハンドリングとサーキットブレーカー要件を追加（R8）