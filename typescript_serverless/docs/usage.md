# 📖 使用方法・ベストプラクティス

Claude Code自動化環境の効果的な使用方法とベストプラクティスです。

## 🚀 基本的な開発フロー

### 1. 事前準備と開発フロー

**利用者が事前に作成するファイル：**
- `requirement.md` - プロジェクトの要件定義
- `design.md` - 技術設計（docs/impl/への参照含む）
- `tasks/` - 開発タスクファイル群
- `docs/impl/` - 実装例・パターン集（任意だが推奨）

**開発実行：**
```bash
# 上記ファイル作成後、開発を自動実行
claude code "/dev"
```

### 2. /dev コマンドによる自動開発
`/dev` コマンドで12-SubAgentシステムが自動起動し、以下が実行されます：
1. **Progress Analysis** (`tracker`) - tasks/と progress/を分析
2. **TDD Implementation** (`test`) - RED-GREEN-BLUEサイクル
3. **Quality Verification** (`qa`, `review`, `security`)
4. **Architecture Check** (`architect`, `typesafe`)

### 3. 要件定義・設計・タスク分割の作成指針

#### requirement.md の記載内容
- **ビジネス要件**: プロジェクトの目的、解決する課題
- **機能要件**: 具体的な機能リスト、ユーザーストーリー
- **非機能要件**: パフォーマンス、セキュリティ、可用性など
- **受入基準**: 各機能の完成条件

#### design.md の記載内容
- **アーキテクチャ**: Clean Architecture準拠の層構成
- **技術選定**: 使用するライブラリ・フレームワーク
- **型定義設計**: 主要なTypeScript型定義
- **実装例参照**: docs/impl/ディレクトリへのパス

#### tasks/ の構成例
```
tasks/
├── 01-project-setup.md      # 環境構築、初期設定
├── 02-database-schema.md    # DB設計、マイグレーション
├── 03-auth-implementation.md # 認証機能実装
├── 04-api-endpoints.md      # APIエンドポイント実装
└── 05-frontend-ui.md        # フロントエンド実装
```

各タスクファイルには以下を記載：
- タスクの概要と目的
- 依存する他タスク
- 実装方針とdocs/impl/への参照
- 受入基準

## 🎯 実行例と成果物

### 🆕 /dev 実行時の動作

#### タスク: 03-auth-implementation.md を実行する場合

