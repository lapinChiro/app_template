# Docker Compose Architecture

## Overview

Docker Composeを使用した開発環境アーキテクチャは、マイクロサービス間の依存関係を明確にし、開発者が即座に全スタックを起動できる環境を提供します。Profile機能により、必要なサービスのみを選択的に起動でき、リソース効率的な開発が可能です。

## Docker Compose V2 Best Practices

本設定は、Docker Compose V2の最新のベストプラクティスに準拠しています：

- `version`フィールドの削除（V2では非推奨）
- YAML anchorsによる設定の再利用
- 一貫した環境変数の形式
- BuildKit機能の活用
- 明示的なネットワーク設定

## Compose File Structure

### プロジェクト構成

````yaml
# compose.yml - メイン構成ファイル
# Docker Compose V2準拠（versionフィールドなし）

x-common-variables: &common-variables
  NODE_ENV: development
  LOG_LEVEL: debug

x-healthcheck: &default-healthcheck
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s

x-base-service: &base-service
  build:
    context: .
    dockerfile: docker/dev.Dockerfile
    args:
      NODE_VERSION: "22"
  image: ${PROJECT_NAME:-app}-workspace:dev
  env_file:
    - .env
  networks:
    - app-network

services:
  # ... service definitions ...

networks:
  app-network:
    driver: bridge

volumes:
  pnpm-store:
  dynamodb-data:

## Service Architecture

### 1. 基盤サービス定義

```yaml
# compose.yml
services:
  # ========================================
  # 開発用ベースサービス
  # ========================================
  workspace:
    <<: *base-service
    volumes:
      - .:/workspace:delegated
      - pnpm-store:/root/.pnpm-store
      - node_modules:/workspace/node_modules
    environment:
      <<: *common-variables
    command: tail -f /dev/null
    profiles:
      - tools

  # ========================================
  # Member Frontend
  # ========================================
  web-member:
    <<: *base-service
    command: pnpm --filter web-member dev
    ports:
      - "3000:3000"
    environment:
      <<: *common-variables
      PORT: "3000"
      NEXT_PUBLIC_API_URL: "http://api-member:4000"
    depends_on:
      api-member:
        condition: service_healthy
    healthcheck:
      <<: *default-healthcheck
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
    volumes:
      - .:/workspace:delegated
      - node_modules:/workspace/node_modules
      - ./apps/web-member/.next:/workspace/apps/web-member/.next
    profiles:
      - frontend
      - full

  # ========================================
  # Admin Frontend
  # ========================================
  web-admin:
    <<: *base-service
    command: pnpm --filter web-admin dev
    ports:
      - "3001:3001"
    environment:
      <<: *common-variables
      PORT: "3001"
      NEXT_PUBLIC_API_URL: "http://api-admin:4001"
    depends_on:
      api-admin:
        condition: service_healthy
    healthcheck:
      <<: *default-healthcheck
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
    volumes:
      - .:/workspace:delegated
      - node_modules:/workspace/node_modules
      - ./apps/web-admin/.next:/workspace/apps/web-admin/.next
    profiles:
      - frontend
      - full

  # ========================================
  # Member API
  # ========================================
  api-member:
    <<: *base-service
    command: pnpm --filter api-member dev
    ports:
      - "4000:4000"
    environment:
      <<: *common-variables
      PORT: "4000"
      DATABASE_URL: "http://dynamodb-local:8000"
      JWT_SECRET: "${JWT_SECRET:-dev-secret}"
      GOOGLE_CLIENT_ID: "${GOOGLE_CLIENT_ID}"
      GOOGLE_CLIENT_SECRET: "${GOOGLE_CLIENT_SECRET}"
    depends_on:
      dynamodb-local:
        condition: service_healthy
    healthcheck:
      <<: *default-healthcheck
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
    volumes:
      - .:/workspace:delegated
      - node_modules:/workspace/node_modules
    profiles:
      - backend
      - full

  # ========================================
  # Admin API
  # ========================================
  api-admin:
    <<: *base-service
    command: pnpm --filter api-admin dev
    ports:
      - "4001:4001"
    environment:
      <<: *common-variables
      PORT: "4001"
      DATABASE_URL: "http://dynamodb-local:8000"
      JWT_SECRET: "${JWT_SECRET:-dev-secret}"
      GOOGLE_CLIENT_ID: "${GOOGLE_CLIENT_ID}"
      GOOGLE_CLIENT_SECRET: "${GOOGLE_CLIENT_SECRET}"
    depends_on:
      dynamodb-local:
        condition: service_healthy
    healthcheck:
      <<: *default-healthcheck
      test: ["CMD", "curl", "-f", "http://localhost:4001/health"]
    volumes:
      - .:/workspace:delegated
      - node_modules:/workspace/node_modules
    profiles:
      - backend
      - full

  # ========================================
  # DynamoDB Local
  # ========================================
  dynamodb-local:
    image: amazon/dynamodb-local:2.5.3
    command: ["-jar", "DynamoDBLocal.jar", "-sharedDb", "-inMemory"]
    ports:
      - "8000:8000"
    healthcheck:
      <<: *default-healthcheck
      test: ["CMD-SHELL", "curl -f http://localhost:8000 || exit 1"]
    networks:
      - app-network
    profiles:
      - backend
      - full
      - db

  # ========================================
  # DynamoDB Admin UI (Development Only)
  # ========================================
  dynamodb-admin:
    image: aaronshaf/dynamodb-admin:4.6.1
    environment:
      DYNAMO_ENDPOINT: "http://dynamodb-local:8000"
      AWS_REGION: "local"
      AWS_ACCESS_KEY_ID: "local"
      AWS_SECRET_ACCESS_KEY: "local"
    ports:
      - "8001:8001"
    depends_on:
      dynamodb-local:
        condition: service_started
    networks:
      - app-network
    profiles:
      - backend
      - full
      - db
      - tools
````

## Profile Strategy

### Profile定義と使用方法

```yaml
# プロファイル定義
profiles:
  - frontend # フロントエンド開発 (web-member, web-admin)
  - backend # バックエンド開発 (api-member, api-admin, dynamodb)
  - full # フルスタック開発 (全サービス)
  - db # データベースのみ
  - tools # 開発ツール (dynamodb-admin等)
  - async # 非同期処理 (オプション機能)
  - scheduled # スケジュールタスク (オプション機能)
```

### 使用例

```bash
# フロントエンド開発のみ
docker compose --profile frontend up

# バックエンド開発のみ
docker compose --profile backend up

# フルスタック開発
docker compose --profile full up

# データベースと管理ツールのみ
docker compose --profile db --profile tools up
```

## Optional Services

### 非同期Job処理 (Profile: async)

```yaml
  # ========================================
  # LocalStack (AWS Services Mock)
  # ========================================
  localstack:
    image: localstack/localstack:3.7.2
    environment:
      SERVICES: "sqs,s3,dynamodb"
      DEBUG: "1"
      DATA_DIR: "/tmp/localstack/data"
      DOCKER_HOST: "unix:///var/run/docker.sock"
    ports:
      - "4566:4566"
      - "4571:4571"
    volumes:
      - localstack-data:/tmp/localstack
      - /var/run/docker.sock:/var/run/docker.sock
    healthcheck:
      <<: *default-healthcheck
      test: ["CMD", "awslocal", "sqs", "list-queues"]
    networks:
      - app-network
    profiles:
      - async
      - full-optional

  # ========================================
  # Async Job Worker
  # ========================================
  job-worker:
    <<: *base-service
    command: pnpm --filter job-worker dev
    environment:
      <<: *common-variables
      SQS_ENDPOINT: "http://localstack:4566"
      AWS_REGION: "us-east-1"
      AWS_ACCESS_KEY_ID: "test"
      AWS_SECRET_ACCESS_KEY: "test"
    depends_on:
      localstack:
        condition: service_healthy
      dynamodb-local:
        condition: service_healthy
    volumes:
      - .:/workspace:delegated
      - node_modules:/workspace/node_modules
    profiles:
      - async
      - full-optional

  # ========================================
  # Schedule Runner
  # ========================================
  scheduler:
    <<: *base-service
    command: pnpm --filter scheduler dev
    environment:
      <<: *common-variables
      DATABASE_URL: "http://dynamodb-local:8000"
      CRON_SCHEDULE: "*/5 * * * *"
    depends_on:
      dynamodb-local:
        condition: service_healthy
    volumes:
      - .:/workspace:delegated
      - node_modules:/workspace/node_modules
    profiles:
      - scheduled
      - full-optional
```

## Development Tools Integration

### 開発支援ツール

```yaml
  # ========================================
  # Redis (キャッシュ/セッション)
  # ========================================
  redis:
    image: redis:7.4-alpine
    command: ["redis-server", "--appendonly", "yes"]
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      <<: *default-healthcheck
      test: ["CMD", "redis-cli", "ping"]
    networks:
      - app-network
    profiles:
      - cache
      - tools

  # ========================================
  # MailHog (メール開発)
  # ========================================
  mailhog:
    image: mailhog/mailhog:v1.0.1
    ports:
      - "1025:1025" # SMTP
      - "8025:8025" # Web UI
    networks:
      - app-network
    profiles:
      - mail
      - tools

  # ========================================
  # Swagger UI
  # ========================================
  swagger-ui:
    image: swaggerapi/swagger-ui:v5.17.14
    environment:
      SWAGGER_JSON_URL: "http://api-member:4000/api-docs/openapi.json"
      BASE_URL: "/swagger"
    ports:
      - "8080:8080"
    depends_on:
      api-member:
        condition: service_started
    networks:
      - app-network
    profiles:
      - docs
      - tools
```

## Volume Management

### ボリューム戦略

```yaml
volumes:
  # Node.js dependencies
  node_modules:
    driver: local

  # pnpm store cache
  pnpm-store:
    driver: local

  # DynamoDB data persistence
  dynamodb-data:
    driver: local

  # LocalStack data
  localstack-data:
    driver: local

  # Redis persistence
  redis-data:
    driver: local
```

### ボリュームマウント最適化

```yaml
# Docker Compose V2での推奨マウント設定
web-member:
  volumes:
    # Source code with delegated for better performance
    - type: bind
      source: .
      target: /workspace
      consistency: delegated

    # Named volume for node_modules (performance)
    - type: volume
      source: node_modules
      target: /workspace/node_modules

    # Build output cache
    - type: bind
      source: ./apps/web-member/.next
      target: /workspace/apps/web-member/.next
      consistency: delegated
```

### パフォーマンス最適化のための設定

```yaml
# macOS向け最適化
api-member:
  volumes:
    - .:/workspace:delegated # 読み取り優先
    - node_modules:/workspace/node_modules # ホストと分離
    - ./.pnpm-store:/workspace/.pnpm-store:cached # キャッシュ優先
```

## Network Configuration

### ネットワーク設計

```yaml
networks:
  # アプリケーションネットワーク
  app-network:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.28.0.0/16

  # 外部サービス接続用
  external-network:
    external: true
    name: ${EXTERNAL_NETWORK:-bridge}
```

### サービス間通信

```yaml
web-member:
  environment:
    # 内部ネットワークでの通信
    NEXT_PUBLIC_API_URL: http://api-member:4000
  networks:
    - app-network

api-member:
  environment:
    # サービス名での接続
    DATABASE_URL: http://dynamodb-local:8000
    REDIS_URL: redis://redis:6379
  networks:
    - app-network
```

## Environment Configuration

### 環境変数管理

```bash
# .env.example
PROJECT_NAME=my-app
NODE_ENV=development

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# JWT
JWT_SECRET=your-jwt-secret

# AWS (LocalStack)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

### 環境別Override

```yaml
# compose.override.yml (ローカル開発用)
services:
  web-member:
    volumes:
      - type: bind
        source: ./apps/web-member/src
        target: /workspace/apps/web-member/src
        consistency: delegated
    environment:
      DEBUG: "true"
      HOT_RELOAD: "true"

# compose.ci.yml (CI環境用)
services:
  workspace:
    image: ${CI_REGISTRY}/${PROJECT_NAME}-workspace:${CI_COMMIT_SHA}
    pull_policy: always
    environment:
      CI: "true"
      NODE_ENV: "test"
```

## Health Checks and Dependencies

### 依存関係の管理

```yaml
api-member:
  depends_on:
    dynamodb-local:
      condition: service_healthy
    redis:
      condition: service_started
  healthcheck:
    test: ['CMD', 'node', 'scripts/healthcheck.js']
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

### 起動順序制御

```yaml
# Startup order with health checks
dynamodb-local (healthy)
└→ api-member (healthy)
└→ web-member (ready)

localstack (healthy)
└→ job-worker (ready)
```

## Performance Optimization

### ビルドキャッシュ活用 (BuildKit)

```yaml
# Docker Compose V2 + BuildKit
workspace:
  build:
    context: .
    dockerfile: docker/dev.Dockerfile
    args:
      NODE_VERSION: '22'
    cache_from:
      - type=registry,ref=${REGISTRY}/cache:buildkit
    cache_to:
      - type=registry,ref=${REGISTRY}/cache:buildkit,mode=max
    target: development
```

### 高度なキャッシュ設定

```yaml
# compose.override.yml
x-build-cache: &build-cache
  cache_from:
    - type=local,src=/tmp/.buildx-cache
    - type=registry,ref=${REGISTRY}/cache
  cache_to:
    - type=local,dest=/tmp/.buildx-cache-new,mode=max
    - type=registry,ref=${REGISTRY}/cache,mode=max

services:
  app:
    build:
      <<: *build-cache
      platforms:
        - linux/amd64
        - linux/arm64
```

### リソース制限

```yaml
web-member:
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 2G
        pids: 1000
      reservations:
        cpus: '0.5'
        memory: 512M
  # 開発環境向けの追加設定
  ulimits:
    nofile:
      soft: 65536
      hard: 65536
```

## Development Workflow

### 基本的な使用方法

```bash
# 1. 環境変数設定
cp .env.example .env

# 2. フルスタック起動
docker compose --profile full up

# 3. ログ確認
docker compose logs -f web-member

# 4. サービス再起動
docker compose restart api-member

# 5. 完全クリーンアップ
docker compose down -v --remove-orphans
```

### デバッグモード

```yaml
api-member:
  command: ['pnpm', '--filter', 'api-member', 'dev:debug']
  environment:
    NODE_OPTIONS: '--inspect=0.0.0.0:9229'
    DEBUG: '*'
  ports:
    - '4000:4000'
    - '9229:9229' # Debug port
  stdin_open: true # docker run -i
  tty: true # docker run -t
```

## Troubleshooting

### よくある問題と解決策

1. **ポート競合**

```bash
# 使用中のポート確認
docker compose ps
lsof -i :3000
```

2. **ボリューム権限**

```yaml
workspace:
  user: '${UID:-1000}:${GID:-1000}'
```

3. **メモリ不足**

```bash
# Docker Desktop設定でメモリ増加
# または compose.yml でリソース制限
```

## CI/CD Integration

### GitHub Actions統合

```yaml
# .github/workflows/docker-compose-test.yml
- name: Start services
  run: |
    docker compose --profile backend up -d
    docker compose wait dynamodb-local api-member

- name: Run tests
  run: |
    docker compose exec -T workspace pnpm test

- name: Stop services
  if: always()
  run: |
    docker compose down -v
```

## Complete Docker Compose V2 Example

### 完全なcompose.yml例

```yaml
# compose.yml - Docker Compose V2準拠
# versionフィールドなし（V2では非推奨）

# 再利用可能な設定定義
x-common-variables: &common-variables
  NODE_ENV: development
  LOG_LEVEL: debug
  TZ: Asia/Tokyo

x-healthcheck: &default-healthcheck
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s

x-base-service: &base-service
  build:
    context: .
    dockerfile: docker/dev.Dockerfile
    args:
      NODE_VERSION: '22'
    cache_from:
      - type=local,src=/tmp/.buildx-cache
    cache_to:
      - type=local,dest=/tmp/.buildx-cache,mode=max
  image: ${PROJECT_NAME:-app}-workspace:dev
  env_file:
    - path: .env
      required: false
  networks:
    - app-network
  restart: unless-stopped

# サービス定義
services:
  # Member Frontend
  web-member:
    <<: *base-service
    command: ['pnpm', '--filter', 'web-member', 'dev']
    ports:
      - target: 3000
        published: 3000
        protocol: tcp
        mode: host
    environment:
      <<: *common-variables
      PORT: '3000'
      NEXT_PUBLIC_API_URL: 'http://api-member:4000'
    depends_on:
      api-member:
        condition: service_healthy
    healthcheck:
      <<: *default-healthcheck
      test: ['CMD', 'wget', '--spider', '-q', 'http://localhost:3000/api/health']
    volumes:
      - type: bind
        source: .
        target: /workspace
        consistency: delegated
      - type: volume
        source: node_modules
        target: /workspace/node_modules
    profiles:
      - frontend
      - full

  # DynamoDB Local
  dynamodb-local:
    image: amazon/dynamodb-local:2.5.3
    command: ['-jar', 'DynamoDBLocal.jar', '-sharedDb', '-inMemory']
    ports:
      - '8000:8000'
    healthcheck:
      <<: *default-healthcheck
      test: ['CMD-SHELL', 'curl -f http://localhost:8000 || exit 1']
    networks:
      - app-network
    profiles:
      - backend
      - full
      - db

# ネットワーク定義
networks:
  app-network:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.name: br-${PROJECT_NAME:-app}

# ボリューム定義
volumes:
  node_modules:
  pnpm-store:
  dynamodb-data:
```

## Docker Compose V2 Migration Checklist

### 移行チェックリスト

- [x] `version`フィールドを削除
- [x] `extends`の代わりにYAML anchorsを使用
- [x] 環境変数をマップ形式に統一
- [x] `container_name`は開発環境では省略
- [x] イメージに具体的なバージョンタグを指定
- [x] BuildKit機能を活用（cache_from/cache_to）
- [x] ボリュームマウントに新しい形式を使用
- [x] `env_file`に`required`オプションを追加
- [x] ポートマッピングに詳細な形式を使用
- [x] ネットワークにカスタムオプションを追加

## Security Integration

### セキュリティ設定の統合

```yaml
# compose.yml - セキュリティ強化版

x-security-opts: &security-opts
  security_opt:
    - no-new-privileges:true
    - apparmor:docker-default
  cap_drop:
    - ALL
  cap_add:
    - CHOWN
    - SETUID
    - SETGID
  read_only: false  # 開発環境では書き込み可能

x-secure-service: &secure-service
  <<: *base-service
  <<: *security-opts
  user: "${UID:-1000}:${GID:-1000}"
  secrets:
    - source: jwt_secret
      target: jwt_secret
      mode: 0400
  environment:
    JWT_SECRET_FILE: /run/secrets/jwt_secret

services:
  web-member:
    <<: *secure-service
    command: ["pnpm", "--filter", "web-member", "dev"]
    # 開発環境向けの一時的な権限緩和
    cap_add:
      - CHOWN
      - SETUID
      - SETGID
      - DAC_OVERRIDE  # ファイル編集用
    volumes:
      # tmpfsでの一時ディレクトリ
      - type: tmpfs
        target: /tmp
        tmpfs:
          size: 100M

  api-member:
    <<: *secure-service
    environment:
      <<: *common-variables
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      GOOGLE_CLIENT_SECRET_FILE: /run/secrets/google_client_secret
    secrets:
      - jwt_secret
      - google_client_secret

# シークレット定義
secrets:
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  google_client_secret:
    file: ./secrets/google_client_secret.txt
```

### 本番環境向けセキュリティ Override

```yaml
# compose.prod.yml - 本番環境セキュリティ設定

x-prod-security: &prod-security
  security_opt:
    - no-new-privileges:true
    - seccomp:seccomp-profile.json
  cap_drop:
    - ALL
  read_only: true
  user: '1001:1001' # 非rootユーザー
  logging:
    driver: 'json-file'
    options:
      max-size: '10m'
      max-file: '3'
      labels: 'service,environment'

services:
  web-member:
    <<: *prod-security
    volumes:
      # 読み取り専用マウント
      - type: bind
        source: ./apps/web-member/.next
        target: /app/.next
        read_only: true
      # 書き込み可能な領域を限定
      - type: tmpfs
        target: /tmp
      - type: tmpfs
        target: /app/logs
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
          pids: 1000
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Error Handling and Recovery

### ヘルスチェックとエラーハンドリング

```yaml
# compose.yml - エラーハンドリング強化版

x-enhanced-healthcheck: &enhanced-healthcheck
  healthcheck:
    test: ["CMD", "/scripts/healthcheck.sh"]
    interval: 30s
    timeout: 10s
    retries: 5
    start_period: 60s

services:
  api-member:
    <<: *base-service
    <<: *enhanced-healthcheck
    restart: on-failure:5
    restart_delay: 10s
    stop_grace_period: 30s
    volumes:
      - ./scripts/healthcheck.sh:/scripts/healthcheck.sh:ro
    labels:
      - "com.example.restart-policy=on-failure"
      - "com.example.max-retries=5"
```

### ヘルスチェックスクリプト

```bash
#!/bin/bash
# scripts/healthcheck.sh

set -e

# APIエンドポイントのチェック
response=$(curl -f -s -o /dev/null -w "%{http_code}" http://localhost:${PORT}/health)

if [ "$response" != "200" ]; then
  echo "Health check failed: HTTP $response"
  exit 1
fi

# データベース接続チェック
if ! node -e "
  const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
  const client = new DynamoDBClient({ endpoint: process.env.DATABASE_URL });
  client.send(new ListTablesCommand({}))
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
"; then
  echo "Database connection check failed"
  exit 1
fi

# メモリ使用量チェック
memory_usage=$(ps aux | grep node | awk '{print $4}' | head -1)
if (( $(echo "$memory_usage > 80.0" | bc -l) )); then
  echo "Memory usage too high: $memory_usage%"
  exit 1
fi

echo "Health check passed"
exit 0
```

### 自動リカバリー設定

```yaml
# compose.yml - 自動リカバリー機能

services:
  # サービス監視とリカバリー
  service-monitor:
    image: willfarrell/autoheal:1.2.0
    environment:
      AUTOHEAL_CONTAINER_LABEL: 'autoheal=true'
      AUTOHEAL_INTERVAL: 60
      AUTOHEAL_START_PERIOD: 300
      AUTOHEAL_DEFAULT_STOP_TIMEOUT: 30
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: always
    profiles:
      - monitoring

  web-member:
    labels:
      - 'autoheal=true'
      - 'autoheal.stop.timeout=30'
    restart: unless-stopped
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
      window: 120s
```

### エラーログ収集

```yaml
# compose.yml - ログ収集設定

x-logging: &default-logging
  logging:
    driver: 'fluentd'
    options:
      fluentd-address: 'localhost:24224'
      tag: 'docker.{{.Name}}'
      fluentd-async: 'true'
      fluentd-buffer-limit: '1MB'

services:
  # Fluentd ログコレクター
  fluentd:
    image: fluent/fluentd:v1.16-debian
    volumes:
      - ./fluent.conf:/fluentd/etc/fluent.conf:ro
      - logs-data:/fluentd/log
    ports:
      - '24224:24224'
      - '24224:24224/udp'
    profiles:
      - logging
      - monitoring

  api-member:
    <<: *default-logging
    environment:
      LOG_FORMAT: 'json'
      ERROR_TRACKING: 'true'
```

## Network Security Configuration

### ネットワーク分離とファイアウォール

```yaml
# compose.yml - ネットワークセキュリティ

networks:
  # DMZ - 外部アクセス可能
  dmz:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.enable_icc: "true"
      com.docker.network.bridge.enable_ip_masquerade: "true"
    ipam:
      config:
        - subnet: 172.20.0.0/16

  # Internal - 内部通信のみ
  internal:
    driver: bridge
    internal: true
    driver_opts:
      com.docker.network.bridge.enable_icc: "true"
    ipam:
      config:
        - subnet: 172.21.0.0/16

  # Data - データベース専用
  data:
    driver: bridge
    internal: true
    driver_opts:
      com.docker.network.bridge.enable_icc: "false"
    ipam:
      config:
        - subnet: 172.22.0.0/16

services:
  # リバースプロキシ (DMZのみ)
  nginx:
    image: nginx:1.27-alpine
    networks:
      - dmz
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    <<: *prod-security

  # Webアプリ (DMZ + Internal)
  web-member:
    networks:
      - dmz
      - internal
    expose:
      - "3000"
    # ポート公開なし（nginxプロキシ経由）

  # API (Internal + Data)
  api-member:
    networks:
      - internal
      - data
    expose:
      - "4000"
    # 外部アクセス不可

  # Database (Data only)
  dynamodb-local:
    networks:
      - data
    # 内部ネットワークのみ
```

## Secrets Management Integration

### Docker Secrets with AWS Secrets Manager

```yaml
# compose.yml - AWS Secrets Manager統合

services:
  # Secrets同期サービス
  secrets-sync:
    image: segment/chamber:v2.13
    environment:
      AWS_REGION: ${AWS_REGION}
      CHAMBER_KMS_KEY_ALIAS: alias/parameter_store_key
    command: |
      sh -c '
        chamber export ${PROJECT_NAME}-${ENVIRONMENT} -f dotenv > /secrets/.env
        chamber exec ${PROJECT_NAME}-${ENVIRONMENT} -- env > /secrets/env.list
      '
    volumes:
      - secrets:/secrets
    profiles:
      - production

  api-member:
    depends_on:
      secrets-sync:
        condition: service_completed_successfully
    volumes:
      - secrets:/run/secrets:ro
    env_file:
      - /run/secrets/.env
```

## Monitoring and Observability

### メトリクスとトレーシング

```yaml
# compose.yml - 監視スタック

services:
  # Prometheus
  prometheus:
    image: prom/prometheus:v2.53.0
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - '9090:9090'
    networks:
      - monitoring
    profiles:
      - monitoring

  # Grafana
  grafana:
    image: grafana/grafana:11.1.0
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
      GF_INSTALL_PLUGINS: grafana-clock-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
    ports:
      - '3000:3000'
    networks:
      - monitoring
    profiles:
      - monitoring

  # Node Exporter
  node-exporter:
    image: prom/node-exporter:v1.8.1
    pid: host
    network_mode: host
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    profiles:
      - monitoring
```

## Summary

このセキュリティ強化されたDocker Compose V2準拠の設計により：

1. **最新のベストプラクティス**: Docker Compose V2の全機能を活用
2. **柔軟な開発環境**: Profileによる選択的サービス起動
3. **パフォーマンス最適化**: BuildKitキャッシュとボリューム最適化
4. **保守性の向上**: YAML anchorsによる設定の再利用
5. **包括的なセキュリティ**: 多層防御とゼロトラストアーキテクチャ
6. **エラーハンドリング**: 自動リカバリーと包括的なモニタリング
7. **ネットワーク分離**: DMZ、内部、データ層の完全分離
8. **シークレット管理**: Docker SecretsとAWS Secrets Manager統合

開発者は安全で堅牢な開発環境を、自身のニーズに応じて即座に構築できます。
