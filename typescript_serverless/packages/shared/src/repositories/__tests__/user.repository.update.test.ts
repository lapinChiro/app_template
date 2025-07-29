import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { User, UpdateUserInput } from '../../types/user';
import { UserRepository } from '../user.repository';

// Mock AWS SDK modules
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(),
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(),
  },
  GetCommand: vi.fn(),
  PutCommand: vi.fn(),
  UpdateCommand: vi.fn(),
  DeleteCommand: vi.fn(),
  QueryCommand: vi.fn(),
  ScanCommand: vi.fn(),
  BatchGetCommand: vi.fn(),
}));

// Mock database client type
interface MockDbClient {
  query: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  batchGet: ReturnType<typeof vi.fn>;
  scan: ReturnType<typeof vi.fn>;
}

describe('UserRepository - Update Operations', () => {
  let repository: UserRepository;
  let mockDbClient: MockDbClient;

  beforeEach(() => {
    // Mock database client
    mockDbClient = {
      query: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      batchGet: vi.fn(),
      scan: vi.fn(),
    };

    repository = new UserRepository(mockDbClient);
  });

  describe('update', () => {
    it('should update user with valid input', async () => {
      const userId = 'user-123';
      const updateInput: UpdateUserInput = {
        name: 'Updated Name',
        profileImageUrl: 'https://example.com/avatar.jpg',
      };

      const updatedUser: User = {
        id: userId,
        email: 'test@example.com',
        name: updateInput.name as string,
        ...(updateInput.profileImageUrl && { profileImageUrl: updateInput.profileImageUrl }),
        role: 'member',
        isActive: true,
        createdAt: '2025-01-29T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
      };

      // Mock findById to return existing user
      mockDbClient.get.mockResolvedValueOnce({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        isActive: true,
        createdAt: '2025-01-29T00:00:00.000Z',
        updatedAt: '2025-01-29T00:00:00.000Z',
      });
      mockDbClient.update.mockResolvedValueOnce(updatedUser);

      const result = await repository.update(userId, updateInput);

      expect(result).toEqual(updatedUser);
      expect(mockDbClient.update).toHaveBeenCalledWith(userId, expect.objectContaining(updateInput));
    });

    it('should update user role', async () => {
      const userId = 'user-123';
      const updateInput: UpdateUserInput = {
        role: 'admin',
      };

      const updatedUser: User = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        isActive: true,
        createdAt: '2025-01-29T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
      };

      // Mock findById to return existing user
      mockDbClient.get.mockResolvedValueOnce({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        isActive: true,
        createdAt: '2025-01-29T00:00:00.000Z',
        updatedAt: '2025-01-29T00:00:00.000Z',
      });
      mockDbClient.update.mockResolvedValueOnce(updatedUser);

      const result = await repository.update(userId, updateInput);

      expect(result).toEqual(updatedUser);
      expect(result?.role).toBe('admin');
    });

    it('should return null when updating non-existent user', async () => {
      const userId = 'non-existent';
      const updateInput: UpdateUserInput = {
        name: 'Updated Name',
      };

      // Mock findById to return null (user not found)
      mockDbClient.get.mockResolvedValueOnce(null);

      const result = await repository.update(userId, updateInput);

      expect(result).toBeNull();
    });
  });

  describe('updateLastLogin', () => {
    it('should update user last login timestamp', async () => {
      const userId = 'user-123';
      const now = new Date().toISOString();

      const updatedUser: User = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        isActive: true,
        lastLoginAt: now,
        createdAt: '2025-01-29T00:00:00.000Z',
        updatedAt: now,
      };

      // Mock findById to return existing user
      mockDbClient.get.mockResolvedValueOnce({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'member',
        isActive: true,
        createdAt: '2025-01-29T00:00:00.000Z',
        updatedAt: '2025-01-29T00:00:00.000Z',
      });
      mockDbClient.update.mockResolvedValueOnce(updatedUser);

      const result = await repository.updateLastLogin(userId);

      expect(result).toEqual(updatedUser);
      expect(mockDbClient.update).toHaveBeenCalledWith(userId, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        lastLoginAt: expect.any(String),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        updatedAt: expect.any(String),
      });
    });
  });
});