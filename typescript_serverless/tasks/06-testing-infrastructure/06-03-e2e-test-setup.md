# TASK-019: E2E Test Setup

**Priority**: Medium  
**Estimated**: 3 hours  
**Dependencies**: TASK-011 (Member App), TASK-012 (Admin App)

## Prerequisites

- Cypress の基本知識
- E2E テストの概念理解
- CI/CD 環境でのテスト実行

## Reference Implementation

- Primary: `@docs/impl/testing/test-pyramid.md` - E2Eテスト戦略
- Secondary: `@docs/impl/testing/cypress-patterns.md` - Cypressベストプラクティス

## Acceptance Criteria

- [ ] Cypress が設定されている
- [ ] 基本的な E2E テストが作成されている
- [ ] Google OAuth 認証フローがテストされている
- [ ] CI/CD で E2E テストが実行される
- [ ] テストレポートが生成される
- [ ] ビジュアルリグレッションテストが設定されている

## Detailed Implementation

### Cypress Setup
```json
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      apiUrl: 'http://localhost:3100',
      adminUrl: 'http://localhost:3001',
      googleTestEmail: process.env.CYPRESS_GOOGLE_TEST_EMAIL,
      googleTestPassword: process.env.CYPRESS_GOOGLE_TEST_PASSWORD,
    },
    setupNodeEvents(on, config) {
      // Task for database seeding
      on('task', {
        async 'db:seed'(data) {
          // Seed test data
          return null;
        },
        async 'db:cleanup'() {
          // Cleanup test data
          return null;
        },
      });

      // Code coverage
      require('@cypress/code-coverage/task')(on, config);

      return config;
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});
```

### Custom Commands
```typescript
// cypress/support/commands.ts
import '@testing-library/cypress/add-commands';

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, role?: 'member' | 'admin'): Chainable<void>;
      loginWithGoogle(): Chainable<void>;
      seedDatabase(fixture: string): Chainable<void>;
      cleanupDatabase(): Chainable<void>;
      interceptAPI(alias: string, response?: any): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add('login', (email = 'test@example.com', role = 'member') => {
  cy.task('db:seed', {
    users: [{
      email,
      name: 'Test User',
      role,
      id: 'test-user-id',
    }],
  });

  // Set auth cookie directly
  cy.setCookie('auth-token', 'test-jwt-token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  });

  cy.visit('/');
});

// Google OAuth login
Cypress.Commands.add('loginWithGoogle', () => {
  const email = Cypress.env('googleTestEmail');
  const password = Cypress.env('googleTestPassword');

  cy.visit('/login');
  cy.contains('Googleでログイン').click();

  // Handle Google OAuth popup
  cy.origin('https://accounts.google.com', { args: { email, password } }, ({ email, password }) => {
    cy.get('input[type="email"]').type(email);
    cy.contains('Next').click();
    cy.get('input[type="password"]').type(password);
    cy.contains('Next').click();
  });

  // Wait for redirect back
  cy.url().should('include', '/');
});

// API interceptor
Cypress.Commands.add('interceptAPI', (alias, response) => {
  cy.intercept('GET', `**/api/${alias}`, response || { fixture: `${alias}.json` }).as(alias);
});
```

### Basic E2E Tests
```typescript
// cypress/e2e/auth/login.cy.ts
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.cleanupDatabase();
  });

  it('should redirect unauthenticated users to login', () => {
    cy.visit('/profile');
    cy.url().should('include', '/login');
    cy.contains('ログインが必要です').should('be.visible');
  });

  it('should login with Google OAuth', () => {
    cy.loginWithGoogle();
    cy.contains('ダッシュボード').should('be.visible');
    cy.getCookie('auth-token').should('exist');
  });

  it('should logout successfully', () => {
    cy.login();
    cy.visit('/');
    
    cy.contains('ログアウト').click();
    cy.url().should('include', '/login');
    cy.getCookie('auth-token').should('not.exist');
  });

  it('should persist authentication across page reloads', () => {
    cy.login();
    cy.visit('/profile');
    cy.contains('プロフィール').should('be.visible');
    
    cy.reload();
    cy.contains('プロフィール').should('be.visible');
  });
});
```

### User Journey Tests
```typescript
// cypress/e2e/user-journey/member-workflow.cy.ts
describe('Member User Journey', () => {
  beforeEach(() => {
    cy.cleanupDatabase();
    cy.login('member@example.com', 'member');
  });

  it('should complete profile update workflow', () => {
    // Navigate to profile
    cy.visit('/');
    cy.contains('プロフィール').click();
    cy.url().should('include', '/profile');

    // Update profile
    cy.contains('編集').click();
    cy.get('input[name="name"]').clear().type('Updated Name');
    cy.get('form').submit();

    // Verify success
    cy.contains('プロフィールを更新しました').should('be.visible');
    cy.contains('Updated Name').should('be.visible');

    // Verify persistence
    cy.reload();
    cy.contains('Updated Name').should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    cy.interceptAPI('profile', { statusCode: 500 });
    cy.visit('/profile');
    
    cy.contains('エラーが発生しました').should('be.visible');
    cy.contains('再試行').should('be.visible');
  });
});
```

### Admin Workflow Tests
```typescript
// cypress/e2e/user-journey/admin-workflow.cy.ts
describe('Admin User Management', () => {
  beforeEach(() => {
    cy.cleanupDatabase();
    cy.seedDatabase('admin-test-data');
    cy.login('admin@example.com', 'admin');
  });

  it('should perform CRUD operations on users', () => {
    cy.visit('/users');

    // Create user
    cy.contains('新規ユーザー').click();
    cy.get('input[name="email"]').type('new-user@example.com');
    cy.get('input[name="name"]').type('New User');
    cy.get('select[name="role"]').select('member');
    cy.get('form').submit();
    cy.contains('ユーザーを作成しました').should('be.visible');

    // Edit user
    cy.contains('new-user@example.com')
      .parent('tr')
      .within(() => {
        cy.get('[data-testid="edit-button"]').click();
      });
    cy.get('input[name="name"]').clear().type('Edited User');
    cy.get('form').submit();
    cy.contains('ユーザーを更新しました').should('be.visible');

    // Delete user
    cy.contains('Edited User')
      .parent('tr')
      .within(() => {
        cy.get('[data-testid="delete-button"]').click();
      });
    cy.contains('削除しますか？').should('be.visible');
    cy.contains('削除する').click();
    cy.contains('ユーザーを削除しました').should('be.visible');
    cy.contains('new-user@example.com').should('not.exist');
  });
});
```

### Visual Regression Tests
```typescript
// cypress/e2e/visual/components.cy.ts
describe('Visual Regression Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should match dashboard visual snapshot', () => {
    cy.visit('/');
    cy.wait(1000); // Wait for animations
    cy.matchImageSnapshot('dashboard');
  });

  it('should match dark mode snapshot', () => {
    cy.visit('/');
    cy.get('[data-testid="theme-toggle"]').click();
    cy.wait(500);
    cy.matchImageSnapshot('dashboard-dark');
  });
});
```

### Performance Tests
```typescript
// cypress/e2e/performance/page-load.cy.ts
describe('Performance Tests', () => {
  it('should load dashboard within performance budget', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.performance.mark('start');
      },
      onLoad: (win) => {
        win.performance.mark('end');
        win.performance.measure('pageLoad', 'start', 'end');
        const measure = win.performance.getEntriesByName('pageLoad')[0];
        expect(measure.duration).to.be.lessThan(3000); // 3 seconds
      },
    });
  });

  it('should have good Core Web Vitals', () => {
    cy.visit('/');
    cy.vitals({
      thresholds: {
        lcp: 2500, // Largest Contentful Paint
        fid: 100,  // First Input Delay
        cls: 0.1,  // Cumulative Layout Shift
      },
    });
  });
});
```

### CI/CD Integration
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build applications
        run: pnpm build
        
      - name: Start services
        run: |
          docker-compose up -d
          pnpm start:test &
          npx wait-on http://localhost:3000
          
      - name: Run Cypress tests
        uses: cypress-io/github-action@v6
        with:
          install: false
          browser: chrome
          record: true
          parallel: true
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: cypress-screenshots
          path: cypress/screenshots
          
      - name: Upload videos
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: cypress-videos
          path: cypress/videos
```

### Test Data Management
```typescript
// cypress/fixtures/admin-test-data.json
{
  "users": [
    {
      "id": "user-1",
      "email": "user1@example.com",
      "name": "Test User 1",
      "role": "member",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "user-2",
      "email": "user2@example.com",
      "name": "Test User 2",
      "role": "member",
      "createdAt": "2024-01-02T00:00:00Z"
    }
  ]
}
```

## Quality Gates

- E2E test pass rate: 100%
- Test execution time: < 5 minutes
- Visual regression threshold: < 0.1% difference
- Core Web Vitals: All green

## Verification Steps

```bash
# Cypress インストール
pnpm add -D cypress @cypress/code-coverage

# Cypress 起動（インタラクティブ）
pnpm cypress open

# E2E テスト実行（ヘッドレス）
pnpm cypress run

# 特定のテストスイート実行
pnpm cypress run --spec "cypress/e2e/auth/**"

# ビジュアルリグレッションテスト
pnpm cypress run --spec "cypress/e2e/visual/**"

# CI環境でのテスト
pnpm test:e2e:ci
```

## Output

- 完全な E2E テストスイート
- ユーザージャーニーテスト
- CI/CD 統合された自動テスト

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented