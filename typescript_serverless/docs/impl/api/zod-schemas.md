# Zod Schema Implementation Strategy

## Overview

Zodスキーマを真実の源泉（Single Source of Truth）として活用し、型安全性・バリデーション・ドキュメント生成を統一的に実現します。これは「Effective TypeScript」のItem 28: "Use Types, Not Strings, to Represent Valid States"の原則に従い、状態を文字列ではなく型で表現します。

## Effective TypeScript Integration

### Applied Principles

- **Item 28**: Use Types, Not Strings, to Represent Valid States
  - `role: z.enum(['member', 'admin'])` instead of `role: z.string()`
- **Item 29**: Be Liberal in What You Accept and Strict in What You Produce
  - Input schemas allow optionals, output schemas are strict
- **Item 31**: Push Null Values to the Perimeter of Your Types
  - `lastLoginAt: TimestampSchema.nullable()` for clear null handling

## Core Schema Architecture

### Base Domain Schemas

```typescript
// packages/shared/src/schemas/base.ts
import { z } from 'zod';

/**
 * 基本的なID型定義
 */
export const IdSchema = z.string().min(1).max(50);

/**
 * タイムスタンプ型定義
 */
export const TimestampSchema = z.string().datetime();

/**
 * メール型定義
 */
export const EmailSchema = z.string().email().max(254);

/**
 * パスワード型定義（最低8文字、英数字記号含む）
 */
export const PasswordSchema = z
  .string()
  .min(8, '最低8文字必要です')
  .max(128, '最大128文字です')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    '英小文字・英大文字・数字・記号を含む必要があります'
  );

/**
 * 共通のレスポンス型定義
 */
export const BaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  timestamp: TimestampSchema,
});

/**
 * エラーレスポンス型定義
 */
export const ErrorResponseSchema = BaseResponseSchema.extend({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

/**
 * ページネーション型定義
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  BaseResponseSchema.extend({
    success: z.literal(true),
    data: z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number().int(),
        limit: z.number().int(),
        total: z.number().int(),
        totalPages: z.number().int(),
      }),
    }),
  });
```

### User Domain Schemas

```typescript
// packages/shared/src/schemas/user.ts
import { z } from 'zod';
import { IdSchema, EmailSchema, TimestampSchema, BaseResponseSchema } from './base';

/**
 * ユーザー作成入力スキーマ
 */
export const CreateUserInputSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内です'),
  email: EmailSchema,
  role: z.enum(['member', 'admin']).default('member'),
});

/**
 * ユーザー更新入力スキーマ
 */
export const UpdateUserInputSchema = CreateUserInputSchema.partial().extend({
  id: IdSchema,
});

/**
 * ユーザーエンティティスキーマ
 */
export const UserSchema = z.object({
  id: IdSchema,
  name: z.string(),
  email: EmailSchema,
  role: z.enum(['member', 'admin']),
  isActive: z.boolean(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  lastLoginAt: TimestampSchema.nullable(),
});

/**
 * 公開用ユーザー情報スキーマ（センシティブ情報除外）
 */
export const PublicUserSchema = UserSchema.omit({
  // 必要に応じて除外するフィールドを追加
});

/**
 * ユーザーリスト取得クエリスキーマ
 */
export const GetUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['member', 'admin']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
});

/**
 * レスポンス型定義
 */
export const CreateUserResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: UserSchema,
});

export const GetUserResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: UserSchema,
});

export const UpdateUserResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: UserSchema,
});

export const DeleteUserResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    deletedId: IdSchema,
  }),
});

// 型定義のエクスポート
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
export type User = z.infer<typeof UserSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type GetUsersQuery = z.infer<typeof GetUsersQuerySchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;
export type UpdateUserResponse = z.infer<typeof UpdateUserResponseSchema>;
export type DeleteUserResponse = z.infer<typeof DeleteUserResponseSchema>;
```

### Authentication Schemas

```typescript
// packages/shared/src/schemas/auth.ts
import { z } from 'zod';
import { EmailSchema, BaseResponseSchema } from './base';
import { UserSchema } from './user';

/**
 * Google OAuth認証レスポンススキーマ
 */
export const GoogleOAuthResponseSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

/**
 * ログイン入力スキーマ
 */
export const LoginInputSchema = z.object({
  googleAuthCode: z.string().min(1, 'Google認証コードは必須です'),
});

/**
 * JWT トークンペイロードスキーマ
 */
export const JWTPayloadSchema = z.object({
  userId: z.string(),
  email: EmailSchema,
  role: z.enum(['member', 'admin']),
  iat: z.number(),
  exp: z.number(),
});

/**
 * ログインレスポンススキーマ
 */
export const LoginResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    user: UserSchema,
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
  }),
});

/**
 * トークンリフレッシュ入力スキーマ
 */
export const RefreshTokenInputSchema = z.object({
  refreshToken: z.string().min(1, 'リフレッシュトークンは必須です'),
});

/**
 * トークンリフレッシュレスポンススキーマ
 */
export const RefreshTokenResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    accessToken: z.string(),
    expiresIn: z.number(),
  }),
});

// 型定義のエクスポート
export type GoogleOAuthResponse = z.infer<typeof GoogleOAuthResponseSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenInputSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
```

## API Handler Implementation

### Member API Handlers

```typescript
// apps/api-member/src/handlers/users.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  GetUsersQuerySchema,
  CreateUserInputSchema,
  UpdateUserInputSchema,
  CreateUserResponseSchema,
  UpdateUserResponseSchema,
  ErrorResponseSchema,
} from '@/shared/schemas/user';
import { createUser, getUsers, updateUser } from '@/shared/services/user-service';
import { validateRequest } from '@/shared/utils/validation';

/**
 * ユーザー一覧取得 (Member API)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // クエリパラメータのバリデーション
    const url = new URL(request.url);
    const queryResult = GetUsersQuerySchema.safeParse(
      Object.fromEntries(url.searchParams.entries())
    );

    if (!queryResult.success) {
      const errorResponse = ErrorResponseSchema.parse({
        success: false,
        message: 'Invalid query parameters',
        error: {
          code: 'VALIDATION_ERROR',
          details: queryResult.error.format(),
        },
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const query = queryResult.data;

    // Member APIではrole='member'のユーザーのみ表示
    const users = await getUsers({ ...query, role: 'member' });

    return NextResponse.json(users);
  } catch (error) {
    const errorResponse = ErrorResponseSchema.parse({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * ユーザー作成 (Member API)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // 入力バリデーション
    const inputResult = CreateUserInputSchema.safeParse(body);

    if (!inputResult.success) {
      const errorResponse = ErrorResponseSchema.parse({
        success: false,
        message: 'Invalid input data',
        error: {
          code: 'VALIDATION_ERROR',
          details: inputResult.error.format(),
        },
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const input = inputResult.data;

    // Member APIでは強制的にrole='member'を設定
    const userData = { ...input, role: 'member' as const };

    const user = await createUser(userData);

    // レスポンスバリデーション
    const response = CreateUserResponseSchema.parse({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const errorResponse = ErrorResponseSchema.parse({
      success: false,
      message: 'Failed to create user',
      error: {
        code: 'CREATION_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
```

### Admin API Handlers

```typescript
// apps/api-admin/src/handlers/users.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  GetUsersQuerySchema,
  CreateUserInputSchema,
  UpdateUserInputSchema,
  CreateUserResponseSchema,
  UpdateUserResponseSchema,
  DeleteUserResponseSchema,
  ErrorResponseSchema,
} from '@/shared/schemas/user';
import { createUser, getUsers, updateUser, deleteUser } from '@/shared/services/user-service';

/**
 * ユーザー一覧取得 (Admin API) - 全ユーザー表示可能
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const queryResult = GetUsersQuerySchema.safeParse(
      Object.fromEntries(url.searchParams.entries())
    );

    if (!queryResult.success) {
      const errorResponse = ErrorResponseSchema.parse({
        success: false,
        message: 'Invalid query parameters',
        error: {
          code: 'VALIDATION_ERROR',
          details: queryResult.error.format(),
        },
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const query = queryResult.data;

    // Admin APIでは全てのroleのユーザーを表示可能
    const users = await getUsers(query);

    return NextResponse.json(users);
  } catch (error) {
    const errorResponse = ErrorResponseSchema.parse({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * ユーザー作成 (Admin API) - 任意のroleで作成可能
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const inputResult = CreateUserInputSchema.safeParse(body);

    if (!inputResult.success) {
      const errorResponse = ErrorResponseSchema.parse({
        success: false,
        message: 'Invalid input data',
        error: {
          code: 'VALIDATION_ERROR',
          details: inputResult.error.format(),
        },
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const input = inputResult.data;

    // Admin APIでは任意のroleで作成可能
    const user = await createUser(input);

    const response = CreateUserResponseSchema.parse({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const errorResponse = ErrorResponseSchema.parse({
      success: false,
      message: 'Failed to create user',
      error: {
        code: 'CREATION_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * ユーザー削除 (Admin API) - 管理者のみ削除可能
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;

    await deleteUser(id);

    const response = DeleteUserResponseSchema.parse({
      success: true,
      data: { deletedId: id },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(response);
  } catch (error) {
    const errorResponse = ErrorResponseSchema.parse({
      success: false,
      message: 'Failed to delete user',
      error: {
        code: 'DELETION_ERROR',
      },
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
```

## Validation Utilities

### Request Validation Helper

```typescript
// packages/shared/src/utils/validation.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ErrorResponseSchema } from '../schemas/base';

/**
 * リクエストボディを型安全にバリデーションする
 */
export async function validateRequestBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: unknown }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return { success: false, error: result.error.format() };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: 'Invalid JSON' };
  }
}

/**
 * クエリパラメータを型安全にバリデーションする
 */
export function validateQueryParams<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: unknown } {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const result = schema.safeParse(params);

    if (!result.success) {
      return { success: false, error: result.error.format() };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: 'Invalid query parameters' };
  }
}

/**
 * レスポンスを型安全にバリデーションする
 */
export function validateResponse<T extends z.ZodType>(data: unknown, schema: T): z.infer<T> {
  return schema.parse(data);
}
```

## OpenAPI Generation

### Schema to OpenAPI

```typescript
// packages/shared/src/utils/openapi.ts
import { z } from 'zod';
import { generateSchema } from '@anatine/zod-openapi';
import {
  CreateUserInputSchema,
  UpdateUserInputSchema,
  UserSchema,
  GetUsersQuerySchema,
} from '../schemas/user';

/**
 * Zodスキーマから OpenAPI 仕様を生成
 */
export function generateOpenAPISpec() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Serverless Template API',
      version: '1.0.0',
      description: 'Type-safe API with Zod validation',
    },
    paths: {
      '/api/member/users': {
        get: {
          summary: 'Get member users',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: generateSchema(GetUsersQuerySchema.shape.page),
            },
            {
              name: 'limit',
              in: 'query',
              schema: generateSchema(GetUsersQuerySchema.shape.limit),
            },
            {
              name: 'search',
              in: 'query',
              schema: generateSchema(GetUsersQuerySchema.shape.search),
            },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: generateSchema(UserSchema),
                },
              },
            },
          },
        },
        post: {
          summary: 'Create member user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: generateSchema(CreateUserInputSchema),
              },
            },
          },
          responses: {
            '201': {
              description: 'User created successfully',
              content: {
                'application/json': {
                  schema: generateSchema(UserSchema),
                },
              },
            },
          },
        },
      },
      '/api/admin/users': {
        get: {
          summary: 'Get all users (admin)',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: generateSchema(GetUsersQuerySchema.shape.page),
            },
            {
              name: 'limit',
              in: 'query',
              schema: generateSchema(GetUsersQuerySchema.shape.limit),
            },
            {
              name: 'role',
              in: 'query',
              schema: generateSchema(GetUsersQuerySchema.shape.role),
            },
            {
              name: 'search',
              in: 'query',
              schema: generateSchema(GetUsersQuerySchema.shape.search),
            },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: generateSchema(UserSchema),
                },
              },
            },
          },
        },
        post: {
          summary: 'Create user (admin)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: generateSchema(CreateUserInputSchema),
              },
            },
          },
          responses: {
            '201': {
              description: 'User created successfully',
              content: {
                'application/json': {
                  schema: generateSchema(UserSchema),
                },
              },
            },
          },
        },
      },
    },
  };
}
```

## Benefits

### 1. Single Source of Truth

- **型定義**: TypeScript型がZodスキーマから自動生成
- **バリデーション**: リクエスト・レスポンスの一貫したバリデーション
- **ドキュメント**: OpenAPI仕様の自動生成

### 2. Member/Admin API Symmetry

- **共通スキーマ**: 同一のドメインスキーマを両APIで使用
- **権限による差分**: APIレベルでの適切な権限制御
- **一貫性**: 同一の型安全性・バリデーション戦略

### 3. Runtime Safety

- **入力検証**: 不正なデータの早期発見
- **出力検証**: レスポンスの型安全性保証
- **エラーハンドリング**: 統一されたエラーレスポンス形式

### 4. Developer Experience

- **型補完**: IDEでの完全な型補完
- **リファクタリング安全性**: スキーマ変更時の影響範囲把握
- **自動テスト**: スキーマベースの自動テスト生成

## Error Handling

### Comprehensive Error Strategy

```typescript
// packages/shared/src/utils/error-handler.ts
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { ErrorResponseSchema } from '../schemas/base';

/**
 * APIエラーコードの定義
 */
export enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * カスタムエラークラス
 */
export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Zodバリデーションエラーを処理
 */
export function handleZodError(error: z.ZodError): NextResponse {
  const formattedErrors = error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  const errorResponse = ErrorResponseSchema.parse({
    success: false,
    message: 'Validation failed',
    error: {
      code: ErrorCode.VALIDATION_ERROR,
      details: formattedErrors,
    },
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(errorResponse, { status: 400 });
}

/**
 * DynamoDBエラーを処理
 */
export function handleDynamoDBError(error: any): NextResponse {
  let statusCode = 500;
  let errorCode = ErrorCode.DATABASE_ERROR;
  let message = 'Database operation failed';

  if (error.name === 'ResourceNotFoundException') {
    statusCode = 404;
    errorCode = ErrorCode.NOT_FOUND;
    message = 'Resource not found';
  } else if (error.name === 'ConditionalCheckFailedException') {
    statusCode = 409;
    errorCode = ErrorCode.CONFLICT;
    message = 'Resource conflict';
  } else if (error.name === 'ValidationException') {
    statusCode = 400;
    errorCode = ErrorCode.INVALID_INPUT;
    message = 'Invalid database input';
  }

  const errorResponse = ErrorResponseSchema.parse({
    success: false,
    message,
    error: {
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    },
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * 汎用エラーハンドラー
 */
export function handleError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // ApiErrorの場合
  if (error instanceof ApiError) {
    const errorResponse = ErrorResponseSchema.parse({
      success: false,
      message: error.message,
      error: {
        code: error.code,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(errorResponse, { status: error.statusCode });
  }

  // Zodエラーの場合
  if (error instanceof z.ZodError) {
    return handleZodError(error);
  }

  // DynamoDBエラーの場合
  if (error && typeof error === 'object' && 'name' in error) {
    const errorName = (error as any).name;
    if (errorName && errorName.includes('DynamoDB')) {
      return handleDynamoDBError(error);
    }
  }

  // その他のエラー
  const errorResponse = ErrorResponseSchema.parse({
    success: false,
    message: 'Internal server error',
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    },
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(errorResponse, { status: 500 });
}
```

### Error Handling in API Routes

