# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo project for a project management application with the following structure:

- **Frontend**: Vue 3 + TypeScript + Vite application
- **Backend**: Hono + Node.js TypeScript API server
- **Infrastructure**: Docker Compose setup with PostgreSQL for development

## Development Commands

### Frontend (apps/frontend/)

```bash
npm install          # Install dependencies
npm run dev          # Start development server (port 5173)
npm run build        # Build for production (type-check + build-only)
npm run build-only   # Build only without type checking
npm run type-check   # Run TypeScript type checking with vue-tsc
npm run lint         # Run oxlint and eslint sequentially with fixes
npm run preview      # Preview production build
```

### Backend (apps/backend/)

```bash
npm install          # Install dependencies  
npm run dev          # Start development server with tsx watch (port 3000)
npm run build        # Compile TypeScript to JavaScript
npm run start        # Run production build (node dist/index.js)
```

### Docker Environment

See `docker/README.md` for detailed Docker setup and usage instructions.

```bash
# Start development environment with Docker
docker compose -f docker/compose.development.yml up -d

# Stop development environment
docker compose -f docker/compose.development.yml down

# View logs
docker compose -f docker/compose.development.yml logs -f
```

**Services:**
- Frontend: `promana_frontend` (Port 5173)
- Backend: `promana_backend` (Port 3000) - HMR enabled with tsx watch
- PostgreSQL: `promana_postgres` (Port 5435)

## Quality Assurance

### Quality Standards

This project maintains the following quality standards:

1. **Zero type errors**: Maintain 0 TypeScript errors at all times
2. **Build success**: All builds must succeed without errors
3. **No `any` types**: Avoid using `any` type - use proper typing instead
4. **No non-null assertions**: Avoid using `!` operator - use proper null checks

### Quality Commands

#### Frontend Quality Checks (apps/frontend/)

```bash
# Required checks (CI/CD pipeline)
npm run type-check     # Zero type errors guarantee
npm run build          # Build success guarantee (includes type-check)

# Quality improvement checks  
npm run lint           # Oxlint + ESLint checking with auto-fix
npm run build-only     # Build without type checking
```

#### Backend Quality Checks (apps/backend/)

```bash
# Required checks (CI/CD pipeline)
npm run build          # TypeScript compilation success
npm run start          # Production build verification

# Note: Linting and testing to be implemented
```

#### Root Level Commands

```bash
# Note: Root level quality commands to be implemented
# Current approach: Run quality checks in each workspace individually

# Frontend checks
cd apps/frontend && npm run type-check && npm run build

# Backend checks  
cd apps/backend && npm run build
```

## Architecture

### Tech Stack

- **Frontend**: Vue 3 with Vue Router, TypeScript, Vite (rolldown-vite), ESLint + Oxlint
- **Backend**: Hono framework on Node.js with TypeScript, tsx for development
- **Database**: PostgreSQL with Kysely query builder for type-safe database operations
- **Development**: Docker Compose with HMR support (PostgreSQL + Backend + Frontend)
- **Production**: AWS Serverless (CloudFront + S3 + API Gateway + Lambda + RDS PostgreSQL)

### Monorepo Structure

The project uses npm workspaces with the following workspace directories:

- `apps/*` - Application code (frontend and backend)
- `packages/*` - Shared packages (currently empty)
- `infra` - Infrastructure code (currently empty)

### Frontend Structure

- Entry point: `src/main.ts`
- Router configuration: `src/router/index.ts`
- Main component: `src/App.vue`
- Views: `src/views/` (HomeView, AboutView)
- Components: `src/components/` (HelloWorld, TheWelcome, WelcomeItem, icons)

### Backend Structure

- Entry point: `src/index.ts` - Hono server with PostgreSQL integration
- Application: `src/app.ts` - Main Hono application with API endpoints
- Database layer: `src/db/` - Kysely-based type-safe database operations
  - `src/db/connection.ts` - PostgreSQL connection with Kysely
  - `src/db/types.ts` - Database schema type definitions
- API endpoints:
  - `/health` - Health check endpoint
  - `/api/db-test` - Database integration testing endpoint
- Configured for ES modules (`"type": "module"`)
- Uses tsx for development with HMR (Hot Module Replacement)

## Development Philosophy

### AI-Driven Development

This project leverages Claude Code for comprehensive code generation and maintenance. All implementation follows AI-assisted development patterns with emphasis on:

- Automated code generation with human oversight
- Consistent coding standards across frontend and backend
- Type-safe implementations throughout the monorepo

### Core Principles

#### UNIX Philosophy

Write programs that do one thing and do it well. Write programs to work together. Choose portability over efficiency, clarity over cleverness.

- **Frontend**: Single-responsibility components with clear interfaces
- **Backend**: Focused API endpoints with minimal coupling
- **Monorepo**: Independent apps that communicate through well-defined contracts

#### Don't Reinvent the Wheel

Leverage existing, proven solutions before implementing custom alternatives. Research available libraries, frameworks, and tools first.

- Prefer established Vue 3 ecosystem solutions
- Use proven Hono middleware and plugins
- Leverage existing TypeScript patterns and utilities

#### Orthogonality Principle

Design independent, loosely coupled components where changes to one component have minimal impact on others. Maintain clear separation of concerns and avoid unexpected interdependencies.

- **Frontend/Backend Separation**: Clear API boundaries
- **Component Independence**: Minimal cross-dependencies
- **Service Layer Isolation**: Business logic separated from presentation

#### Type-Driven Development

Apply TDD principles to static type checking:

1. **Incremental Type Checking**: Check types as you develop
2. **Early Error Detection**: Catch type errors during development
3. **Progressive Integration**: Maintain type safety across app boundaries

#### DRY (Don't Repeat Yourself)

Each piece of knowledge must have a single, unambiguous, authoritative representation within the system.

- Shared types between frontend and backend
- Reusable components and utilities
- Common configuration patterns

#### KISS (Keep It Simple, Stupid)

Choose the simplest solution that fully addresses the problem. Avoid over-engineering.

- Simple component hierarchies
- Straightforward API design
- Clear data flow patterns

#### SOLID Principles

- **S**ingle Responsibility: One class/component, one responsibility
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subtypes substitutable for base types
- **I**nterface Segregation: Many specific interfaces over one general
- **D**ependency Inversion: Depend on abstractions, not concretions

#### Test-Driven Development

Follow the RED-GREEN-BLUE cycle for all development:

1. **RED**: Write failing test first
2. **GREEN**: Write minimal code to pass
3. **BLUE**: Refactor while keeping tests green

Apply TDD across both frontend and backend components with appropriate testing strategies for each layer.
