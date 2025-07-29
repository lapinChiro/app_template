import type { Response, NextFunction } from 'express';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { IdTokenPayload } from '../../google-oauth/types';
import { authMiddleware } from '../auth-middleware';
import type { AuthenticatedRequest, AuthMiddlewareOptions } from '../types';

// Mock the TokenValidator
vi.mock('../../google-oauth/token-validator');

describe('authMiddleware - Custom User Transform', () => {
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

  it('should apply custom user transformation', async () => {
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

    const customTransform = vi.fn().mockReturnValue({
      id: 'custom-id',
      email: mockPayload.email,
      customField: 'custom value',
    });

    const middleware = authMiddleware({
      tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'],
      userTransform: customTransform,
    });
    await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

    expect(customTransform).toHaveBeenCalledWith(mockPayload);
    expect(mockRequest.user).toEqual({
      id: 'custom-id',
      email: 'test@example.com',
      customField: 'custom value',
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should skip role checking when custom transform is provided', async () => {
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

    const customTransform = vi.fn().mockReturnValue({
      userId: 'user-123',
      userEmail: mockPayload.email,
      isAdmin: true,
    });

    const userLookup = vi.fn();

    const middleware = authMiddleware({
      tokenValidator: mockTokenValidator as unknown as AuthMiddlewareOptions['tokenValidator'],
      userTransform: customTransform,
      requiredRole: 'admin',
      userLookup,
    });
    await middleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

    expect(customTransform).toHaveBeenCalledWith(mockPayload);
    expect(userLookup).not.toHaveBeenCalled(); // Should not call userLookup when transform is provided
    expect(mockRequest.user).toEqual({
      userId: 'user-123',
      userEmail: 'test@example.com',
      isAdmin: true,
    });
    expect(mockNext).toHaveBeenCalled();
  });
});