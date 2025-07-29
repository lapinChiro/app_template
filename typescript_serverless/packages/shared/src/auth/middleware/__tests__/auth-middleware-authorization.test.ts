import type { Response, NextFunction } from 'express';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { IdTokenPayload, InternalUser } from '../../google-oauth/types';
import { authMiddleware } from '../auth-middleware';
import type { AuthenticatedRequest, AuthMiddlewareOptions } from '../types';

// Mock the TokenValidator
vi.mock('../../google-oauth/token-validator');

describe('authMiddleware - Authorization', () => {
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

  describe('Role-based Authorization', () => {
    it('should allow access when user has required admin role', async () => {
      const validToken = 'valid-jwt-token';
      const mockPayload: IdTokenPayload = {
        iss: 'https://accounts.google.com',
        sub: '123456789',
        azp: 'test-client-id',
        aud: 'test-client-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        email: 'admin@example.com',
        email_verified: true,
        name: 'Admin User',
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      mockTokenValidator.verifyIdToken.mockResolvedValue(mockPayload);

      // Mock user lookup that returns admin role
      const mockDbUser: InternalUser = {
        id: 'user-123',
        email: 'admin@example.com',
        name: 'Admin User',
        googleId: '123456789',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userLookup = vi.fn().mockResolvedValue(mockDbUser);

      const middleware = authMiddleware({
        tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'],
        requiredRole: 'admin',
        userLookup,
      });
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(userLookup).toHaveBeenCalledWith(mockPayload);
      expect(mockRequest.user?.role).toBe('admin');
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access when user has insufficient permissions', async () => {
      const validToken = 'valid-jwt-token';
      const mockPayload: IdTokenPayload = {
        iss: 'https://accounts.google.com',
        sub: '123456789',
        azp: 'test-client-id',
        aud: 'test-client-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        email: 'member@example.com',
        email_verified: true,
        name: 'Member User',
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      mockTokenValidator.verifyIdToken.mockResolvedValue(mockPayload);

      // Mock user lookup that returns member role
      const mockDbUser: InternalUser = {
        id: 'user-456',
        email: 'member@example.com',
        name: 'Member User',
        googleId: '123456789',
        role: 'member',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userLookup = vi.fn().mockResolvedValue(mockDbUser);

      const middleware = authMiddleware({
        tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'],
        requiredRole: 'admin',
        userLookup,
      });
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(userLookup).toHaveBeenCalledWith(mockPayload);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user not found in database', async () => {
      const validToken = 'valid-jwt-token';
      const mockPayload: IdTokenPayload = {
        iss: 'https://accounts.google.com',
        sub: '123456789',
        azp: 'test-client-id',
        aud: 'test-client-id',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        email: 'unknown@example.com',
        email_verified: true,
        name: 'Unknown User',
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      mockTokenValidator.verifyIdToken.mockResolvedValue(mockPayload);

      const userLookup = vi.fn().mockResolvedValue(null);

      const middleware = authMiddleware({
        tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'],
        requiredRole: 'admin',
        userLookup,
      });
      await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(userLookup).toHaveBeenCalledWith(mockPayload);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'User not found',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

});