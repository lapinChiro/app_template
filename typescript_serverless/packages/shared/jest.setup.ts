// Type definitions for global test data
interface User {
  id: string;
  email: string;
  name: string;
  role: 'member' | 'admin';
  createdAt: string;
  updatedAt: string;
}

declare global {
  var testUser: User;
  var testAdminUser: User;
}

// Initialize global test data
global.testUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'member',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

global.testAdminUser = {
  ...global.testUser,
  id: 'test-admin-id',
  email: 'admin@example.com',
  name: 'Test Admin',
  role: 'admin',
};

// Ensure test isolation
beforeEach(() => {
  jest.clearAllMocks();
});

export {};