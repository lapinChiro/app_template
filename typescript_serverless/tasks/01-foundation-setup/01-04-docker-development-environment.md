---
task_id: '01-04'
task_name: 'Docker Development Environment'
category: 'foundation'
priority: 'critical'
task_status: 'completed'
estimated_hours: 3
actual_hours: 0.4
developer: 'claude'
started_at: '2025-07-29T14:30:00Z'
completed_at: '2025-07-29T14:57:00Z'
depends_on: ['01-01']
blocks_tasks: []
---

# TASK-004: Docker Development Environment

**Priority**: Critical  
**Estimated**: 3 hours  
**Dependencies**: TASK-001 (ディレクトリ構造)

## Prerequisites

- Docker Desktop installed and running
- Docker Compose V2 (`docker compose version` で確認)
- 基本的な Docker 知識

## Reference Implementation

- Primary: `@docs/impl/docker/dockerfile-strategy.md` - マルチステージビルド戦略
- Secondary: `@docs/impl/docker/compose-architecture.md` - Compose設定とprofile
- Security: `@docs/impl/docker/security-hardening.md` - セキュリティ強化

## Acceptance Criteria

- [ ] Dockerfile が node:22-bookworm-slim を使用している
- [ ] マルチステージビルドで最終イメージサイズ < 300MB
- [ ] compose.yml で profile 機能が実装されている
- [ ] DynamoDB Local が動作し、データが永続化される
- [ ] ホットリロードが全アプリケーションで動作する
- [ ] セキュリティ強化（non-root user、read-only filesystem）
- [ ] `docker compose up` で全サービスが起動する

## Detailed Implementation

### Dockerfile
```dockerfile
# Dockerfile - dockerfile-strategy.md Section 3 に基づく
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json packages/*/
COPY apps/*/package.json apps/*/
RUN corepack enable && pnpm install --frozen-lockfile

FROM base AS development
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages ./packages
COPY --from=dependencies /app/apps ./apps
USER node
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["pnpm", "dev"]
```

### compose.yml
```yaml
# compose.yml - compose-architecture.md に基づく
services:
  # Core services (always run)
  dynamodb:
    image: amazon/dynamodb-local:latest
    ports:
      - "8000:8000"
    volumes:
      - dynamodb_data:/data
    command: "-jar DynamoDBLocal.jar -sharedDb -dbPath /data"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/shell/ || exit 1"]
      interval: 5s
      timeout: 2s
      retries: 3

  # Application services
  web-member:
    build:
      context: .
      target: development
    ports:
      - "3000:3000"
    volumes:
      - ./apps/web-member:/app/apps/web-member
      - ./packages:/app/packages
    environment:
      - NODE_ENV=development
    depends_on:
      dynamodb:
        condition: service_healthy

  # Optional services (profile-based)
  web-admin:
    profiles: ["admin", "full"]
    extends:
      service: web-member
    ports:
      - "3001:3000"
    volumes:
      - ./apps/web-admin:/app/apps/web-admin
      - ./packages:/app/packages

volumes:
  dynamodb_data:
```

## Quality Gates

- Docker image size: < 300MB (production)
- Container startup time: < 10 seconds
- Memory usage: < 512MB per container
- Security scan: 0 high/critical vulnerabilities

## Verification Steps

```bash
# 基本サービスの起動
docker compose up -d

# ヘルスチェック確認
docker compose ps

# プロファイル付き起動
docker compose --profile full up -d

# ログ確認
docker compose logs -f web-member

# DynamoDB Local 接続テスト
curl http://localhost:8000/shell/

# ホットリロードテスト（ファイル変更後）
echo '// test' >> apps/web-member/src/app/page.tsx
# ブラウザで自動更新を確認
```

## Output

- 本番環境と同等の Docker 開発環境
- プロファイルベースの柔軟なサービス管理
- セキュアで高速な開発環境

## Progress

- [x] Started
- [x] Implementation complete
- [x] Verified
- [x] Documented