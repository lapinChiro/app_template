export * from './utils';
export type * from './types';
// Export only schemas, not types from schemas since they conflict with types/index.ts
export {
  // Base schemas
  EmailSchema,
  UUIDSchema,
  TimestampSchema,
  PasswordSchema,
  IdSchema,
  BaseResponseSchema,
  ErrorResponseSchema,
  PaginationSchema,
  PaginatedResponseSchema,
  // User schemas
  UserRoleSchema,
  UserSchema,
  CreateUserInputSchema,
  UpdateUserInputSchema,
  UserProfileSchema,
  UserSessionSchema,
  NotificationPreferencesSchema,
  UserPreferencesSchema,
  UserActivitySchema,
  UserStatsSchema,
} from './schemas';

// Export auth modules
export * from './auth/google-oauth';
// Export middleware without conflicting types
export {
  authMiddleware,
  createRequireAuth,
  createRequireAdmin,
  createRequireMember,
  createNextAuthMiddleware,
  authMiddlewareConfig,
} from './auth/middleware';
export type {
  // Only export types that don't conflict
  AuthenticatedRequest,
  AuthMiddlewareOptions,
  GuardConfig,
  NextAuthMiddlewareConfig,
  ErrorHandler,
  UserLookupFunction,
  UserTransformFunction,
  AuthMiddleware,
} from './auth/middleware';