# TASK-016: OpenAPI Documentation Generation

**Priority**: Medium  
**Estimated**: 2 hours  
**Dependencies**: TASK-014 (Member API), TASK-015 (Admin API)

## Prerequisites

- OpenAPI 3.0 仕様の理解
- Zod スキーマの基本知識
- Swagger UI の使用経験

## Reference Implementation

- Primary: `@docs/impl/api/zod-schemas.md` - Zod to OpenAPI変換
- Secondary: `@docs/impl/api/openapi-spec.md` - OpenAPI仕様

## Acceptance Criteria

- [ ] zod-to-openapi が設定されている
- [ ] 全 API エンドポイントが OpenAPI で注釈されている
- [ ] Swagger UI が /api-docs で利用可能
- [ ] スキーマから OpenAPI spec が自動生成される
- [ ] API バージョニングが実装されている
- [ ] セキュリティスキームが定義されている

## Detailed Implementation

### Package Setup
```json
// packages/shared/package.json に追加
{
  "dependencies": {
    "@asteasolutions/zod-to-openapi": "^6.0.0",
    "openapi3-ts": "^4.1.0"
  }
}
```

### OpenAPI Registry Setup
```typescript
// packages/shared/src/openapi/registry.ts
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { UserSchema } from '../schemas/user';

// Extend Zod with OpenAPI
import '@asteasolutions/zod-to-openapi/extend';

// Create registry
export const registry = new OpenAPIRegistry();

// Register schemas
registry.register('User', UserSchema.openapi({
  description: 'System user object',
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'user@example.com',
    name: 'John Doe',
    role: 'member',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
}));

// Common responses
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
}).openapi('ErrorResponse');

export const PaginationSchema = z.object({
  limit: z.number(),
  nextCursor: z.string().optional(),
}).openapi('Pagination');

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    pagination: PaginationSchema.optional(),
  });

registry.register('ErrorResponse', ErrorResponseSchema);
registry.register('Pagination', PaginationSchema);

// Security schemes
registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'auth-token',
  description: 'JWT token stored in httpOnly cookie',
});
```

### API Route Annotations
```typescript
// packages/shared/src/openapi/routes/member.ts
import { registry } from '../registry';
import { UserSchema } from '../../schemas/user';
import { z } from 'zod';

// Profile endpoints
registry.registerPath({
  method: 'get',
  path: '/api/profile',
  summary: 'Get current user profile',
  tags: ['Profile'],
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: 'User profile retrieved successfully',
      content: {
        'application/json': {
          schema: ApiResponseSchema(UserSchema),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/profile',
  summary: 'Update current user profile',
  tags: ['Profile'],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: UserSchema.pick({ name: true, picture: true }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Profile updated successfully',
      content: {
        'application/json': {
          schema: ApiResponseSchema(UserSchema),
        },
      },
    },
    400: {
      description: 'Invalid request data',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// Auth endpoints
registry.registerPath({
  method: 'get',
  path: '/api/auth/google',
  summary: 'Initiate Google OAuth flow',
  tags: ['Authentication'],
  parameters: [
    {
      name: 'redirect',
      in: 'query',
      required: false,
      schema: { type: 'string' },
      description: 'Redirect URL after authentication',
    },
  ],
  responses: {
    302: {
      description: 'Redirect to Google OAuth',
      headers: {
        Location: {
          schema: { type: 'string' },
        },
      },
    },
  },
});
```

### Admin API Annotations
```typescript
// packages/shared/src/openapi/routes/admin.ts
import { registry } from '../registry';
import { UserSchema } from '../../schemas/user';
import { z } from 'zod';

// User management endpoints
registry.registerPath({
  method: 'get',
  path: '/api/users',
  summary: 'List all users',
  tags: ['User Management'],
  security: [{ cookieAuth: [] }],
  parameters: [
    {
      name: 'limit',
      in: 'query',
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
    {
      name: 'cursor',
      in: 'query',
      required: false,
      schema: { type: 'string' },
    },
    {
      name: 'role',
      in: 'query',
      required: false,
      schema: { type: 'string', enum: ['member', 'admin'] },
    },
  ],
  responses: {
    200: {
      description: 'Users retrieved successfully',
      content: {
        'application/json': {
          schema: ApiResponseSchema(z.array(UserSchema)),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden - Admin access required',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/users',
  summary: 'Create new user',
  tags: ['User Management'],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: UserSchema.omit({ id: true, createdAt: true, updatedAt: true }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User created successfully',
      content: {
        'application/json': {
          schema: ApiResponseSchema(UserSchema),
        },
      },
    },
    400: {
      description: 'Invalid request data',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    409: {
      description: 'Email already exists',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});
```

