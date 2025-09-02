# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo project for a project management application with the following structure:

- **Frontend**: Vue 3 + TypeScript + Vite application
- **Backend**: Rust + Axum web server
- **Infrastructure**: Docker Compose setup with PostgreSQL for development, AWS ECS for production

## Development Commands

### Polyglot Monorepo (Root Level)

```bash
# Integrated development workflow
make dev                    # Start all services (sync types + docker-compose up)
make build                  # Build all components (Rust + TypeScript)  
make test                   # Run all test suites
make sync-types             # Synchronize types (Rust → OpenAPI → TypeScript)
make clean                  # Clean all build artifacts

# Type synchronization
make sync-types             # Full type sync pipeline
make generate-openapi       # Generate OpenAPI spec from Rust
make generate-ts-types      # Generate TypeScript types from OpenAPI

# Package management
cargo update                # Update Rust dependencies
npm install                 # Install TypeScript dependencies (all workspaces)
```

### Backend (apps/backend/)

```bash
# Development
cargo run                   # Start development server (port 3000)
cargo watch -x run          # Auto-restart on file changes
cargo check                 # Quick compile check
cargo clippy                # Linter
cargo fmt                   # Code formatter

# Building
cargo build                 # Debug build
cargo build --release       # Production build

# Testing
cargo test                  # Run all tests
cargo test --test integration  # Run integration tests only
cargo test -- --nocapture  # Run tests with output

# Database
sqlx migrate add <name>     # Create new migration
sqlx migrate run            # Run pending migrations
sqlx migrate revert         # Revert last migration
cargo sqlx prepare          # Generate query metadata for offline builds
```

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
- Frontend: `axum_frontend` (Port 5173)
- Backend: `axum_backend` (Port 3000) - HMR enabled with cargo-watch
- PostgreSQL: `axum_postgres` (Port 5435)

## Quality Assurance

### Quality Standards

This project maintains the following quality standards:

1. **Zero compiler warnings**: Maintain clean compilation at all times
2. **Clippy compliance**: All clippy warnings must be addressed
3. **Test coverage**: Maintain high test coverage for critical paths
4. **Type safety**: Leverage Rust's type system for correctness
5. **Memory safety**: No unsafe code without justification

### Quality Commands

#### Backend Quality Checks (apps/backend/)

```bash
# Required checks (CI/CD pipeline)
cargo check                 # Compile-time correctness
cargo clippy -- -D warnings # Linting with warnings as errors
cargo test                  # Test suite execution
cargo fmt -- --check       # Code formatting verification

# Quality improvement checks
cargo clippy --fix         # Auto-fix clippy suggestions
cargo fmt                  # Auto-format code
cargo audit                # Security vulnerability check
```

#### Frontend Quality Checks (apps/frontend/)

```bash
# Required checks (CI/CD pipeline)
npm run type-check         # Zero type errors guarantee
npm run build              # Build success guarantee (includes type-check)

# Quality improvement checks  
npm run lint               # Oxlint + ESLint checking with auto-fix
npm run build-only         # Build without type checking
```

#### Root Level Commands

```bash
# Integrated quality checks (recommended)
make test                   # Run all tests (Rust + TypeScript)
make build                  # Build all components with type sync
make lint                   # Lint all codebases

# Manual quality checks
make sync-types             # Ensure types are synchronized first
cd apps/backend && cargo check && cargo clippy && cargo test
cd apps/frontend && npm run type-check && npm run build
```

## Architecture

### Tech Stack

- **Backend**: Rust + Axum web framework + Tokio async runtime
- **Database**: PostgreSQL with sqlx for type-safe async database operations
- **API Documentation**: utoipa + utoipa-axum for automatic OpenAPI generation
- **Frontend**: Vue 3 with Vue Router, TypeScript, Vite (rolldown-vite), ESLint + Oxlint
- **Development**: Docker Compose with HMR support (PostgreSQL + Backend + Frontend)
- **Production**: AWS ECS + Fargate with RDS PostgreSQL

### Polyglot Monorepo Structure

This project uses a polyglot monorepo approach with separate package managers:

- **Rust Workspace** (`Cargo.toml`): Backend and Rust-based codegen tools
- **TypeScript Workspace** (`package.json`): Frontend, infra, and TypeScript tools

#### Directory Structure
- `apps/backend/` - Rust + Axum application (cargo workspace member)
- `apps/frontend/` - Vue.js + TypeScript application (npm workspace member)
- `packages/openapi-spec/` - OpenAPI specification and TypeScript type generation
- `packages/codegen/` - Code generation tools (Rust → OpenAPI → TypeScript)
- `packages/shared-config/` - Language-agnostic configuration files
- `packages/dev-tools/` - Development utilities and scripts
- `infra/` - AWS CDK infrastructure code (npm workspace member)

#### Type Safety Across Languages

The project maintains type safety between Rust and TypeScript through:

1. **Rust → OpenAPI**: `utoipa-axum` automatically generates OpenAPI specs from Rust code
2. **OpenAPI → TypeScript**: `openapi-typescript` generates TypeScript types from OpenAPI specs
3. **Sync Command**: `make sync-types` orchestrates the entire pipeline

```bash
# Type synchronization workflow
cargo run --bin generate-openapi > packages/openapi-spec/openapi.json
cd packages/openapi-spec && npm run generate-types
# Generated types are now available for frontend use
```

### Frontend Structure

- Entry point: `src/main.ts`
- Router configuration: `src/router/index.ts`
- Main component: `src/App.vue`
- Views: `src/views/` (HomeView, AboutView)
- Components: `src/components/` (HelloWorld, TheWelcome, WelcomeItem, icons)

### Backend Structure

```
apps/backend/src/
├── main.rs                    # Application entry point
├── lib.rs                     # Library root
├── handlers/                  # HTTP request handlers
│   ├── mod.rs                 # Handler module exports
│   ├── health.rs              # Health check endpoint
│   ├── users.rs               # User CRUD operations
│   └── db_test.rs             # Database connectivity test
├── models/                    # Data models and business logic
│   ├── mod.rs
│   └── user.rs                # User domain model
├── schemas/                   # Request/Response schemas
│   ├── mod.rs
│   ├── common.rs              # Common API schemas
│   └── user.rs                # User API schemas
├── db/                        # Database operations
│   ├── mod.rs
│   ├── connection.rs          # Database connection setup
│   └── user.rs                # User database operations
├── middleware/                # Custom middleware
│   └── mod.rs
└── utils/                     # Shared utilities
    └── mod.rs
```

### Key API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/hello` - Hello API
- `GET /api/db-test` - Database integration testing endpoint
- `GET /api/users` - List users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user
- `GET /api-docs/openapi.json` - OpenAPI specification
- `GET /swagger-ui/` - Interactive API documentation

### Database Operations

Using sqlx for type-safe, async database operations:

```rust
// Example: Type-safe query with compile-time verification
let users = sqlx::query_as!(
    User,
    "SELECT id, name, email, active, created_at FROM test_users WHERE active = $1",
    true
)
.fetch_all(&pool)
.await?;
```

### API Documentation

Automatic OpenAPI generation using utoipa + utoipa-axum:

```rust
#[utoipa::path(
    get,
    path = "/api/users/{id}",
    params(
        ("id" = i32, Path, description = "User ID")
    ),
    responses(
        (status = 200, description = "User found", body = User),
        (status = 404, description = "User not found", body = ErrorResponse)
    )
)]
pub async fn get_user_by_id(/* ... */) -> Result<Json<User>, AppError> {
    // Handler implementation
}
```

## Development Philosophy

### AI-Driven Development

This project leverages Claude Code for comprehensive code generation and maintenance. All implementation follows AI-assisted development patterns with emphasis on:

- Automated code generation with human oversight
- Consistent coding standards across frontend and backend
- Type-safe implementations throughout the monorepo
- Rust's memory safety and performance characteristics

### Core Principles

#### UNIX Philosophy

Write programs that do one thing and do it well. Write programs to work together. Choose portability over efficiency, clarity over cleverness.

- **Frontend**: Single-responsibility components with clear interfaces
- **Backend**: Focused API handlers with minimal coupling
- **Monorepo**: Independent apps that communicate through well-defined contracts

#### Don't Reinvent the Wheel

Leverage existing, proven solutions before implementing custom alternatives. Research available libraries, frameworks, and tools first.

- Prefer established Rust ecosystem solutions (tokio, axum, sqlx)
- Use proven Vue 3 ecosystem solutions
- Leverage existing Rust patterns and idioms

#### Orthogonality Principle

Design independent, loosely coupled components where changes to one component have minimal impact on others. Maintain clear separation of concerns and avoid unexpected interdependencies.

- **Frontend/Backend Separation**: Clear API boundaries
- **Module Independence**: Minimal cross-dependencies
- **Layer Separation**: Database, business logic, and presentation layers

#### Type-Driven Development

Apply TDD principles to static type checking:

1. **Compile-Time Verification**: Use Rust's type system for correctness
2. **Early Error Detection**: Catch errors during compilation
3. **Progressive Integration**: Maintain type safety across app boundaries

#### DRY (Don't Repeat Yourself)

Each piece of knowledge must have a single, unambiguous, authoritative representation within the system.

- Shared types between different modules
- Reusable components and utilities
- Common configuration patterns

#### KISS (Keep It Simple, Stupid)

Choose the simplest solution that fully addresses the problem. Avoid over-engineering.

- Simple module hierarchies
- Straightforward API design
- Clear data flow patterns

#### SOLID Principles

- **S**ingle Responsibility: One struct/function, one responsibility
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Trait implementations must be substitutable
- **I**nterface Segregation: Many specific traits over one general trait
- **D**ependency Inversion: Depend on abstractions (traits), not concretions

#### Test-Driven Development

Follow the RED-GREEN-REFACTOR cycle for all development:

1. **RED**: Write failing test first
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve code while keeping tests green

Apply TDD across both frontend and backend components:
- Unit tests for business logic
- Integration tests for API endpoints
- Property-based testing where applicable

## Rust-Specific Guidelines

### Error Handling

Use structured error handling with custom error types:

```rust
#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Validation error: {0}")]
    Validation(String),
    
    #[error("User not found")]
    UserNotFound,
}
```

### Async Programming

- Use `async/await` for I/O operations
- Leverage Tokio's ecosystem
- Prefer structured concurrency patterns

### Memory Management

- Use borrowing and ownership effectively
- Minimize allocations in hot paths
- Use `Arc` and `Mutex` judiciously for shared state

### Performance Considerations

- Use connection pooling for database operations
- Implement proper caching strategies
- Profile and optimize based on real metrics

## Infrastructure

### Development Environment

- **Local**: Docker Compose with PostgreSQL, backend, and frontend services
- **Hot Reloading**: cargo-watch for backend, Vite HMR for frontend
- **Database**: PostgreSQL with sqlx migrations

### Production Environment

- **Compute**: AWS ECS with Fargate
- **Database**: AWS RDS PostgreSQL
- **Load Balancing**: Application Load Balancer
- **Monitoring**: CloudWatch for logs and metrics
- **Infrastructure as Code**: AWS CDK (TypeScript)

### Security Considerations

- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: sqlx compile-time query verification
- **CORS**: Properly configured CORS middleware
- **Environment Variables**: Secure handling of secrets
- **Container Security**: Minimal container images, non-root user