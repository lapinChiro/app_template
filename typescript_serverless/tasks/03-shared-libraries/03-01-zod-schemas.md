# Task 3.1: Zod Schemas and Domain Type Definitions

## Overview

Implement Schema-First API design using Zod as the single source of truth for type definitions, validation, and API contracts across the entire application.

## Description

Create comprehensive Zod schemas for User, Auth, and Base domain objects that serve as the foundation for type-safe APIs, client-server communication, and data validation throughout the system.

## Requirements

- Schema-First API design with Zod
- User, Auth, and Base domain schemas
- Type-safe validation utilities
- TypeScript type inference from schemas
- Error handling and validation messaging

## Dependencies

- **Depends on**: Task 1.1 (monorepo), Task 1.2 (type safety configuration)
- **Blocks**: Tasks 3.2-3.3 (Clean Architecture), Tasks 4.1-4.3 (Authentication), Tasks 6.1-6.3 (Member API), Tasks 7.1-7.3 (Admin API)
- **Can work in parallel with**: None (foundational type definitions)

## Implementation Reference

- [`@docs/impl/api/zod-schemas.md`](../docs/impl/api/zod-schemas.md)

## Acceptance Criteria

- [ ] Base schemas (ID, Timestamp, Email, Pagination)
- [ ] User domain schemas (Create, Update, Entity, Public)
- [ ] Auth schemas (Login, JWT, OAuth, Refresh)
- [ ] Validation utilities and error handling
- [ ] TypeScript type exports for all schemas
- [ ] Member/Admin API schema variations
- [ ] OpenAPI generation compatibility

## Technical Requirements

- **Type Safety**: 100% type inference from schemas
- **Validation**: Runtime type safety for all inputs/outputs
- **Member/Admin Symmetry**: Consistent schema patterns
- **Performance**: Schema validation < 5ms per request

## Core Schemas to Implement

```typescript
// Key schemas from implementation docs:
- BaseResponseSchema
- ErrorResponseSchema
- PaginationSchema
- UserSchema (with role enum)
- CreateUserInputSchema
- AuthenticationSchemas (JWT, OAuth)
- API request/response schemas
```

## Progress Tracking (Claude Code Critical)

**MANDATORY**: Create `@progress/03-01-zod-schemas.md` with structured YAML frontmatter for automated progress analysis.

### Required YAML Frontmatter

```yaml
---
task_id: '03-01'
task_name: 'zod-schemas'
task_status: 'completed' # MUST update when done
developer: '[Your Name]'
start_date: 'YYYY-MM-DD'
end_date: 'YYYY-MM-DD' # when completed
estimated_hours: 7
actual_hours: X.X # track actual time
blocks_tasks: [
    '03-02',
    '03-03',
    '04-01',
    '04-02',
    '04-03',
    '06-01',
    '06-02',
    '06-03',
    '07-01',
    '07-02',
    '07-03',
  ] # DO NOT CHANGE
depends_on_completed: ['01-01', '01-02'] # requires project structure and type safety
technical_decisions:
  schema_validation_approach: '[runtime|compile-time|hybrid]' # CRITICAL: affects all APIs
  error_message_strategy: '[detailed|simple|localized]' # user experience approach
  type_inference_pattern: '[strict|permissive]' # type safety level
  enum_handling: '[string_literals|zod_enums]' # enum implementation choice
  date_handling: '[iso_strings|date_objects|timestamps]' # date serialization
  pagination_pattern: '[cursor|offset|hybrid]' # API pagination strategy
  validation_performance: '[X ms per schema]' # performance benchmark
files_modified:
  - path: 'packages/shared/src/schemas/base.ts'
    action: 'created'
    purpose: 'Base schema primitives (ID, Timestamp, Email)'
  - path: 'packages/shared/src/schemas/user.ts'
    action: 'created'
    purpose: 'User domain schemas'
  - path: 'packages/shared/src/schemas/auth.ts'
    action: 'created'
    purpose: 'Authentication schemas'
  - path: 'packages/shared/src/utils/validation.ts'
    action: 'created'
    purpose: 'Validation utility functions'
quality_metrics:
  eslint_errors: 0 # MUST be 0
  typescript_errors: 0 # MUST be 0
  schema_validation_time: 'X ms' # performance requirement
  type_inference_coverage: '100%' # all schemas must infer types
  build_success: true # MUST be true
acceptance_criteria_met: '7/7' # count completed criteria
---
```

### Critical Recording Requirements

1. **schema_validation_approach** - ALL APIs depend on this choice
2. **type_inference_pattern** - affects type safety across entire system
3. **date_handling & pagination_pattern** - API consistency requirements
4. **Record validation performance** - < 5ms per request requirement
5. **Verify 100% type inference** - no manual type definitions allowed

## Estimated Time

6-8 hours

## Implementation Steps

1. Set up Zod in packages/shared
2. Design base schema primitives
3. Implement User domain schemas
4. Create Auth/JWT related schemas
5. Build validation utility functions
6. Test type inference and runtime validation
7. Create schema documentation
8. Verify Member/Admin schema compatibility

---

_Task Status: Ready for Implementation_
_Foundation for all API and data layer development_
