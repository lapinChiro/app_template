# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

This document defines strategic principles. See prompt.md for tactical implementation.

## Language Policy

**Dialogue**: 日本語で回答
**Code**: English only (comments, variables, documentation)

## Project Context

TypeScript serverless monorepo: Next.js + AWS Lambda + CDK

## Development Philosophy

### UNIX Philosophy

Write programs that do one thing and do it well. Write programs to work together. Choose portability over efficiency, clarity over cleverness.

### Don't Reinvent the Wheel

Leverage existing, proven solutions before implementing custom alternatives. Research available libraries, frameworks, and tools first.

### Orthogonality Principle

Design independent, loosely coupled components where changes to one component have minimal impact on others. Maintain clear separation of concerns and avoid unexpected interdependencies.

### Test-Driven Development (t_wada's TDD)

Follow the RED-GREEN-BLUE cycle for all development:

1. **RED**: Write failing test first
2. **GREEN**: Write minimal code to pass
3. **BLUE**: Refactor while keeping tests green

### Type-Driven Development

Apply TDD principles to static type checking:

1. **Incremental Type Checking**: Check only implemented packages
2. **Early Error Detection**: Find type errors as you develop
3. **Progressive Integration**: Add packages to type check as they're implemented

```bash
# Check only active packages (recommended during development)
npm run typecheck

# Update active packages list and check
npm run typecheck:update

# Check all packages (use when ready)
npm run typecheck:all
```

### Comprehensive Quality Assurance

Every task must pass through:

- Test verification
- Code review
- Security audit
- Quality assurance

## Core Principles

### DRY (Don't Repeat Yourself)

Each piece of knowledge must have a single, unambiguous, authoritative representation within the system.

### KISS (Keep It Simple, Stupid)

Choose the simplest solution that fully addresses the problem. Avoid over-engineering.

### SOLID Principles

- **S**: One class, one responsibility
- **O**: Open for extension, closed for modification
- **L**: Subtypes substitutable for base types
- **I**: Many specific interfaces over one general
- **D**: Depend on abstractions, not concretions

## Type Safety Enforcement

### Mandatory Levels (1-3)

```typescript
// Level 1: Compiler-level type checking (tsconfig.json)
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}

// Level 2: Linter-level type enforcement (eslint.config.js)
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/strict-boolean-expressions": "error"
}

// Level 3: Runtime validation with Zod
import { z } from 'zod';
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'user'])
});
type User = z.infer<typeof UserSchema>;
const user = UserSchema.parse(data); // Throws if invalid
```

### Advanced Levels (4-8) - Apply when needed

- Level 4: Branded types for domain modeling
- Level 5: Template literal types for string validation
- Level 6: Conditional types for type logic
- Level 7: Mapped types for transformations
- Level 8: Type-level programming

## SubAgent Philosophy

Utilize specialized agents to ensure quality and consistency:

- Automate repetitive quality checks
- Enforce architectural principles
- Maintain security standards
- Ensure type safety

## Parallel Execution Philosophy

Maximize efficiency through parallel execution when tasks are independent. Sequential execution should only be used when there are explicit dependencies between operations.

## /dev Command

The `/dev` command triggers automated development workflow following TDD principles and comprehensive quality checks.
