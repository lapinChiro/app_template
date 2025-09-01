# Backend API Server

Vue + Hono + PostgreSQL プロジェクト管理アプリケーションのバックエンドAPIサーバー

## Quick Start

```bash
npm install
npm run dev
```

```bash
open http://localhost:3000
```

## Zod OpenAPI Integration

This backend implements Zod OpenAPI for type-safe API development with automatic OpenAPI specification generation.

### Features

- **Type-safe API endpoints** with Zod schema validation
- **Automatic OpenAPI specification** generation at `/doc`
- **Swagger UI** available at `/swagger-ui`
- **Frontend type sharing** for end-to-end type safety
- **Comprehensive testing** with Vitest (70%+ coverage)

### API Endpoints

#### Basic Endpoints
- `GET /health` - Health check
- `GET /api/hello` - Hello API
- `GET /doc` - OpenAPI JSON specification
- `GET /swagger-ui` - Interactive API documentation

#### User Management API
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Development

#### Running Tests
```bash
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

#### Type Safety
- All endpoints are type-safe with Zod validation
- Frontend can import backend types from `src/types/`
- Zero `any` types and no non-null assertions (`!`)

#### Adding New Endpoints
1. Define Zod schemas in `src/schemas/`
2. Create route with `createRoute()`
3. Implement handler with `app.openapi()`
4. Add comprehensive tests
5. Update this documentation

### Frontend Integration

Frontend projects can import backend types:
```typescript
import type { User, CreateUser } from '../../backend/src/types'
```

### Quality Standards
- TypeScript errors: 0
- Test coverage: 70%+
- No `any` types
- No non-null assertions

### Database Setup

The application uses PostgreSQL with Kysely query builder. Make sure to configure your database connection in the environment variables.