### OpenAPI Generator
```typescript
// packages/shared/src/openapi/generator.ts
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';
import './routes'; // Import all route registrations

export function generateOpenAPIDocument(version: 'member' | 'admin') {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  const baseDoc = {
    openapi: '3.0.0',
    info: {
      title: version === 'admin' ? 'Admin API' : 'Member API',
      version: '1.0.0',
      description: `Ultimate Type Safety Serverless Template - ${version === 'admin' ? 'Admin' : 'Member'} API`,
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? `https://api.example.com/${version}`
          : `http://localhost:${version === 'admin' ? '3101' : '3100'}`,
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
  };

  const fullDoc = generator.generateDocument(baseDoc);

  // Filter paths based on version
  if (version === 'member') {
    fullDoc.paths = Object.fromEntries(
      Object.entries(fullDoc.paths).filter(([path]) => 
        !path.includes('/users') || path === '/api/users/me'
      )
    );
  }

  return fullDoc;
}
```

### Swagger UI Setup
```typescript
// apps/api-member/src/app/api-docs/page.tsx
import { generateOpenAPIDocument } from '@shared/openapi/generator';

export default function ApiDocsPage() {
  return (
    <html>
      <head>
        <title>API Documentation</title>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
        />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.onload = function() {
                const spec = ${JSON.stringify(generateOpenAPIDocument('member'))};
                SwaggerUIBundle({
                  spec: spec,
                  dom_id: '#swagger-ui',
                  presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                  ],
                  layout: "BaseLayout",
                  deepLinking: true,
                  showExtensions: true,
                  showCommonExtensions: true
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
```

### OpenAPI Spec Endpoint
```typescript
// apps/api-member/src/app/api/openapi.json/route.ts
import { NextResponse } from 'next/server';
import { generateOpenAPIDocument } from '@shared/openapi/generator';

export async function GET() {
  const spec = generateOpenAPIDocument('member');
  
  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
```

### Build Script for Static Generation
```typescript
// scripts/generate-openapi.ts
import { writeFileSync } from 'fs';
import { join } from 'path';
import { generateOpenAPIDocument } from '@shared/openapi/generator';

// Generate Member API spec
const memberSpec = generateOpenAPIDocument('member');
writeFileSync(
  join(__dirname, '../docs/openapi-member.json'),
  JSON.stringify(memberSpec, null, 2)
);

// Generate Admin API spec
const adminSpec = generateOpenAPIDocument('admin');
writeFileSync(
  join(__dirname, '../docs/openapi-admin.json'),
  JSON.stringify(adminSpec, null, 2)
);

console.log('✅ OpenAPI specifications generated successfully');
```

### API Client Generation
```json
// package.json scripts
{
  "scripts": {
    "openapi:generate": "tsx scripts/generate-openapi.ts",
    "openapi:validate": "swagger-cli validate docs/openapi-*.json",
    "client:generate": "openapi-generator-cli generate -i docs/openapi-member.json -g typescript-fetch -o packages/api-client"
  }
}
```

## Quality Gates

- OpenAPI spec validation: Pass
- Schema coverage: 100%
- Example coverage: 100%
- Security definitions: Complete

## Verification Steps

```bash
# OpenAPI spec 生成
pnpm openapi:generate

# スペック検証
pnpm openapi:validate

# Swagger UI 確認
# 1. Member API
open http://localhost:3100/api-docs

# 2. Admin API
open http://localhost:3101/api-docs

# API クライアント生成
pnpm client:generate

# 生成されたスペック確認
cat docs/openapi-member.json | jq '.info'
cat docs/openapi-admin.json | jq '.paths | keys'
```

## Output

- 自動生成される OpenAPI ドキュメント
- インタラクティブな Swagger UI
- 型安全な API クライアント生成対応

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented