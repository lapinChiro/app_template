import { z } from 'zod';

export enum OAuthErrorCode {
  INVALID_REQUEST = 'invalid_request',
  UNAUTHORIZED_CLIENT = 'unauthorized_client',
  ACCESS_DENIED = 'access_denied',
  UNSUPPORTED_RESPONSE_TYPE = 'unsupported_response_type',
  INVALID_SCOPE = 'invalid_scope',
  SERVER_ERROR = 'server_error',
  TEMPORARILY_UNAVAILABLE = 'temporarily_unavailable',
  INVALID_CLIENT = 'invalid_client',
  INVALID_GRANT = 'invalid_grant',
  UNSUPPORTED_GRANT_TYPE = 'unsupported_grant_type',
  INVALID_TOKEN = 'invalid_token',
  INSUFFICIENT_SCOPE = 'insufficient_scope',
  STATE_MISMATCH = 'state_mismatch',
  PKCE_CHALLENGE_FAILED = 'pkce_challenge_failed',
  TOKEN_EXPIRED = 'token_expired',
  EMAIL_NOT_VERIFIED = 'email_not_verified',
  DOMAIN_NOT_ALLOWED = 'domain_not_allowed',
}

export const OAuthErrorResponseSchema = z.object({
  error: z.nativeEnum(OAuthErrorCode),
  error_description: z.string().optional(),
  error_uri: z.string().url().optional(),
  state: z.string().optional(),
});

export type OAuthErrorResponse = z.infer<typeof OAuthErrorResponseSchema>;

// Base GoogleOAuthError class
export class GoogleOAuthError extends Error {
  public code: string;
  public details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'GoogleOAuthError';
    this.code = code;
    if (details) this.details = details;
    
    // Capture the stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

// Specific error classes
export class InvalidGrantError extends GoogleOAuthError {
  constructor(message?: string) {
    super(
      message ?? 'The provided authorization grant is invalid, expired, or revoked',
      'invalid_grant'
    );
    this.name = 'InvalidGrantError';
  }
}

export class TokenExpiredError extends GoogleOAuthError {
  constructor(message?: string) {
    super(message ?? 'The access token has expired', 'token_expired');
    this.name = 'TokenExpiredError';
  }
}

export class InvalidClientError extends GoogleOAuthError {
  constructor(message?: string) {
    super(message ?? 'Client authentication failed', 'invalid_client');
    this.name = 'InvalidClientError';
  }
}

export class UnauthorizedClientError extends GoogleOAuthError {
  constructor(message?: string) {
    super(
      message ?? 'The client is not authorized to use this authorization grant type',
      'unauthorized_client'
    );
    this.name = 'UnauthorizedClientError';
  }
}

export class AccessDeniedError extends GoogleOAuthError {
  constructor(message?: string) {
    super(message ?? 'The user denied the authorization request', 'access_denied');
    this.name = 'AccessDeniedError';
  }
}

export class UnsupportedResponseTypeError extends GoogleOAuthError {
  constructor(message?: string) {
    super(
      message ?? 'The authorization server does not support this response type',
      'unsupported_response_type'
    );
    this.name = 'UnsupportedResponseTypeError';
  }
}

export class ServerError extends GoogleOAuthError {
  constructor(message?: string) {
    super(
      message ?? 'The authorization server encountered an unexpected condition',
      'server_error'
    );
    this.name = 'ServerError';
  }
}

export class TemporarilyUnavailableError extends GoogleOAuthError {
  constructor(message?: string) {
    super(
      message ?? 'The authorization server is temporarily unavailable',
      'temporarily_unavailable'
    );
    this.name = 'TemporarilyUnavailableError';
  }
}

export class InvalidRequestError extends GoogleOAuthError {
  constructor(message?: string) {
    super(message ?? 'The request is missing a required parameter', 'invalid_request');
    this.name = 'InvalidRequestError';
  }
}

export class InvalidScopeError extends GoogleOAuthError {
  constructor(message?: string, details?: Record<string, unknown>) {
    super(message ?? 'The requested scope is invalid or unknown', 'invalid_scope');
    this.name = 'InvalidScopeError';
    if (details) this.details = details;
  }
}

export class NetworkError extends GoogleOAuthError {
  constructor(message?: string, originalError?: Error) {
    super(message ?? 'Network error occurred', 'network_error');
    this.name = 'NetworkError';
    if (originalError) {
      this.details = { originalError };
    }
  }
}

// Parse OAuth error response
export function parseOAuthError(errorResponse: { error?: string; error_description?: string }): GoogleOAuthError {
  const { error, error_description } = errorResponse;
  
  const errorClassMap: Record<string, (message?: string) => GoogleOAuthError> = {
    'invalid_grant': (msg) => new InvalidGrantError(msg),
    'invalid_client': (msg) => new InvalidClientError(msg),
    'unauthorized_client': (msg) => new UnauthorizedClientError(msg),
    'access_denied': (msg) => new AccessDeniedError(msg),
    'unsupported_response_type': (msg) => new UnsupportedResponseTypeError(msg),
    'server_error': (msg) => new ServerError(msg),
    'temporarily_unavailable': (msg) => new TemporarilyUnavailableError(msg),
    'invalid_request': (msg) => new InvalidRequestError(msg),
    'invalid_scope': (msg) => new InvalidScopeError(msg),
  };

  if (!error) {
    return new GoogleOAuthError('No error code provided', 'unknown_error');
  }

  const errorFactory = errorClassMap[error];
  return errorFactory 
    ? errorFactory(error_description)
    : new GoogleOAuthError(error_description ?? error, error);
}

// Check if error is retryable
export function isRetryableError(error: unknown): boolean {
  const retryableErrors = [ServerError, TemporarilyUnavailableError, NetworkError];
  return retryableErrors.some(ErrorClass => error instanceof ErrorClass);
}

// Get user-friendly error message
export function getErrorUserMessage(error: unknown): string {
  const errorMessageMap = new Map([
    [InvalidGrantError, 'Your authorization has expired. Please sign in again.'],
    [TokenExpiredError, 'Your session has expired. Please sign in again.'],
    [AccessDeniedError, 'You denied the authorization request. Please try again if you want to sign in.'],
    [ServerError, 'Google\'s servers are experiencing issues. Please try again later.'],
    [TemporarilyUnavailableError, 'Google\'s servers are temporarily unavailable. Please try again in a few moments.'],
    [NetworkError, 'Unable to connect to Google. Please check your internet connection and try again.'],
  ]);

  for (const [ErrorClass, message] of errorMessageMap) {
    if (error instanceof ErrorClass) {
      return message;
    }
  }

  if (error instanceof InvalidClientError || error instanceof UnauthorizedClientError) {
    return 'There\'s a configuration issue with the application. Please contact support.';
  }
  
  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
}

// Keep the existing OAuthError class for backward compatibility
export class OAuthError extends Error {
  constructor(
    public code: OAuthErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'OAuthError';
  }

  static fromResponse(response: OAuthErrorResponse): OAuthError {
    const statusCodeMap: Record<OAuthErrorCode, number> = {
      [OAuthErrorCode.INVALID_REQUEST]: 400,
      [OAuthErrorCode.UNAUTHORIZED_CLIENT]: 401,
      [OAuthErrorCode.ACCESS_DENIED]: 403,
      [OAuthErrorCode.UNSUPPORTED_RESPONSE_TYPE]: 400,
      [OAuthErrorCode.INVALID_SCOPE]: 400,
      [OAuthErrorCode.SERVER_ERROR]: 500,
      [OAuthErrorCode.TEMPORARILY_UNAVAILABLE]: 503,
      [OAuthErrorCode.INVALID_CLIENT]: 401,
      [OAuthErrorCode.INVALID_GRANT]: 400,
      [OAuthErrorCode.UNSUPPORTED_GRANT_TYPE]: 400,
      [OAuthErrorCode.INVALID_TOKEN]: 401,
      [OAuthErrorCode.INSUFFICIENT_SCOPE]: 403,
      [OAuthErrorCode.STATE_MISMATCH]: 400,
      [OAuthErrorCode.PKCE_CHALLENGE_FAILED]: 400,
      [OAuthErrorCode.TOKEN_EXPIRED]: 401,
      [OAuthErrorCode.EMAIL_NOT_VERIFIED]: 403,
      [OAuthErrorCode.DOMAIN_NOT_ALLOWED]: 403,
    };

    return new OAuthError(
      response.error,
      response.error_description ?? response.error,
      statusCodeMap[response.error] ?? 400,
      { response }
    );
  }

  static parseError(error: unknown): OAuthError {
    if (error instanceof OAuthError) {
      return error;
    }

    if (error && typeof error === 'object' && 'error' in error) {
      try {
        const parsed = OAuthErrorResponseSchema.parse(error);
        return OAuthError.fromResponse(parsed);
      } catch {
        // Fall through to generic error
      }
    }

    if (error instanceof Error) {
      return new OAuthError(
        OAuthErrorCode.SERVER_ERROR,
        error.message,
        500,
        { originalError: error.message }
      );
    }

    return new OAuthError(
      OAuthErrorCode.SERVER_ERROR,
      'An unknown error occurred',
      500
    );
  }

  isRetryable(): boolean {
    return [
      OAuthErrorCode.SERVER_ERROR,
      OAuthErrorCode.TEMPORARILY_UNAVAILABLE,
    ].includes(this.code);
  }

  getUserFriendlyMessage(): string {
    const messages: Record<OAuthErrorCode, string> = {
      [OAuthErrorCode.INVALID_REQUEST]: '認証リクエストが無効です。もう一度お試しください。',
      [OAuthErrorCode.UNAUTHORIZED_CLIENT]: 'このアプリケーションは認証されていません。',
      [OAuthErrorCode.ACCESS_DENIED]: 'アクセスが拒否されました。',
      [OAuthErrorCode.UNSUPPORTED_RESPONSE_TYPE]: 'サポートされていない認証方式です。',
      [OAuthErrorCode.INVALID_SCOPE]: '要求された権限が無効です。',
      [OAuthErrorCode.SERVER_ERROR]: 'サーバーエラーが発生しました。しばらく待ってからお試しください。',
      [OAuthErrorCode.TEMPORARILY_UNAVAILABLE]: 'サービスが一時的に利用できません。しばらく待ってからお試しください。',
      [OAuthErrorCode.INVALID_CLIENT]: 'クライアント認証に失敗しました。',
      [OAuthErrorCode.INVALID_GRANT]: '認証コードが無効または期限切れです。',
      [OAuthErrorCode.UNSUPPORTED_GRANT_TYPE]: 'サポートされていない認証タイプです。',
      [OAuthErrorCode.INVALID_TOKEN]: 'トークンが無効です。再度ログインしてください。',
      [OAuthErrorCode.INSUFFICIENT_SCOPE]: 'この操作を実行する権限がありません。',
      [OAuthErrorCode.STATE_MISMATCH]: 'セキュリティ検証に失敗しました。もう一度お試しください。',
      [OAuthErrorCode.PKCE_CHALLENGE_FAILED]: 'セキュリティチャレンジに失敗しました。',
      [OAuthErrorCode.TOKEN_EXPIRED]: 'トークンの有効期限が切れました。再度ログインしてください。',
      [OAuthErrorCode.EMAIL_NOT_VERIFIED]: 'メールアドレスが確認されていません。',
      [OAuthErrorCode.DOMAIN_NOT_ALLOWED]: 'このドメインからのログインは許可されていません。',
    };

    return messages[this.code] ?? 'エラーが発生しました。もう一度お試しください。';
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}