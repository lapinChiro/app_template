# axum_postgres 実行可能タスク一覧

## 前提条件・環境要件

### 開発環境

- **OS**: Linux/macOS (Windows WSL2)
- **Rust**: 1.75+ (`rustup`, `cargo`, `clippy`, `rustfmt`)
- **Node.js**: 20.x+ (`npm`)
- **Docker**: 最新版 + Docker Compose
- **PostgreSQL Client**: `psql` コマンド
- **その他**: `git`, `curl`, `make`, `jq`

### 必要なCrates/Tools

```bash
cargo install sqlx-cli --features postgres
cargo install cargo-watch
npm install -g openapi-typescript
```

### スキルレベル定義

- **初級**: 言語基本構文、基本コマンド操作
- **中級**: フレームワーク使用経験、API設計理解
- **上級**: アーキテクチャ設計、パフォーマンス最適化

---

## Phase 0: 事前分析・準備

### T000: hono_postgres 既存実装分析

**目的**: 移植対象の詳細仕様を把握  
**前提条件**: hono_postgresディレクトリアクセス権限  
**依存関係**: なし  
**推定工数**: 1日  
**必要スキル**: 初級 (ファイル読解、API理解)

**作業内容**:

1. `hono_postgres/apps/backend/src/` 全体構造確認
2. データベーススキーマ定義抽出
3. API仕様書作成 (エンドポイント一覧)
4. 環境変数・設定値一覧作成

**完了条件**:

- [ ] `analysis_report.md` ファイル作成
- [ ] 全APIエンドポイント仕様表作成
- [ ] データベーススキーマDDL抽出
- [ ] 環境変数一覧表作成

**検証方法**:

```bash
# 既存システム動作確認
cd /home/kyohei/app_template/hono_postgres
docker-compose -f docker/compose.development.yml up -d
curl http://localhost:3000/api/users | jq
```

**成果物**:

- `/docs/analysis_report.md`
- `/docs/api_specification.md`
- `/docs/database_schema.sql`
- `/docs/environment_variables.md`

**リスク・対策**:

- リスク: 既存システムが起動しない
- 対策: ドキュメントとソースコードから仕様抽出

---

## Phase 1: プロジェクト基盤構築

### T101: Rust最小限プロジェクト作成

**目的**: 動作する最小限のRustプロジェクト作成  
**前提条件**: Rust開発環境構築済み  
**依存関係**: T000 (分析結果参照)  
**推定工数**: 0.5日  
**必要スキル**: 初級 (Rust基本、Cargo基本)

**作業内容**:

1. `cargo new apps/backend --name backend` 実行
2. 基本的な依存関係追加
3. Hello World HTTP サーバー実装
4. 手動動作確認

**完了条件**:

- [ ] `cargo run` でサーバー起動
- [ ] `http://localhost:3000` にアクセス可能
- [ ] "Hello, World!" レスポンス返却
- [ ] `cargo clippy` エラーなし
- [ ] `cargo fmt --check` エラーなし

**検証方法**:

```bash
cd apps/backend
cargo run &
SERVER_PID=$!
sleep 2
RESPONSE=$(curl -s http://localhost:3000)
kill $SERVER_PID
echo "Response: $RESPONSE"
[[ "$RESPONSE" == *"Hello"* ]] && echo "✅ Success" || echo "❌ Failed"
```

**成果物**:

- `/apps/backend/Cargo.toml`
- `/apps/backend/src/main.rs`
- `/apps/backend/src/lib.rs`

**設定例**:

```toml
[dependencies]
axum = "0.7"
tokio = { version = "1.0", features = ["full"] }
tower = "0.4"
```

---

### T102: PostgreSQL Docker環境構築

**目的**: 開発用PostgreSQL環境を構築  
**前提条件**: Docker, Docker Compose インストール済み  
**依存関係**: なし (T101と並行実行可能)  
**推定工数**: 0.5日  
**必要スキル**: 初級 (Docker基本、YAML)

**作業内容**:

1. `docker-compose.yml` 作成
2. PostgreSQL設定定義
3. 接続確認用スクリプト作成
4. データベース作成確認

**完了条件**:

- [ ] `docker-compose up -d postgres` でDB起動
- [ ] `psql` でDB接続成功
- [ ] `dev` データベース存在確認
- [ ] ヘルスチェッククエリ実行成功

**検証方法**:

```bash
docker-compose up -d postgres
sleep 10
DB_URL="postgresql://postgres:password@localhost:5435/dev"
psql "$DB_URL" -c "SELECT version();" 
echo "✅ PostgreSQL Ready"
```

**成果物**:

- `/docker-compose.yml`
- `/scripts/check_db.sh`
- `/README.md` (DB起動手順)

**設定例**:

```yaml
services:
  postgres:
    image: postgres:17
    ports: ["5435:5432"]
    environment:
      POSTGRES_DB: dev
      POSTGRES_USER: postgres  
      POSTGRES_PASSWORD: password
```

---

### T103: 基本Axumサーバー実装

**目的**: ルーティング・ミドルウェアを含む基本サーバー実装  
**前提条件**: T101完了  
**依存関係**: T101  
**推定工数**: 1日  
**必要スキル**: 初級 (Axum基本、HTTP基本)

**作業内容**:

1. Axum基本ルーター実装
2. CORS, ログミドルウェア追加
3. `/health` エンドポイント実装
4. エラーハンドリング基本構造実装

**完了条件**:

- [ ] `GET /health` が200レスポンス返却
- [ ] CORS設定でブラウザからアクセス可能
- [ ] アクセスログがコンソール出力される
- [ ] 存在しないエンドポイントで404レスポンス

**検証方法**:

```bash
cd apps/backend && cargo run &
SERVER_PID=$!
sleep 3

# Health check
curl -s http://localhost:3000/health | jq -e '.status == "ok"'

# CORS check  
curl -s -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS http://localhost:3000/health | grep -q "access-control"

# 404 check
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/nonexistent)
[[ "$STATUS" == "404" ]] && echo "✅ 404 OK"

kill $SERVER_PID
```

**成果物**:

- `/apps/backend/src/main.rs` (更新)
- `/apps/backend/src/handlers/mod.rs`
- `/apps/backend/src/handlers/health.rs`
- `/apps/backend/src/error.rs`

**コード例**:

```rust
// src/handlers/health.rs
use axum::{Json, response::IntoResponse};
use serde_json::{json, Value};

pub async fn health() -> impl IntoResponse {
    Json(json!({"status": "ok", "timestamp": chrono::Utc::now()}))
}
```

---

### T104: sqlx基本セットアップ

**目的**: データベース接続とマイグレーションシステム構築  
**前提条件**: T102, T103完了  
**依存関係**: T102, T103  
**推定工数**: 1日  
**必要スキル**: 中級 (sqlx基本、SQL、環境変数)

**作業内容**:

1. sqlx依存関係追加
2. データベース接続コード実装
3. 環境変数設定
4. 基本マイグレーション作成

**完了条件**:

- [ ] `DATABASE_URL` 環境変数で接続成功
- [ ] `sqlx migrate run` 実行成功
- [ ] 接続プールから基本クエリ実行成功
- [ ] `cargo sqlx prepare` 実行成功

**検証方法**:

```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5435/dev"
cd apps/backend

# マイグレーション実行
sqlx migrate run
echo "✅ Migration completed"

# 基本接続確認
cargo run --bin db_check
echo "✅ Database connection OK"

# Prepared queries
cargo sqlx prepare
echo "✅ sqlx prepare completed"
```

**成果物**:

- `/apps/backend/migrations/001_initial.sql`
- `/apps/backend/src/database.rs`
- `/apps/backend/src/bin/db_check.rs`
- `/apps/backend/.env.example`

**設定例**:

```rust
// src/database.rs
use sqlx::{PgPool, postgres::PgPoolOptions};

pub async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await
}
```

---

## Phase 2: データモデル実装

### T201: User データモデル実装

**目的**: User構造体とバリデーション実装  
**前提条件**: T000 (既存スキーマ分析完了), Rust構造体理解  
**依存関係**: T000  
**推定工数**: 1日  
**必要スキル**: 初級 (Rust struct, derive, serde)

**作業内容**:

1. `User` struct定義
2. serde シリアライゼーション設定  
3. バリデーション実装
4. 型変換ヘルパー実装

**完了条件**:

- [ ] `User` structコンパイル成功
- [ ] JSON シリアライゼーション動作確認
- [ ] バリデーション (email形式等) 動作確認
- [ ] 単体テスト全て通過

**検証方法**:

```bash
cd apps/backend
cargo test models::user
cargo test --doc models::user

# JSON serialization test
cargo run --bin test_user_serialization
```

**成果物**:

- `/apps/backend/src/models/mod.rs`
- `/apps/backend/src/models/user.rs`
- `/apps/backend/src/bin/test_user_serialization.rs`

**実装例**:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: i32,
    pub name: String,
    #[validate(email)]
    pub email: String,
    pub active: bool,
    pub created_at: DateTime<Utc>,
}
```

---

### T202: User データベース操作実装  

**目的**: User CRUD操作をsqlxで実装  
**前提条件**: T104, T201完了  
**依存関係**: T104, T201  
**推定工数**: 1.5日  
**必要スキル**: 中級 (async Rust, SQL, sqlx)

**作業内容**:

1. User repository trait定義
2. 各CRUD操作実装 (Create, Read, Update, Delete)
3. エラーハンドリング実装
4. データベース接続テスト実装

**完了条件**:

- [ ] `create_user` 関数動作確認
- [ ] `get_user_by_id` 関数動作確認  
- [ ] `update_user` 関数動作確認
- [ ] `delete_user` 関数動作確認
- [ ] `list_users` 関数動作確認
- [ ] 統合テスト全て通過

**検証方法**:

```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5435/dev"
cd apps/backend

# 統合テスト実行
cargo test --test user_repository_test

# 手動動作確認
cargo run --bin test_user_operations
```

**成果物**:

- `/apps/backend/src/repository/mod.rs`
- `/apps/backend/src/repository/user.rs`
- `/apps/backend/tests/user_repository_test.rs`
- `/apps/backend/src/bin/test_user_operations.rs`

**実装例**:

```rust
pub async fn create_user(pool: &PgPool, user: CreateUserRequest) -> Result<User, sqlx::Error> {
    sqlx::query_as!(
        User,
        "INSERT INTO test_users (name, email) VALUES ($1, $2) 
         RETURNING id, name, email, active, created_at",
        user.name, user.email
    )
    .fetch_one(pool)
    .await
}
```

---

## Phase 3: HTTP API実装

### T301: 基本APIハンドラー実装

**目的**: User CRUD APIエンドポイントをAxumで実装  
**前提条件**: T103, T202完了  
**依存関係**: T103, T202  
**推定工数**: 1.5日  
**必要スキル**: 中級 (Axum handlers, HTTP status codes, JSON)

**作業内容**:

1. Axum handler関数実装 (5つのエンドポイント)
2. リクエスト/レスポンス型定義
3. エラーハンドリング統合
4. ルーター統合

**完了条件**:

- [ ] `POST /api/users` (201作成, 400バリデーションエラー)
- [ ] `GET /api/users/{id}` (200取得, 404未発見)  
- [ ] `GET /api/users` (200一覧取得)
- [ ] `PUT /api/users/{id}` (200更新, 404未発見)
- [ ] `DELETE /api/users/{id}` (204削除, 404未発見)
- [ ] 各エンドポイントcurlテスト通過

**検証方法**:

```bash
cd apps/backend && cargo run &
SERVER_PID=$!
sleep 3

# Create user
USER_ID=$(curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}' | jq -r '.id')

# Get user  
curl -s http://localhost:3000/api/users/$USER_ID | jq -e '.name == "Test User"'

# Update user
curl -s -X PUT http://localhost:3000/api/users/$USER_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated User","email":"updated@example.com"}' | jq -e '.name == "Updated User"'

# List users
curl -s http://localhost:3000/api/users | jq -e 'length > 0'

# Delete user
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:3000/api/users/$USER_ID)
[[ "$STATUS" == "204" ]] && echo "✅ All API tests passed"

