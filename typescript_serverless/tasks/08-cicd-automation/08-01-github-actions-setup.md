# TASK-023: GitHub Actions Setup

**Priority**: Medium  
**Estimated**: 3 hours  
**Dependencies**: TASK-017 (Unit Test Setup)

## Prerequisites

- GitHub Actions の基本知識
- CI/CD パイプラインの概念理解
- AWS デプロイ権限の設定

## Reference Implementation

- Primary: `@docs/impl/workflow/github-flow.md` - GitHubフロー実装
- Secondary: `@docs/impl/security/ci-security.md` - CI/CDセキュリティ

## Acceptance Criteria

- [ ] 基本ワークフローが作成されている
- [ ] 品質ゲートが実装されている（ESLint, TypeScript, テスト）
- [ ] 自動デプロイが設定されている
- [ ] セキュリティスキャンが実行される
- [ ] 並列実行で高速化されている
- [ ] 失敗時の通知が設定されている

## Detailed Implementation

### Main CI Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # 品質チェック（並列実行）
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest
    strategy:
      matrix:
        check: [lint, type-check, format]
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
        run: pnpm install --frozen-lockfile
        
      - name: Run ${{ matrix.check }}
        run: pnpm ${{ matrix.check }}

  # ユニットテスト
  unit-tests:
    name: Unit Tests
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
        run: pnpm install --frozen-lockfile
        
      - name: Run unit tests
        run: pnpm test --coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          
      - name: Check coverage thresholds
        run: |
          coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$coverage < 90" | bc -l) )); then
            echo "Coverage is below 90%: $coverage%"
            exit 1
          fi

  # 統合テスト
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    services:
      dynamodb:
        image: amazon/dynamodb-local:latest
        ports:
          - 8000:8000
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
        run: pnpm install --frozen-lockfile
        
      - name: Run integration tests
        run: pnpm test:integration
        env:
          DYNAMODB_ENDPOINT: http://localhost:8000
          
  # セキュリティスキャン
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
          
      - name: Run npm audit
        run: |
          pnpm audit --audit-level=high
          
      - name: Run license check
        run: |
          pnpm licenses list --prod
          
  # ビルド
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [quality, unit-tests]
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
        run: pnpm install --frozen-lockfile
        
      - name: Build all packages
        run: pnpm build
        
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: |
            packages/*/dist
            apps/*/out
            apps/*/.next
          retention-days: 7
```

### CD Workflow
```yaml
# .github/workflows/cd.yml
name: CD

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'dev'
        type: choice
        options:
          - dev
          - stg
          - prod

jobs:
  deploy:
    name: Deploy to ${{ github.event.inputs.environment || 'dev' }}
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'dev' }}
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
          
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: ap-northeast-1
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_API_URL: ${{ vars.API_URL }}
          
      - name: Deploy with CDK
        run: |
          pnpm cdk deploy --all \
            --context stage=${{ github.event.inputs.environment || 'dev' }} \
            --require-approval never
            
      - name: Run smoke tests
        run: pnpm test:smoke
        env:
          API_URL: ${{ vars.API_URL }}
          
      - name: Notify deployment
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Deployment to ${{ github.event.inputs.environment || 'dev' }} ${{ job.status }}
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### E2E Test Workflow
```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, firefox, edge]
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
        run: pnpm install --frozen-lockfile
        
      - name: Build applications
        run: pnpm build
        
      - name: Start services
        run: |
          docker compose up -d
          pnpm start:test &
          npx wait-on http://localhost:3000 http://localhost:3001 --timeout 60000
          
      - name: Run Cypress tests
        uses: cypress-io/github-action@v6
        with:
          install: false
          browser: ${{ matrix.browser }}
          record: true
          parallel: true
          group: ${{ matrix.browser }}
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: cypress-screenshots-${{ matrix.browser }}
          path: cypress/screenshots
```

### Dependency Update Workflow
```yaml
# .github/workflows/dependency-update.yml
name: Dependency Update

on:
  schedule:
    - cron: '0 9 * * 1' # Weekly on Monday at 9 AM UTC
  workflow_dispatch:

jobs:
  update-dependencies:
    name: Update Dependencies
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
          
      - name: Update dependencies
        run: |
          pnpm update --interactive false
          pnpm audit fix
          
      - name: Run tests
        run: |
          pnpm install
          pnpm test
          pnpm build
          
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore: update dependencies'
          title: 'Weekly dependency updates'
          body: |
            ## Weekly Dependency Updates
            
            This PR contains the following updates:
            - Updated npm dependencies to latest versions
            - Fixed any audit vulnerabilities
            
            Please review and merge if all checks pass.
          branch: deps/weekly-update
          delete-branch: true
```

### Performance Monitoring Workflow
```yaml
# .github/workflows/performance.yml
name: Performance Monitoring

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    name: Lighthouse CI
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
        run: pnpm install --frozen-lockfile
        
      - name: Build applications
        run: pnpm build
        
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            http://localhost:3000
            http://localhost:3001
          uploadArtifacts: true
          temporaryPublicStorage: true
          
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const results = require('./lighthouse-results.json');
            const comment = `## Lighthouse Results
            
            | Metric | Score |
            |--------|-------|
            | Performance | ${results.performance} |
            | Accessibility | ${results.accessibility} |
            | Best Practices | ${results.bestPractices} |
            | SEO | ${results.seo} |
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### Reusable Workflows
```yaml
# .github/workflows/reusable-quality.yml
name: Reusable Quality Checks

on:
  workflow_call:
    inputs:
      node-version:
        required: false
        type: string
        default: '22'

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run quality checks
        run: |
          pnpm lint
          pnpm type-check
          pnpm test
```

## Quality Gates

- CI pipeline duration: < 10 minutes
- Parallel job execution: Maximum efficiency
- Cache hit rate: > 90%
- Security scan pass rate: 100%

## Verification Steps

```bash
# ローカルでワークフロー検証
act -j quality

# GitHub Actions デバッグ
# 1. Settings > Secrets and variables > Actions でシークレット設定
# 2. ワークフロー実行
git push origin feature/test-ci

# ステータスバッジ追加
echo '![CI](https://github.com/user/repo/workflows/CI/badge.svg)' >> README.md

# ワークフロー実行履歴確認
gh run list
gh run view
```

## Output

- 完全な CI/CD パイプライン
- 自動品質チェックと通知
- 並列実行による高速化

## Progress

- [ ] Started
- [ ] Implementation complete
- [ ] Verified
- [ ] Documented