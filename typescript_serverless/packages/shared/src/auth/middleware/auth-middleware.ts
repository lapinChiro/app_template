import type { Request, Response, NextFunction } from 'express';

import type { UserRole } from '../../schemas/user.schema';
import type { IdTokenPayload } from '../google-oauth/types';

import type { AuthUser, AuthenticatedRequest, AuthMiddlewareOptions } from './types';

function sendUnauthorized(res: Response, message: string): void {
  res.status(401).json({
    error: 'Unauthorized',
    message,
  });
}

function sendForbidden(res: Response, message: string): void {
  res.status(403).json({
    error: 'Forbidden',
    message,
  });
}

function sendErrorResponse(
  res: Response,
  error: unknown,
  errorHandler?: AuthMiddlewareOptions['errorHandler']
): void {
  if (errorHandler) {
    const errorResponse = errorHandler(error as Error);
    res.status(errorResponse.status).json({
      error: errorResponse.error,
      message: errorResponse.message,
    });
  } else {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  }
}

function extractAndValidateToken(
  req: Request
): { token: string } | { error: string } {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return { error: 'No authorization header provided' };
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return { error: 'Invalid authorization header format' };
  }

  return { token };
}

async function verifyToken(
  token: string,
  tokenValidator: AuthMiddlewareOptions['tokenValidator']
): Promise<IdTokenPayload> {
  return await tokenValidator.verifyIdToken(token);
}

async function checkUserRole(
  payload: IdTokenPayload,
  options: AuthMiddlewareOptions
): Promise<{ user: AuthUser } | { error: string; status: number }> {
  // If no userLookup function, create basic user from token
  if (!options.userLookup) {
    return {
      user: {
        email: payload.email,
        googleId: payload.sub,
        ...(payload.name && { name: payload.name }),
        ...(payload.picture && { picture: payload.picture }),
      },
    };
  }

  // Look up user in database
  const dbUser = await options.userLookup(payload);
  if (!dbUser) {
    return { error: 'User not found', status: 401 };
  }

  // Check role if required
  if (options.requiredRole && dbUser.role !== options.requiredRole) {
    return { error: 'Insufficient permissions', status: 403 };
  }

  return {
    user: {
      id: dbUser.id,
      email: payload.email,
      googleId: payload.sub,
      role: dbUser.role as UserRole,
      ...(payload.name && { name: payload.name }),
      ...(payload.picture && { picture: payload.picture }),
    },
  };
}

export function authMiddleware(options: AuthMiddlewareOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract and validate token
      const tokenResult = extractAndValidateToken(req);
      if ('error' in tokenResult) {
        if (options.optional) {
          return next();
        }
        sendUnauthorized(res, tokenResult.error);
        return;
      }

      // Verify token
      let payload: IdTokenPayload;
      try {
        payload = await verifyToken(tokenResult.token, options.tokenValidator);
      } catch (error) {
        if (options.optional) {
          return next();
        }
        const message = error instanceof Error ? error.message : 'Invalid token';
        if (options.errorHandler) {
          const errorResponse = options.errorHandler(error as Error);
          res.status(errorResponse.status).json({
            error: errorResponse.error,
            message: errorResponse.message,
          });
        } else {
          sendUnauthorized(res, message);
        }
        return;
      }

      // Check email verification
      if (!payload.email_verified) {
        sendUnauthorized(res, 'Email not verified');
        return;
      }

      // Apply custom transformation if provided
      if (options.userTransform) {
        (req as AuthenticatedRequest).user = options.userTransform(payload);
        return next();
      }

      // Check role and create user
      const roleResult = await checkUserRole(payload, options);
      if ('error' in roleResult) {
        if (roleResult.status === 401) {
          sendUnauthorized(res, roleResult.error);
        } else {
          sendForbidden(res, roleResult.error);
        }
        return;
      }

      // Attach user to request
      (req as AuthenticatedRequest).user = roleResult.user;
      next();
    } catch (error) {
      sendErrorResponse(res, error, options.errorHandler);
      return;
    }
  };
}