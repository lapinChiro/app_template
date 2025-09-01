import { z } from '@hono/zod-openapi'

// メインユーザースキーマ
export const UserSchema = z.object({
  id: z.string().openapi({ example: '1' }),
  name: z.string().openapi({ example: 'John Doe' }),
  email: z.string().email().openapi({ example: 'john@example.com' }),
  active: z.boolean().openapi({ example: true }),
  created_at: z.string().datetime().openapi({ example: '2024-01-01T00:00:00Z' })
}).openapi('User')

// ユーザー作成用スキーマ
export const CreateUserSchema = z.object({
  name: z.string().min(1).openapi({ example: 'Jane Doe' }),
  email: z.string().email().openapi({ example: 'jane@example.com' })
}).openapi('CreateUser')

// ユーザー更新用スキーマ
export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional().openapi({ example: 'Jane Smith' }),
  email: z.string().email().optional().openapi({ example: 'jane.smith@example.com' }),
  active: z.boolean().optional().openapi({ example: false })
}).openapi('UpdateUser')

// パスパラメータ用スキーマ
export const UserParamsSchema = z.object({
  id: z.string().min(1).openapi({
    param: { name: 'id', in: 'path' },
    example: '1'
  })
})

// ユーザーリスト用スキーマ
export const UserListSchema = z.array(UserSchema).openapi('UserList')