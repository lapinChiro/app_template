import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { TokenValidator } from '../../google-oauth/token-validator';
import type { IdTokenPayload } from '../../google-oauth/types';
import { createNextAuthMiddleware } from '../nextjs-middleware';

import {
  createMockTokenValidator,
  type MockTokenValidator,
} from './test-helpers';

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({ headers: new Map() })),
    redirect: vi.fn((url: URL) => ({ redirectUrl: url.toString() })),
  },
}));

describe('createNextAuthMiddleware', () => {
  let mockTokenValidator: MockTokenValidator;

  const createMockRequest = (pathname: string, token?: string): NextRequest => ({
    nextUrl: { pathname } as NextRequest['nextUrl'],
    url: 'http://localhost:3000' + pathname,
    cookies: {
      get: vi.fn((name: string) => 
        name === 'auth-token' && token ? { value: token, name } : undefined
      ),
    } as unknown as NextRequest['cookies'],
  } as NextRequest);

  const createMockPayload = (overrides: Partial<IdTokenPayload> = {}): IdTokenPayload => ({
    iss: 'https://accounts.google.com',
    sub: '123456789',
    azp: 'test-client-id',
    aud: 'test-client-id',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    email: 'test@example.com',
    email_verified: true,
    name: 'Test User',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockTokenValidator = createMockTokenValidator(vi);
  });

  describe('Public Paths', () => {
    it('should allow access to public paths without authentication', async () => {
      const middleware = createNextAuthMiddleware({
        tokenValidator: mockTokenValidator as unknown as TokenValidator,
        publicPaths: ['/login', '/register', '/api/auth'],
      });

      const mockRequest = createMockRequest('/login');
      await middleware(mockRequest);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(mockTokenValidator.verifyIdToken).not.toHaveBeenCalled();
    });

    it('should allow access to paths that start with public path', async () => {
      const middleware = createNextAuthMiddleware({
        tokenValidator: mockTokenValidator as unknown as TokenValidator,
        publicPaths: ['/api/auth'],
      });

      const mockRequest = createMockRequest('/api/auth/google/callback');
      await middleware(mockRequest);

      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe('Authentication Required', () => {
    it('should redirect to login when no token present', async () => {
      const middleware = createNextAuthMiddleware({
        tokenValidator: mockTokenValidator as unknown as TokenValidator,
        publicPaths: ['/login'],
      });

      const mockRequest = createMockRequest('/dashboard');
      await middleware(mockRequest);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/login', 'http://localhost:3000/dashboard')
      );
    });

    it('should use custom login path when provided', async () => {
      const middleware = createNextAuthMiddleware({
        tokenValidator: mockTokenValidator as unknown as TokenValidator,
        publicPaths: [],
        loginPath: '/auth/signin',
      });

      const mockRequest = createMockRequest('/dashboard');
      await middleware(mockRequest);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL('/auth/signin', 'http://localhost:3000/dashboard')
      );
    });
  });

  describe('Token Validation', () => {
    it('should allow access with valid token', async () => {
      const middleware = createNextAuthMiddleware({
        tokenValidator: mockTokenValidator as unknown as TokenValidator,
        publicPaths: ['/login'],
      });

      const mockPayload = createMockPayload();
      mockTokenValidator.verifyIdToken.mockResolvedValue(mockPayload);

      const mockRequest = createMockRequest('/dashboard', 'valid-token');
      await middleware(mockRequest);

      expect(mockTokenValidator.verifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('should redirect to login with invalid token', async () => {
      const middleware = createNextAuthMiddleware({
        tokenValidator: mockTokenValidator as unknown as TokenValidator,
        publicPaths: ['/login'],
      });

      mockTokenValidator.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const mockRequest = createMockRequest('/dashboard', 'invalid-token');
      await middleware(mockRequest);

      expect(NextResponse.redirect).toHaveBeenCalled();
    });
  });

  describe('Token Refresh', () => {
    it('should indicate refresh needed when token near expiry', async () => {
      const middleware = createNextAuthMiddleware({
        tokenValidator: mockTokenValidator as unknown as TokenValidator,
        publicPaths: ['/login'],
        tokenRefreshThreshold: 600, // 10 minutes
      });

      // Token expires in 5 minutes (300 seconds)
      const mockPayload = createMockPayload({
        exp: Math.floor(Date.now() / 1000) + 300,
      });
      mockTokenValidator.verifyIdToken.mockResolvedValue(mockPayload);

      // Create a mock response with headers
      const mockHeaders = new Map();
      const mockResponse = { 
        headers: { 
          set: vi.fn((key: string, value: string) => mockHeaders.set(key, value)) 
        } 
      };
      (NextResponse.next as ReturnType<typeof vi.fn>).mockReturnValue(mockResponse);

      const mockRequest = createMockRequest('/dashboard', 'valid-token');
      await middleware(mockRequest);

      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-Token-Refresh-Needed', 'true');
    });

    it('should not indicate refresh when token has sufficient time', async () => {
      const middleware = createNextAuthMiddleware({
        tokenValidator: mockTokenValidator as unknown as TokenValidator,
        publicPaths: ['/login'],
        tokenRefreshThreshold: 300, // 5 minutes
      });

      // Token expires in 20 minutes
      const mockPayload = createMockPayload({
        exp: Math.floor(Date.now() / 1000) + 1200,
      });
      mockTokenValidator.verifyIdToken.mockResolvedValue(mockPayload);

      const mockRequest = createMockRequest('/dashboard', 'valid-token');
      await middleware(mockRequest);

      expect(NextResponse.next).toHaveBeenCalled();
      // Should not have refresh header
    });
  });
});