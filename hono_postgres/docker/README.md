# Docker Environment

This project uses Docker for the development environment. Production deployment uses AWS serverless architecture (CloudFront + S3 + API Gateway + Lambda + DynamoDB).

## Quick Start

### Development Environment (with HMR)

```bash
# From docker/ directory
docker compose -f compose.development.yml up -d
docker compose -f compose.development.yml down

# From project root
docker compose -f docker/compose.development.yml up -d
```

## Architecture

### Development Services

- **Frontend** (`promana_frontend`): Port 5173
  - Vue.js with Vite dev server
  - Hot Module Replacement (HMR) enabled
  - Volume mounted for live code updates
  
- **Backend** (`promana_backend`): Port 3000
  - Hono with tsx watch
  - Hot Module Replacement (HMR) enabled
  - Volume mounted for live code updates
  
- **DynamoDB Local** (`promana_dynamodb`): Port 8000
  - Local DynamoDB for development
  - Data persisted in `local-data/dynamodb/`

### Dockerfiles

Both `Dockerfile.frontend` and `Dockerfile.backend` are optimized for development with HMR support and minimal setup.

### Environment Variables

#### Backend

- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default: 3000)
- `SERVER_TIMEOUT`: Server timeout in milliseconds
- `DYNAMODB_ENDPOINT`: DynamoDB endpoint URL
- `AWS_REGION`: AWS region (default: ap-northeast-1)
- `AWS_ACCESS_KEY_ID`: AWS access key (dummy for local)
- `AWS_SECRET_ACCESS_KEY`: AWS secret key (dummy for local)

#### Frontend

- `VITE_API_BASE_URL`: Backend API base URL
- `VITE_APP_VERSION`: Application version
- `VITE_ENVIRONMENT`: Environment name
- `VITE_ENABLE_DEBUG`: Debug mode flag
- `VITE_API_TIMEOUT`: API timeout in milliseconds

## Common Commands

### Rebuild Images

```bash
docker compose -f compose.development.yml up -d --build
```

### View Logs

```bash
# All services
docker compose -f compose.development.yml logs -f

# Specific service
docker compose -f compose.development.yml logs -f backend
```

### Execute Commands in Container

```bash
# Access backend container shell
docker exec -it promana_backend sh

# Run npm commands in frontend container
docker exec promana_frontend npm run lint
```

### Clean Up

```bash
# Remove containers and networks
docker compose -f compose.development.yml down

# Remove containers, networks, and volumes
docker compose -f compose.development.yml down -v

# Remove all unused images
docker image prune -a
```
