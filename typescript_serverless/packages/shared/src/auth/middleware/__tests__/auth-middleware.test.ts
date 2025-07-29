import type { Response, NextFunction } from 'express';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { IdTokenPayload } from '../../google-oauth/types';
import { authMiddleware } from '../auth-middleware';
import type { AuthenticatedRequest, AuthMiddlewareOptions } from '../types';

// Mock the TokenValidator
vi.mock('../../google-oauth/token-validator');

describe('authMiddleware', () => {
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

  describe('Token Validation', () => {
    it('should call next() when valid bearer token is provided', async () => {
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

      const middleware = authMiddleware({ tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'] });
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockTokenValidator.verifyIdToken).toHaveBeenCalledWith(validToken);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should attach user to request object when token is valid', async () => {
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
        picture: 'https://example.com/picture.jpg',
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      mockTokenValidator.verifyIdToken.mockResolvedValue(mockPayload);

      const middleware = authMiddleware({ tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'] });
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.email).toBe('test@example.com');
      expect(mockRequest.user?.googleId).toBe('123456789');
      expect(mockRequest.user?.name).toBe('Test User');
    });

    it('should return 401 when no authorization header is present', async () => {
      const middleware = authMiddleware({ tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'] });
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No authorization header provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is malformed', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      const middleware = authMiddleware({ tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'] });
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid authorization header format',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token validation fails', async () => {
      const invalidToken = 'invalid-jwt-token';
      mockRequest.headers = {
        authorization: `Bearer ${invalidToken}`,
      };

      mockTokenValidator.verifyIdToken
        .mockRejectedValue(new Error('Invalid token'));

      const middleware = authMiddleware({ tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'] });
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when email is not verified', async () => {
      const validToken = 'valid-jwt-token';
      const mockPayload: IdTokenPayload = {
        iss: 'https://accounts.google.com',
        sub: '123456789',
        azp: 'test-client-id',
        aud: 'test-client-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        email: 'test@example.com',
        email_verified: false,
        name: 'Test User',
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      mockTokenValidator.verifyIdToken.mockResolvedValue(mockPayload);

      const middleware = authMiddleware({ tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'] });
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Email not verified',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });




});