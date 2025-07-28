# TASK-007: Zod Schema Definitions

**Priority**: High  
**Estimated**: 3 hours  
**Dependencies**: TASK-005 (Shared Package)

## Prerequisites

- TASK-005 完了（packages/shared）
- Zod ライブラリの基本知識
- TypeScript ジェネリクスの理解

## Reference Implementation

- Primary: `@docs/impl/api/zod-schemas.md` - 完全な Zod スキーマ実装
- Related: `@design.md` - Schema-First API 設計セクション

## Acceptance Criteria

- [ ] UserSchema が zod-schemas.md Section 2 に準拠している
- [ ] 全スキーマから TypeScript 型が自動推論される
- [ ] バリデーションエラーが日本語で表示される
- [ ] OpenAPI 生成用のメタデータが含まれている
- [ ] 再利用可能な基本スキーマ（Email, UUID等）が定義されている
- [ ] `pnpm test` でスキーマのバリデーションテストが通る

## Detailed Implementation

### Base Schemas
```typescript
// packages/shared/src/schemas/base.ts - 基本スキーマ
import { z } from 'zod';

// zod-schemas.md Section 2.1 に基づく
export const EmailSchema = z
  .string()
  .email({ message: '有効なメールアドレスを入力してください' })
  .transform(email => email.toLowerCase());

export const UUIDSchema = z
  .string()
  .uuid({ message: '有効なUUIDを入力してください' });

export const TimestampSchema = z
  .string()
  .datetime({ message: '有効な日時を入力してください' });
```

### User Schema
```typescript
// packages/shared/src/schemas/user.ts - ユーザースキーマ
export const UserRoleSchema = z.enum(['member', 'admin'], {
  errorMap: () => ({ message: 'member または admin を指定してください' })
});

export const UserSchema = z.object({
  id: UUIDSchema,
  email: EmailSchema,
  name: z.string().min(1, { message: '名前は必須です' }).max(100),
  role: UserRoleSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

// 型推論
export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;

// OpenAPI メタデータ付き（zod-schemas.md Section 4）
export const UserSchemaWithMeta = UserSchema.openapi({
  description: 'システムユーザー',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'user@example.com',
    name: '山田太郎',
    role: 'member',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
});
```

### Validation Helpers
```typescript
// packages/shared/src/schemas/helpers.ts
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map(e => 
    `${e.path.join('.')}: ${e.message}`
  );
  
  return { success: false, errors };
}
```

## Quality Gates

- Type inference: 100% (全スキーマから型推論可能)
- Validation coverage: 100% (全フィールドにバリデーション)
- Error messages: 100% 日本語化
- Test coverage: > 90%

## Verification Steps

```bash
# 型チェック
pnpm tsc --noEmit

# スキーマのテスト実行
pnpm test packages/shared/src/schemas

# バリデーション動作確認
pnpm tsx -e "import { UserSchema } from './packages/shared/src/schemas/user'; console.log(UserSchema.safeParse({ email: 'invalid' }));"
```

## Output

- 完全な型安全 Zod スキーマライブラリ
- API 全体で使用される統一バリデーション
- OpenAPI 自動生成対応

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented