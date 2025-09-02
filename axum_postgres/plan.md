# axum_postgres 開発計画

## プロジェクト概要

この文書では、`hono_postgres` プロジェクトをベースに、バックエンドを **Rust + Axum** に移植し、インフラを **AWS Lambda** から **AWS ECS** に変更した `axum_postgres` プロジェクトの開発計画を定義します。

## 移行概要

### 元プロジェクト（hono_postgres）の分析結果

#### 技術スタック
- **Backend**: Hono + Node.js + TypeScript
- **Database**: PostgreSQL + Kysely (Type-safe SQL builder)
- **Frontend**: Vue.js 3 + TypeScript + Vite
- **Infrastructure**: Docker Compose (開発) + AWS Lambda (本番想定)
- **API**: OpenAPI/Swagger仕様
- **Validation**: Zod schemas

#### 主要機能
- ユーザー管理 (CRUD操作)
- Google OAuth認証
- チーム管理
- プロダクト管理
- プロジェクト管理（ウォーターフォールモデル）
- レビューシステム
- パフォーマンス分析
- Slack通知

#### API エンドポイント
- `GET /health` - ヘルスチェック
- `GET /api/hello` - Hello API
- `GET /api/db-test` - データベース接続テスト
- `GET /api/users` - ユーザー一覧取得
- `GET /api/users/{id}` - ユーザー詳細取得
- `POST /api/users` - ユーザー作成
- `PUT /api/users/{id}` - ユーザー更新
- `DELETE /api/users/{id}` - ユーザー削除
- `GET /doc` - OpenAPI仕様書
- `GET /swagger-ui` - Swagger UI

#### データベーススキーマ
```sql
CREATE TABLE test_users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);
```

### 新プロジェクト（axum_postgres）の目標

#### 技術スタック変更
- **Backend**: Rust + Axum + Tokio
- **Database**: PostgreSQL + sqlx (Rust用async SQLライブラリ)
- **Frontend**: Vue.js 3 + TypeScript + Vite（**変更なし**）
- **Infrastructure**: Docker Compose (開発) + AWS ECS + Fargate
- **API**: OpenAPI仕様（utoipa使用）
- **Validation**: serde + validator

#### インフラ変更の理由
- **ECSの利点**:
  - 長時間実行プロセスに適している
  - WebSocketサポート
  - より複雑なバックグラウンド処理に対応
  - コンテナベースでスケーラビリティと移植性が高い
  - Lambdaの制約（実行時間、メモリ、冷たい起動）がない

#### 言語変更の理由
- **Rustの利点**:
  - メモリ安全性とパフォーマンス
  - 型安全性と concurrent processing
  - エコシステムの成熟（Axum, sqlx, tokio）
  - ECSでの長時間実行に適している

## アーキテクチャ設計

### ディレクトリ構造 (Polyglot Monorepo)

```
axum_postgres/
├── apps/
│   ├── backend/           # Rust + Axum バックエンド
│   │   ├── src/
│   │   │   ├── handlers/  # HTTP ハンドラー
│   │   │   ├── models/    # データモデル
│   │   │   ├── schemas/   # リクエスト/レスポンススキーマ
│   │   │   ├── db/        # データベース操作
│   │   │   ├── middleware/ # ミドルウェア
│   │   │   ├── utils/     # ユーティリティ
│   │   │   ├── main.rs    # メインエントリーポイント
│   │   │   └── lib.rs     # ライブラリルート
│   │   ├── tests/         # テストコード
│   │   ├── migrations/    # データベースマイグレーション
│   │   ├── Cargo.toml     # Rust依存関係
│   │   └── Dockerfile     # コンテナ化
│   └── frontend/          # Vue.js フロントエンド（hono_postgresから移植）
├── packages/              # 共有パッケージ（Polyglot対応）
│   ├── openapi-spec/      # OpenAPI仕様書（単一真理源）
│   │   ├── generated/     # 自動生成ファイル
│   │   ├── openapi.json   # Rustから生成されるOpenAPI仕様
│   │   └── package.json   # TypeScript型生成スクリプト
│   ├── codegen/           # コード生成ツール
│   │   ├── rust-to-openapi.rs  # Rust → OpenAPI生成
│   │   ├── openapi-to-ts.js    # OpenAPI → TypeScript型生成
│   │   └── sync-types.sh       # 型同期スクリプト
│   ├── shared-config/     # 言語非依存設定
│   │   ├── database.json  # データベース設定
│   │   ├── api-config.json # API設定
│   │   └── docker-compose.base.yml
│   └── dev-tools/         # 開発支援ツール
│       ├── scripts/       # ビルドスクリプト
│       ├── linting/       # 共通リント設定
│       └── testing/       # テストユーティリティ
├── infra/                 # AWS ECS + CDK インフラコード
├── docker/                # Docker設定ファイル
├── docs/                  # プロジェクトドキュメント
├── Cargo.toml            # Rust workspace設定
├── package.json          # TypeScript workspace設定
├── Makefile              # 統合ビルドスクリプト
├── plan.md               # 本ファイル
└── README.md             # プロジェクト概要
```

