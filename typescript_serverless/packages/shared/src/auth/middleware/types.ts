import type { Request, Response, NextFunction } from 'express';

import type { TokenValidator } from '../google-oauth/token-validator';
import type { IdTokenPayload, InternalUser } from '../google-oauth/types';

export interface AuthUser {
  id?: string;
  email: string;
  googleId: string;
  name?: string;
  picture?: string;
  role?: 'admin' | 'member';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export type UserLookupFunction = (
  payload: IdTokenPayload
) => Promise<InternalUser | null>;

export type UserTransformFunction<T = AuthUser> = (
  payload: IdTokenPayload
) => T;

export type ErrorHandlerFunction = (error: Error) => {
  status: number;
  error: string;
  message: string;
};

export type ErrorHandler = ErrorHandlerFunction;

export interface AuthMiddlewareOptions {
  /**
   * TokenValidator instance for verifying tokens
   */
  tokenValidator: TokenValidator;

  /**
   * If true, authentication is optional - request proceeds without user if no token
   */
  optional?: boolean;

  /**
   * Required role for authorization (requires userLookup to be provided)
   */
  requiredRole?: 'admin' | 'member';

  /**
   * Function to lookup user from database based on token payload
   */
  userLookup?: UserLookupFunction;

  /**
   * Custom transformation function for user data
   */
  userTransform?: UserTransformFunction;

  /**
   * Custom error handler
   */
  errorHandler?: ErrorHandlerFunction;
}

export type AuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;