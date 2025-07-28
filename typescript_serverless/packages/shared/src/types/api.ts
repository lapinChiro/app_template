import type { HttpMethod, PaginatedResponse } from './common';

// Base API response
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

// Error response
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string; // Only in development
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  timestamp: string;
}

// Request types
export interface ApiRequest<T = unknown> {
  body?: T;
  params?: Record<string, string>;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  user?: AuthUser;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  permissions?: string[];
}

export type UserRole = 'member' | 'admin';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// API endpoint definition
export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  auth: boolean;
  roles?: UserRole[];
  rateLimit?: RateLimitConfig;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

// File upload types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
}

// Health check
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  services: Record<string, ServiceHealth>;
}

export interface ServiceHealth {
  status: 'up' | 'down';
  latency?: number;
  message?: string;
}

// Webhook types
export interface WebhookEvent<T = unknown> {
  id: string;
  type: string;
  data: T;
  timestamp: string;
  signature?: string;
}

// Batch operation types
export interface BatchRequest<T> {
  operations: Array<BatchOperation<T>>;
}

export interface BatchOperation<T> {
  id: string;
  operation: 'create' | 'update' | 'delete';
  data: T;
}

export interface BatchResponse<T> {
  successful: Array<BatchResult<T>>;
  failed: BatchError[];
}

export interface BatchResult<T> {
  id: string;
  data: T;
}

export interface BatchError {
  id: string;
  error: ApiError;
}

// Export convenient type aliases
export type ApiSuccessResponse<T> = ApiResponse<T> & { success: true };
export type PaginatedApiResponse<T> = ApiResponse<PaginatedResponse<T>>;
export type ApiRequestHandler<TBody = unknown, TResponse = unknown> = (
  request: ApiRequest<TBody>
) => Promise<ApiResponse<TResponse> | ApiErrorResponse>;