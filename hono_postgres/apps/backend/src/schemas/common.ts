import { z } from '@hono/zod-openapi'

export const HealthResponseSchema = z.object({
  status: z.string().openapi({ example: 'ok' })
}).openapi('HealthResponse')

export const HelloResponseSchema = z.object({
  message: z.string().openapi({ example: 'Hello from API' })
}).openapi('HelloResponse')

export const ErrorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  message: z.string().openapi({ example: 'Error occurred' }),
  error: z.string().optional().openapi({ example: 'Detailed error message' })
}).openapi('ErrorResponse')