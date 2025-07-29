import type { Response, NextFunction } from 'express';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { IdTokenPayload } from '../../google-oauth/types';
import { authMiddleware } from '../auth-middleware';
import type { AuthenticatedRequest, AuthMiddlewareOptions } from '../types';

// Mock the TokenValidator
vi.mock('../../google-oauth/token-validator');

describe('authMiddleware - Error Handling', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  
  interface MockTokenValidator {
    clientId: string;
    verifyIdToken: ReturnType<typeof vi.fn>;
    validateIdToken: ReturnType<typeof vi.fn>;
    validateAccessToken: ReturnType<typeof vi.fn>;
    getCertificates: ReturnType<typeof vi.fn>;
    verifyJWT: ReturnType<typeof vi.fn>;
    constructor: {
      verifyIdToken: ReturnType<typeof vi.fn>;
    };
  }

  let mockTokenValidator: MockTokenValidator;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis() as Response['status'],
      json: vi.fn() as Response['json'],
    };
    mockNext = vi.fn();

    // Reset mocks
    vi.clearAllMocks();
    mockTokenValidator = {
      clientId: 'test-client-id',
      verifyIdToken: vi.fn(),
      validateIdToken: vi.fn(),
      validateAccessToken: vi.fn(),
      getCertificates: vi.fn(),
      verifyJWT: vi.fn(),
      constructor: {
        verifyIdToken: vi.fn(),
      },
    };
  });

  describe('Error Handler Function', () => {
    it('should use custom error handler when provided', async () => {
      const validToken = 'valid-jwt-token';
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      mockTokenValidator.verifyIdToken
        .mockRejectedValue(new Error('Network error'));

      const middleware = authMiddleware({
        tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'],
        errorHandler: (_error: Error) => {
          return {
            status: 500,
            error: 'Internal Server Error',
            message: 'An unexpected error occurred',
          };
        },
      });
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    });

    it('should use default error handler when not provided', async () => {
      const validToken = 'valid-jwt-token';
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      const networkError = new Error('Network error');
      mockTokenValidator.verifyIdToken.mockRejectedValue(networkError);

      const middleware = authMiddleware({ tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'] });
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Network error',
      });
    });

    it('should handle non-Error exceptions gracefully', async () => {
      const validToken = 'valid-jwt-token';
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      // Simulate throwing a non-Error object
      mockTokenValidator.verifyIdToken.mockRejectedValue('String error');

      const middleware = authMiddleware({ tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'] });
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    });

    it('should handle unexpected errors in catch block', async () => {
      const middleware = authMiddleware({
        tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'],
        userLookup: () => {
          throw new Error('Database connection failed');
        },
        requiredRole: 'admin',
      });

      const validToken = 'valid-jwt-token';
      const mockPayload: IdTokenPayload = {
        iss: 'https://accounts.google.com',
        sub: '123456789',
        azp: 'test-client-id',
        aud: 'test-client-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        email: 'test@example.com',
        email_verified: true,
        name: 'Test User',
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      mockTokenValidator.verifyIdToken.mockResolvedValue(mockPayload);

      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    });
  });
});