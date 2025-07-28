# Implementation Examples

This directory contains concrete implementation examples referenced from the main design document.

## Directory Structure

```txt
impl/
├── README.md                    # This file
├── type-safety/                 # Ultimate Type Safety implementations
│   ├── eslint-strategy.md      # ESLint configuration strategy
│   ├── prettier-integration.md # Prettier integration with ESLint
│   ├── domain-types.md         # Domain type implementations
│   └── error-handling.md       # Type-safe error handling
├── architecture/                # Clean Architecture + SOLID examples
│   ├── clean-layers.md         # Layer implementation examples
│   ├── solid-principles.md     # SOLID implementation examples
│   └── gof-patterns.md         # GoF patterns implementations
├── config/                      # 12-Factor App configurations
│   ├── environment-config.md   # Environment configuration examples
│   ├── service-registry.md     # Service registry implementations
│   └── process-lifecycle.md    # Process lifecycle management
├── testing/                     # TDD & Test Pyramid examples
│   ├── tdd-cycle.md            # TDD implementation cycle
│   ├── test-pyramid.md         # Test pyramid implementations
│   └── test-infrastructure.md  # Testing infrastructure setup
├── ui/                          # Frontend implementation examples
│   ├── shadcn-tailwind.md      # shadcn/ui + Tailwind CSS setup
│   ├── theme-strategy.md       # Theme implementation strategy
│   └── component-patterns.md   # Component design patterns
├── api/                         # API implementation examples
│   ├── zod-schemas.md          # Zod schema implementations
│   ├── openapi-generation.md   # OpenAPI auto-generation
│   └── api-handlers.md         # API handler implementations
├── auth/                        # Authentication implementation examples
│   ├── google-oauth.md         # Google OAuth implementation
│   ├── admin-crud.md           # Admin CRUD operations
│   ├── jwt-strategy.md         # JWT token strategy
│   └── auth-middleware.md      # Authentication middleware
├── database/                    # Database implementation examples
│   ├── dynamodb-design.md      # DynamoDB single table design
│   ├── repository-pattern.md   # Repository pattern implementation
│   └── data-migrations.md      # Data migration strategies
├── docker/                      # Docker implementation examples
│   ├── dockerfile-strategy.md  # Node.js 22 Bookworm Dockerfile strategy
│   ├── compose-architecture.md # Docker Compose with profiles
│   └── security-hardening.md   # Container security best practices
├── infrastructure/              # Infrastructure implementation examples
│   ├── cdk-stacks.md           # CDK stack implementations
│   └── deployment-pipeline.md  # CI/CD pipeline implementations
├── security/                    # Security implementation examples
│   └── best-practices.md       # Comprehensive security best practices
└── workflow/                    # Development workflow examples
    ├── project-init.md         # Project initialization strategy
    ├── github-flow.md          # GitHub Flow implementation
    ├── atomic-commits.md       # Atomic commit strategies
    └── quality-gates.md        # Quality gate implementations
```

## Usage

Each implementation example is referenced from the main design document with direct links. The examples provide concrete code and configuration that demonstrates the architectural principles and design decisions outlined in the design document.

## Navigation

- **Main Design Document**: [`../design.md`](../design.md)
- **Requirements Document**: [`../requirements.md`](../requirements.md)
