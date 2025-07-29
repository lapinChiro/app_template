---
task_id: '03-03'
task_name: 'Auth Middleware & Guards'
category: 'authentication'
priority: 'high'
estimated_hours: 2
depends_on: ['03-01']
blocks_tasks: ['04-03', '05-01', '05-02']
task_status: 'completed'
developer: 'claude'
started_at: '2025-07-29T11:03:30Z'
completed_at: '2025-07-29T12:30:00Z'
---

# TASK-010: Auth Middleware & Guards

**Priority**: High  
**Estimated**: 2 hours  
**Dependencies**: TASK-008 (Google OAuth)

## Prerequisites

- Next.js middleware の理解
- JWT 検証の知識
- ロールベースアクセス制御（RBAC）の概念

## Reference Implementation

- Primary: `@docs/impl/auth/google-oauth.md` - JWT検証実装
- Secondary: `@docs/impl/auth/admin-crud.md` - 管理者権限チェック

## Acceptance Criteria

- [ ] JWT 検証ミドルウェアが実装されている
- [ ] ロールベースアクセス制御が動作する
- [ ] API ルート保護が型安全に実装されている
- [ ] エラーハンドリングが包括的である
- [ ] 認証失敗時に適切な HTTP ステータスコードが返される
- [ ] セッション更新が自動的に行われる

## Detailed Implementation

### JWT Verification Middleware
```typescript
// packages/shared/src/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from './jwt';
import { UserRole } from '../schemas/user';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options?: {
    roles?: UserRole[];
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Extract token from cookie
      const token = req.cookies.get('auth-token')?.value;
      
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Verify JWT
      const payload = await verifyJWT(token);
      
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      // Check role if specified
      if (options?.roles && !options.roles.includes(payload.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Attach user to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      // Execute handler
      return handler(authenticatedReq);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}
```

### Role-Based Guards
```typescript
// packages/shared/src/auth/guards.ts
export const requireAuth = withAuth(async (req) => {
  // Base authenticated handler
  return NextResponse.next();
});

export const requireAdmin = withAuth(
  async (req) => {
    return NextResponse.next();
  },
  { roles: ['admin'] }
);

export const requireMember = withAuth(
  async (req) => {
    return NextResponse.next();
  },
  { roles: ['member', 'admin'] } // Admin can access member routes
);
```

### API Route Protection
```typescript
// apps/api-member/src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@shared/auth/middleware';
import { userRepository } from '@/services/repositories';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const user = await userRepository.findById(req.user!.id);
  
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: user });
});

// apps/api-admin/src/app/api/users/route.ts
import { requireAdmin } from '@shared/auth/guards';

export const GET = requireAdmin(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const cursor = searchParams.get('cursor') || undefined;

  const result = await userRepository.findAll({
    limit,
    lastEvaluatedKey: cursor,
  });

  return NextResponse.json({
    data: result.items,
    nextCursor: result.lastEvaluatedKey,
  });
});
```

### Next.js Middleware Configuration
```typescript
// apps/web-member/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@shared/auth/jwt';

export async function middleware(request: NextRequest) {
  // Public routes that don't require authentication
  const publicPaths = ['/login', '/register', '/api/auth/google'];
  
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await verifyJWT(token);
    
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Refresh token if needed (within 5 minutes of expiry)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp - now < 300) {
      // Token refresh logic here
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Error Handling
```typescript
// packages/shared/src/auth/errors.ts
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const AuthErrors = {
  Unauthorized: new AuthError('Unauthorized', 401, 'UNAUTHORIZED'),
  InvalidToken: new AuthError('Invalid token', 401, 'INVALID_TOKEN'),
  TokenExpired: new AuthError('Token expired', 401, 'TOKEN_EXPIRED'),
  InsufficientPermissions: new AuthError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS'),
} as const;
```

## Quality Gates

- TypeScript errors: 0
- Test coverage: > 95%
- Response time: < 10ms (token verification)
- Security: OWASP compliant

## Verification Steps

```bash
# 型チェック
pnpm tsc --noEmit

# ユニットテスト
pnpm test packages/shared/src/auth

# 統合テスト
pnpm test:e2e apps/api-member/src/app/api

# セキュリティテスト
# 1. 無効なトークンでのアクセス
curl -H "Cookie: auth-token=invalid" http://localhost:3000/api/profile

# 2. 権限不足でのアクセス（memberトークンでadmin API）
curl -H "Cookie: auth-token=$MEMBER_TOKEN" http://localhost:3001/api/users

# 3. 有効なトークンでのアクセス
curl -H "Cookie: auth-token=$VALID_TOKEN" http://localhost:3000/api/profile
```

## Output

- 再利用可能な認証ミドルウェア
- 型安全なルート保護
- ロールベースアクセス制御システム

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented