import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { User } from '../../types/user';
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

describe('UserRepository - Query Operations', () => {
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

  describe('findByRole', () => {
    it('should return users with specific role', async () => {
      const role = 'admin';
      const mockAdmins: User[] = [
        {
          id: 'admin-1',
          email: 'admin1@example.com',
          name: 'Admin 1',
          role: 'admin',
          isActive: true,
          createdAt: '2025-01-29T00:00:00.000Z',
          updatedAt: '2025-01-29T00:00:00.000Z',
        },
      ];

      mockDbClient.query.mockResolvedValueOnce({ items: mockAdmins });

      const result = await repository.findByRole(role);

      expect(result).toEqual(mockAdmins);
      expect(mockDbClient.query).toHaveBeenCalledWith({ role });
    });

    it('should return empty array when no users found with role', async () => {
      const role = 'admin' as const;
      mockDbClient.query.mockResolvedValueOnce({ items: [] });

      const result = await repository.findByRole(role);

      expect(result).toEqual([]);
    });
  });

  describe('findActive', () => {
    it('should return only active users', async () => {
      const mockActiveUsers: User[] = [
        {
          id: 'user-1',
          email: 'active1@example.com',
          name: 'Active User 1',
          role: 'member',
          isActive: true,
          createdAt: '2025-01-29T00:00:00.000Z',
          updatedAt: '2025-01-29T00:00:00.000Z',
        },
      ];

      mockDbClient.query.mockResolvedValueOnce({ items: mockActiveUsers });

      const result = await repository.findActiveUsers();

      expect(result).toEqual(mockActiveUsers);
      expect(mockDbClient.query).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe('count', () => {
    it('should return total count of active users', async () => {
      mockDbClient.query.mockResolvedValueOnce({ count: 42 });

      const result = await repository.countByRole('member');

      expect(result).toBe(42);
      expect(mockDbClient.query).toHaveBeenCalledWith({ role: 'member' });
    });

    it('should return count including inactive users when specified', async () => {
      mockDbClient.query.mockResolvedValueOnce({ count: 50 });

      const result = await repository.countByRole('admin');

      expect(result).toBe(50);
      expect(mockDbClient.query).toHaveBeenCalledWith({ role: 'admin' });
    });
  });
});