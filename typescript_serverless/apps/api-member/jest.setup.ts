// Import shared test setup
import '../../packages/shared/jest.setup';

// API Member specific test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset modules to ensure clean state
  jest.resetModules();
  
  // Clear environment variables
  delete process.env.AWS_REGION;
  delete process.env.DYNAMODB_TABLE;
  
  // Set default test environment
  process.env.NODE_ENV = 'test';
  process.env.AWS_REGION = 'us-east-1';
  process.env.DYNAMODB_TABLE = 'test-table';
});

export {};