```typescript
// apps/api-member/src/handlers/users.ts (Enhanced with error handling)
import { handleError, ApiError, ErrorCode } from '@/shared/utils/error-handler';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new ApiError(ErrorCode.INVALID_INPUT, 'Content-Type must be application/json', 400);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      throw new ApiError(ErrorCode.INVALID_INPUT, 'Invalid JSON in request body', 400);
    }

    // Validate input
    const inputResult = CreateUserInputSchema.safeParse(body);
    if (!inputResult.success) {
      return handleZodError(inputResult.error);
    }

    const input = inputResult.data;

    // Check for duplicate email
    const existingUser = await userService.findByEmail(input.email);
    if (existingUser) {
      throw new ApiError(ErrorCode.ALREADY_EXISTS, 'User with this email already exists', 409, {
        email: input.email,
      });
    }

    // Create user with retry logic
    let user;
    let retries = 3;
    while (retries > 0) {
      try {
        user = await userService.createUser({
          ...input,
          role: 'member' as const,
        });
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 100));
      }
    }

    // Validate response
    const response = CreateUserResponseSchema.parse({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
```

### Schema Validation with Custom Error Messages

```typescript
// packages/shared/src/schemas/user.ts (Enhanced validation)
export const CreateUserInputSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),

    email: z
      .string()
      .email('Invalid email format')
      .max(254, 'Email must be less than 254 characters')
      .transform(email => email.toLowerCase())
      .refine(email => !email.includes('..'), 'Email cannot contain consecutive dots'),

    role: z
      .enum(['member', 'admin'], {
        errorMap: () => ({ message: 'Role must be either "member" or "admin"' }),
      })
      .default('member'),
  })
  .strict(); // Reject unknown fields

// Advanced validation with context
export const UpdateUserInputSchema = z
  .object({
    id: IdSchema,
    name: z.string().optional(),
    email: z.string().email().optional(),
    role: z.enum(['member', 'admin']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(data => Object.keys(data).length > 1, 'At least one field to update must be provided')
  .refine(data => {
    // Custom business logic validation
    if (data.role === 'admin' && data.isActive === false) {
      return false;
    }
    return true;
  }, 'Admin users cannot be deactivated');
```

### Error Recovery and Resilience

```typescript
// packages/shared/src/utils/resilience.ts
import { z } from 'zod';

/**
 * リトライ可能なエラーか判定
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return [ErrorCode.DATABASE_ERROR, ErrorCode.EXTERNAL_SERVICE_ERROR].includes(error.code);
  }

  if (error && typeof error === 'object' && 'name' in error) {
    const errorName = (error as any).name;
    return ['NetworkError', 'TimeoutError', 'ServiceUnavailable'].includes(errorName);
  }

  return false;
}

/**
 * エクスポネンシャルバックオフでリトライ
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * タイムアウト付き操作
 */
export async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new ApiError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'Operation timed out', 504)),
      timeoutMs
    )
  );

  return Promise.race([operation, timeoutPromise]);
}
```

### Error Monitoring and Logging

```typescript
// packages/shared/src/utils/error-logger.ts
interface ErrorLog {
  timestamp: string;
  errorCode: string;
  message: string;
  userId?: string;
  requestId: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
}

export class ErrorLogger {
  static log(error: unknown, context?: Record<string, unknown>): void {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      errorCode: error instanceof ApiError ? error.code : 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      requestId: (context?.requestId as string) || 'unknown',
      userId: context?.userId as string,
      stackTrace: error instanceof Error ? error.stack : undefined,
      context,
    };

    // Development環境ではconsole.error
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Log:', errorLog);
    }

    // Production環境ではCloudWatch Logsに送信
    if (process.env.NODE_ENV === 'production') {
      // CloudWatch Logs実装
      // aws-sdk/client-cloudwatch-logsを使用
    }
  }
}
```

---

_この包括的なエラーハンドリング戦略により、予期しないエラーから適切に回復し、ユーザーに一貫性のあるエラー体験を提供します。_