kill $SERVER_PID
```

**成果物**:

- `/apps/backend/src/handlers/users.rs`
- `/apps/backend/src/schemas/user.rs`
- `/apps/backend/tests/api_integration_test.rs`

---

### T302: utoipa-axum OpenAPI統合

**目的**: 自動OpenAPI仕様生成とSwagger UI統合  
**前提条件**: T301完了, OpenAPI基本概念理解  
**依存関係**: T301  
**推定工数**: 1日  
**必要スキル**: 中級 (utoipa annotations, OpenAPI仕様)

**作業内容**:

1. utoipa-axum依存関係追加
2. 各APIハンドラーにutoipaアノテーション追加
3. OpenAPI仕様生成設定
4. Swagger UIエンドポイント実装

**完了条件**:

- [ ] `/api-docs/openapi.json` でOpenAPI仕様取得可能
- [ ] `/swagger-ui/` でSwagger UIアクセス可能
- [ ] 全APIエンドポイントが仕様書に含まれている
- [ ] Swagger UIから各API動作確認可能

**検証方法**:

```bash
cd apps/backend && cargo run &
SERVER_PID=$!
sleep 3

# OpenAPI spec validation
curl -s http://localhost:3000/api-docs/openapi.json | jq -e '.openapi == "3.0.0"'
curl -s http://localhost:3000/api-docs/openapi.json | jq -e '.paths."/api/users".post'

# Swagger UI check
curl -s http://localhost:3000/swagger-ui/ | grep -q "Swagger UI"

echo "✅ OpenAPI integration successful"
kill $SERVER_PID
```

**成果物**:

- 更新された handler ファイル (utoipa annotations追加)
- `/apps/backend/src/docs.rs` (OpenAPI設定)
- Swagger UI統合コード

**実装例**:

```rust
#[utoipa::path(
    post,
    path = "/api/users",
    request_body = CreateUserRequest,
    responses(
        (status = 201, description = "User created", body = User),
        (status = 400, description = "Validation error", body = ErrorResponse)
    )
)]
pub async fn create_user(/* ... */) -> Result<Json<User>, AppError> {
    // implementation
}
```

---

## Phase 4: 型同期システム構築

### T401: TypeScript Workspace基盤構築

**目的**: TypeScript workspaceとpackages構造を構築  
**前提条件**: Node.js基本理解, npm workspace概念理解  
**依存関係**: なし (Phase 3と並行実行可能)  
**推定工数**: 0.5日  
**必要スキル**: 初級 (npm, package.json, workspace)

**作業内容**:

1. root `package.json` workspace設定
2. `packages/openapi-spec/package.json` 作成
3. 基本的なnpmスクリプト設定
4. workspace動作確認

**完了条件**:

- [ ] `npm install` でworkspace全体の依存関係インストール
- [ ] `npm run workspace-info` でworkspace一覧表示
- [ ] packages/openapi-spec でTypeScript基本設定完了

**検証方法**:

```bash
npm install
npm run workspace-info
cd packages/openapi-spec && npm run build
echo "✅ TypeScript workspace ready"
```

**成果物**:

- `/package.json` (workspace root)
- `/packages/openapi-spec/package.json`
- `/packages/openapi-spec/tsconfig.json`

---

### T402: OpenAPI自動生成実装

**目的**: RustからOpenAPI仕様を自動生成するシステム実装  
**前提条件**: T302完了  
**依存関係**: T302  
**推定工数**: 0.5日  
**必要スキル**: 初級 (Rustバイナリ作成, file I/O)

**作業内容**:

1. OpenAPI生成バイナリ実装
2. 出力パス設定
3. 生成スクリプト作成
4. 自動化検証

**完了条件**:

- [ ] `cargo run --bin generate-openapi` 実行成功
- [ ] `packages/openapi-spec/openapi.json` ファイル生成
- [ ] 生成されたOpenAPI仕様が妥当 (jq parsing成功)

**検証方法**:

```bash
cd apps/backend
cargo run --bin generate-openapi > ../../packages/openapi-spec/openapi.json

# Validation
jq -e '.openapi == "3.0.0"' ../../packages/openapi-spec/openapi.json
jq -e '.paths | length > 0' ../../packages/openapi-spec/openapi.json
echo "✅ OpenAPI generation successful"
```

**成果物**:

- `/apps/backend/src/bin/generate-openapi.rs`
- 生成される `/packages/openapi-spec/openapi.json`

---

### T403: TypeScript型自動生成実装

**目的**: OpenAPIからTypeScript型定義を自動生成  
**前提条件**: T401, T402完了  
**依存関係**: T401, T402  
**推定工数**: 0.5日  
**必要スキル**: 初級 (npm scripts, TypeScript基本)

**作業内容**:

1. openapi-typescript設定
2. 型生成スクリプト実装
3. 出力設定
4. 型検証

**完了条件**:

- [ ] `npm run generate-types` で型生成成功
- [ ] `packages/openapi-spec/generated/types.ts` 生成
- [ ] 生成された型がTypeScriptコンパイル成功
- [ ] User型等の主要型が含まれている

**検証方法**:

```bash
cd packages/openapi-spec
npm run generate-types

# TypeScript compilation check
npx tsc --noEmit generated/types.ts

# Type content check
grep -q "interface.*User" generated/types.ts
echo "✅ TypeScript type generation successful"
```

**成果物**:

- `/packages/openapi-spec/scripts/generate-types.js`
- 生成される `/packages/openapi-spec/generated/types.ts`

---

### T404: 統合型同期システム実装

**目的**: Rust→OpenAPI→TypeScript全体パイプライン構築  
**前提条件**: T402, T403完了  
**依存関係**: T402, T403  
**推定工数**: 0.5日  
**必要スキル**: 初級 (shell scripting, Make)

**作業内容**:

1. 統合同期スクリプト作成
2. Makefileへの統合
3. エラーハンドリング実装
4. 全体動作確認

**完了条件**:

- [ ] `make sync-types` で全パイプライン実行成功
- [ ] エラー時の適切なメッセージ表示
- [ ] 変更検知機能動作

**検証方法**:

```bash
# Clean slate test
rm -f packages/openapi-spec/openapi.json
rm -f packages/openapi-spec/generated/types.ts

# Full pipeline test
make sync-types

# Verify outputs
[[ -f packages/openapi-spec/openapi.json ]] || exit 1
[[ -f packages/openapi-spec/generated/types.ts ]] || exit 1
echo "✅ Type sync pipeline complete"
```

**成果物**:

- `/scripts/sync-types.sh`
- 更新された `/Makefile`

---

## Phase 5: フロントエンド統合

### T501: Vue.js基本セットアップ

**目的**: Vue.jsアプリケーションの基本構造を構築  
**前提条件**: Vue.js基本理解, T404完了 (型定義利用のため)  
**依存関係**: T404  
**推定工数**: 1日  
**必要スキル**: 中級 (Vue.js, TypeScript, Vite)

**作業内容**:

1. hono_postgresからVue.jsコード移植
2. 生成されたTypeScript型のimport設定
3. API clientライブラリ統合
4. 基本画面表示確認

**完了条件**:

- [ ] `npm run dev` でVue.jsアプリ起動
- [ ] <http://localhost:5173> でアクセス可能
- [ ] TypeScript型エラーなし
- [ ] 生成された型を使用したコード動作確認

**検証方法**:

```bash
cd apps/frontend
npm install
npm run dev &
FRONTEND_PID=$!
sleep 5

# Basic access test
curl -s http://localhost:5173 | grep -q "Vue"

# Type check
npm run type-check

kill $FRONTEND_PID
echo "✅ Frontend setup complete"
```

**成果物**:

- `/apps/frontend/` 全体
- API client実装
- 型統合コード

---

### T502: API統合実装

**目的**: フロントエンドからバックエンドAPIの呼び出し実装  
**前提条件**: T501, T301完了  
**依存関係**: T501, T301  
**推定工数**: 1日  
**必要スキル**: 中級 (HTTP client, async/await, error handling)

**作業内容**:

1. ユーザー一覧表示画面実装
2. ユーザー作成・更新・削除機能実装
3. エラーハンドリング実装
4. 型安全性確認

**完了条件**:

- [ ] ユーザー一覧が画面に表示される
- [ ] ユーザー新規作成が画面から可能
- [ ] ユーザー編集・削除が画面から可能
- [ ] API通信エラー時の適切な表示
- [ ] TypeScript型チェック全て通過

**検証方法**:

```bash
# Backend startup
cd apps/backend && cargo run &
BACKEND_PID=$!

# Frontend startup  
cd apps/frontend && npm run dev &
FRONTEND_PID=$!

sleep 5

