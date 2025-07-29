import type { Response, NextFunction } from 'express';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { IdTokenPayload } from '../../google-oauth/types';
import { authMiddleware } from '../auth-middleware';
import type { AuthenticatedRequest, AuthMiddlewareOptions } from '../types';

// Mock the TokenValidator
vi.mock('../../google-oauth/token-validator');

describe('authMiddleware - Optional Auth Mode', () => {
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

  it('should call next() without user when no token in optional mode', async () => {
    const middleware = authMiddleware({
      tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'],
      optional: true,
    });
    await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

    expect(mockRequest.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should attach user when valid token in optional mode', async () => {
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

    const middleware = authMiddleware({
      tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'],
      optional: true,
    });
    await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

    expect(mockRequest.user).toBeDefined();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should call next() without user when invalid token in optional mode', async () => {
    const invalidToken = 'invalid-jwt-token';
    mockRequest.headers = {
      authorization: `Bearer ${invalidToken}`,
    };

    mockTokenValidator.verifyIdToken
      .mockRejectedValue(new Error('Invalid token'));

    const middleware = authMiddleware({
      tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'],
      optional: true,
    });
    await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

    expect(mockRequest.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should proceed without user when malformed header in optional mode', async () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat token',
    };

    const middleware = authMiddleware({
      tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'],
      optional: true,
    });
    await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

    expect(mockRequest.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should proceed without user when email not verified in optional mode', async () => {
    const validToken = 'valid-jwt-token';
    const mockPayload: IdTokenPayload = {
      iss: 'https://accounts.google.com',
      sub: '123456789',
      azp: 'test-client-id',
      aud: 'test-client-id',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      email: 'test@example.com',
      email_verified: false, // Not verified
      name: 'Test User',
    };

    mockRequest.headers = {
      authorization: `Bearer ${validToken}`,
    };

    mockTokenValidator.verifyIdToken.mockResolvedValue(mockPayload);

    const middleware = authMiddleware({
      tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'],
      optional: true,
    });
    await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

    // In optional mode, email verification failure should not attach user
    expect(mockRequest.user).toBeUndefined();
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Email not verified',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});