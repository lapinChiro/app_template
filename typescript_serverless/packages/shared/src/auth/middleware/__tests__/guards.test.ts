import type { Request, Response, NextFunction } from 'express';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { UserRepository } from '../../../repositories/user.repository';
import type { User } from '../../../schemas/user.schema';
import type { TokenValidator } from '../../google-oauth/token-validator';
import type { IdTokenPayload } from '../../google-oauth/types';
import { createRequireAuth, createRequireAdmin, createRequireMember } from '../guards';
import type { AuthenticatedRequest } from '../types';

import {
  createMockTokenValidator,
  createMockUserRepository,
  type MockTokenValidator,
  type MockUserRepository,
} from './test-helpers';

describe('guards', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockTokenValidator: MockTokenValidator;
  let mockUserRepository: MockUserRepository;

  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-123',
    email: 'test@example.com',
    googleId: '123456789',
    name: 'Test User',
    role: 'member',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

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
    mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };
    mockResponse = {
      status: vi.fn().mockReturnThis() as Response['status'],
      json: vi.fn() as Response['json'],
    };
    mockNext = vi.fn();

    mockTokenValidator = createMockTokenValidator(vi);
    mockUserRepository = createMockUserRepository(vi);

    vi.clearAllMocks();
  });

  describe('createRequireAuth', () => {
    it('should allow authenticated users', async () => {
      const mockUser = createMockUser();
      const mockPayload = createMockPayload();
      mockTokenValidator.verifyIdToken.mockResolvedValue(mockPayload);
      mockUserRepository.findByGoogleId.mockResolvedValue(mockUser);

      const guard = createRequireAuth({
        tokenValidator: mockTokenValidator as unknown as TokenValidator,
        userRepository: mockUserRepository as unknown as UserRepository,
      });

      await guard(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockTokenValidator.verifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(mockUserRepository.findByGoogleId).toHaveBeenCalledWith(mockPayload.sub);
      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as AuthenticatedRequest).user).toBeDefined();
      expect((mockRequest as AuthenticatedRequest).user?.id).toBe(mockUser.id);
    });

    it('should reject when user not found', async () => {
      mockTokenValidator.verifyIdToken.mockResolvedValue(createMockPayload());
      mockUserRepository.findByGoogleId.mockResolvedValue(null);

      const guard = createRequireAuth({
        tokenValidator: mockTokenValidator as unknown as TokenValidator,
        userRepository: mockUserRepository as unknown as UserRepository,
      });

      await guard(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('createRequireAdmin', () => {
    it('should allow admin users', async () => {
      const mockUser = createMockUser({ role: 'admin' });
      mockTokenValidator.verifyIdToken.mockResolvedValue(createMockPayload());
      mockUserRepository.findByGoogleId.mockResolvedValue(mockUser);

      const guard = createRequireAdmin({
        tokenValidator: mockTokenValidator as unknown as TokenValidator,
        userRepository: mockUserRepository as unknown as UserRepository,
      });

      await guard(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as AuthenticatedRequest).user?.role).toBe('admin');
    });

    it('should reject non-admin users', async () => {
      const mockUser = createMockUser({ role: 'member' });
      mockTokenValidator.verifyIdToken.mockResolvedValue(createMockPayload());
      mockUserRepository.findByGoogleId.mockResolvedValue(mockUser);

      const guard = createRequireAdmin({
        tokenValidator: mockTokenValidator as unknown as TokenValidator,
        userRepository: mockUserRepository as unknown as UserRepository,
      });

      await guard(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('createRequireMember', () => {
    it('should allow member users', async () => {
      const mockUser = createMockUser({ role: 'member' });
      mockTokenValidator.verifyIdToken.mockResolvedValue(createMockPayload());
      mockUserRepository.findByGoogleId.mockResolvedValue(mockUser);

      const guard = createRequireMember({
        tokenValidator: mockTokenValidator as unknown as TokenValidator,
        userRepository: mockUserRepository as unknown as UserRepository,
      });

      await guard(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow admin users to access member routes', async () => {
      const mockUser = createMockUser({ role: 'admin' });
      mockTokenValidator.verifyIdToken.mockResolvedValue(createMockPayload());
      mockUserRepository.findByGoogleId.mockResolvedValue(mockUser);

      const guard = createRequireMember({
        tokenValidator: mockTokenValidator as unknown as TokenValidator,
        userRepository: mockUserRepository as unknown as UserRepository,
      });

      await guard(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});