# Manual test checklist (to be executed in browser)
echo "Manual tests required:"
echo "1. Access http://localhost:5173"
echo "2. Check user list display"
echo "3. Create new user"
echo "4. Edit existing user" 
echo "5. Delete user"
echo "6. Check error handling"

kill $BACKEND_PID $FRONTEND_PID
```

**成果物**:

- ユーザー管理画面実装
- API client統合コード
- エラーハンドリングコンポーネント

---

## Phase 6: インフラ構築 (AWS ECS)

### T601: AWS CDK プロジェクト基盤構築

**目的**: AWS CDK(TypeScript)プロジェクトの初期セットアップ  
**前提条件**: AWS CLI設定、AWS CDK CLI、AWSアカウント権限  
**依存関係**: なし (Phase 5と並行実行可能)  
**推定工数**: 0.5日  
**必要スキル**: 初級 (AWS基本, CDK基本, TypeScript)

**作業内容**:

1. CDKプロジェクト初期化
2. 基本VPC・Subnet設定
3. デプロイテスト実行
4. リソース削除確認

**完了条件**:

- [ ] `cdk init` プロジェクト作成成功
- [ ] `cdk synth` でCloudFormationテンプレート生成成功
- [ ] `cdk deploy --require-approval never` で基本リソースデプロイ成功
- [ ] `cdk destroy` でリソース削除成功

**検証方法**:

```bash
cd infra
npm install
cdk synth > template.yaml
wc -l template.yaml  # Template generated

# Test deploy (will incur AWS charges)
cdk deploy --require-approval never
cdk destroy --force
echo "✅ CDK project ready"
```

**成果物**:

- `/infra/` CDKプロジェクト全体
- 基本VPCスタック定義

**⚠️注意**: AWS料金が発生する可能性があります

---

### T602: RDS PostgreSQL構築

**目的**: RDSインスタンスをCDKで構築・設定  
**前提条件**: T601完了, RDS基本概念理解  
**依存関係**: T601  
**推定工数**: 1日  
**必要スキル**: 中級 (AWS RDS, セキュリティグループ, CDK)

**作業内容**:

1. RDSインスタンス定義
2. セキュリティグループ設定  
3. 接続文字列出力設定
4. 接続テスト実装

**完了条件**:

- [ ] RDSインスタンス正常起動
- [ ] ECSタスクからの接続許可設定完了
- [ ] 接続文字列がCDK outputに出力
- [ ] `psql` での接続確認成功

**検証方法**:

```bash
cd infra
cdk deploy RdsStack --require-approval never

# Get connection string from CDK output
DB_ENDPOINT=$(cdk output RdsStack.DatabaseEndpoint)
echo "Testing connection to: $DB_ENDPOINT"

# Connection test (requires bastion host or VPN)
# This would be tested from within AWS environment
echo "✅ RDS deployment complete"
```

**成果物**:

- RDS構築CDKコード
- セキュリティグループ定義

**⚠️注意**: RDS料金が継続的に発生します

---

### T603: ECS Cluster & ALB構築

**目的**: ECS Cluster、Application Load Balancer構築  
**前提条件**: T602完了, ECS基本概念理解  
**依存関係**: T602  
**推定工数**: 1.5日  
**必要スキル**: 中級 (AWS ECS, ALB, Target Groups, CDK)

**作業内容**:

1. ECS Cluster作成
2. Application Load Balancer設定
3. Target Group設定
4. セキュリティグループ設定

**完了条件**:

- [ ] ECS Cluster正常作成
- [ ] ALB正常作成・ヘルスチェック設定完了
- [ ] Target Group正常作成
- [ ] HTTP/HTTPSリスナー設定完了
- [ ] 基本接続確認(503エラーでも可、サービス未起動のため)

**検証方法**:

```bash
cd infra
cdk deploy EcsStack --require-approval never

# Get ALB DNS name
ALB_DNS=$(cdk output EcsStack.LoadBalancerDnsName)
echo "ALB DNS: $ALB_DNS"

# Basic connectivity test (expect 503 - no service running)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$ALB_DNS/health)
[[ "$STATUS" == "503" ]] && echo "✅ ALB reachable (503 expected - no service)"
```

**成果物**:

- ECS Cluster定義
- ALB構築コード

---

### T604: ECS Service & Task Definition実装

**目的**: Rustアプリケーション用のECS ServiceとTask Definition作成  
**前提条件**: T603完了, Dockerイメージ作成済み  
**依存関係**: T603, Docker image (要事前作成)  
**推定工数**: 2日  
**必要スキル**: 上級 (ECS Task Definition, ECR, Docker, 環境変数管理)

**作業内容**:

1. ECR リポジトリ作成
2. Docker multi-stage build設定
3. Task Definition作成 (CPU, Memory, 環境変数)
4. ECS Service設定 (Auto Scaling含む)

**完了条件**:

- [ ] ECR push成功
- [ ] Task Definition登録成功
- [ ] ECS Service起動成功
- [ ] ALB経由でアプリケーション応答確認
- [ ] ヘルスチェック通過

**検証方法**:

```bash
# Build & push Docker image
cd apps/backend
docker build -t axum-postgres-backend .

# ECR login & push (requires AWS CLI configuration)
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com
docker tag axum-postgres-backend <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/axum-postgres-backend
docker push <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/axum-postgres-backend

# Deploy service
cd ../../infra
cdk deploy EcsServiceStack --require-approval never

# Test application
ALB_DNS=$(cdk output EcsStack.LoadBalancerDnsName)
curl http://$ALB_DNS/health | jq -e '.status == "ok"'
echo "✅ ECS Service deployed successfully"
```

**成果物**:

- ECR + Task Definition + Service 定義
- 本番用Dockerfile
- 環境変数管理設定

**⚠️注意**:

- ECR, ECS料金が継続発生
- Dockerイメージの事前作成が必要

---

## Phase 7: 品質保証・テスト

### T701: 統合テストスイート実装

**目的**: バックエンドAPIの包括的統合テスト実装  
**前提条件**: T301完了, テスト概念理解  
**依存関係**: T301  
**推定工数**: 2日  
**必要スキル**: 中級 (Rustテスト, HTTP testing, テストDB)

**作業内容**:

1. テスト用データベース設定
2. APIエンドポイント統合テスト実装
3. テストデータ管理実装
4. CI用テスト設定

**完了条件**:

- [ ] 全APIエンドポイントのテスト実装
- [ ] 正常系・異常系テストカバー
- [ ] テストDB自動セットアップ・クリーンアップ
- [ ] `cargo test --test integration` 全通過

**検証方法**:

```bash
export TEST_DATABASE_URL="postgresql://postgres:password@localhost:5435/test"
cd apps/backend

# Create test database
createdb -h localhost -p 5435 -U postgres test

# Run integration tests
cargo test --test integration -- --test-threads=1
echo "✅ Integration tests complete"
```

**成果物**:

- `/apps/backend/tests/integration/` テスト群
- テストデータ管理ヘルパー
- テスト設定ファイル

---

### T702: E2Eテストスイート実装

**目的**: フロントエンド・バックエンド統合のE2Eテスト実装  
**前提条件**: T502完了, E2Eテストツール選定済み  
**依存関係**: T502  
**推定工数**: 2日  
**必要スキル**: 上級 (Playwright/Cypress, テスト設計)

**作業内容**:

1. E2Eテストフレームワーク選定・設定
2. 主要ユーザーフロー E2E テスト実装
3. テストデータ管理実装
4. CI統合設定

**完了条件**:

- [ ] ユーザー作成フロー E2E テスト通過
- [ ] ユーザー一覧表示 E2E テスト通過
- [ ] ユーザー編集・削除 E2E テスト通過
- [ ] エラーケース E2E テスト通過

**検証方法**:

```bash
# Start backend & frontend
cd apps/backend && cargo run &
BACKEND_PID=$!
cd apps/frontend && npm run dev &
FRONTEND_PID=$!

sleep 5

# Run E2E tests
npm run test:e2e

kill $BACKEND_PID $FRONTEND_PID
echo "✅ E2E tests complete"
```

**成果物**:

- E2Eテストスイート
- テストデータ管理
- CI設定ファイル

**⚠️注意**: E2Eテストツールの学習コストが高いため、必要に応じてスキップ可能

---

### T703: CI/CDパイプライン実装

**目的**: GitHub ActionsでのCI/CDパイプライン構築  
**前提条件**: T701完了, GitHub Actions基本理解  
**依存関係**: T701, (T604 - ECS設定)  
**推定工数**: 2日  
**必要スキル**: 中級 (GitHub Actions, Docker, AWS権限)

**作業内容**:

1. CI設定 (テスト・ビルド・リント)
2. CD設定 (ECSデプロイ)
3. 型同期チェック設定
4. セキュリティスキャン設定

**完了条件**:

- [ ] Push時の自動テスト実行
- [ ] 型同期チェック実行
- [ ] mainブランチマージ時の自動デプロイ
- [ ] 失敗時の適切な通知

**検証方法**:

```bash
# Create test PR
git checkout -b test-ci
echo "# Test" >> README.md
git add README.md
git commit -m "Test CI"
git push origin test-ci

# Create PR and verify CI runs
echo "Check GitHub Actions tab for CI execution"
echo "✅ CI/CD pipeline active"
```

**成果物**:

- `.github/workflows/` CI/CD定義
- デプロイスクリプト
- セキュリティ設定

---

## 依存関係図

```mermaid
graph TD
    T000[T000: hono_postgres分析] 
    
    T101[T101: Rust最小プロジェクト] 
    T102[T102: PostgreSQL Docker環境]
    T103[T103: 基本Axumサーバー]
    T104[T104: sqlx基本セットアップ]
    
    T201[T201: User データモデル]
    T202[T202: User DB操作実装]
    
    T301[T301: 基本APIハンドラー]
    T302[T302: utoipa-axum統合]
    
    T401[T401: TypeScript Workspace]
    T402[T402: OpenAPI自動生成]
    T403[T403: TypeScript型生成]
    T404[T404: 統合型同期]
    
    T501[T501: Vue.js基本セットアップ]
    T502[T502: API統合実装]
    
    T601[T601: AWS CDK基盤]
    T602[T602: RDS構築]
    T603[T603: ECS Cluster]
    T604[T604: ECS Service]
    
    T701[T701: 統合テスト]
    T702[T702: E2Eテスト]
    T703[T703: CI/CD]
    
    T000 --> T101
    T000 --> T201
    
    T101 --> T103
    T102 --> T104
    T103 --> T104
    T104 --> T202
    T201 --> T202
    
    T103 --> T301
    T202 --> T301
    T301 --> T302
    
    T302 --> T402
    T401 --> T403
    T402 --> T403
    T403 --> T404
    
    T404 --> T501
    T301 --> T502
    T501 --> T502
    
    T601 --> T602
    T602 --> T603
    T603 --> T604
    
    T301 --> T701
    T502 --> T702
    T701 --> T703
```

## 実行時の注意事項

### 共通注意事項

- 各タスク開始前に依存関係を必ず確認
- 完了条件を全て満たしてから次のタスクに進行
- 問題発生時は早めに相談・エスカレーション

### AWS関連タスク注意事項

- **Phase 6 (T601-T604)**: AWS料金が発生します
- テスト後の確実なリソース削除を推奨
- 本番運用前にセキュリティ設定の再確認が必要

### 学習コスト考慮

- Rust初心者: Phase 2で追加1-2日の学習時間を見込む
- AWS初心者: Phase 6で追加2-3日の学習時間を見込む
- TypeScript初心者: Phase 4, 5で追加1日の学習時間を見込む

### 推奨実行順序

1. **Phase 0-3**: バックエンド基盤構築 (並行可能な部分は並行実行)
2. **Phase 4**: 型同期システム構築
3. **Phase 5**: フロントエンド統合
4. **Phase 6**: インフラ構築 (AWS料金発生注意)
5. **Phase 7**: テスト・CI/CD (継続的実行)

---

## 成功指標

### 技術指標

- [ ] API レスポンス時間: < 100ms (95%tile)
- [ ] TypeScript型エラー: 0件
- [ ] テストカバレッジ: > 80%
- [ ] ビルド時間: < 5分

### 機能指標  

- [ ] 全APIエンドポイント正常動作
- [ ] フロントエンド・バックエンド型安全性確保
- [ ] Docker環境での開発可能
- [ ] AWS ECSでの本番稼働可能

### 運用指標

- [ ] ゼロダウンタイムデプロイ実現
- [ ] CI/CDパイプライン正常稼働
- [ ] 型同期の自動化実現
- [ ] 開発者オンボーディング時間: < 1日