### 多言語依存関係管理

#### Rust Workspace (Cargo.toml)
```toml
[workspace]
members = [
    "apps/backend",
    "packages/codegen"  # Rustベースのコード生成ツール
]

[workspace.dependencies]
# 共通依存関係
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
```

#### TypeScript Workspace (package.json)  
```json
{
  "workspaces": [
    "apps/frontend",
    "packages/openapi-spec",
    "packages/dev-tools",
    "infra"
  ]
}
```

### 型安全性の実現

1. **Rust → OpenAPI**: `utoipa-axum` で自動生成
2. **OpenAPI → TypeScript**: `openapi-typescript` で型定義生成  
3. **同期メカニズム**: `make sync-types` で両方向同期

### 主要依存関係（Rust）

```toml
[dependencies]
# Web framework
axum = "0.7"
tokio = { version = "1.0", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.4", features = ["cors"] }

# Database
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "postgres", "uuid", "chrono"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Validation
validator = { version = "0.16", features = ["derive"] }

# API Documentation
utoipa = { version = "4.0", features = ["axum_extras", "chrono", "uuid"] }
utoipa-axum = { version = "0.1", features = ["debug"] }
utoipa-swagger-ui = { version = "4.0", features = ["axum"] }

# Configuration
config = "0.13"
dotenvy = "0.15"

# Logging
tracing = "0.1"
tracing-subscriber = "0.3"

# UUID
uuid = { version = "1.0", features = ["v4", "serde"] }

# Time
chrono = { version = "0.4", features = ["serde"] }

# Error handling
anyhow = "1.0"
thiserror = "1.0"
```

## 実装フェーズ

### Phase 1: プロジェクト基盤構築（1-2週間）

#### 1.1 Rust プロジェクト初期化
- [x] ディレクトリ構造作成
- [ ] `Cargo.toml` の設定
- [ ] 基本的な依存関係の追加
- [ ] プロジェクト設定ファイル（`.env`, `config/`）

#### 1.2 開発環境構築
- [ ] Docker Compose設定（PostgreSQL + Rust backend + Vue frontend）
- [ ] Dockerfile作成（マルチステージビルド）
- [ ] 開発用スクリプト作成
- [ ] ホットリロード設定

#### 1.3 データベース設定
- [ ] PostgreSQL接続設定
- [ ] sqlx migration システム構築
- [ ] 既存スキーマ（`test_users`）の移植
- [ ] 接続プール設定

#### 1.4 基本Webサーバー構築
- [ ] Axum アプリケーション初期化
- [ ] 基本ルーター設定
- [ ] CORS ミドルウェア
- [ ] ログ設定（tracing）
- [ ] ヘルスチェックエンドポイント

#### 1.5 Polyglot Monorepo構築
- [ ] `Cargo.toml` workspace設定（Rust部分）
- [ ] `package.json` workspace設定（TypeScript部分）
- [ ] `packages/openapi-spec` 初期化
  - [ ] package.json作成
  - [ ] TypeScript型生成スクリプト
  - [ ] `.gitignore` 設定（generated/除外）
- [ ] `packages/codegen` 構築
  - [ ] Rust → OpenAPI変換ツール
  - [ ] OpenAPI → TypeScript変換ツール
  - [ ] 型同期スクリプト (`sync-types.sh`)
- [ ] `Makefile` 作成
  - [ ] `make sync-types` - 型同期コマンド
  - [ ] `make dev` - 開発サーバー起動
  - [ ] `make build` - 全体ビルド
  - [ ] `make test` - 全体テスト
- [ ] `packages/shared-config` 初期化
  - [ ] データベース設定共通化
  - [ ] Docker Compose設定共通化

### Phase 2: コア API 実装（2-3週間）

#### 2.1 データモデル定義
- [ ] User モデル（`models/user.rs`）
- [ ] データベーススキーマとの対応
- [ ] シリアライゼーション設定

#### 2.2 バリデーション実装
- [ ] リクエストスキーマ（`schemas/user.rs`）
- [ ] バリデーションルール定義
- [ ] エラーハンドリング

#### 2.3 データベース操作層
- [ ] User repository (`db/user.rs`)
- [ ] CRUD操作実装
- [ ] トランザクション管理
- [ ] エラーハンドリング

#### 2.4 HTTP ハンドラー実装
- [ ] `handlers/user.rs` - ユーザーCRUD API
- [ ] `handlers/health.rs` - ヘルスチェック
- [ ] `handlers/db_test.rs` - データベーステスト
- [ ] レスポンス型定義

#### 2.5 API ドキュメンテーション
- [ ] utoipa-axum 統合設定
- [ ] APIエンドポイントへの #[utoipa::path] アノテーション追加
- [ ] OpenAPI仕様自動生成（utoipa + utoipa-axum）
- [ ] Swagger UI統合（utoipa-swagger-ui）
- [ ] API文書の自動更新設定

### Phase 3: インフラストラクチャ実装（2-3週間）

#### 3.1 AWS ECS設定
- [ ] ECS Cluster作成
- [ ] Task Definition作成
- [ ] Service Definition作成
- [ ] Application Load Balancer設定

#### 3.2 AWS インフラ自動化
- [ ] AWS CDK プロジェクト作成（TypeScript）
- [ ] VPC、Subnets設定
- [ ] RDS PostgreSQL設定
- [ ] ECS Service設定
- [ ] CloudWatch ログ設定

#### 3.3 CI/CD パイプライン
- [ ] GitHub Actions設定
- [ ] Docker image build & push
- [ ] ECS deployment自動化
- [ ] 環境変数管理

#### 3.4 モニタリング & ログ
- [ ] CloudWatch integration
- [ ] アプリケーションメトリクス
- [ ] ヘルスチェック設定
- [ ] アラート設定

### Phase 4: フロントエンド統合（1週間）

#### 4.1 フロントエンド移植
- [ ] `hono_postgres/apps/frontend` からファイルコピー
- [ ] API エンドポイント更新（必要に応じて）
- [ ] 型定義更新
- [ ] 動作確認

#### 4.2 フロントエンド Docker化
- [ ] Dockerfile作成
- [ ] nginx設定
- [ ] 本番用ビルド設定

### Phase 5: テスト & 品質保証（1-2週間）

#### 5.1 ユニットテスト
- [ ] `tests/` ディレクトリ構築
- [ ] データベース操作テスト
- [ ] ハンドラーテスト
- [ ] モデルバリデーションテスト

#### 5.2 統合テスト
- [ ] API統合テスト
- [ ] データベーステスト
- [ ] E2E テスト（可能であれば）

#### 5.3 パフォーマンステスト
- [ ] 負荷テスト
- [ ] メモリ使用量測定
- [ ] レスポンス時間測定

### Phase 6: 本格機能実装（今後の拡張）

#### 6.1 認証システム
- [ ] Google OAuth2 統合
- [ ] JWT トークン管理
- [ ] ミドルウェア実装

#### 6.2 高度な機能
- [ ] チーム管理 API
- [ ] プロジェクト管理 API
- [ ] レビューシステム API
- [ ] 通知システム

## 技術的考慮事項

### Polyglot Monorepo管理戦略

#### 型安全性の実現
```bash
# 開発ワークフロー
1. Rustでバックエンド開発 (utoipa-axumアノテーション付き)
2. make sync-types でOpenAPI仕様生成 → TypeScript型生成
3. フロントエンドで生成された型を使用

# 例：型同期フロー
cargo run --bin generate-openapi > packages/openapi-spec/openapi.json
cd packages/openapi-spec && npm run generate-types
```

#### ビルドシステム統合
```makefile
# Makefile例
.PHONY: dev build test sync-types

dev:
	make sync-types
	docker-compose up -d
	
build:
	cargo build --workspace
	cd packages/openapi-spec && npm run build
	cd apps/frontend && npm run build
	
sync-types:
	cargo run --bin generate-openapi > packages/openapi-spec/openapi.json
	cd packages/openapi-spec && npm run generate-types
	
test:
	cargo test --workspace
	cd apps/frontend && npm run test
```

#### 依存関係管理
- **Rust部分**: `Cargo.toml` workspace + 共通依存関係管理
- **TypeScript部分**: `package.json` workspace + 共通devDependencies
- **型定義**: OpenAPI仕様書を単一真理源として活用

### データベースマイグレーション戦略
1. **sqlx-cli** を使用してマイグレーションファイル管理
2. 既存の `test_users` テーブル構造を維持
3. マイグレーションは本番環境で安全に実行できるよう設計

### エラーハンドリング戦略
```rust
// カスタムエラー型定義
#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Validation error: {0}")]
    Validation(String),
    
    #[error("Not found")]
    NotFound,
}

// Axum エラーレスポンス変換
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        // エラーをJSONレスポンスに変換
    }
}
```

### パフォーマンス最適化
- **Connection Pooling**: sqlx connection pool
- **Async Processing**: Tokio を活用した非同期処理
- **Caching**: 必要に応じてRedis導入検討
- **Resource Limits**: ECS task定義での適切なリソース制限

### セキュリティ考慮事項
- **Input Validation**: serde + validator を使用
- **SQL Injection Prevention**: sqlx の準備済みステートメント
- **CORS**: tower-http CORS ミドルウェア
- **Environment Variables**: 機密情報の環境変数化

## 開発体制・ツール

### 必要なツール
- **Rust**: 1.75+ (stable)
- **Docker & Docker Compose**
- **AWS CLI**: ECS操作用
- **sqlx-cli**: マイグレーション実行
- **Node.js**: フロントエンド開発用

### 開発フロー
1. **Local Development**: Docker Compose
2. **Testing**: cargo test + integration tests
3. **CI/CD**: GitHub Actions
4. **Deployment**: AWS ECS via CDK

### 品質管理
- **Linting**: clippy
- **Formatting**: rustfmt
- **Documentation**: cargo doc
- **Coverage**: cargo tarpaulin（オプション）

## 期待される成果

### パフォーマンス向上
- **Memory Safety**: Rustの所有権システム
- **Concurrency**: Tokio の async/await
- **Lower Resource Usage**: コンパイル型言語の利点

### 運用面の改善
- **Container Native**: ECS での native 実行
- **Scalability**: ECS Auto Scaling
- **Observability**: AWS CloudWatch 統合

### 開発体験向上
- **Type Safety**: Rustの型システム
- **Compile-time Guarantees**: コンパイル時エラー検出
- **Rich Ecosystem**: Rust webアプリケーションエコシステム

## リスク & 軽減策

### 技術的リスク
- **学習コストが高い**: Rustの習得に時間がかかる
  - 軽減策: 段階的な実装、豊富なドキュメント作成
- **デバッグ複雑性**: async Rustのデバッグは複雑
  - 軽減策: 豊富なログ、テストカバレッジ

### 運用リスク
- **ECS運用経験不足**: Lambda と異なる運用モデル
  - 軽減策: 十分な検証環境、モニタリング強化
- **コスト増加**: 常時稼働による
  - 軽減策: 適切なオートスケーリング設定

## 成功指標

### 技術指標
- [ ] API レスポンス時間: < 100ms（95%tile）
- [ ] メモリ使用量: < 512MB（通常運用時）
- [ ] コンテナ起動時間: < 30秒
- [ ] テストカバレッジ: > 80%

### 機能指標
- [ ] 全API エンドポイントが正常動作
- [ ] データベース操作が型安全に実行
- [ ] 本番環境でのゼロダウンタイムデプロイ
- [ ] フロントエンドとの完全互換性

## 今後の拡張予定

1. **認証・認可システム** (Google OAuth)
2. **Websocket サポート** (リアルタイム通知)
3. **GraphQL API** (柔軟なデータ取得)
4. **Microservices 分割** (チーム・プロジェクト管理の分離)
5. **Event-driven Architecture** (非同期処理)

---

**作成日**: 2025年9月2日  
**更新日**: 2025年9月2日  
**作成者**: Claude Code  
**版数**: v1.0