# TASK-017: Unit Test Setup

**Priority**: High  
**Estimated**: 2 hours  
**Dependencies**: TASK-002 (TypeScript設定)

## Prerequisites

- Jest の基本知識
- Testing Library の理解
- TDD の基本概念

## Reference Implementation

- Primary: `@docs/impl/testing/test-pyramid.md` - テスト戦略実装
- Agent: `@.claude/agents/test-creator.md` - TDDサイクル支援

## Acceptance Criteria

- [ ] Jest が TypeScript で動作する（ts-jest 設定）
- [ ] 各パッケージで独立してテストが実行できる
- [ ] カバレッジ閾値が 90% に設定されている（test-pyramid.md Section 4）
- [ ] グローバルテストユーティリティが型安全である
- [ ] モックヘルパーが @shared/test-utils からインポート可能
- [ ] `pnpm test` で全テストが実行される

## Detailed Implementation

### Base Configuration
```javascript
// jest.config.base.js - 基本設定
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

// packages/shared/jest.config.js - パッケージ個別設定
const base = require('../../jest.config.base');

module.exports = {
  ...base,
  displayName: 'shared',
  testEnvironment: 'node',
};
```

### Test Utilities Setup
```typescript
// jest.setup.ts - test-pyramid.md Section 3.2
declare global {
  var testUser: User;
  var testAdminUser: User;
}

// グローバルテストデータ
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
```

### Test Builders
```typescript
// packages/shared/src/test-utils/builders.ts
export class UserBuilder {
  private user: Partial<User> = {};
  
  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }
  
  withRole(role: UserRole): this {
    this.user.role = role;
    return this;
  }
  
  build(): User {
    return {
      id: this.user.id ?? 'test-id',
      email: this.user.email ?? 'test@example.com',
      name: this.user.name ?? 'Test User',
      role: this.user.role ?? 'member',
      createdAt: this.user.createdAt ?? new Date().toISOString(),
      updatedAt: this.user.updatedAt ?? new Date().toISOString(),
    };
  }
}
```

### Mock Helpers
```typescript
// packages/shared/src/test-utils/mocks.ts
export function createMockRepository<T>(): jest.Mocked<Repository<T>> {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

export function mockApiResponse<T>(data: T, status = 200) {
  return {
    status,
    json: async () => data,
    headers: new Headers(),
    ok: status >= 200 && status < 300,
  } as Response;
}
```

## Quality Gates

- Test execution time: < 5 seconds (unit tests)
- Coverage thresholds: All > 90%
- Type safety: 100% (no any in tests)
- Test isolation: 100% (no test interdependencies)

## Verification Steps

```bash
# Jest 設定の確認
pnpm test --listTests

# カバレッジ付きテスト実行
pnpm test --coverage

# 個別パッケージのテスト
pnpm test packages/shared

# ウォッチモードでの開発
pnpm test --watch

# カバレッジレポートの確認
open coverage/lcov-report/index.html
```

## Output

- 型安全な Jest テスト環境
- 90% カバレッジを強制する設定
- 再利用可能なテストユーティリティ

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented