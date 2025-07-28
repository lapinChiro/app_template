# TASK-014: Member API Routes

**Priority**: Medium  
**Estimated**: 3 hours  
**Dependencies**: TASK-007 (Zod Schemas), TASK-010 (Auth Middleware)

## Prerequisites

- Next.js API Routes の理解
- REST API 設計の基本知識
- Zod によるバリデーション

## Reference Implementation

- Primary: `@docs/impl/api/zod-schemas.md` - APIバリデーション
- Secondary: `@docs/impl/auth/google-oauth.md` - 認証エンドポイント

## Acceptance Criteria

- [ ] apps/api-member が Next.js アプリとして初期化されている
- [ ] ユーザープロフィール API が実装されている
- [ ] 認証関連 API が実装されている
- [ ] 全エンドポイントで Zod バリデーションが動作する
- [ ] エラーハンドリングが統一されている
- [ ] API レート制限が実装されている

## Detailed Implementation

### Project Setup
```json
// apps/api-member/package.json
{
  "name": "@apps/api-member",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3100",
    "build": "next build",
    "start": "next start -p 3100",
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
    "rate-limiter-flexible": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.0"
  }
}
```

### API Configuration
```typescript
// apps/api-member/src/lib/api-config.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthError } from '@shared/core/auth/errors';

export interface ApiContext {
  request: NextRequest;
  params?: Record<string, string>;
}

export type ApiHandler<T = any> = (
  context: ApiContext
) => Promise<NextResponse<T>>;

export function createApiHandler<T>(
  handler: ApiHandler<T>
): ApiHandler<T> {
  return async (context: ApiContext) => {
    try {
      return await handler(context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation error',
        details: error.errors,
      },
      { status: 400 }
    );
  }

  if (error instanceof AuthError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: 'Internal server error',
    },
    { status: 500 }
  );
}
```

### Profile API Endpoints
```typescript
// apps/api-member/src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@shared/core/auth/middleware';
import { UserSchema } from '@shared/core/schemas';
import { createApiHandler } from '@/lib/api-config';
import { userRepository } from '@/lib/repositories';

// GET /api/profile - Get current user profile
export const GET = withAuth(
  createApiHandler(async ({ request }: { request: AuthenticatedRequest }) => {
    const user = await userRepository.findById(request.user!.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: user });
  })
);

// PUT /api/profile - Update current user profile
export const PUT = withAuth(
  createApiHandler(async ({ request }: { request: AuthenticatedRequest }) => {
    const body = await request.json();
    
    // Validate update data
    const updateData = UserSchema.partial().parse(body);
    
    // Users can only update certain fields
    const allowedFields = ['name', 'picture'];
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as any);

    const updatedUser = await userRepository.update(
      request.user!.id,
      filteredData
    );

    return NextResponse.json({ data: updatedUser });
  })
);
```

### Auth API Endpoints
```typescript
// apps/api-member/src/app/api/auth/google/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuthService } from '@shared/core/auth/oauth-client';
import { createApiHandler } from '@/lib/api-config';
import { generateState } from '@/lib/auth-utils';

const authService = new GoogleAuthService();

// GET /api/auth/google - Initiate Google OAuth flow
export const GET = createApiHandler(async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect') || '/';
  
  const state = generateState({ redirect });
  const authUrl = authService.generateAuthUrl(state);
  
  // Store state in secure httpOnly cookie
  const response = NextResponse.redirect(authUrl);
  response.cookies.set('oauth-state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  });
  
  return response;
});

// apps/api-member/src/app/api/auth/callback/route.ts
export const GET = createApiHandler(async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  if (!code || !state) {
    return NextResponse.redirect('/login?error=invalid_request');
  }
  
  // Verify state
  const storedState = request.cookies.get('oauth-state')?.value;
  if (state !== storedState) {
    return NextResponse.redirect('/login?error=invalid_state');
  }
  
  try {
    // Exchange code for tokens
    const tokens = await authService.getTokens(code);
    const userInfo = await authService.getUserInfo(tokens.access_token);
    
    // Create or update user
    let user = await userRepository.findByEmail(userInfo.email);
    if (!user) {
      user = await userRepository.create({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        role: 'member',
      });
    }
    
    // Generate JWT
    const jwt = await generateJWT(user);
    
    // Set auth cookie and redirect
    const { redirect } = JSON.parse(Buffer.from(state, 'base64').toString());
    const response = NextResponse.redirect(redirect);
    
    response.cookies.set('auth-token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect('/login?error=auth_failed');
  }
});

// apps/api-member/src/app/api/auth/logout/route.ts
export const POST = createApiHandler(async ({ request }) => {
  const response = NextResponse.json({ success: true });
  
  // Clear auth cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
  });
  
  return response;
});
```

### Rate Limiting Middleware
```typescript
// apps/api-member/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Create rate limiter
const rateLimiter = new RateLimiterMemory({
  points: 60, // Number of requests
  duration: 60, // Per 60 seconds
});

export async function middleware(request: NextRequest) {
  // Skip rate limiting for static assets
  if (request.nextUrl.pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  try {
    // Use IP address as key
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    await rateLimiter.consume(ip);
    
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
        },
      }
    );
  }
}

export const config = {
  matcher: '/api/:path*',
};
```

### Health Check Endpoint
```typescript
// apps/api-member/src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api-config';

export const GET = createApiHandler(async () => {
  // Check database connection
  try {
    await userRepository.findAll({ limit: 1 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        checks: {
          database: 'failed',
        },
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: 'ok',
    },
  });
});
```

## Quality Gates

- API response time: < 200ms (p95)
- Error rate: < 0.1%
- Validation coverage: 100%
- Rate limit effectiveness: 100%

## Verification Steps

```bash
# プロジェクトセットアップ
cd apps/api-member
pnpm install

# 開発サーバー起動
pnpm dev

# API テスト
# 1. Health check
curl http://localhost:3100/api/health

# 2. Auth flow (ブラウザで確認)
open http://localhost:3100/api/auth/google

# 3. Profile API (要認証)
curl -H "Cookie: auth-token=$TOKEN" http://localhost:3100/api/profile

# 4. Rate limit テスト
for i in {1..100}; do curl http://localhost:3100/api/health; done

# 型チェック
pnpm type-check

# ビルド確認
pnpm build
```

## Output

- 動作するメンバー用 API
- Zod による完全なバリデーション
- レート制限付きの安全な API

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented