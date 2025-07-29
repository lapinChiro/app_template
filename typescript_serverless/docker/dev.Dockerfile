# Development Dockerfile with BuildKit support
FROM node:22-bookworm-slim AS base

# Install dependencies with cache mount
RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install pnpm
RUN corepack enable

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json packages/*/
COPY apps/*/package.json apps/*/

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Development stage
USER node
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["pnpm", "dev"]