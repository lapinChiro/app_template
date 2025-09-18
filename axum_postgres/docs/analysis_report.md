# hono_postgres 既存実装分析レポート

**分析日**: 2025-09-03  
**対象**: /home/kyohei/app_template/hono_postgres  
**目的**: Rust + Axum実装のための詳細仕様把握  

## 1. アーキテクチャ概要

### 技術スタック
- **フロントエンド**: Vue 3 + TypeScript + Vite + Vue Router
- **バックエンド**: Hono framework + Node.js + TypeScript
- **データベース**: PostgreSQL + Kysely (type-safe query builder)
- **API仕様**: @hono/zod-openapi (自動OpenAPI生成)
- **バリデーション**: Zod schema
- **開発環境**: Docker Compose
- **本番環境**: AWS Serverless (予定)

### アプリケーション構成
```
hono_postgres/
├── apps/
│   ├── frontend/           # Vue 3 アプリケーション
│   └── backend/            # Hono APIサーバー
├── docker/                 # Docker設定
└── packages/               # 共有パッケージ (空)
```

## 2. データベーススキーマ詳細

### test_users テーブル
```sql
CREATE TABLE test_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_test_users_email ON test_users(email);
```

### 初期データ
```sql
INSERT INTO test_users (name, email, active) VALUES
    ('Alice Johnson', 'alice@example.com', true),
    ('Bob Smith', 'bob@example.com', true),
    ('Charlie Brown', 'charlie@example.com', false);
```

## 3. API エンドポイント仕様

### 基本エンドポイント
| Method | Path | 説明 | リクエスト | レスポンス |
|--------|------|------|-----------|-----------|
| GET | `/health` | ヘルスチェック | - | `{status: "ok"}` |
| GET | `/` | ルートページ | - | `"Hello Hono!"` |
| GET | `/api/hello` | Hello API | - | `{message: "Hello from API"}` |
| GET | `/api/db-test` | DB接続テスト | - | DatabaseTestResponse |

### Users CRUD API
| Method | Path | 説明 | リクエスト | レスポンス |
|--------|------|------|-----------|-----------|
| GET | `/api/users` | ユーザー一覧 | - | `User[]` |
| GET | `/api/users/{id}` | ユーザー詳細 | - | `User` |
| POST | `/api/users` | ユーザー作成 | `CreateUserRequest` | `User` (201) |
| PUT | `/api/users/{id}` | ユーザー更新 | `UpdateUserRequest` | `User` |
| DELETE | `/api/users/{id}` | ユーザー削除 | - | 204 (No Content) |

### OpenAPI関連
| Method | Path | 説明 |
|--------|------|------|
| GET | `/doc` | OpenAPI仕様書 (JSON) |
| GET | `/swagger-ui` | Swagger UI |

## 4. データ型定義

### User型
```typescript
interface User {
  id: string,           // DBではSERIAL、APIでは文字列
  name: string,
  email: string,
  active: boolean,
  created_at: string    // ISO 8601 形式
}
```

### API リクエスト型
```typescript
interface CreateUserRequest {
  name: string,
  email: string
}

interface UpdateUserRequest {
  name?: string,
  email?: string,
  active?: boolean
}
```

### API レスポンス型
```typescript
interface DatabaseTestResponse {
  success: boolean,
  message: string,
  data: {
    existing_users: User[],
    new_user: { id: number, name: string, email: string },
    total_users: number
  }
}

interface ErrorResponse {
  success: false,
  message: string,
  error?: string
}
```

## 5. 環境変数仕様

### バックエンド環境変数
| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `PORT` | `3000` | APIサーバーポート |
| `NODE_ENV` | - | 実行環境 |
| `DATABASE_URL` | - | PostgreSQL接続文字列 |
| `DB_HOST` | `localhost` | データベースホスト |
| `DB_PORT` | `5432` | データベースポート |
| `DB_NAME` | `dev` | データベース名 |
| `DB_USER` | `postgres` | データベースユーザー |
| `DB_PASSWORD` | `password` | データベースパスワード |
| `DB_SSL` | `false` | SSL接続設定 |

### フロントエンド環境変数
| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `VITE_API_BASE_URL` | `http://localhost:3000` | APIベースURL |
| `VITE_APP_VERSION` | `0.0.0` | アプリケーションバージョン |
| `VITE_ENVIRONMENT` | `development` | 実行環境 |
| `VITE_ENABLE_DEBUG` | `true` | デバッグ設定 |
| `VITE_API_TIMEOUT` | `120000` | APIタイムアウト (ms) |

## 6. Docker 環境設定

### 開発環境構成
```yaml
services:
  postgres:    # PostgreSQL DB (port: 5435)
  backend:     # Hono API Server (port: 3000)  
  frontend:    # Vue.js Dev Server (port: 5173)
```

### ネットワーク
- `app_network`: Bridge ネットワークで全サービス接続
- 外部アクセス用ポートマッピング

## 7. 重要な実装パターン

### 1. 型安全なデータベースアクセス
```typescript
const users = await db
  .selectFrom('test_users')
  .select(['id', 'name', 'email', 'active', 'created_at'])
  .where('active', '=', true)
  .execute()
```

### 2. Zodによるバリデーション
```typescript
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  active: z.boolean(),
  created_at: z.string().datetime()
}).openapi('User')
```

### 3. 自動OpenAPI生成
```typescript
const getUserRoute = createRoute({
  method: 'get',
  path: '/api/users/{id}',
  request: { params: UserParamsSchema },
  responses: {
    200: { content: { 'application/json': { schema: UserSchema } } }
  }
})
```

### 4. フロントエンドAPI Client
```typescript
class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T>
  async healthCheck(): Promise<HealthResponse>
  async databaseTest(): Promise<DatabaseTestResponse | ApiError>
}
```

## 8. Axum移植時の考慮事項

### 必須機能
1. **CRUD API**: 5つのユーザー管理エンドポイント
2. **自動OpenAPI生成**: utoipa-axumによる実装
3. **型安全なDB操作**: sqlx + derive macros
4. **CORS対応**: axum::middleware::cors
5. **ログ出力**: tower::middleware::logger
6. **バリデーション**: serdeによる構造体バリデーション

### データ型マッピング
- Hono/Zod → Axum/serde
- Kysely → sqlx
- Node.js環境変数 → Rust std::env

### API互換性維持
- 同じエンドポイントパス
- 同じJSONレスポンス形式
- 同じHTTPステータスコード
- 同じエラーレスポンス構造

## 9. 開発環境要件

### 必要なツール
- Docker + Docker Compose
- Node.js 22+ (既存システム確認用)
- Rust 1.75+ (新システム開発用)
- PostgreSQL Client (psql)

### 開発フロー
1. Docker環境でPostgreSQL起動
2. マイグレーション実行
3. テストデータ挿入
4. API動作確認
5. フロントエンド動作確認

## 10. 移植優先度

### Phase 1: 基盤構築
1. Axum基本サーバー + CORS + ログ
2. PostgreSQL接続 + sqlx設定
3. User構造体 + バリデーション

### Phase 2: API実装  
1. 5つのCRUD エンドポイント
2. エラーハンドリング統合
3. OpenAPI生成 (utoipa)

### Phase 3: 統合テスト
1. 既存フロントエンドとの互換性確認
2. Docker環境統合
3. 型同期システム構築

この分析に基づき、段階的にRust + Axum実装を進めることができます。