# API エンドポイント仕様書

**プロジェクト**: axum_postgres  
**ベース仕様**: hono_postgres API  
**生成日**: 2025-09-03  

## エンドポイント一覧

### システム管理

#### 1. ヘルスチェック
- **URL**: `GET /health`
- **概要**: システムの稼働状況確認
- **認証**: 不要
- **リクエスト**: なし
- **レスポンス**: 200 OK
```json
{
  "status": "ok"
}
```

#### 2. ルートエンドポイント  
- **URL**: `GET /`
- **概要**: 基本動作確認
- **認証**: 不要
- **リクエスト**: なし
- **レスポンス**: 200 OK (text/plain)
```
Hello Hono!
```

#### 3. Hello API
- **URL**: `GET /api/hello`
- **概要**: API基本動作確認
- **認証**: 不要
- **リクエスト**: なし
- **レスポンス**: 200 OK
```json
{
  "message": "Hello from API"
}
```

#### 4. データベース接続テスト
- **URL**: `GET /api/db-test`
- **概要**: データベース接続とCRUD操作の動作確認
- **認証**: 不要
- **リクエスト**: なし
- **レスポンス**: 200 OK
```json
{
  "success": true,
  "message": "Database connection and operations successful",
  "data": {
    "existing_users": [
      {
        "id": 1,
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "active": true,
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "new_user": {
      "id": 4,
      "name": "Test User 1704067200000",
      "email": "test1704067200000@example.com"
    },
    "total_users": 2
  }
}
```
- **エラーレスポンス**: 500 Internal Server Error
```json
{
  "success": false,
  "message": "Database operation failed", 
  "error": "詳細なエラーメッセージ"
}
```

### ユーザー管理 CRUD

#### 5. ユーザー一覧取得
- **URL**: `GET /api/users`
- **概要**: 全ユーザー情報の取得（作成日時降順）
- **認証**: 不要
- **リクエスト**: なし
- **レスポンス**: 200 OK
```json
[
  {
    "id": "1",
    "name": "Alice Johnson", 
    "email": "alice@example.com",
    "active": true,
    "created_at": "2025-01-01T00:00:00Z"
  },
  {
    "id": "2",
    "name": "Bob Smith",
    "email": "bob@example.com", 
    "active": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```
- **エラーレスポンス**: 500 Internal Server Error

#### 6. ユーザー詳細取得
- **URL**: `GET /api/users/{id}`
- **概要**: 指定IDのユーザー情報取得
- **認証**: 不要
- **パスパラメーター**: 
  - `id` (string, required): ユーザーID
- **リクエスト**: なし
- **レスポンス**: 200 OK
```json
{
  "id": "1",
  "name": "Alice Johnson",
  "email": "alice@example.com", 
  "active": true,
  "created_at": "2025-01-01T00:00:00Z"
}
```
- **エラーレスポンス**: 
  - 404 Not Found: ユーザーが存在しない
  ```json
  {
    "success": false,
    "message": "User not found"
  }
  ```
  - 500 Internal Server Error: データベースエラー

#### 7. ユーザー作成
- **URL**: `POST /api/users`
- **概要**: 新規ユーザーの作成
- **認証**: 不要
- **リクエストボディ**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```
- **バリデーションルール**:
  - `name`: 必須、1文字以上
  - `email`: 必須、有効なメールアドレス形式、一意制約
- **レスポンス**: 201 Created
```json
{
  "id": "3", 
  "name": "Jane Doe",
  "email": "jane@example.com",
  "active": true,
  "created_at": "2025-09-03T12:00:00Z"
}
```
- **エラーレスポンス**:
  - 400 Bad Request: バリデーションエラー
  - 500 Internal Server Error: データベースエラー

#### 8. ユーザー更新
- **URL**: `PUT /api/users/{id}`
- **概要**: 既存ユーザー情報の更新
- **認証**: 不要
- **パスパラメーター**:
  - `id` (string, required): ユーザーID
- **リクエストボディ** (すべて任意):
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com", 
  "active": false
}
```
- **バリデーションルール**:
  - `name`: 任意、1文字以上
  - `email`: 任意、有効なメールアドレス形式
  - `active`: 任意、boolean
- **レスポンス**: 200 OK
```json
{
  "id": "3",
  "name": "Jane Smith", 
  "email": "jane.smith@example.com",
  "active": false,
  "created_at": "2025-09-03T12:00:00Z"
}
```
- **エラーレスポンス**:
  - 404 Not Found: ユーザーが存在しない
  - 500 Internal Server Error: データベースエラー

#### 9. ユーザー削除
- **URL**: `DELETE /api/users/{id}`
- **概要**: 指定ユーザーの削除
- **認証**: 不要
- **パスパラメーター**:
  - `id` (string, required): ユーザーID
- **リクエスト**: なし
- **レスポンス**: 204 No Content
- **エラーレスポンス**:
  - 404 Not Found: ユーザーが存在しない
  ```json
  {
    "success": false,
    "message": "User not found"
  }
  ```
  - 500 Internal Server Error: データベースエラー

### API仕様書

#### 10. OpenAPI仕様書
- **URL**: `GET /doc`
- **概要**: OpenAPI 3.0仕様書（JSON形式）
- **認証**: 不要
- **レスポンス**: 200 OK (application/json)

#### 11. Swagger UI
- **URL**: `GET /swagger-ui`
- **概要**: インタラクティブAPI仕様書
- **認証**: 不要  
- **レスポンス**: 200 OK (text/html)

## 共通仕様

### Content-Type
- **リクエスト**: `application/json`
- **レスポンス**: `application/json` (HTMLを除く)

### CORSヘッダー
- すべてのエンドポイントでCORS対応
- 開発環境では `*` を許可

### エラーレスポンス共通形式
```json
{
  "success": false,
  "message": "エラーメッセージ",
  "error": "詳細なエラー情報（任意）"
}
```

### HTTPステータスコード
- `200`: 正常処理（取得・更新）
- `201`: 正常作成
- `204`: 正常削除
- `400`: バリデーションエラー
- `404`: リソース未発見  
- `500`: サーバー内部エラー

### 実装優先度
1. **高**: 5, 6, 7, 8, 9 (ユーザーCRUD)
2. **中**: 1, 3, 4 (システム管理)
3. **低**: 2, 10, 11 (その他)

## Axum実装時の注意事項

### 型安全性
- sqlx::query_as! マクロで型安全なクエリ実行
- serde Deserialize/Serialize でJSON変換
- utoipa annotations で自動OpenAPI生成

### エラーハンドリング  
- thiserror::Error でカスタムエラー型定義
- 統一されたエラーレスポンス形式維持

### パフォーマンス
- 接続プール利用でDB接続効率化
- 非同期処理（async/await）で並行性確保