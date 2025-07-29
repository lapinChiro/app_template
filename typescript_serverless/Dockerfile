# Base stage with minimal dependencies
FROM node:22-bookworm-slim AS base
RUN --mount=type=cache,target=/var/cache/apt \
    apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Dependencies stage - install all node_modules
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json packages/*/
COPY apps/*/package.json apps/*/
RUN corepack enable && \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Development stage - for local development with hot reload
FROM base AS development
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages ./packages
COPY --from=dependencies /app/apps ./apps
COPY . .
USER node
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["pnpm", "dev"]

# Build stage - compile TypeScript
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

# Production stage - minimal runtime
FROM base AS production
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/packages/*/dist ./packages/*/dist
COPY --from=build /app/apps/*/dist ./apps/*/dist
USER nodejs
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]