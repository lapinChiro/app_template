import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { PaginationParams, PaginatedResponse } from '../../types/common';
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
}));

// Define the mock client interface for test clarity
interface MockDbClient {
  query: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  batchGet: ReturnType<typeof vi.fn>;
  scan: ReturnType<typeof vi.fn>;
}

describe('UserRepository - List Operations', () => {
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

    // Create repository instance with mock
    repository = new UserRepository(mockDbClient as unknown as MockDbClient);
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should return paginated list of users', async () => {
      const params: PaginationParams = {
        page: 1,
        limit: 10,
      };

      const mockUsers: User[] = Array.from({ length: 10 }, (_, i) => ({
        id: `user-${i + 1}`,
        email: `user${i + 1}@example.com`,
        name: `User ${i + 1}`,
        role: 'member' as const,
        isActive: true,
        createdAt: '2025-01-29T00:00:00.000Z',
        updatedAt: '2025-01-29T00:00:00.000Z',
      }));

      mockDbClient.scan.mockResolvedValueOnce({
        items: mockUsers,
        count: 25, // total count
      });

      const result = await repository.list(params);

      expect(result).toMatchObject<PaginatedResponse<User>>({
        items: mockUsers,
        total: 25,
        page: 1,
        limit: 10,
        pages: 3,
        hasNext: true,
        hasPrev: false,
      });
    });

    it('should handle pagination correctly', async () => {
      const params: PaginationParams = {
        page: 2,
        limit: 5,
      };

      const mockUsers: User[] = Array.from({ length: 5 }, (_, i) => ({
        id: `user-${i + 6}`,
        email: `user${i + 6}@example.com`,
        name: `User ${i + 6}`,
        role: 'member' as const,
        isActive: true,
        createdAt: '2025-01-29T00:00:00.000Z',
        updatedAt: '2025-01-29T00:00:00.000Z',
      }));

      mockDbClient.scan.mockResolvedValueOnce({
        items: mockUsers,
        count: 15,
        lastEvaluatedKey: { id: 'user-10' },
      });

      const result = await repository.list(params);

      expect(result.page).toBe(2);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
      expect(result.pages).toBe(3);
    });
  });
});