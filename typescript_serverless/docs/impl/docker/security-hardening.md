# Docker Security Hardening

## Overview

Dockerコンテナのセキュリティ強化は、アプリケーションの脆弱性を最小化し、攻撃対象領域を削減する重要な取り組みです。本ドキュメントでは、開発から本番環境まで一貫したセキュリティ対策を実装します。

## Security Principles

### Defense in Depth (多層防御)

```
┌─────────────────────────────────────┐
│     Image Scanning & Validation     │
├─────────────────────────────────────┤
│    Non-root User & Capabilities    │
├─────────────────────────────────────┤
│     Read-only Filesystem           │
├─────────────────────────────────────┤
│    Network Policies & Isolation    │
├─────────────────────────────────────┤
│     Secrets Management             │
└─────────────────────────────────────┘
```

## Base Image Security

### 公式イメージの使用とバージョン固定

```dockerfile
# ❌ 悪い例：タグなしまたはlatestタグ
FROM node
FROM node:latest

# ✅ 良い例：具体的なバージョンとディストリビューション
FROM node:22.11.0-bookworm@sha256:abc123...

# ✅ より良い例：ハッシュ値による完全な固定
FROM node:22-bookworm@sha256:1234567890abcdef...
```

### 最小限のベースイメージ

```dockerfile
# Development: フル機能のイメージ
FROM node:22-bookworm AS development

# Production: 最小限のイメージ
FROM node:22-bookworm-slim AS production

# Alternative: Distroless (最高のセキュリティ)
FROM gcr.io/distroless/nodejs22-debian12 AS ultra-secure
```

## User and Permission Management

### 非rootユーザーの作成と使用

```dockerfile
# Create a dedicated user and group
RUN groupadd -r appgroup -g 1001 && \
    useradd -r -g appgroup -u 1001 \
    -d /app -s /sbin/nologin appuser

# Create app directory with correct permissions
RUN mkdir -p /app && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Verify user
RUN whoami # Should output: appuser
```

### ファイルシステム権限の最小化

```dockerfile
# Set strict permissions
COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --only=production

# Make files read-only where possible
COPY --chown=appuser:appgroup . .
RUN chmod -R 444 /app/dist && \
    chmod -R 444 /app/public && \
    chmod 555 /app/node_modules/.bin/*
```

## Capability Management

### Linux Capabilitiesの削除

```dockerfile
# Dockerfile内では指定できないため、実行時に設定
# docker-compose.yml
services:
  app:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # ポート80/443をバインドする場合のみ
    security_opt:
      - no-new-privileges:true
      - seccomp:unconfined
```

### Seccompプロファイル

```json
// seccomp-profile.json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": [
        "read",
        "write",
        "open",
        "close",
        "stat",
        "fstat",
        "lstat",
        "poll",
        "ppoll",
        "select",
        "mmap",
        "mprotect",
        "munmap",
        "brk",
        "rt_sigaction",
        "rt_sigprocmask",
        "ioctl",
        "nanosleep",
        "clock_gettime"
      ],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
```

## Secrets Management

### ビルド時のシークレット

```dockerfile
# BuildKitのsecret mount使用
# syntax=docker/dockerfile:1
FROM node:22-bookworm AS builder

# NPM tokenを安全に使用
RUN --mount=type=secret,id=npm_token \
    NPM_TOKEN=$(cat /run/secrets/npm_token) \
    npm config set //registry.npmjs.org/:_authToken $NPM_TOKEN && \
    npm ci --only=production && \
    npm config delete //registry.npmjs.org/:_authToken
```

### 実行時のシークレット

```yaml
# docker-compose.yml
services:
  app:
    secrets:
      - jwt_secret
      - db_password
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      DB_PASSWORD_FILE: /run/secrets/db_password

secrets:
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  db_password:
    external: true
```

### アプリケーション内でのシークレット読み込み

```typescript
// src/config/secrets.ts
import { readFileSync } from 'fs';

export function loadSecret(envVar: string): string {
  const filePath = process.env[`${envVar}_FILE`];

  if (filePath) {
    // Docker secretから読み込み
    return readFileSync(filePath, 'utf8').trim();
  }

  // 通常の環境変数から読み込み（開発環境用）
  const value = process.env[envVar];
  if (!value) {
    throw new Error(`Secret ${envVar} not found`);
  }

  return value;
}

// 使用例
const jwtSecret = loadSecret('JWT_SECRET');
```

## Read-Only Root Filesystem

### 読み取り専用ファイルシステムの実装

```dockerfile
# Dockerfile
FROM node:22-bookworm-slim

# Create writable directories
RUN mkdir -p /tmp /app/logs /app/uploads && \
    chown -R appuser:appgroup /tmp /app/logs /app/uploads

USER appuser

# Application will only write to specific directories
ENV TMPDIR=/tmp
ENV LOG_DIR=/app/logs
ENV UPLOAD_DIR=/app/uploads
```

```yaml
# docker-compose.yml
services:
  app:
    read_only: true
    tmpfs:
      - /tmp
      - /app/logs
    volumes:
      - uploads:/app/uploads
```

## Network Security

### ネットワーク分離

```yaml
# docker-compose.yml
networks:
  frontend:
    driver: bridge
    internal: false

  backend:
    driver: bridge
    internal: true # 外部アクセス禁止

  database:
    driver: bridge
    internal: true

services:
  web:
    networks:
      - frontend
      - backend

  api:
    networks:
      - backend

  db:
    networks:
      - database
```

### ポート露出の最小化

```yaml
services:
  # ❌ 悪い例：全インターフェースに露出
  web:
    ports:
      - "3000:3000"

  # ✅ 良い例：localhostのみに限定
  web:
    ports:
      - "127.0.0.1:3000:3000"

  # ✅ より良い例：内部通信のみ（ポート露出なし）
  api:
    expose:
      - "4000"
    # portsディレクティブなし
```

## Image Scanning and Validation

### Dockerfile Linting

```bash
# Hadolintを使用したDockerfileの検証
# .hadolint.yml
ignored:
  - DL3008  # apt-getでバージョン固定
  - DL3009  # apt-get clean削除

trustedRegistries:
  - docker.io
  - gcr.io
```

```bash
# CI/CDでの実行
hadolint Dockerfile
```

### 脆弱性スキャン

```yaml
# .github/workflows/security.yml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'myapp:${{ github.sha }}'
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'
```

### コンテナイメージの署名

```bash
# Cosignを使用したイメージ署名
cosign sign --key cosign.key myapp:latest

# 署名の検証
cosign verify --key cosign.pub myapp:latest
```

## Runtime Security

### Security Options

```yaml
# docker-compose.yml
services:
  app:
    security_opt:
      - no-new-privileges:true
      - apparmor:docker-default
      - seccomp:seccomp-profile.json
    cap_drop:
      - ALL
    read_only: true
    user: '1001:1001'
```

### Resource Limits

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
          pids: 100
        reservations:
          cpus: '0.5'
          memory: 512M
    ulimits:
      nproc: 65535
      nofile:
        soft: 20000
        hard: 40000
```

## Logging and Monitoring

### セキュリティログ設定

```yaml
services:
  app:
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'
        labels: 'service=app,environment=production'
    environment:
      - LOG_LEVEL=info
      - AUDIT_LOG=true
```

### 監査ログの実装

```typescript
// src/security/audit.ts
export class SecurityAudit {
  static log(event: SecurityEvent): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType: event.type,
      userId: event.userId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      action: event.action,
      resource: event.resource,
      result: event.result,
      metadata: event.metadata,
    };

    // Write to secure audit log
    console.log(JSON.stringify(logEntry));
  }
}
```

## Container Registry Security

### プライベートレジストリの使用

```yaml
# docker-compose.yml
services:
  app:
    image: ${REGISTRY_URL}/myapp:${VERSION}
    pull_policy: always
```

### レジストリ認証

```bash
# CI/CD環境での認証
echo $REGISTRY_PASSWORD | docker login -u $REGISTRY_USER --password-stdin $REGISTRY_URL
```

## Development vs Production Security

### 開発環境の設定

```yaml
# docker-compose.dev.yml
services:
  app:
    user: root # 開発時のみ
    cap_add:
      - SYS_PTRACE # デバッグ用
    environment:
      - NODE_ENV=development
      - DEBUG=true
```

### 本番環境の設定

```yaml
# docker-compose.prod.yml
services:
  app:
    user: '1001:1001'
    cap_drop:
      - ALL
    read_only: true
    security_opt:
      - no-new-privileges:true
    environment:
      - NODE_ENV=production
      - DEBUG=false
```

## Security Checklist

### ビルド時のチェックリスト

- [ ] 公式ベースイメージを使用
- [ ] 特定バージョンにピン留め
- [ ] 非rootユーザーで実行
- [ ] 不要なパッケージを削除
- [ ] シークレットを含めない
- [ ] .dockerignoreを適切に設定
- [ ] マルチステージビルドを使用
- [ ] 最小限の権限を設定

### 実行時のチェックリスト

- [ ] 読み取り専用ルートファイルシステム
- [ ] Capabilitiesを削除
- [ ] リソース制限を設定
- [ ] ネットワークを分離
- [ ] 最小限のポート露出
- [ ] セキュリティスキャンを実行
- [ ] ログと監視を設定
- [ ] シークレット管理を実装

## Incident Response

### セキュリティインシデント対応

```bash
# 1. 影響を受けたコンテナの特定
docker ps --filter "ancestor=vulnerable-image"

# 2. コンテナの隔離
docker network disconnect bridge container-id

# 3. フォレンジック分析
docker diff container-id
docker logs container-id > incident-logs.txt

# 4. コンテナの停止と削除
docker stop container-id
docker rm container-id

# 5. 修正済みイメージのデプロイ
docker pull fixed-image:latest
docker run --security-opt=... fixed-image:latest
```

## Error Handling and Recovery

### コンテナエラーハンドリング

```bash
#!/bin/bash
# scripts/container-error-handler.sh

# エラートラップ設定
trap 'handle_error $? $LINENO' ERR

handle_error() {
    local exit_code=$1
    local line_number=$2
    echo "[ERROR] Command failed with exit code $exit_code at line $line_number"

    # エラー通知
    send_alert "Container error: Exit code $exit_code at line $line_number"

    # グレースフルシャットダウン
    graceful_shutdown

    exit $exit_code
}

graceful_shutdown() {
    echo "[INFO] Starting graceful shutdown..."

    # アプリケーションにSIGTERMシグナル送信
    if [ -f /var/run/app.pid ]; then
        kill -TERM $(cat /var/run/app.pid) 2>/dev/null || true

        # 最大30秒待機
        local count=0
        while [ $count -lt 30 ] && kill -0 $(cat /var/run/app.pid) 2>/dev/null; do
            sleep 1
            count=$((count + 1))
        done

        # 強制終了
        if kill -0 $(cat /var/run/app.pid) 2>/dev/null; then
            kill -KILL $(cat /var/run/app.pid) 2>/dev/null || true
        fi
    fi

    echo "[INFO] Graceful shutdown completed"
}

# シグナルハンドリング
trap graceful_shutdown SIGTERM SIGINT
```

### Node.js アプリケーションエラーハンドリング

```typescript
// src/security/container-health.ts
import { promises as fs } from 'fs';
import * as os from 'os';

export class ContainerHealthMonitor {
  private static readonly MAX_MEMORY_USAGE = 0.8; // 80%
  private static readonly MAX_CPU_USAGE = 0.9; // 90%
  private static readonly HEALTH_CHECK_INTERVAL = 30000; // 30秒

  static async startMonitoring(): Promise<void> {
    setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
        process.exit(1);
      }
    }, this.HEALTH_CHECK_INTERVAL);

    // グレースフルシャットダウン
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));

    // 未処理エラーのキャッチ
    process.on('uncaughtException', error => {
      console.error('Uncaught Exception:', error);
      this.gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('unhandledRejection');
    });
  }

  private static async performHealthCheck(): Promise<void> {
    // メモリ使用量チェック
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const memoryUsageRatio = (memoryUsage.rss + memoryUsage.heapUsed) / totalMemory;

    if (memoryUsageRatio > this.MAX_MEMORY_USAGE) {
      throw new Error(`Memory usage too high: ${(memoryUsageRatio * 100).toFixed(2)}%`);
    }

    // CPU使用量チェック（簡易版）
    const cpuUsage = process.cpuUsage();
    const cpuUsageRatio = (cpuUsage.user + cpuUsage.system) / 1000000 / os.cpus().length;

    if (cpuUsageRatio > this.MAX_CPU_USAGE) {
      throw new Error(`CPU usage too high: ${(cpuUsageRatio * 100).toFixed(2)}%`);
    }

    // ディスク容量チェック
    try {
      const stats = await fs.statfs('/');
      const diskUsageRatio = 1 - stats.bavail / stats.blocks;

      if (diskUsageRatio > 0.9) {
        throw new Error(`Disk usage too high: ${(diskUsageRatio * 100).toFixed(2)}%`);
      }
    } catch (error) {
      console.warn('Failed to check disk usage:', error);
    }
  }

  private static async gracefulShutdown(signal: string): Promise<void> {
    console.log(`[${signal}] Graceful shutdown initiated...`);

    try {
      // 新規リクエストの受付停止
      if (global.server) {
        global.server.close();
      }

      // アクティブな接続を終了
      // データベース接続のクローズ
      // キャッシュのフラッシュ

      // PIDファイルの削除
      await fs.unlink('/var/run/app.pid').catch(() => {});

      console.log('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}
```

### Docker Compose エラーリカバリー設定

```yaml
# docker-compose.yml - エラーリカバリー設定

services:
  app:
    restart: unless-stopped
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
      window: 120s

    # ヘルスチェック設定
    healthcheck:
      test: ['CMD', '/scripts/healthcheck.sh']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

    # リソース制限（OOMキラー対策）
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 512M

    # OOMスコア調整（重要度設定）
    oom_score_adj: -500

    # ログローテーション
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '5'
        compress: 'true'
```

### セキュリティインシデントのエラーハンドリング

```bash
#!/bin/bash
# scripts/security-incident-handler.sh

# セキュリティイベントの検出と対応
handle_security_incident() {
    local incident_type=$1
    local container_id=$2
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    case $incident_type in
        "unauthorized_access")
            echo "[SECURITY] Unauthorized access detected in container $container_id"
            # コンテナの隔離
            docker network disconnect bridge $container_id
            # 証拠保全
            docker diff $container_id > /var/log/incidents/${container_id}_diff_${timestamp}.log
            docker logs $container_id > /var/log/incidents/${container_id}_logs_${timestamp}.log
            ;;

        "privilege_escalation")
            echo "[SECURITY] Privilege escalation attempt in container $container_id"
            # 即座に停止
            docker stop $container_id
            # イメージの隔離
            docker tag $(docker inspect -f '{{.Image}}' $container_id) quarantine/suspicious:${timestamp}
            ;;

        "resource_abuse")
            echo "[SECURITY] Resource abuse detected in container $container_id"
            # リソース制限の適用
            docker update --cpus="0.5" --memory="512m" $container_id
            # アラート送信
            send_alert "Resource abuse in container $container_id"
            ;;
    esac

    # インシデントレポートの生成
    generate_incident_report $incident_type $container_id $timestamp
}

# 自動復旧メカニズム
auto_recovery() {
    local container_name=$1
    local max_retries=3
    local retry_count=0

    while [ $retry_count -lt $max_retries ]; do
        echo "[RECOVERY] Attempting to recover $container_name (attempt $((retry_count + 1))/$max_retries)"

        # コンテナの再起動
        if docker restart $container_name; then
            # ヘルスチェック待機
            sleep 30

            # ヘルスチェック確認
            if docker exec $container_name /scripts/healthcheck.sh; then
                echo "[RECOVERY] Successfully recovered $container_name"
                return 0
            fi
        fi

        retry_count=$((retry_count + 1))
        sleep $((retry_count * 10))
    done

    echo "[RECOVERY] Failed to recover $container_name after $max_retries attempts"
    return 1
}
```

### コンテナ監視とアラート

```yaml
# monitoring/prometheus-rules.yml
groups:
  - name: container_security
    interval: 30s
    rules:
      # 異常なプロセス実行の検出
      - alert: UnauthorizedProcessExecution
        expr: |
          container_process_count{process!~"node|npm|yarn|pnpm"} > 0
        for: 1m
        labels:
          severity: critical
          category: security
        annotations:
          summary: 'Unauthorized process detected in container {{ $labels.container }}'
          description: 'Process {{ $labels.process }} is running in container {{ $labels.container }}'

      # ファイルシステムの改変検出
      - alert: FileSystemModification
        expr: |
          container_fs_changes{path=~"/usr|/bin|/sbin|/lib"} > 0
        for: 1m
        labels:
          severity: critical
          category: security
        annotations:
          summary: 'Critical filesystem modification in {{ $labels.container }}'
          description: 'Detected changes in {{ $labels.path }} within container {{ $labels.container }}'

      # リソース異常使用の検出
      - alert: AbnormalResourceUsage
        expr: |
          (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.9
          or
          rate(container_cpu_usage_seconds_total[5m]) > 0.9
        for: 5m
        labels:
          severity: warning
          category: performance
        annotations:
          summary: 'High resource usage in container {{ $labels.container }}'
          description: 'Container {{ $labels.container }} is using excessive resources'
```

### 障害復旧手順

````markdown
## 障害復旧プレイブック

### 1. コンテナがクラッシュループに陥った場合

1. ログの確認
   ```bash
   docker logs --tail 100 -f <container_name>
   ```
````

2. 最後の正常な状態への復元

   ```bash
   docker run --rm -v <volume_name>:/data alpine \
     sh -c "cd /data && tar -czf /backup.tar.gz ."
   ```

3. デバッグモードでの起動
   ```bash
   docker run -it --entrypoint /bin/sh <image_name>
   ```

### 2. セキュリティ侵害が疑われる場合

1. コンテナの隔離

   ```bash
   docker network disconnect bridge <container_id>
   ```

2. フォレンジック分析

   ```bash
   docker diff <container_id> > container_changes.log
   docker export <container_id> | tar -tv > container_files.log
   ```

3. クリーンな環境での再構築
   ```bash
   docker stop <container_id>
   docker rm <container_id>
   docker rmi <image_id>
   docker build --no-cache -t <image_name> .
   ```

```

## Summary

このセキュリティ強化戦略により：

1. **最小権限の原則**: 必要最小限の権限でコンテナを実行
2. **多層防御**: 複数のセキュリティレイヤーで保護
3. **継続的な検証**: 自動スキャンとモニタリング
4. **インシデント対応**: 迅速な問題解決プロセス
5. **包括的なエラーハンドリング**: 自動復旧とグレースフルシャットダウン
6. **プロアクティブな監視**: 異常検出と早期対応

これらの対策により、開発から本番環境まで一貫したセキュリティを実現し、アプリケーションの安全性と可用性を最大化します。
```
