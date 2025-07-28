# TASK-018: Integration Test Setup

**Priority**: High  
**Estimated**: 3 hours  
**Dependencies**: TASK-017 (Unit Test Setup)

## Prerequisites

- Jest の統合テスト知識
- API テストの基本概念
- テストデータベースの理解

## Reference Implementation

- Primary: `@docs/impl/testing/test-pyramid.md` - 統合テスト戦略
- Secondary: `@docs/impl/testing/api-testing.md` - APIテストパターン

## Acceptance Criteria

- [ ] Supertest が設定されている
- [ ] テスト用 DynamoDB Local が動作する
- [ ] API テストヘルパーが作成されている
- [ ] 認証付きテストが実装されている
- [ ] テストデータのシード機能がある
- [ ] トランザクショナルテストが可能

## Detailed Implementation

### Test Environment Setup
```typescript
// jest.config.integration.js
module.exports = {
  displayName: 'integration',
  testMatch: ['**/*.integration.test.ts'],
  testEnvironment: './jest.integration.environment.ts',
  globalSetup: './jest.integration.setup.ts',
  globalTeardown: './jest.integration.teardown.ts',
  setupFilesAfterEnv: ['./jest.integration.setup-after-env.ts'],
  testTimeout: 30000, // 30 seconds for API tests
};
```

### DynamoDB Test Environment
```typescript
// jest.integration.environment.ts
import { TestEnvironment } from 'jest-environment-node';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CreateTableCommand, DeleteTableCommand } from '@aws-sdk/client-dynamodb';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

export default class DynamoDBTestEnvironment extends TestEnvironment {
  private container?: StartedTestContainer;
  private client?: DynamoDBClient;

  async setup() {
    await super.setup();

    // Start DynamoDB Local container
    this.container = await new GenericContainer('amazon/dynamodb-local:latest')
      .withExposedPorts(8000)
      .withCommand(['-jar', 'DynamoDBLocal.jar', '-inMemory'])
      .start();

    const port = this.container.getMappedPort(8000);
    const endpoint = `http://localhost:${port}`;

    // Set environment variables
    this.global.process.env.DYNAMODB_ENDPOINT = endpoint;
    this.global.process.env.AWS_REGION = 'us-east-1';
    this.global.process.env.AWS_ACCESS_KEY_ID = 'test';
    this.global.process.env.AWS_SECRET_ACCESS_KEY = 'test';

    // Create test table
    this.client = new DynamoDBClient({ endpoint });
    await this.createTestTable();
  }

  async teardown() {
    if (this.container) {
      await this.container.stop();
    }
    await super.teardown();
  }

  private async createTestTable() {
    const params = {
      TableName: 'test-table',
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'GSI1PK', AttributeType: 'S' },
        { AttributeName: 'GSI1SK', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'GSI1PK', KeyType: 'HASH' },
            { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
          BillingMode: 'PAY_PER_REQUEST',
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    };

    await this.client!.send(new CreateTableCommand(params));
  }
}
```

### API Test Helpers
```typescript
// test/helpers/api-test-helper.ts
import request from 'supertest';
import { User } from '@shared/core/types';
import { generateJWT } from '@shared/core/auth/jwt';

export class ApiTestHelper {
  private app: any;
  private authTokens: Map<string, string> = new Map();

  constructor(app: any) {
    this.app = app;
  }

  async authenticateAs(user: User): Promise<string> {
    const token = await generateJWT(user);
    this.authTokens.set(user.id, token);
    return token;
  }

  request() {
    return request(this.app);
  }

  authenticatedRequest(userId: string) {
    const token = this.authTokens.get(userId);
    if (!token) {
      throw new Error(`No auth token found for user ${userId}`);
    }
    return request(this.app).set('Cookie', `auth-token=${token}`);
  }

  async createUser(data: Partial<User> = {}): Promise<User> {
    const user: User = {
      id: data.id || 'test-user-id',
      email: data.email || 'test@example.com',
      name: data.name || 'Test User',
      role: data.role || 'member',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };

    // Save to database
    await userRepository.create(user);
    return user;
  }

  async cleanupDatabase() {
    // Clear all test data
    await dynamoDBClient.send(
      new ScanCommand({
        TableName: 'test-table',
      })
    );
    // Delete all items...
  }
}
```

### Integration Test Example
```typescript
// apps/api-member/src/app/api/profile/route.integration.test.ts
import { ApiTestHelper } from '@/test/helpers/api-test-helper';
import { createTestApp } from '@/test/helpers/create-test-app';
import { User } from '@shared/core/types';

describe('Profile API', () => {
  let helper: ApiTestHelper;
  let testUser: User;

  beforeAll(async () => {
    const app = await createTestApp();
    helper = new ApiTestHelper(app);
  });

  beforeEach(async () => {
    await helper.cleanupDatabase();
    testUser = await helper.createUser({
      email: 'profile-test@example.com',
      name: 'Profile Test User',
    });
    await helper.authenticateAs(testUser);
  });

  describe('GET /api/profile', () => {
    it('should return authenticated user profile', async () => {
      const response = await helper
        .authenticatedRequest(testUser.id)
        .get('/api/profile');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: expect.objectContaining({
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
        }),
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await helper.request().get('/api/profile');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Unauthorized',
      });
    });
  });

  describe('PUT /api/profile', () => {
    it('should update user profile', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const response = await helper
        .authenticatedRequest(testUser.id)
        .put('/api/profile')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(updateData.name);

      // Verify in database
      const updatedUser = await userRepository.findById(testUser.id);
      expect(updatedUser?.name).toBe(updateData.name);
    });

    it('should validate request body', async () => {
      const response = await helper
        .authenticatedRequest(testUser.id)
        .put('/api/profile')
        .send({ email: 'invalid-email' }); // Email update not allowed

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });
  });
});
```

### Test Data Factories
```typescript
// test/factories/user.factory.ts
import { Factory } from 'fishery';
import { User } from '@shared/core/types';
import { faker } from '@faker-js/faker';

export const userFactory = Factory.define<User>(() => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: faker.helpers.arrayElement(['member', 'admin']),
  picture: faker.image.avatar(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
}));

// Usage
const testUsers = userFactory.buildList(5);
const adminUser = userFactory.build({ role: 'admin' });
```

### Transactional Tests
```typescript
// test/helpers/transactional-test.ts
export async function withTransaction<T>(
  fn: () => Promise<T>
): Promise<T> {
  const backup = await createDatabaseBackup();
  
  try {
    return await fn();
  } finally {
    await restoreDatabaseBackup(backup);
  }
}

// Usage in tests
it('should handle complex transaction', async () => {
  await withTransaction(async () => {
    // All database changes will be rolled back
    const user = await helper.createUser();
    const response = await helper
      .authenticatedRequest(user.id)
      .delete(`/api/users/${user.id}`);
      
    expect(response.status).toBe(200);
  });
  
  // Database is restored to original state
});
```

### Performance Testing
```typescript
// test/performance/api.perf.test.ts
describe('API Performance', () => {
  it('should handle concurrent requests', async () => {
    const users = await Promise.all(
      Array.from({ length: 10 }, () => helper.createUser())
    );

    const start = Date.now();
    const requests = users.map((user) =>
      helper.authenticatedRequest(user.id).get('/api/profile')
    );

    const responses = await Promise.all(requests);
    const duration = Date.now() - start;

    expect(responses.every((r) => r.status === 200)).toBe(true);
    expect(duration).toBeLessThan(1000); // All requests complete within 1s
  });
});
```

## Quality Gates

- Integration test coverage: > 80%
- Test execution time: < 60 seconds
- Test isolation: 100%
- No test data leakage

## Verification Steps

```bash
# 統合テスト実行
pnpm test:integration

# 特定のAPIテスト
pnpm test:integration apps/api-member

# カバレッジ付き実行
pnpm test:integration --coverage

# デバッグモード
DEBUG=supertest pnpm test:integration

# パフォーマンステスト
pnpm test:performance
```

## Output

- API 統合テスト環境
- 再利用可能なテストヘルパー
- トランザクショナルテストサポート

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented