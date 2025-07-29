# Task ID Mapping Reference

このドキュメントは、異なるタスクID形式間のマッピングを明確にします。

## タスクID対応表

| File ID | Task ID | Task Name |
|---------|---------|-----------|
| 01-01 | TASK-001 | Project Structure Setup |
| 01-02 | TASK-002 | TypeScript Configuration |
| 01-03 | TASK-003 | ESLint Ultimate Type Safety Setup |
| 01-04 | TASK-004 | Docker Development Environment |
| 02-01 | TASK-005 | Shared Package Setup |
| 02-02 | TASK-006 | UI Component Library Setup |
| 02-03 | TASK-007 | Zod Schema Definitions |
| 03-01 | TASK-008 | Google OAuth Implementation |
| 03-02 | TASK-009 | User Repository Implementation |
| 03-03 | TASK-010 | Auth Middleware & Guards |
| 04-01 | TASK-011 | Member Next.js App Setup |
| 04-02 | TASK-012 | Admin Next.js App Setup |
| 04-03 | TASK-013 | Admin CRUD UI Implementation |
| 05-01 | TASK-014 | Member API Routes |
| 05-02 | TASK-015 | Admin API Routes |
| 05-03 | TASK-016 | OpenAPI Documentation Generation |
| 06-01 | TASK-017 | Unit Test Setup |
| 06-02 | TASK-018 | Integration Test Setup |
| 06-03 | TASK-019 | E2E Test Setup |
| 07-01 | TASK-020 | CDK Project Setup |
| 07-02 | TASK-021 | Core Infrastructure Stack |
| 07-03 | TASK-022 | Optional Features Stack |
| 08-01 | TASK-023 | GitHub Actions Setup |
| 08-02 | TASK-024 | Project Initialization Script |
| 08-03 | TASK-025 | Developer Documentation |

## 使用上の注意

1. **TASK_INDEX.md**: File ID (XX-XX形式) を使用
2. **個別タスクファイル**: Task ID (TASK-XXX形式) を使用
3. **依存関係の参照**: 
   - TASK_INDEX.mdでは File ID を使用
   - 個別ファイル内では Task ID を使用

## 具体的な使用例

### 例1: タスクファイルから依存タスクを探す場合

あなたが `04-01-member-nextjs-app-setup.md` を作業中で、
ファイル内に以下の記載があるとします：
```
Dependencies: TASK-006 (UI Components), TASK-008 (Google OAuth)
```

依存タスクのファイルを見つけるには：
1. この表で `TASK-006` → `02-02` を確認
2. この表で `TASK-008` → `03-01` を確認
3. 実際のファイル:
   - `02-core-infrastructure/02-02-ui-component-library-setup.md`
   - `03-authentication-system/03-01-google-oauth-implementation.md`

### 例2: 複数の依存関係がある場合

`05-02-admin-api-routes.md` の依存関係：
```
Dependencies: TASK-007 (Zod Schemas), TASK-010 (Auth Middleware), TASK-009 (User Repository)
```

マッピング：
- TASK-007 → 02-03 → `02-core-infrastructure/02-03-zod-schema-definitions.md`
- TASK-010 → 03-03 → `03-authentication-system/03-03-auth-middleware-guards.md`
- TASK-009 → 03-02 → `03-authentication-system/03-02-user-repository-implementation.md`

この対応表を参照することで、異なる形式間での正確な参照が可能になります。