# TASK-008: Google OAuth Implementation

**Priority**: High  
**Estimated**: 4 hours  
**Dependencies**: TASK-005, TASK-007 (Shared Package, Zod Schemas)

## Prerequisites

- Google Cloud Console アクセス
- OAuth 2.0 の基本理解
- JWT の知識

## Reference Implementation

- Primary: `@docs/impl/auth/google-oauth.md` - 完全な OAuth 実装
- Security: `@docs/impl/security/best-practices.md` - JWT セキュリティ

## Acceptance Criteria

- [ ] Google OAuth 2.0 + PKCE フローが実装されている
- [ ] JWT トークンが RS256 で署名されている（google-oauth.md Section 3）
- [ ] httpOnly, Secure, SameSite=Strict Cookie が設定されている
- [ ] トークンの有効期限が適切（access: 15分、refresh: 7日）
- [ ] CSRF 対策として state パラメータが実装されている
- [ ] エラーハンドリングが包括的である

## Detailed Implementation

### OAuth Client
```typescript
// packages/shared/src/auth/oauth-client.ts - google-oauth.md Section 2
import { OAuth2Client } from 'google-auth-library';

export class GoogleAuthService {
  private client: OAuth2Client;
  
  constructor() {
    this.client = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    });
  }
  
  // PKCE 対応の認証 URL 生成
  generateAuthUrl(state: string): string {
    const codeChallenge = this.generateCodeChallenge();
    
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
  }
  
  // JWT 生成（google-oauth.md Section 3）
  async generateTokens(user: User): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    
    const accessToken = await this.signJWT(payload, '15m');
    const refreshToken = await this.signJWT(
      { sub: user.id }, 
      '7d'
    );
    
    return { accessToken, refreshToken };
  }
}
```

### Cookie Settings
```typescript
// Cookie 設定（security-hardening.md 準拠）
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
```

### Error Handling
```typescript
// 包括的エラーハンドリング
export class AuthError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'INVALID_STATE' | 'OAUTH_ERROR',
    public statusCode: number = 401
  ) {
    super(message);
  }
}

// 使用例
try {
  const tokens = await verifyGoogleToken(code);
} catch (error) {
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({
      error: error.code,
      message: error.message
    });
  }
  throw error;
}
```

## Quality Gates

- Security scan: 0 vulnerabilities
- Token validation: 100% coverage
- OWASP compliance: Pass all checks
- Response time: < 200ms

## Verification Steps

```bash
# 環境変数の設定確認
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET

# OAuth フローのテスト
pnpm test packages/shared/src/auth

# セキュリティヘッダーの確認
curl -I http://localhost:3000/api/auth/login | grep -E '(Set-Cookie|Strict-Transport)'

# JWT 検証テスト
pnpm tsx -e "import { verifyJWT } from './packages/shared/src/auth'; console.log(await verifyJWT('test-token'));"
```

## Output

- 本番レベルの Google OAuth 実装
- セキュアな JWT ベース認証
- OWASP 準拠のセキュリティ対策

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented