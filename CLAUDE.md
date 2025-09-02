# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a template repository containing three distinct projects showcasing different architectural patterns and technologies:

1. **hono_postgres** - Full-stack project management app with Vue.js frontend and Hono backend
2. **typescript_serverless** - TypeScript serverless monorepo for Next.js + AWS Lambda + CDK
3. **multi_agent_network** - AI agent network system for autonomous token trading simulation

## Project Selection

When working in this repository, first identify which project the user is referring to:

- `/hono_postgres/` - Modern web application with PostgreSQL
- `/typescript_serverless/` - Serverless architecture with AWS CDK
- `/multi_agent_network/` - AI agent simulation system

Each project has its own development workflow and commands.

## Common Development Commands

### For hono_postgres project:

```bash
cd hono_postgres

# Frontend (Vue.js + TypeScript + Vite)
cd apps/frontend
npm run dev          # Development server (port 5173)
npm run type-check   # TypeScript type checking
npm run build        # Production build
npm run lint         # Linting with auto-fix

# Backend (Hono + Node.js)
cd apps/backend  
npm run dev          # Development with tsx watch (port 3000)
npm run build        # TypeScript compilation
npm run start        # Production server

# Docker environment
docker compose -f docker/compose.development.yml up -d    # Start all services
docker compose -f docker/compose.development.yml down    # Stop services
```

### For typescript_serverless project:

```bash
cd typescript_serverless

# Development workflow
npm run typecheck        # Type checking for active packages
npm run typecheck:all    # Type checking for all packages
npm run lint            # ESLint checking
npm run test            # Run all tests
npm run build           # Build all packages

# Docker operations
npm run docker:up       # Start development environment
npm run docker:down     # Stop development environment
```

### For multi_agent_network project:

This is a conceptual AI system. See `docs/requirements.md` for detailed specifications of the agent trading system.

## Architecture Insights

### hono_postgres Architecture
- **Frontend**: Vue 3 + TypeScript + Vite with Vue Router
- **Backend**: Hono framework with Kysely for type-safe PostgreSQL operations
- **Database**: PostgreSQL with migration support
- **Development**: Docker Compose with HMR support
- **Monorepo**: npm workspaces with `apps/*` and `packages/*` structure

### typescript_serverless Architecture  
- **Framework**: Next.js applications with TypeScript
- **Infrastructure**: AWS CDK for Infrastructure as Code
- **Backend**: AWS Lambda functions
- **Package Manager**: pnpm for efficient dependency management
- **Monorepo**: Comprehensive packages/apps structure with shared libraries
- **Quality**: Extensive TypeScript configuration with 8-level type safety enforcement

### multi_agent_network Architecture
- **System**: Distributed AI agent network for token trading
- **Agents**: Autonomous entities with individual value functions
- **Monitoring**: "Brainwashing" detection and market manipulation prevention
- **Trading**: 10 types of virtual tokens with normative evaluation system

## Quality Assurance Standards

### Type Safety Requirements
All projects maintain strict TypeScript standards:
- Zero type errors policy
- No `any` types allowed  
- No non-null assertions (`!`) without proper null checks
- Comprehensive Zod schema validation where applicable

### Testing Requirements
- Follow Test-Driven Development (RED-GREEN-BLUE cycle)
- Unit tests for all utilities and business logic
- Integration tests for API endpoints
- Type-driven development with incremental type checking

### Build Verification
Before committing changes:
1. Run type checking: `npm run type-check` or `npm run typecheck`
2. Run linting: `npm run lint`  
3. Ensure builds succeed: `npm run build`
4. Run tests: `npm run test`

## Development Philosophy

### Core Principles Applied Across All Projects
- **UNIX Philosophy**: Do one thing well, programs work together
- **Don't Reinvent the Wheel**: Leverage existing proven solutions
- **Orthogonality**: Independent, loosely coupled components
- **DRY**: Single source of truth for shared knowledge
- **KISS**: Choose simplest solution that addresses the problem
- **SOLID Principles**: Especially single responsibility and dependency inversion

### Language Policy (typescript_serverless)
- **Dialogue**: Japanese responses preferred (`日本語で回答`)
- **Code**: English only for comments, variables, and documentation

## Project-Specific Guidelines

### When working on hono_postgres:
- Use Kysely for all database operations (type-safe SQL builder)
- Follow Vue 3 Composition API patterns
- Maintain Docker development environment compatibility
- Focus on real-time development with HMR

### When working on typescript_serverless:
- Follow comprehensive type safety (Levels 1-8)
- Use pnpm for package management
- Implement CDK patterns for infrastructure
- Apply parallel execution philosophy for independent tasks
- Utilize specialized agents for quality assurance

### When working on multi_agent_network:
- Reference detailed requirements in `docs/requirements.md`
- Focus on agent autonomy and value function implementation
- Implement monitoring systems for abnormal behavior detection
- Consider distributed system principles for agent interactions

## File Structure Navigation

Each project maintains distinct file organization:
- **hono_postgres**: Traditional monorepo with `apps/` and `packages/`
- **typescript_serverless**: Comprehensive structure with `docs/`, `tasks/`, `progress/` 
- **multi_agent_network**: Conceptual with documentation in `docs/`

## Infrastructure Notes

- **hono_postgres**: PostgreSQL + Docker Compose for development, AWS Serverless for production
- **typescript_serverless**: Full AWS CDK infrastructure with Lambda, API Gateway, CloudFront
- **multi_agent_network**: Distributed system requiring real-time agent coordination