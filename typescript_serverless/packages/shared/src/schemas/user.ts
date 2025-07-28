import { z } from 'zod';

import { EmailSchema, UUIDSchema, TimestampSchema } from './base';

/**
 * User role enum
 */
export const UserRoleSchema = z.enum(['member', 'admin'], {
  errorMap: () => ({ message: 'member または admin を指定してください' })
});

/**
 * Main user entity schema
 */
export const UserSchema = z.object({
  id: UUIDSchema,
  email: EmailSchema,
  name: z.string().min(1).max(100),
  role: UserRoleSchema,
  profileImageUrl: z.string().url().optional(),
  googleId: z.string().optional(),
  lastLoginAt: TimestampSchema.optional(),
  isActive: z.boolean().default(true),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

/**
 * User creation input schema
 */
export const CreateUserInputSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1).max(100),
  role: UserRoleSchema.optional(),
  googleId: z.string().optional(),
});

/**
 * User update input schema
 */
export const UpdateUserInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  profileImageUrl: z.string().url({ message: 'Invalid url' }).optional(),
  role: UserRoleSchema.optional(),
  isActive: z.boolean().optional(),
});

/**
 * User profile schema
 */
export const UserProfileSchema = z.object({
  id: UUIDSchema,
  email: EmailSchema,
  name: z.string(),
  profileImageUrl: z.string().url({ message: '有効なURLを入力してください' }).optional(),
  role: UserRoleSchema,
  createdAt: TimestampSchema,
});

/**
 * User session schema
 */
export const UserSessionSchema = z.object({
  userId: UUIDSchema,
  email: EmailSchema,
  role: UserRoleSchema,
  sessionId: z.string(),
  expiresAt: z.string().datetime({ message: 'Invalid datetime' }),
});

/**
 * Notification preferences schema
 */
export const NotificationPreferencesSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  marketing: z.boolean(),
});

/**
 * User preferences schema
 */
export const UserPreferencesSchema = z.object({
  userId: UUIDSchema,
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['ja', 'en']).optional(),
  notifications: NotificationPreferencesSchema.optional(),
});

/**
 * User activity schema
 */
export const UserActivitySchema = z.object({
  userId: UUIDSchema,
  action: z.string().min(1),
  resource: z.string().optional(),
  resourceId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: TimestampSchema,
});

/**
 * User statistics schema
 */
export const UserStatsSchema = z.object({
  totalUsers: z.number().int().min(0),
  activeUsers: z.number().int().min(0),
  newUsersToday: z.number().int().min(0),
  newUsersThisWeek: z.number().int().min(0),
  newUsersThisMonth: z.number().int().min(0),
  usersByRole: z.record(UserRoleSchema, z.number().int().min(0)),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserSession = z.infer<typeof UserSessionSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
export type UserActivity = z.infer<typeof UserActivitySchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;