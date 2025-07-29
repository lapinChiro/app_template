# Security Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the security features in your TypeScript serverless application.

## Quick Start

```typescript
import express from 'express';
import {
  createSecureApp,
  createAuthRateLimiter,
  createApiRateLimiter,
  validateBody,
  securityHeaders,
  DEFAULT_SECURITY_CONFIG,
} from '@shared/security';

const app = createSecureApp();
```

## Security Layers

### 1. Rate Limiting

Protect your endpoints from abuse:

```typescript
// Global rate limiting (100 requests per 15 minutes)
app.use(createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));

// Auth endpoints (5 attempts per 15 minutes)
authRouter.use(createAuthRateLimiter());

// API endpoints (30 requests per minute)
apiRouter.use(createApiRateLimiter());
```

### 2. Security Headers

Automatically applied with `createSecureApp()` or manually:

```typescript
app.use(securityHeaders({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 3. CORS Configuration

```typescript
app.use(createCorsMiddleware({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
```

### 4. Input Validation

Always validate inputs with Zod:

```typescript
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user']),
});

router.post('/users', validateBody(CreateUserSchema), async (req, res) => {
  // req.body is now typed and validated
  const { email, name, role } = req.body;
});
```

### 5. Request Logging

```typescript
const logger: SecurityLogger = {
  log(level, message, data) {
    // Integrate with your logging service
    console.log(JSON.stringify({ level, message, ...data }));
  },
};

app.use(createRequestLogger(logger));
```

### 6. Authentication Middleware

```typescript
import { authMiddleware } from '@shared/auth/middleware';

// Protect routes
router.use(authMiddleware({
  tokenValidator: new TokenValidator(config),
  requiredRole: 'admin',
}));
```

## Environment Variables

Required security-related environment variables:

```bash
# JWT Configuration
JWT_SECRET=your-very-long-random-string-at-least-32-chars

# CORS
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://api.example.com/auth/callback

# Optional
HOSTED_DOMAIN=example.com  # Restrict to company domain
```

## Security Checklist

Before deploying any endpoint:

- [ ] Rate limiting applied
- [ ] Input validation with Zod
- [ ] Authentication required (if not public)
- [ ] Authorization checks implemented
- [ ] Security headers configured
- [ ] CORS properly set up
- [ ] Request logging enabled
- [ ] Error messages don't leak sensitive info
- [ ] Environment variables properly configured

## AWS Lambda Considerations

When deploying to Lambda:

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import serverless from 'serverless-http';

const app = createSecureApp();
// ... configure routes ...

export const handler: APIGatewayProxyHandler = serverless(app);
```

### Lambda-specific Security

1. **Function Permissions**: Use least privilege IAM roles
2. **Environment Variables**: Use AWS Secrets Manager for sensitive data
3. **VPC Configuration**: Place functions in VPC if accessing private resources
4. **API Gateway**: Enable throttling and API keys

## Monitoring and Alerts

Set up CloudWatch alarms for:

- Rate limit violations (429 responses)
- Authentication failures (401 responses)
- Authorization failures (403 responses)
- Server errors (5xx responses)
- Suspicious patterns in logs

## Testing Security

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';

describe('Security', () => {
  it('should enforce rate limiting', async () => {
    const app = createSecureApp();
    
    // Make requests up to limit
    for (let i = 0; i < 100; i++) {
      await request(app).get('/api/users').expect(200);
    }
    
    // Next request should be rate limited
    await request(app).get('/api/users').expect(429);
  });

  it('should validate input', async () => {
    const app = createSecureApp();
    
    await request(app)
      .post('/api/users')
      .send({ email: 'invalid-email' })
      .expect(400);
  });

  it('should set security headers', async () => {
    const app = createSecureApp();
    
    const response = await request(app).get('/health');
    
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
  });
});
```

## Common Pitfalls to Avoid

1. **Don't log sensitive data**: Always sanitize before logging
2. **Don't trust client input**: Always validate
3. **Don't use weak secrets**: Use strong, random values
4. **Don't expose stack traces**: Use proper error handling
5. **Don't skip HTTPS**: Always use TLS in production

## Integration Example

Complete example for a secure API:

```typescript
import express from 'express';
import { z } from 'zod';
import {
  createSecureApp,
  createAuthRateLimiter,
  validateBody,
  createSecurityEventLogger,
} from '@shared/security';
import { authMiddleware } from '@shared/auth/middleware';
import { GoogleOAuth } from '@shared/auth/google-oauth';

// Initialize
const app = createSecureApp();
const oauth = new GoogleOAuth({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.GOOGLE_REDIRECT_URI!,
});

// Auth routes
const authRouter = express.Router();
authRouter.use(createAuthRateLimiter());

authRouter.post('/login', async (req, res) => {
  const { code } = req.body;
  try {
    const tokens = await oauth.exchangeCodeForTokens(code);
    res.json({ tokens });
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Protected API routes
const apiRouter = express.Router();
apiRouter.use(authMiddleware({
  tokenValidator: oauth,
  requiredRole: 'user',
}));

apiRouter.get('/profile', async (req, res) => {
  res.json({ user: (req as any).user });
});

// Mount routes
app.use('/auth', authRouter);
app.use('/api', apiRouter);

export default app;
```

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)