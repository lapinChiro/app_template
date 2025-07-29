import type { MockInstance } from 'vitest';

// Type-safe mock for TokenValidator
export interface MockTokenValidator {
  verifyIdToken: MockInstance;
  validateIdToken: MockInstance;
  validateAccessToken: MockInstance;
  getCertificates: MockInstance;
  verifyJWT: MockInstance;
  clientId: string;
}

// Type-safe mock for UserRepository
export interface MockUserRepository {
  findByGoogleId: MockInstance;
  findById: MockInstance;
  findByEmail: MockInstance;
  findByRole: MockInstance;
  create: MockInstance;
  update: MockInstance;
  updateLastLogin: MockInstance;
  delete: MockInstance;
  list: MockInstance;
  listWithCursor: MockInstance;
  findActiveUsers: MockInstance;
  findInactiveUsers: MockInstance;
  countByRole: MockInstance;
}

interface ViInstance {
  fn: () => MockInstance;
}

export function createMockTokenValidator(vi: ViInstance): MockTokenValidator {
  return {
    verifyIdToken: vi.fn(),
    validateIdToken: vi.fn(),
    validateAccessToken: vi.fn(),
    getCertificates: vi.fn(),
    verifyJWT: vi.fn(),
    clientId: 'test-client-id',
  };
}

export function createMockUserRepository(vi: ViInstance): MockUserRepository {
  return {
    findByGoogleId: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByRole: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateLastLogin: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    listWithCursor: vi.fn(),
    findActiveUsers: vi.fn(),
    findInactiveUsers: vi.fn(),
    countByRole: vi.fn(),
  };
}