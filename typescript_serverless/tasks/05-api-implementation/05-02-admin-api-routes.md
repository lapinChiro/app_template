# TASK-015: Admin API Routes

**Priority**: Medium  
**Estimated**: 4 hours  
**Dependencies**: TASK-007 (Zod Schemas), TASK-010 (Auth Middleware), TASK-009 (User Repository)

## Prerequisites

- REST API CRUD 操作の理解
- 管理者権限の概念
- 監査ログの基本知識

## Reference Implementation

- Primary: `@docs/impl/auth/admin-crud.md` - 管理者CRUD実装
- Secondary: `@docs/impl/api/zod-schemas.md` - バリデーション実装

## Acceptance Criteria

- [ ] apps/api-admin が Next.js アプリとして初期化されている
- [ ] ユーザー CRUD API が実装されている
- [ ] 管理者認証が全エンドポイントで動作する
- [ ] 監査ログ機能が実装されている
- [ ] バルク操作 API が実装されている
- [ ] ページネーションが実装されている

## Detailed Implementation

### Project Setup
```json
// apps/api-admin/package.json
{
  "name": "@apps/api-admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3101",
    "build": "next build",
    "start": "next start -p 3101",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@shared/core": "workspace:*",
    "next": "14.2.0",
    "zod": "^3.22.0",
    "@aws-sdk/client-dynamodb": "^3.500.0",
    "@aws-sdk/lib-dynamodb": "^3.500.0",
    "jose": "^5.2.0",
    "rate-limiter-flexible": "^3.0.0",
    "csv-parse": "^5.5.0",
    "csv-stringify": "^6.4.0"
  }
}
```

### Audit Log Service
```typescript
// apps/api-admin/src/lib/audit-log.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

export class AuditLogService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client: DynamoDBClient, tableName: string) {
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  async log(
    user: { id: string; email: string },
    action: string,
    resource: string,
    options?: {
      resourceId?: string;
      details?: Record<string, any>;
      request?: Request;
    }
  ): Promise<void> {
    const log: AuditLog = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      action,
      resource,
      resourceId: options?.resourceId,
      details: options?.details,
      ip: options?.request?.headers.get('x-forwarded-for') || undefined,
      userAgent: options?.request?.headers.get('user-agent') || undefined,
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `AUDIT#${log.timestamp.substring(0, 10)}`, // Daily partition
          SK: `${log.timestamp}#${log.id}`,
          ...log,
        },
      })
    );
  }
}
```

### User CRUD API
```typescript
// apps/api-admin/src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@shared/core/auth/guards';
import { UserSchema } from '@shared/core/schemas';
import { createApiHandler } from '@/lib/api-config';
import { userRepository } from '@/lib/repositories';
import { auditLog } from '@/lib/audit-log';

// GET /api/users - List all users with pagination
const ListUsersSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  role: z.enum(['member', 'admin']).optional(),
});

export const GET = requireAdmin(
  createApiHandler(async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const params = ListUsersSchema.parse(Object.fromEntries(searchParams));

    const result = await userRepository.findAll({
      limit: params.limit,
      lastEvaluatedKey: params.cursor,
      filter: params.role ? { role: params.role } : undefined,
    });

    return NextResponse.json({
      data: result.items,
      pagination: {
        limit: params.limit,
        nextCursor: result.lastEvaluatedKey,
      },
    });
  })
);

// POST /api/users - Create new user
export const POST = requireAdmin(
  createApiHandler(async ({ request }) => {
    const authReq = request as any;
    const body = await request.json();
    
    // Validate user data
    const userData = UserSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(body);
    
    // Check if email already exists
    const existing = await userRepository.findByEmail(userData.email);
    if (existing) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }
    
    // Create user
    const user = await userRepository.create(userData);
    
    // Audit log
    await auditLog.log(authReq.user!, 'CREATE', 'USER', {
      resourceId: user.id,
      details: { email: user.email, role: user.role },
      request,
    });
    
    return NextResponse.json({ data: user }, { status: 201 });
  })
);
```

### Individual User API
```typescript
// apps/api-admin/src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@shared/core/auth/guards';
import { UserSchema } from '@shared/core/schemas';
import { createApiHandler } from '@/lib/api-config';
import { userRepository } from '@/lib/repositories';
import { auditLog } from '@/lib/audit-log';

interface RouteParams {
  params: { id: string };
}

// GET /api/users/:id - Get user by ID
export const GET = requireAdmin(
  createApiHandler(async ({ params }: RouteParams) => {
    const user = await userRepository.findById(params.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: user });
  })
);

// PUT /api/users/:id - Update user
export const PUT = requireAdmin(
  createApiHandler(async ({ request, params }: RouteParams & { request: any }) => {
    const body = await request.json();
    
    // Validate update data
    const updateData = UserSchema
      .omit({ id: true, createdAt: true, updatedAt: true })
      .partial()
      .parse(body);
    
    // Check if user exists
    const existing = await userRepository.findById(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user
    const user = await userRepository.update(params.id, updateData);
    
    // Audit log
    await auditLog.log(request.user!, 'UPDATE', 'USER', {
      resourceId: params.id,
      details: { changes: updateData },
      request,
    });
    
    return NextResponse.json({ data: user });
  })
);

// DELETE /api/users/:id - Delete user
export const DELETE = requireAdmin(
  createApiHandler(async ({ request, params }: RouteParams & { request: any }) => {
    // Check if user exists
    const user = await userRepository.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prevent self-deletion
    if (user.id === request.user!.id) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }
    
    // Delete user
    await userRepository.delete(params.id);
    
    // Audit log
    await auditLog.log(request.user!, 'DELETE', 'USER', {
      resourceId: params.id,
      details: { email: user.email },
      request,
    });
    
    return NextResponse.json({ success: true });
  })
);
```

### Bulk Operations API
```typescript
// apps/api-admin/src/app/api/users/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@shared/core/auth/guards';
import { UserSchema } from '@shared/core/schemas';
import { createApiHandler } from '@/lib/api-config';
import { userRepository } from '@/lib/repositories';
import { auditLog } from '@/lib/audit-log';

const BulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

// POST /api/users/bulk/delete - Bulk delete users
export const POST = requireAdmin(
  createApiHandler(async ({ request }) => {
    const authReq = request as any;
    const body = await request.json();
    const { ids } = BulkDeleteSchema.parse(body);
    
    // Prevent self-deletion
    if (ids.includes(authReq.user!.id)) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }
    
    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
    };
    
    // Process deletions
    for (const id of ids) {
      try {
        const user = await userRepository.findById(id);
        if (!user) {
          results.failed.push({ id, error: 'Not found' });
          continue;
        }
        
        await userRepository.delete(id);
        results.success.push(id);
        
        // Audit log
        await auditLog.log(authReq.user!, 'BULK_DELETE', 'USER', {
          resourceId: id,
          details: { email: user.email },
          request,
        });
      } catch (error) {
        results.failed.push({ id, error: 'Delete failed' });
      }
    }
    
    return NextResponse.json({ data: results });
  })
);
```

### Export/Import API
```typescript
// apps/api-admin/src/app/api/users/export/route.ts
import { NextResponse } from 'next/server';
import { stringify } from 'csv-stringify';
import { requireAdmin } from '@shared/core/auth/guards';
import { createApiHandler } from '@/lib/api-config';
import { userRepository } from '@/lib/repositories';

// GET /api/users/export - Export users as CSV
export const GET = requireAdmin(
  createApiHandler(async ({ request }) => {
    const authReq = request as any;
    
    // Fetch all users
    const users = [];
    let cursor: string | undefined;
    
    do {
      const result = await userRepository.findAll({
        limit: 100,
        lastEvaluatedKey: cursor,
      });
      users.push(...result.items);
      cursor = result.lastEvaluatedKey;
    } while (cursor);
    
    // Convert to CSV
    const csv = await new Promise<string>((resolve, reject) => {
      stringify(
        users,
        {
          header: true,
          columns: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
        },
        (err, output) => {
          if (err) reject(err);
          else resolve(output);
        }
      );
    });
    
    // Audit log
    await auditLog.log(authReq.user!, 'EXPORT', 'USER', {
      details: { count: users.length },
      request,
    });
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  })
);
```

### Statistics API
```typescript
// apps/api-admin/src/app/api/stats/users/route.ts
import { NextResponse } from 'next/server';
import { requireAdmin } from '@shared/core/auth/guards';
import { createApiHandler } from '@/lib/api-config';
import { userRepository } from '@/lib/repositories';

// GET /api/stats/users - Get user statistics
export const GET = requireAdmin(
  createApiHandler(async () => {
    // In production, these would be optimized queries
    const stats = {
      total: 0,
      byRole: { member: 0, admin: 0 },
      recentSignups: 0,
      activeToday: 0,
    };
    
    // Count all users
    let cursor: string | undefined;
    do {
      const result = await userRepository.findAll({
        limit: 100,
        lastEvaluatedKey: cursor,
      });
      
      result.items.forEach(user => {
        stats.total++;
        stats.byRole[user.role]++;
        
        const createdDate = new Date(user.createdAt);
        const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation <= 7) {
          stats.recentSignups++;
        }
      });
      
      cursor = result.lastEvaluatedKey;
    } while (cursor);
    
    return NextResponse.json({ data: stats });
  })
);
```

## Quality Gates

- API response time: < 300ms (p95)
- Audit log coverage: 100%
- Authorization checks: 100%
- Bulk operation success rate: > 95%

## Verification Steps

```bash
# プロジェクトセットアップ
cd apps/api-admin
pnpm install

# 開発サーバー起動
pnpm dev

# API テスト (管理者トークン必要)
export ADMIN_TOKEN="your-admin-jwt-token"

# 1. ユーザー一覧
curl -H "Cookie: auth-token=$ADMIN_TOKEN" http://localhost:3101/api/users

# 2. ユーザー作成
curl -X POST -H "Cookie: auth-token=$ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","role":"member"}' \
  http://localhost:3101/api/users

# 3. バルク削除
curl -X POST -H "Cookie: auth-token=$ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ids":["id1","id2"]}' \
  http://localhost:3101/api/users/bulk/delete

# 4. CSV エクスポート
curl -H "Cookie: auth-token=$ADMIN_TOKEN" \
  http://localhost:3101/api/users/export -o users.csv

# 型チェック
pnpm type-check

# ビルド確認
pnpm build
```

## Output

- 完全な管理者 API
- 監査ログ付きの全操作
- バルク操作とエクスポート機能

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented