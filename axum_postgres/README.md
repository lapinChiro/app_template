# axum_postgres

Rust + Axum + PostgreSQLで構築するプロジェクト管理システム。hono_postgresをRustで再実装したものです。

## Quick Start

### 1. PostgreSQL起動

```bash
# PostgreSQLコンテナを起動
docker-compose up -d postgres

# 接続確認
./scripts/check_db.sh
```

### 2. Rustアプリケーション起動

```bash
# バックエンドディレクトリに移動
cd apps/backend

# 開発用サーバー起動
cargo run

# またはリリース版でビルド後起動
cargo build --release
./target/release/backend
```

### 3. 動作確認

```bash
# ヘルスチェック
curl http://localhost:3000

# レスポンス: "Hello, World!"
```

## アーキテクチャ

- **Backend**: Rust + Axum + sqlx + PostgreSQL
- **Database**: PostgreSQL 17 (Docker)
- **API**: RESTful API with OpenAPI specification
- **Type Safety**: Rust → OpenAPI → TypeScript type sync

## 開発環境

### 必要なツール

- Rust 1.75+
- Docker + Docker Compose  
- PostgreSQL Client (psql)

### データベース設定

- **Host**: localhost
- **Port**: 5435
- **Database**: dev
- **User**: postgres
- **Password**: password
- **Connection String**: `postgresql://postgres:password@localhost:5435/dev`

### 環境変数

```bash
# .env.example をコピーして設定
DATABASE_URL=postgresql://postgres:password@localhost:5435/dev
PORT=3000
RUST_ENV=development
RUST_LOG=info
```

## プロジェクト構造

```
axum_postgres/
├── apps/backend/           # Rust + Axum アプリケーション
├── docs/                   # 分析・仕様ドキュメント  
├── scripts/                # 管理スクリプト
├── docker-compose.yml      # PostgreSQL環境
└── progress.md             # 開発進捗管理
```

## 開発フロー

### 1. データベース操作

```bash
# PostgreSQL起動
docker-compose up -d postgres

# データベースヘルスチェック
./scripts/check_db.sh

# PostgreSQL停止
docker-compose down
```

### 2. Rust開発

```bash
cd apps/backend

# 依存関係更新
cargo update

# 開発用起動（ファイル監視付き）  
cargo install cargo-watch
cargo watch -x run

# コード品質チェック
cargo check
cargo clippy
cargo fmt
```

### 3. テスト実行

```bash
# 単体テスト
cargo test

# 統合テスト
cargo test --test integration

# データベーステスト
cargo test --test db_test
```

## API仕様

API仕様の詳細は以下を参照：

- `docs/api_specification.md` - 全エンドポイント仕様
- `docs/database_schema.sql` - データベーススキーマ
- `docs/environment_variables.md` - 環境変数一覧

### 主要エンドポイント

- `GET /health` - ヘルスチェック
- `GET /api/users` - ユーザー一覧
- `POST /api/users` - ユーザー作成
- `GET /api/users/{id}` - ユーザー詳細
- `PUT /api/users/{id}` - ユーザー更新
- `DELETE /api/users/{id}` - ユーザー削除

## トラブルシューティング

### PostgreSQL接続エラー

```bash
# コンテナ状態確認
docker-compose ps

# ログ確認  
docker-compose logs postgres

# 接続テスト
./scripts/check_db.sh
```

### Rustビルドエラー

```bash
# キャッシュクリア
cargo clean

# 依存関係更新
cargo update

# 再ビルド
cargo build
```

### ポート競合

```bash
# 使用中ポート確認
lsof -i :3000
lsof -i :5435

# docker-compose.ymlでポート番号変更
```

## 関連リンク

- [Axum Web Framework](https://github.com/tokio-rs/axum)
- [sqlx Database Toolkit](https://github.com/launchbadge/sqlx)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose](https://docs.docker.com/compose/)
