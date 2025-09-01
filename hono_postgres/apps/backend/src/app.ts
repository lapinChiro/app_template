import { Hono } from 'hono'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { db } from './db/connection.js'
import { HealthResponseSchema, HelloResponseSchema, ErrorResponseSchema } from './schemas/common.js'
import { UserSchema, UserParamsSchema, UserListSchema, CreateUserSchema, UpdateUserSchema } from './schemas/users.js'

export const app = new OpenAPIHono()

// Middleware
app.use('*', logger())
app.use('*', cors())

// Health check route definition
const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  responses: {
    200: {
      content: { 'application/json': { schema: HealthResponseSchema } },
      description: 'システムヘルスステータス'
    }
  }
})

// Health check
app.openapi(healthRoute, (c) => {
  return c.json({ status: 'ok' })
})

// Routes
app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// Hello API route definition
const helloRoute = createRoute({
  method: 'get',
  path: '/api/hello',
  responses: {
    200: {
      content: { 'application/json': { schema: HelloResponseSchema } },
      description: 'Hello APIレスポンス'
    }
  }
})

// API routes
app.openapi(helloRoute, (c) => {
  return c.json({ message: 'Hello from API' })
})

// Database validation endpoint
app.get('/api/db-test', async (c) => {
  try {
    // 1. データベース接続テスト
    await db.selectFrom('test_users').select('id').limit(1).execute()
    
    // 2. 既存データの取得（型安全）
    const users = await db
      .selectFrom('test_users')
      .select(['id', 'name', 'email', 'active', 'created_at'])
      .where('active', '=', true)
      .orderBy('created_at', 'desc')
      .execute()
    
    // 3. 新規データの挿入
    const newUser = await db
      .insertInto('test_users')
      .values({
        name: `Test User ${Date.now()}`,
        email: `test${Date.now()}@example.com`
      })
      .returning(['id', 'name', 'email'])
      .executeTakeFirstOrThrow()
    
    return c.json({
      success: true,
      message: 'Database connection and operations successful',
      data: {
        existing_users: users,
        new_user: newUser,
        total_users: users.length + 1
      }
    })
  } catch (error) {
    console.error('Database test failed:', error)
    return c.json({
      success: false,
      message: 'Database operation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// GET /api/users/{id} ルート定義
const getUserRoute = createRoute({
  method: 'get',
  path: '/api/users/{id}',
  request: { params: UserParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: UserSchema } },
      description: 'ユーザー情報を取得'
    },
    404: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'ユーザーが見つからない'
    },
    500: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'データベースエラー'
    }
  }
})

// GET /api/users/{id} エンドポイント実装
app.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid('param')
  
  try {
    const user = await db
      .selectFrom('test_users')
      .select(['id', 'name', 'email', 'active', 'created_at'])
      .where('id', '=', parseInt(id))
      .executeTakeFirst()
    
    if (!user) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404)
    }
    
    return c.json({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      active: user.active,
      created_at: user.created_at.toISOString()
    }, 200)
  } catch (error) {
    console.error('Database error:', error)
    return c.json({
      success: false,
      message: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// GET /api/users ルート定義
const getUsersRoute = createRoute({
  method: 'get',
  path: '/api/users',
  responses: {
    200: {
      content: { 'application/json': { schema: UserListSchema } },
      description: 'ユーザー一覧を取得'
    },
    500: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'データベースエラー'
    }
  }
})

// GET /api/users エンドポイント実装
app.openapi(getUsersRoute, async (c) => {
  try {
    const users = await db
      .selectFrom('test_users')
      .select(['id', 'name', 'email', 'active', 'created_at'])
      .orderBy('created_at', 'desc')
      .execute()
    
    const formattedUsers = users.map(user => ({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      active: user.active,
      created_at: user.created_at.toISOString()
    }))
    
    return c.json(formattedUsers, 200)
  } catch (error) {
    console.error('Database error:', error)
    return c.json({
      success: false,
      message: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// POST /api/users ルート定義
const createUserRoute = createRoute({
  method: 'post',
  path: '/api/users',
  request: {
    body: {
      content: { 'application/json': { schema: CreateUserSchema } }
    }
  },
  responses: {
    201: {
      content: { 'application/json': { schema: UserSchema } },
      description: 'ユーザー作成成功'
    },
    400: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'バリデーションエラー'
    },
    500: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'データベースエラー'
    }
  }
})

// POST /api/users エンドポイント実装
app.openapi(createUserRoute, async (c) => {
  const userData = c.req.valid('json')
  
  try {
    const newUser = await db
      .insertInto('test_users')
      .values({
        name: userData.name,
        email: userData.email
      })
      .returning(['id', 'name', 'email', 'active', 'created_at'])
      .executeTakeFirstOrThrow()
    
    return c.json({
      id: newUser.id.toString(),
      name: newUser.name,
      email: newUser.email,
      active: newUser.active,
      created_at: newUser.created_at.toISOString()
    }, 201)
  } catch (error) {
    console.error('Database error:', error)
    return c.json({
      success: false,
      message: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// PUT /api/users/{id} ルート定義
const updateUserRoute = createRoute({
  method: 'put',
  path: '/api/users/{id}',
  request: {
    params: UserParamsSchema,
    body: {
      content: { 'application/json': { schema: UpdateUserSchema } }
    }
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UserSchema } },
      description: 'ユーザー更新成功'
    },
    404: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'ユーザーが見つからない'
    },
    500: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'データベースエラー'
    }
  }
})

// PUT /api/users/{id} エンドポイント実装
app.openapi(updateUserRoute, async (c) => {
  const { id } = c.req.valid('param')
  const updateData = c.req.valid('json')
  
  try {
    const updatedUser = await db
      .updateTable('test_users')
      .set(updateData)
      .where('id', '=', parseInt(id))
      .returning(['id', 'name', 'email', 'active', 'created_at'])
      .executeTakeFirst()
    
    if (!updatedUser) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404)
    }
    
    return c.json({
      id: updatedUser.id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      active: updatedUser.active,
      created_at: updatedUser.created_at.toISOString()
    }, 200)
  } catch (error) {
    console.error('Database error:', error)
    return c.json({
      success: false,
      message: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// DELETE /api/users/{id} ルート定義
const deleteUserRoute = createRoute({
  method: 'delete',
  path: '/api/users/{id}',
  request: { params: UserParamsSchema },
  responses: {
    204: {
      description: 'ユーザー削除成功'
    },
    404: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'ユーザーが見つからない'
    },
    500: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'データベースエラー'
    }
  }
})

// DELETE /api/users/{id} エンドポイント実装
app.openapi(deleteUserRoute, async (c) => {
  const { id } = c.req.valid('param')
  
  try {
    const result = await db
      .deleteFrom('test_users')
      .where('id', '=', parseInt(id))
      .executeTakeFirst()
    
    if (result.numDeletedRows === 0n) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404)
    }
    
    return c.body(null, 204)
  } catch (error) {
    console.error('Database error:', error)
    return c.json({
      success: false,
      message: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// OpenAPI仕様書の生成
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Project Manager API',
    description: 'Vue + Hono + PostgreSQL プロジェクト管理API'
  }
})

// Swagger UI エンドポイント
app.get('/swagger-ui', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>API Documentation</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js"></script>
      <script>
        SwaggerUIBundle({
          url: '/doc',
          dom_id: '#swagger-ui',
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.presets.standalone
          ]
        })
      </script>
    </body>
    </html>
  `)
})