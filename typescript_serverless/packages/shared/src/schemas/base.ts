import { z } from 'zod';

/**
 * Email schema with lowercase transformation
 */
export const EmailSchema = z
  .string()
  .email({ message: 'Invalid email' })
  .transform(email => email.toLowerCase());

/**
 * UUID schema
 */
export const UUIDSchema = z
  .string()
  .uuid({ message: 'Invalid uuid' });

/**
 * Timestamp schema (ISO 8601 datetime)
 */
export const TimestampSchema = z
  .string()
  .datetime({ message: '有効な日時を入力してください' });

/**
 * Password schema with security requirements
 */
export const PasswordSchema = z
  .string()
  .min(8, { message: 'パスワードは最低8文字必要です' })
  .max(128, { message: 'パスワードは最大128文字です' })
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: '英小文字・英大文字・数字・記号を含む必要があります' }
  );

/**
 * Common ID schema
 */
export const IdSchema = z
  .string()
  .min(1, { message: 'IDは必須です' })
  .max(50, { message: 'IDは50文字以内です' });

/**
 * Base response schema
 */
export const BaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  timestamp: TimestampSchema,
});

/**
 * Error response schema
 */
export const ErrorResponseSchema = BaseResponseSchema.extend({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

/**
 * Pagination schema
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * Paginated response factory
 */
export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T): z.ZodObject<{
  success: z.ZodLiteral<true>;
  message: z.ZodOptional<z.ZodString>;
  timestamp: z.ZodString;
  data: z.ZodObject<{
    items: z.ZodArray<T>;
    pagination: z.ZodObject<{
      page: z.ZodNumber;
      limit: z.ZodNumber;
      total: z.ZodNumber;
      totalPages: z.ZodNumber;
    }>;
  }>;
}> =>
  BaseResponseSchema.extend({
    success: z.literal(true),
    data: z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number().int(),
        limit: z.number().int(),
        total: z.number().int(),
        totalPages: z.number().int(),
      }),
    }),
  });