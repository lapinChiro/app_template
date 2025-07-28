# Development Tasks

このディレクトリには、Ultimate Type Safety Serverless Template の開発タスクが整理されています。

## Overview

各タスクは明確な前提条件、完了条件、品質基準を持ち、`@docs/impl/` の実装ドキュメントを参照して一貫性のある開発を保証します。

## Directory Structure

```
tasks/
├── 01-foundation-setup/        # 基盤となる開発環境構築
├── 02-core-infrastructure/     # 共有ライブラリとコア機能
├── 03-authentication-system/   # 認証システム実装
├── 04-frontend-applications/   # フロントエンドアプリケーション
├── 05-api-implementation/      # API実装
├── 06-testing-infrastructure/  # テスト環境構築
├── 07-infrastructure-as-code/  # CDKインフラストラクチャ
├── 08-cicd-automation/        # CI/CDと自動化
├── README.md                  # このファイル
└── TASK_INDEX.md             # 全タスクのインデックス
```

## Task Format

各タスクファイルには以下の情報が含まれています：

1. **Prerequisites** - 必要な環境・ツール・知識
2. **Reference Implementation** - `@docs/impl/` への参照
3. **Acceptance Criteria** - 明確で測定可能な完了条件
4. **Detailed Implementation** - 実装の詳細とコード例
5. **Quality Gates** - 品質基準と数値目標
6. **Verification Steps** - 検証手順とコマンド
7. **Progress** - タスクの進捗状況

## Getting Started

1. **Phase 1: Foundation Setup** から開始
   - 01-01: Project Structure Setup
   - 01-02: TypeScript Configuration
   - 01-03: ESLint Ultimate Type Safety
   - 01-04: Docker Development Environment

2. 各タスクの **Dependencies** を確認し、依存タスクが完了していることを確認

3. **Reference Implementation** のドキュメントを読み、実装方針を理解

4. **Acceptance Criteria** に従って実装を進める

5. **Verification Steps** で動作確認を行う

## Quality Standards

全タスクは以下の品質基準を満たす必要があります：

- **Type Safety**: any 型使用箇所 0
- **Code Quality**: ESLint/TypeScript エラー 0
- **Test Coverage**: 90% 以上
- **Documentation**: 完全な TSDoc コメント

## Task Dependencies

タスク間の依存関係は各タスクファイルの **Dependencies** セクションに記載されています。
並列実行可能なタスクは同時に進めることができます。

## Progress Tracking

各タスクの **Progress** セクションでチェックリストを使用して進捗を管理：

- [ ] Started - タスク開始
- [ ] Implementation complete - 実装完了
- [ ] Verified - 動作確認完了
- [ ] Documented - ドキュメント作成完了

## Support

実装で困った場合は：

1. `@docs/impl/` の実装ドキュメントを参照
2. `@.claude/agents/` のサブエージェントを活用
3. `@design.md` で全体の設計思想を確認

## Next Steps

1. [TASK_INDEX.md](./TASK_INDEX.md) で全タスクの一覧を確認
2. Phase 1 のタスクから順番に実装を開始
3. 各フェーズ完了時に品質チェックを実施