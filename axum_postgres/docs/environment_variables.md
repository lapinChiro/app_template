# 環境変数仕様書

**プロジェクト**: axum_postgres  
**ベース**: hono_postgres 環境変数分析  
**更新日**: 2025-09-03  

## 環境変数一覧

### バックエンド（Axum）環境変数

#### データベース接続

| 変数名 | 型 | デフォルト値 | 必須 | 説明 |
|--------|----|-----------|----|------|
| `DATABASE_URL` | string | - | ✅ | PostgreSQL接続文字列（完全形式） |
| `DB_HOST` | string | `localhost` | ❌ | データベースサーバーホスト |
| `DB_PORT` | string | `5432` | ❌ | データベースサーバーポート |
| `DB_NAME` | string | `dev` | ❌ | データベース名 |
| `DB_USER` | string | `postgres` | ❌ | データベースユーザー名 |
| `DB_PASSWORD` | string | `password` | ❌ | データベースパスワード |
| `DB_SSL` | string | `false` | ❌ | SSL接続有効化 (`true`/`false`) |

**DATABASE_URL形式例**:

```bash
# 開発環境
DATABASE_URL="postgresql://postgres:password@localhost:5435/dev"

# Docker環境  
DATABASE_URL="postgresql://postgres:password@postgres:5432/dev"

# 本番環境
DATABASE_URL="postgresql://user:pass@prod-host:5432/prod?sslmode=require"
```

#### サーバー設定

| 変数名 | 型 | デフォルト値 | 必須 | 説明 |
|--------|----|-----------|----|------|
| `PORT` | string | `3000` | ❌ | APIサーバー待機ポート |
| `HOST` | string | `0.0.0.0` | ❌ | バインドアドレス |
| `SERVER_TIMEOUT` | string | `120000` | ❌ | リクエストタイムアウト（ミリ秒） |

#### 実行環境

| 変数名 | 型 | デフォルト値 | 必須 | 説明 |
|--------|----|-----------|----|------|
| `RUST_ENV` | string | `development` | ❌ | 実行環境 (`development`/`production`) |
| `RUST_LOG` | string | `info` | ❌ | ログレベル (`error`/`warn`/`info`/`debug`/`trace`) |

### フロントエンド（Vue.js）環境変数

#### API通信設定  

| 変数名 | 型 | デフォルト値 | 必須 | 説明 |
|--------|----|-----------|----|------|
| `VITE_API_BASE_URL` | string | `http://localhost:3000` | ❌ | バックエンドAPIのベースURL |
| `VITE_API_TIMEOUT` | string | `120000` | ❌ | APIリクエストタイムアウト（ミリ秒） |

#### アプリケーション設定

| 変数名 | 型 | デフォルト値 | 必須 | 説明 |
|--------|----|-----------|----|------|
| `VITE_APP_VERSION` | string | `0.0.0` | ❌ | アプリケーションバージョン |
| `VITE_ENVIRONMENT` | string | `development` | ❌ | 実行環境識別子 |
| `VITE_ENABLE_DEBUG` | string | `true` | ❌ | デバッグ機能有効化 |

## 環境別設定例

### 開発環境 (.env.development)

```bash
# Backend (Axum)
DATABASE_URL=postgresql://postgres:password@localhost:5435/dev
PORT=3000
RUST_ENV=development
RUST_LOG=debug

# Frontend (Vue.js)
VITE_API_BASE_URL=http://localhost:3000
VITE_ENVIRONMENT=development
VITE_ENABLE_DEBUG=true
```

### Docker環境 (docker-compose.yml)

```yaml
# Backend service
environment:
  - DATABASE_URL=postgresql://postgres:password@postgres:5432/dev
  - DB_HOST=postgres
  - DB_PORT=5432
  - DB_NAME=dev
  - DB_USER=postgres
  - DB_PASSWORD=password
  - DB_SSL=false
  - PORT=3000
  - RUST_ENV=development

# Frontend service  
environment:
  - VITE_API_BASE_URL=http://localhost:3000
  - VITE_ENVIRONMENT=development
```

### 本番環境 (.env.production)

```bash
# Backend (Axum)
DATABASE_URL=postgresql://prod_user:secure_pass@rds-endpoint:5432/prod?sslmode=require
PORT=3000
RUST_ENV=production
RUST_LOG=info

# Frontend (Vue.js)
VITE_API_BASE_URL=https://api.example.com
VITE_ENVIRONMENT=production
VITE_ENABLE_DEBUG=false
```

## Axum実装での環境変数処理

### Rustでの読み込み方法

```rust
use std::env;

// 必須環境変数
let database_url = env::var("DATABASE_URL")
    .expect("DATABASE_URL must be set");

// デフォルト値付き環境変数
let port = env::var("PORT")
    .unwrap_or_else(|_| "3000".to_string())
    .parse::<u16>()
    .expect("PORT must be a valid number");

let host = env::var("HOST")
    .unwrap_or_else(|_| "0.0.0.0".to_string());
```

### 設定構造体パターン

```rust
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub host: String,
    pub port: u16,
    pub name: String,
    pub user: String,
    pub password: String,
    pub ssl: bool,
}

impl DatabaseConfig {
    pub fn from_env() -> Self {
        Self {
            url: env::var("DATABASE_URL")
                .expect("DATABASE_URL is required"),
            host: env::var("DB_HOST")
                .unwrap_or_else(|_| "localhost".to_string()),
            port: env::var("DB_PORT")
                .unwrap_or_else(|_| "5432".to_string())
                .parse()
                .expect("DB_PORT must be a number"),
            // ... other fields
        }
    }
}
```

### dotenvy統合

```rust
// main.rs
use dotenvy::dotenv;

fn main() {
    // .envファイル読み込み
    dotenv().ok();
    
    let config = DatabaseConfig::from_env();
    // ...
}
```

## 検証とテスト

### 環境変数検証スクリプト

```bash
#!/bin/bash
# scripts/validate_env.sh

echo "=== Environment Variables Validation ==="

# Required variables
required_vars=("DATABASE_URL")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "❌ Required variable $var is not set"
        exit 1
    else
        echo "✅ $var is set"
    fi
done

# Optional variables with defaults
echo "PORT: ${PORT:-3000}"
echo "RUST_ENV: ${RUST_ENV:-development}"
echo "RUST_LOG: ${RUST_LOG:-info}"

echo "=== Validation completed ==="
```

### データベース接続テスト

```rust
// tests/integration/database_test.rs
#[tokio::test]
async fn test_database_connection() {
    dotenvy::dotenv().ok();
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    
    let pool = PgPool::connect(&db_url).await;
    assert!(pool.is_ok(), "Failed to connect to database");
}
```

## セキュリティ考慮事項

### 機密情報の扱い

- ❌ パスワードを平文で.envに保存
- ✅ 本番環境では環境変数やSecrets Managerを使用
- ✅ .env.example でテンプレート提供
- ✅ .gitignoreで.envファイルを除外

### .env.example

```bash
# Database (required)
DATABASE_URL=postgresql://postgres:password@localhost:5435/dev

# Server (optional)  
PORT=3000
RUST_ENV=development
RUST_LOG=info

# Copy this file to .env and modify values as needed
```

## トラブルシューティング

### よくある問題

1. **DATABASE_URL未設定**: アプリケーション起動失敗
   - 解決: .envファイル作成またはexport

2. **ポート競合**: `PORT`設定済みだが起動失敗  
   - 解決: 別のポート番号を使用

3. **DB接続失敗**: ホスト/ポート/認証情報の誤り
   - 解決: 接続情報の再確認

### デバッグ用環境変数表示

```rust
pub fn print_env_info() {
    println!("=== Environment Information ===");
    println!("DATABASE_URL: {}", env::var("DATABASE_URL").unwrap_or_else(|_| "NOT SET".to_string()));
    println!("PORT: {}", env::var("PORT").unwrap_or_else(|_| "3000".to_string()));
    println!("RUST_ENV: {}", env::var("RUST_ENV").unwrap_or_else(|_| "development".to_string()));
    println!("===============================");
}
```
