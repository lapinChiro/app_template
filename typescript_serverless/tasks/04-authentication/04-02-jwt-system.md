# Task 4.2: JWT Authentication System

## Overview

Implement a comprehensive JWT authentication system with secure token generation, validation, refresh functionality, and authentication middleware for API protection.

## Description

Create a robust JWT service that handles access tokens, refresh tokens, httpOnly cookie storage, and provides authentication middleware for protecting API endpoints with proper security measures.

## Requirements

- JWT generation with secure algorithms
- Token validation and refresh mechanisms
- httpOnly cookie storage (no localStorage)
- Authentication middleware for API routes
- Type-safe JWT payload definitions

## Dependencies

- **Depends on**: Task 3.1 (Auth schemas), Task 4.1 (OAuth for user context)
- **Blocks**: Tasks 6.1-6.3 (Member API), Tasks 7.1-7.3 (Admin API), Tasks 8.1-8.3 (Frontend auth)
- **Can work in parallel with**: Task 4.3 (Repository implementation)

## Implementation Reference

- [`@docs/impl/auth/google-oauth.md`](../docs/impl/auth/google-oauth.md)

## Acceptance Criteria

- [ ] JWT service with generate/verify/refresh
- [ ] Secure httpOnly cookie configuration
- [ ] Authentication middleware for API routes
- [ ] Type-safe JWT payload with Zod
- [ ] Refresh token rotation for security
- [ ] Token expiration handling
- [ ] Role-based authorization support
- [ ] CSRF protection integration

## Technical Requirements

- **Security**: httpOnly cookies, secure algorithms (RS256/HS256)
- **Performance**: Token validation < 50ms
- **Type Safety**: Zod-validated JWT payloads
- **Member/Admin**: Unified auth for both APIs

## JWT Implementation

```typescript
// Core JWT service to implement:
interface JWTService {
  generateAccessToken(payload: JWTPayload): string;
  generateRefreshToken(userId: string): string;
  verifyAccessToken(
    token: string
  ): { success: true; payload: JWTPayload } | { success: false; error: string };
  verifyRefreshToken(
    token: string
  ): { success: true; userId: string } | { success: false; error: string };
  refreshTokens(refreshToken: string): Promise<TokenPair>;
}

// Secure cookie configuration
const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 3600, // 1 hour for access token
};
```

## Progress Tracking (Claude Code Critical)

**MANDATORY**: Create `@progress/04-02-jwt-system.md` with structured YAML frontmatter for automated progress analysis.

### Required YAML Frontmatter

```yaml
---
task_id: '04-02'
task_name: 'jwt-system'
task_status: 'completed' # MUST update when done
developer: '[Your Name]'
start_date: 'YYYY-MM-DD'
end_date: 'YYYY-MM-DD' # when completed
estimated_hours: 7
actual_hours: X.X # track actual time
blocks_tasks: ['06-01', '06-02', '06-03', '07-01', '07-02', '07-03', '08-01', '08-02', '08-03'] # All API and frontend auth
depends_on_completed: ['03-01', '04-01'] # requires Auth schemas and OAuth
technical_decisions:
  jwt_algorithm: '[RS256|HS256|ES256]' # CRITICAL: affects all token security
  token_storage_method: '[http_only_cookies|secure_storage|hybrid]' # security approach
  access_token_expiry: '[15m|1h|4h]' # token lifecycle choice
  refresh_token_strategy: '[rotation|reuse|family]' # refresh security pattern
  cookie_security_config: '[strict|lax|secure_only]' # cookie configuration
  csrf_protection_method: '[double_submit|synchronizer_token|custom_header]' # CSRF strategy
  middleware_architecture: '[next_middleware|api_wrapper|decorator]' # implementation pattern
files_modified:
  - path: 'packages/shared/src/services/jwt.ts'
    action: 'created'
    purpose: 'JWT generation and validation service'
  - path: 'packages/shared/src/middleware/auth.ts'
    action: 'created'
    purpose: 'Authentication middleware'
  - path: 'packages/shared/src/utils/cookies.ts'
    action: 'created'
    purpose: 'Secure cookie utilities'
quality_metrics:
  eslint_errors: 0 # MUST be 0
  typescript_errors: 0 # MUST be 0
  token_validation_time: 'X ms' # < 50ms requirement
  security_audit_score: '100%' # security checklist completion
  build_success: true # MUST be true
acceptance_criteria_met: '8/8' # count completed criteria
---
```

### Critical Recording Requirements

1. **jwt_algorithm & token_storage_method** - ALL authentication security depends on these
2. **access_token_expiry & refresh_token_strategy** - affects user experience and security
3. **csrf_protection_method** - critical for API security across all endpoints
4. **Record token validation performance** - < 50ms requirement
5. **Complete security audit** - 100% security checklist required

## Estimated Time

6-8 hours

## Implementation Steps

1. Set up JWT library and security configuration
2. Implement token generation with proper algorithms
3. Create httpOnly cookie configuration
4. Build token validation and refresh logic
5. Implement authentication middleware
6. Add role-based authorization
7. Test token lifecycle and security
8. Document security measures and usage

---

_Task Status: Ready for Implementation_
_Critical for all API authentication_
