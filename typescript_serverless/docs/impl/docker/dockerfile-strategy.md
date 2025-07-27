# Dockerfile Strategy - Node.js 22 Bookworm Base

## Overview

本プロジェクトのDocker戦略は、Docker公式のベストプラクティスに基づき、`node:22-bookworm`をベースイメージとして、セキュアで効率的なコンテナ環境を構築します。究極の型安全性を維持しながら、開発・本番両環境で最適なパフォーマンスを実現します。

## Base Image Selection

### node:22-bookworm選定理由

```dockerfile
FROM node:22-bookworm
```

**選定理由**:

- **Node.js 22**: 最新のLTS候補版で、最新のJavaScript/TypeScript機能をフルサポート
- **Debian 12 (Bookworm)**: 安定性とセキュリティアップデートの充実
- **glibc互換性**: ネイティブ依存関係を持つnpmパッケージとの高い互換性
- **開発ツール**: git、build-essential等の開発ツールが利用可能

## Multi-Stage Build Pattern

### 効率的なビルド戦略

```dockerfile
# ========================================
# Stage 1: Dependencies Layer
# ========================================
FROM node:22-bookworm AS dependencies

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /workspace

# Copy dependency files first (layer caching optimization)
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/*/package.json ./apps/
COPY packages/*/package.json ./packages/

# Install dependencies with frozen lockfile
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile --prefer-offline

# ========================================
# Stage 2: Build Layer
# ========================================
FROM node:22-bookworm AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /workspace

# Copy dependencies from previous stage
COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --from=dependencies /workspace/apps/*/node_modules ./apps/
COPY --from=dependencies /workspace/packages/*/node_modules ./packages/

# Copy source code
COPY . .

# Build all applications
RUN pnpm run build

# Remove development dependencies
RUN pnpm prune --prod

# ========================================
# Stage 3: Production Runtime
# ========================================
FROM node:22-bookworm-slim AS runtime

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r nodejs -g 1001 && \
    useradd -r -g nodejs -u 1001 -d /app -s /sbin/nologin nodejs

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /workspace/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /workspace/node_modules ./node_modules

# Use non-root user
USER nodejs

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
```

## Layer Caching Optimization

### 依存関係の効率的なキャッシング

```dockerfile
# ❌ 悪い例：全ファイルコピー後にインストール
COPY . .
RUN pnpm install

# ✅ 良い例：依存関係ファイルのみ先にコピー
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile
COPY . .
```

### BuildKitの活用

```dockerfile
# syntax=docker/dockerfile:1
# BuildKit mount cacheの使用
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

# Secret mountの使用（プライベートレジストリ）
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    pnpm install --frozen-lockfile
```

## Security Best Practices

### 1. 非rootユーザー実行

```dockerfile
# Create dedicated user
RUN groupadd -r nodejs -g 1001 && \
    useradd -r -g nodejs -u 1001 -d /app -s /sbin/nologin nodejs

# Change ownership
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs
```

### 2. 最小権限の原則

```dockerfile
# Read-only root filesystem
# docker run --read-only

# Drop all capabilities
# docker run --cap-drop=ALL

# No new privileges
# docker run --security-opt=no-new-privileges
```

### 3. イメージスキャン

```dockerfile
# Hadolint for Dockerfile linting
# hadolint Dockerfile

# Trivy for vulnerability scanning
# trivy image myapp:latest
```

## Application-Specific Dockerfiles

### Member Frontend (Next.js)

```dockerfile
# apps/web-member/Dockerfile
FROM node:22-bookworm AS builder

# ... build stages ...

FROM node:22-bookworm-slim AS runtime
WORKDIR /app

# Next.js specific
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/apps/web-member/.next/standalone ./
COPY --from=builder /app/apps/web-member/.next/static ./apps/web-member/.next/static
COPY --from=builder /app/apps/web-member/public ./apps/web-member/public

USER nodejs
EXPOSE 3000
CMD ["node", "apps/web-member/server.js"]
```

### API Lambda Function

```dockerfile
# packages/lambda/Dockerfile
FROM public.ecr.aws/lambda/nodejs:22 AS runtime

# Lambda specific optimizations
COPY --from=builder /app/dist/lambda.js ./
COPY --from=builder /app/node_modules ./node_modules

# Lambda handler
CMD ["lambda.handler"]
```

## Development vs Production Optimization

### Development Dockerfile

```dockerfile
# docker/dev.Dockerfile
FROM node:22-bookworm AS development

# Install development tools
RUN apt-get update && apt-get install -y \
    git \
    vim \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable

WORKDIR /workspace

# Install watchman for better file watching
RUN git clone https://github.com/facebook/watchman.git \
    && cd watchman \
    && ./autogen.sh \
    && ./configure \
    && make \
    && make install

# Development user with sudo
RUN groupadd -r developer -g 1000 && \
    useradd -r -g developer -u 1000 -m -s /bin/bash developer && \
    echo "developer ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER developer

# Keep container running
CMD ["tail", "-f", "/dev/null"]
```

### Production Optimizations

```dockerfile
# Remove all unnecessary files
RUN find . -name "*.md" -type f -delete && \
    find . -name "*.map" -type f -delete && \
    find . -name "test" -type d -exec rm -rf {} + && \
    find . -name "__tests__" -type d -exec rm -rf {} +

# Optimize node_modules
RUN npm prune --production && \
    find node_modules -name "*.md" -delete && \
    find node_modules -name "LICENSE*" -delete
```

## .dockerignore Configuration

```dockerignore
# .dockerignore
# Git
.git
.gitignore
.gitattributes

# CI/CD
.github
.gitlab-ci.yml
.travis.yml

# Development
.vscode
.idea
*.swp
*.swo
.DS_Store

# Dependencies
node_modules
.pnpm-store

# Build outputs
dist
.next
out
build
coverage

# Tests
**/*.test.ts
**/*.spec.ts
cypress
jest.config.js
vitest.config.ts

# Documentation
*.md
docs
LICENSE

# Environment
.env
.env.*
!.env.example

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Temporary files
tmp
temp
*.tmp
```

## Build Arguments and Environment Variables

### Flexible Configuration

```dockerfile
# Build arguments
ARG NODE_VERSION=22
ARG PNPM_VERSION=9

# Use build args
FROM node:${NODE_VERSION}-bookworm

# Runtime environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    LOG_LEVEL=info

# Build-time configuration
ARG BUILD_DATE
ARG GIT_COMMIT
ARG VERSION

# Labels for metadata
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${GIT_COMMIT}" \
      org.opencontainers.image.version="${VERSION}"
```

## Health Checks

### Container Health Monitoring

```dockerfile
# Health check for web application
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Health check for API
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

## Image Size Optimization

### Strategies for Smaller Images

1. **Multi-stage builds**: 開発依存関係を最終イメージから除外
2. **Slim variants**: `node:22-bookworm-slim`を本番環境で使用
3. **Layer squashing**: 不要なレイヤーを統合
4. **Minimal dependencies**: 本番環境に必要な最小限のパッケージのみ

```dockerfile
# Size comparison
# node:22-bookworm: ~1.1GB
# node:22-bookworm-slim: ~300MB
# distroless/nodejs22: ~150MB (考慮可能)
```

## CI/CD Integration

### Automated Build Pipeline

```yaml
# .github/workflows/docker-build.yml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Build and push
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ./Dockerfile
    platforms: linux/amd64,linux/arm64
    push: true
    tags: |
      myapp:latest
      myapp:${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
    build-args: |
      GIT_COMMIT=${{ github.sha }}
      BUILD_DATE=${{ steps.date.outputs.date }}
```

## Performance Considerations

### 1. Parallel Installation

```dockerfile
# Use pnpm for faster, more efficient installs
RUN corepack enable && \
    pnpm config set store-dir /root/.pnpm-store && \
    pnpm install --frozen-lockfile --prefer-offline
```

### 2. Build Cache Optimization

```dockerfile
# Mount cache for package managers
RUN --mount=type=cache,target=/root/.pnpm-store \
    --mount=type=cache,target=/root/.npm \
    pnpm install --frozen-lockfile
```

### 3. Conditional Rebuilds

```dockerfile
# Only rebuild when dependencies change
COPY pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm fetch --frozen-lockfile

COPY . .
RUN pnpm install --offline
```

## Debugging and Troubleshooting

### Debug Image

```dockerfile
# docker/debug.Dockerfile
FROM node:22-bookworm AS debug

# Install debugging tools
RUN apt-get update && apt-get install -y \
    strace \
    tcpdump \
    net-tools \
    procps \
    htop \
    && rm -rf /var/lib/apt/lists/*

# Node.js debugging
ENV NODE_OPTIONS="--inspect=0.0.0.0:9229"
EXPOSE 9229
```

## Summary

このDockerfile戦略により、以下を実現します：

1. **効率的なビルド**: マルチステージビルドとレイヤーキャッシング
2. **セキュリティ**: 非rootユーザー、最小権限、脆弱性スキャン
3. **パフォーマンス**: 最適化されたイメージサイズ、並列インストール
4. **保守性**: 明確な構造、デバッグ容易性、CI/CD統合

これらの戦略は、究極の型安全性を維持しながら、開発者体験と本番環境の信頼性を最大化します。
