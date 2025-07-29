# 🚀 TypeScript Serverless Development Environment

**Claude Code自動化環境** for TypeScript + Next.js + AWS Lambda + CDK

世界最高レベルの開発自動化システム。要件定義から本番デプロイまで完全自動化。

## ⚡ Quick Start

### 📝 事前準備（利用者が作成）

**必須：**
1. **requirement.md** - プロジェクトの要件定義書
2. **design.md** - 技術設計書（アーキテクチャ、実装方針、docs/impl/への参照）
3. **tasks/** - 設計を元に分割した開発タスク

**任意（推奨）：**
- **docs/impl/** - 実装パターン例（design.mdから参照される場合）
- **progress/** - 空ディレクトリ（自動的にファイルが生成されます）

これらを準備後、以下のコマンドで開発を開始：

```bash
# 環境取得
git clone <this-repo> my-serverless-app
cd my-serverless-app

# 開発実行（自動的にタスクを選択・実装）
claude code "/dev"
```

**🎯 /devコマンドが自動的にtasks/からタスクを選択し、TDDで高品質な実装を行います**

## 🌟 特徴

### 💎 究極の型安全性
- **8レベル型安全性システム**: `any` 完全排除
- **ゼロランタイムエラー**: 全エラーをコンパイル時に検出
- **Branded Types**: ビジネスロジック安全性

### 🤖 完全自動化開発
- **12-SubAgent システム**: TDD、コードレビュー、セキュリティ監査
- **6キーワード最適化**: 15ペア相乗効果による品質向上
- **品質ゲート**: 各フェーズでの自動エラー修正

### 🏗️ TypeScript サーバレス特化
- **Next.js フロントエンド**
- **AWS Lambda バックエンド** 
- **CDK インフラ**
- **モノレポ対応**

## 🎯 対象技術スタック

```yaml
Frontend: Next.js + React + TypeScript
Backend: AWS Lambda + TypeScript  
Infrastructure: AWS CDK + TypeScript
Testing: Jest + Testing Library
Quality: ESLint + Prettier + Husky
```

## 📋 自動化機能

### 🔄 TDD自動化
```bash
# RED → GREEN → BLUE サイクル完全自動化
claude code "新機能を TDD で実装してください"
```

### 🛡️ セキュリティ監査
```bash
# OWASP Top 10 自動チェック
claude code "セキュリティ監査を実行してください"
```

### 📊 品質管理
```bash
# コード品質・複雑性・型安全性自動チェック
claude code "コード品質をレビューしてください"
```

## 🧠 6キーワード最適化システム

### Phase 1: Solution Research
- **Don't Reinvent the Wheel**: 既存ソリューション活用

### Phase 2: Design Foundation  
- **UNIX philosophy**: モジュラー設計
- **KISS principle**: 簡潔性重視
- **Effective TypeScript**: 型ファースト設計

### Phase 3: Implementation Quality
- **DRY principle**: 重複排除
- **Orthogonality**: 独立性確保

### 🔗 15ペア相乗効果
各キーワードの組み合わせが創発的品質向上を実現

## 🤖 SubAgent一覧

| Agent | 機能 | 用途 |
|-------|------|------|
| `test` | TDD自動化 | RED-GREEN-BLUE cycle |
| `typesafe` | 8レベル型安全性 | `any` 排除、型安全性強制 |
| `review` | コードレビュー | SOLID原則、15ペア相乗効果 |
| `architect` | アーキテクチャ | Clean Architecture検証 |
| `security` | セキュリティ | OWASP Top 10監査 |
| `qa` | 品質保証 | 総合品質チェック |
| `perf` | パフォーマンス | Core Web Vitals最適化 |
| `monorepo` | モノレポ | 依存関係分析 |
| `docker` | Docker | コンテナ最適化 |
| `debug` | デバッグ | 体系的デバッグ |
| `guide` | 実装ガイド | ベストプラクティス |
| `tracker` | 進捗管理 | タスク・プログレス追跡 |

## 📖 使用例

### 🆕 新機能開発
```bash
claude code "ユーザー認証機能を実装してください"
```

### 🔧 既存機能改善
```bash
claude code "パフォーマンスを最適化してください"
```

### 🐛 バグ修正
```bash
claude code "この TypeScript エラーを修正してください"
```

### 🚀 デプロイ準備
```bash
claude code "本番デプロイの準備をしてください"
```

## ⚙️ 品質設定（実装済み）

### TypeScript設定
厳格な型チェックを有効にした `tsconfig.json` を使用：
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### ESLint設定
本テンプレートには厳格な ESLint 設定 (`eslint.config.js`) が含まれています。

**7層型安全性アーキテクチャ:**
- Layer 1: 完全な `any` 排除
- Layer 2: 関数境界の安全性
- Layer 3: Null/Undefined 完全安全性
- Layer 4: Promise/Async 完全安全性
- Layer 5: コード品質ゲート（複雑度制限）
- Layer 6: ドキュメント強制
- Layer 7: 依存関係管理

### モノレポ構成
各アプリケーションはルートの設定を継承し、必要に応じて拡張できます。

### テストカバレッジ基準
本プロジェクトでは段階的なテストカバレッジ基準を設定しています。

**詳細は `@docs/development/coverage-standards.md` を参照してください。**

> **注意**: 現在、Huskyプリコミットフックとの互換性のため、vitest.config.tsの設定値は一時的に下げています。  
> 本来の基準値は上記ドキュメントに記載されています。

**現在の実績と目標:**
- `packages/shared`: 71.89% (Phase 1目標: 70% ✅)
- `packages/ui`: 46.93% (Phase 1目標: 40% ✅)

```bash
# カバレッジレポートの生成
npm run test:coverage
```

## 📁 必須ディレクトリ構成

このテンプレートは以下のディレクトリ構成を前提としています：

```
my-serverless-app/
├── requirement.md   # 要件定義書（プロジェクトの目的・機能要件・非機能要件）
├── design.md        # 設計書（アーキテクチャ・技術選定・実装方針）
├── tasks/           # タスク分割（設計を元に分割された開発タスク）
│   ├── 01-setup-infrastructure.md
│   ├── 02-implement-auth.md
│   ├── 03-create-api-endpoints.md
│   └── ...
├── progress/        # タスク進捗管理（/dev実行時の進捗追跡）
│   ├── 01-setup.md  # 各タスクの実装記録・品質メトリクス
│   ├── 02-auth.md   # trackerエージェントが自動更新
│   └── ...
├── .claude/         # Claude Code設定（テンプレートに含まれる）
│   └── agents/      # 12 SubAgent定義
│       └── README.md
├── docs/
│   ├── impl/       # 実装例・パターン集（利用者がdesign.md作成時に作成）
│   │   ├── auth-jwt-example.ts    # guideエージェントが参照
│   │   ├── lambda-handler-pattern.ts
│   │   └── type-safe-api.ts
│   ├── usage.md
│   ├── architecture.md
│   └── synergy-effects.md
├── CLAUDE.md        # Claude Code動作設定
├── prompt.md        # /dev実行時のプロンプト
├── eslint.config.js # 7層型安全性ESLint設定（モノレポ共通）
├── tsconfig.json    # TypeScript設定（strict mode）
├── package.json     # ワークスペース定義
└── src/            # ソースコード（実際の実装）
```

### 開発フローの各ファイル・ディレクトリ

#### requirement.md
- **役割**: プロジェクトの要件定義
- **内容**: ビジネス要件、機能要件、非機能要件、制約事項
- **作成時期**: プロジェクト開始時

#### design.md  
- **役割**: 技術設計書
- **内容**: アーキテクチャ、技術選定、実装方針、docs/impl/への参照
- **作成時期**: requirement.md完成後

#### tasks/ディレクトリ
- **役割**: 開発タスクの分割・管理
- **内容**: design.mdを元に分割された具体的なタスク
- **参照**: 必要に応じてdocs/impl/の実装例へのパスを含む

#### docs/impl/ディレクトリ
- **役割**: 実装例・パターンのサンプルコード
- **内容**: 利用者がdesign.md作成時に作成する具体的な実装例
- **参照元**: design.md、tasks/の各タスクファイル
- **作成者**: 利用者（任意だが推奨）

#### progress/ディレクトリ
- **役割**: /dev実行時のタスク進捗管理
- **形式**: YAML frontmatter付きMarkdown
- **自動更新**: `tracker`エージェントが管理
- **重要ファイル**:
  - `SUMMARY.md` - プロジェクト全体の進捗サマリー（自動更新）
  - `IN_PROGRESS.md` - 現在作業中のタスク（中断検出用）
- **自動記録内容**:
  - タスクID、ステータス、実行時間
  - 修正ファイル一覧と変更内容
  - 品質メトリクス（ESLint/TypeScriptエラー数）
  - 技術的決定事項
  - 作業の開始・中断・再開履歴

## 📚 詳細ドキュメント

- [`docs/usage.md`](docs/usage.md) - 使用方法・ベストプラクティス  
- [`docs/architecture.md`](docs/architecture.md) - システムアーキテクチャ
- [`docs/synergy-effects.md`](docs/synergy-effects.md) - 15ペア相乗効果詳細

## 🎯 開発フロー

```mermaid
graph TB
    A[requirement.md 作成<br/>（利用者）] --> B[design.md 作成<br/>（利用者）]
    B --> C[tasks/ にタスク分割<br/>（利用者）]
    C --> D[/dev 実行]
    D --> E[Task Selection<br/>（tracker）]
    E --> F[TDD Red]
    F --> G[TDD Green]
    G --> H[Quality Check]
    H --> I[TDD Blue]
    I --> J[Task Complete]
    J --> D
    J --> K[All Tasks Done]
    K --> L[Deploy Ready]
```

### 📝 フェーズ別詳細

1. **要件定義フェーズ**
   - `requirement.md` でビジネス要件・機能要件を明確化
   - ユーザーストーリー・受入基準の定義

2. **設計フェーズ**
   - `design.md` でアーキテクチャ・技術選定を決定
   - 必要な実装パターンを `docs/impl/` に作成
   - 設計書から実装例への参照パスを記載

3. **タスク分割フェーズ**
   - 設計を実装可能な単位に分割して `tasks/` へ
   - 各タスクに依存関係・実装方針を記載
   - 必要に応じて `docs/impl/` の実装例を参照

4. **開発実行フェーズ（/dev）**
   - `progress/SUMMARY.md` で全体進捗を確認
   - `progress/IN_PROGRESS.md` で中断作業をチェック
   - `tracker` エージェントが最適なタスクを選択
   - 作業開始時に `IN_PROGRESS.md` に記録
   - TDD サイクルで品質を保証しながら実装
   - 作業完了時に `IN_PROGRESS.md` から削除
   - `progress/` に詳細な進捗を自動記録

## 💡 トラブルシューティング

### TypeScript エラー
```bash
claude code "TypeScript エラーを修正してください"
```

### ビルドエラー  
```bash
claude code "ビルドエラーを解決してください"
```

### パフォーマンス問題
```bash
claude code "パフォーマンスを最適化してください"
```

## 🤝 コントリビューション

このプロジェクトは Claude Code 自動化環境のテンプレートです。
改善提案やバグ報告は Issue でお知らせください。

## 📄 ライセンス

MIT License

---

## 🎉 開発開始

### 1. 必須ファイルの準備
以下のファイル・ディレクトリを作成してください：

**必須ファイル：**
- **requirement.md** - ビジネス要件、機能要件、非機能要件を記載
- **design.md** - アーキテクチャ設計、技術選定、実装方針を記載
- **tasks/** - design.mdを元に実装タスクを分割（例: 01-setup.md, 02-auth.md）

**任意（推奨）：**
- **docs/impl/** - 設計時に作成した実装例・パターン集（design.mdとtasks/から参照）
- **progress/** - 空のディレクトリ（/dev実行時に自動的にファイルが作成されます）

**テンプレートに含まれるもの：**
- **.claude/agents/** - SubAgent定義（編集不要）
- **CLAUDE.md** - Claude Code動作設定
- **prompt.md** - /dev実行時のプロンプト
- **eslint.config.js** - 7層型安全性設定

### 2. 開発実行
```bash
claude code "/dev"
```

このコマンドで以下が自動実行されます：
- タスクの優先順位判定と選択
- TDDによる実装（RED→GREEN→BLUE）
- 品質チェックとレビュー
- 進捗の自動記録

**世界最高の TypeScript サーバレス開発体験をお楽しみください！**