**自動実行される内容:**
1. 既存認証ライブラリ調査 (Don't Reinvent)
2. 型安全なJWT型定義作成 (Effective TypeScript)
3. テスト作成 → 実装 → リファクタリング (TDD)
4. セキュリティ監査 (OWASP Top 10)

**生成される成果物:**
- `src/auth/` - 認証関連コード
- `src/auth/__tests__/` - テストコード
- `src/types/auth.ts` - 型定義
- `progress/03-auth.md` - 実装記録

#### タスク: 04-api-endpoints.md を実行する場合

**生成される成果物:**
- TypeScript型定義
- Lambda関数実装
- Jest単体テスト
- OpenAPI仕様書
- CDKインフラコード

### 🔧 特定の品質改善タスク

#### パフォーマンス最適化タスクがある場合
tasks/に `06-performance-optimization.md` がある場合、/dev実行時に：

**実行される最適化:**
- Core Web Vitals分析
- バンドルサイズ最適化
- 遅延読み込み実装
- キャッシュ戦略改善

#### セキュリティ強化タスクがある場合
tasks/に `07-security-audit.md` がある場合、/dev実行時に：

**チェック項目:**
- OWASP Top 10準拠
- 入力値検証
- 認証・認可の確認
- 機密データ保護

### 🐛 デバッグ・エラー対応

/dev実行中にエラーが発生した場合、自動的に：
- `debug` エージェントが体系的なデバッグを実施
- エラーの根本原因を特定
- 修正案を実装
- テストで修正を検証

## 🤖 SubAgent活用方法

### Core Development Agents

#### `test` - TDD自動化
SubAgentはTask toolで呼び出されます（直接呼び出しはできません）：
- RED フェーズ: 失敗するテストを作成
- GREEN フェーズ: テストを通す最小実装
- BLUE フェーズ: リファクタリング

/dev実行時に自動的にTDDサイクルが実行されます。

#### `typesafe` - 型安全性強制
```bash
# 8レベル型安全性チェック
claude code "型安全性を最大限まで高めてください"

# any 型排除
claude code "anyタイプを完全に排除してください"
```

#### `review` - コードレビュー
```bash
# 15ペア相乗効果チェック
claude code "コード品質をレビューしてください"

# SOLID原則チェック
claude code "SOLID原則に準拠しているかチェックしてください"
```

### Quality Assurance Agents

#### `architect` - アーキテクチャ検証
```bash
claude code "Clean Architectureに準拠しているかチェックしてください"
```

#### `security` - セキュリティ監査
```bash
claude code "セキュリティ脆弱性をチェックしてください"
```

#### `qa` - 品質保証
```bash
claude code "総合的な品質チェックを実行してください"
```

### Specialized Agents

#### `perf` - パフォーマンス最適化
```bash
claude code "Core Web Vitalsを最適化してください"
```

#### `monorepo` - モノレポ管理
```bash
claude code "モノレポの依存関係を最適化してください"
```

## 📊 品質管理ベストプラクティス

### 1. 継続的品質チェック

#### 開発中の品質確認
```bash
# 即座チェック
claude code "qa quick で品質をチェックしてください"

# 包括的チェック  
claude code "すべての品質エージェントでチェックしてください"
```

#### Git commit前チェック
```bash
# Husky自動実行または手動実行
npm run quality
```

### 2. 段階的品質向上

#### Level 1: 基本品質
- TypeScript strict mode
- ESLint エラーゼロ
- 基本テストカバレッジ 80%+

#### Level 2: 高品質
- `any` 型完全排除
- SOLID原則準拠
- セキュリティ監査パス

#### Level 3: 最高品質  
- 15ペア相乗効果最大化
- Clean Architecture準拠
- Core Web Vitals最適化

## 🔄 開発ワークフロー

### Standard Mode (推奨)
```bash
claude code "/dev"
```

実行フロー:
1. `tracker` - tasks/から最適なタスクを選択
2. `test (red)` - 失敗テスト作成
3. `test (green)` - 最小実装
4. `qa (quick)` - 即座品質チェック
5. `test (blue)` - リファクタリング  
6. `qa (quick)` - 再品質チェック
7. `review` - コード品質レビュー
8. `qa` - 最終品質確認
9. `tracker` - progress/更新・次タスク推奨

### Quick Mode (最小チェック)
```bash
claude code "簡単な修正を実行してください (quick mode)"
```

### Thorough Mode (最大品質)
```bash
claude code "最高品質で実装してください (thorough mode)"
```

## 📈 効果測定

### 品質メトリクス確認
```bash
claude code "開発品質メトリクスを測定してください"
```

**測定項目:**
- TypeScript エラー数: 0
- ESLint エラー数: 0  
- テストカバレッジ: 90%+
- 相乗効果スコア: 85%+
- ビルド成功率: 100%

### パフォーマンス測定
```bash
claude code "パフォーマンスメトリクスを測定してください"
```

## 🚫 避けるべきアンチパターン

### ❌ 型安全性違反
```typescript
// NG: any の使用
function process(data: any) { }

// OK: 適切な型定義
interface ProcessData {
  id: string;
  value: number;
}
function process(data: ProcessData) { }
```

### ❌ テスト後回し
```bash
# NG: 実装後テスト
claude code "実装を作成してください。テストは後で。"

# OK: TDD
claude code "TDDで実装してください"
```

### ❌ 品質チェック省略
```bash
# NG: 品質チェック省略
claude code "速攻で実装してください"

# OK: 品質重視
claude code "/dev"
```

## 🎯 高度な使用例

### カスタムワークフロー
```bash
# 特定エージェント組み合わせ
claude code "test → typesafe → architect → review の順序で実行してください"
```

### 段階的リファクタリング
```bash
claude code "レガシーコードを段階的にリファクタリングしてください"
```

### API設計特化
```bash
claude code "型安全なREST APIを設計・実装してください"
```

## 📞 サポート・トラブルシューティング

### よくある問題

#### Claude Code応答なし
```bash
# エージェント状態確認
claude code "tracker で現在の状況を確認してください"
```

#### 品質チェック失敗
```bash
# 詳細エラー分析
claude code "qa で詳細なエラー分析をしてください"
```

#### パフォーマンス問題
```bash
# パフォーマンス診断
claude code "perf で詳細なパフォーマンス分析をしてください"
```

---

**🚀 効果的な開発を！**

次は [`architecture.md`](architecture.md) でシステム詳細を確認してください。