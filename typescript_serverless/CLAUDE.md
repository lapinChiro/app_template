# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Language Policy

**Dialogue**: 日本語で回答
**Code**: English only (comments, variables, documentation)

- Reason: Unambiguous subject-object relationships in English

## Project Context

TypeScript serverless monorepo: Next.js + AWS Lambda + CDK

## Execution Decision Tree

```
START
  │
  ├─ Code changes? No → implement → qa
  │
  └─ Code changes? Yes → File count?
      ├─ 1-2 files → test:red → implement → test:green → qa
      ├─ 3-5 files → test:red → implement → test:green → test:blue → review → qa
      └─ 6+ files → tracker:start → test:red → implement → test:green → qa:quick → 
                     test:blue → qa:quick → architect → review → qa → tracker:complete
```

### Special Case Injection

- Path contains [auth|login|password|token|crypto] → Insert `security` before `review`
- File is [*.d.ts|interface|type] → Insert `typesafe` before `review`
- Context mentions [performance|optimize|speed] → Insert `perf` before `qa`

## Core Principles

### DRY (Don't Repeat Yourself)

- Trigger: Code appears 3+ times
- Action: Extract to shared function/component
- Validation: Each piece of knowledge has single authoritative representation

### KISS (Keep It Simple, Stupid)

- Trigger: Solution complexity exceeds problem complexity
- Action: Simplify to minimal viable solution
- Validation: Junior developer can understand in 5 minutes

### SOLID Principles

- **S**: One class, one responsibility
- **O**: Open for extension, closed for modification
- **L**: Subtypes substitutable for base types
- **I**: Many specific interfaces over one general
- **D**: Depend on abstractions, not concretions

### TDD (Test-Driven Development)

1. **RED**: Write failing test first
2. **GREEN**: Write minimal code to pass
3. **BLUE**: Refactor while keeping tests green

## Type Safety Enforcement

### Mandatory Levels (1-3)

```typescript
// Level 1: tsconfig.json
"strict": true,
"noImplicitAny": true

// Level 2: ESLint rules
"@typescript-eslint/no-explicit-any": "error"

// Level 3: Runtime validation
import { z } from 'zod';
const schema = z.object({ /* ... */ });
```

### Advanced Levels (4-8) - Apply when needed

- Level 4: Branded types for domain modeling
- Level 5: Template literal types for string validation
- Level 6: Conditional types for type logic
- Level 7: Mapped types for transformations
- Level 8: Type-level programming

## SubAgent Usage

### Always Use (3)

- `qa`: Final step of every task
- `test`: All code changes (except config/style/docs)
- `tracker`: Tasks with 6+ file changes

### Conditional Use (4)

- `review`: 3+ file changes
- `architect`: 6+ file changes
- `security`: Auth/crypto/data access changes
- `typesafe`: Type definition changes

### On-Demand Use (5)

- `perf`: Performance issues reported
- `docker`: Container file changes
- `monorepo`: Workspace dependency changes
- `debug`: Unknown error causes
- `guide`: Implementation uncertainty

## Parallel Execution Rules

```typescript
// Sequential (default)
await readFile1();
await readFile2();

// Parallel (when independent)
await Promise.all([
  readFile1(),
  readFile2(),
  readFile3()
]);
```

## Error Priority

1. **Stop immediately**: Build errors, TypeScript errors, Security vulnerabilities
2. **Fix after task**: Lint warnings, Performance issues

## Progress Tracking

### Minimal YAML

```yaml
---
task_id: 'XX-YY'
status: 'completed'
files: 3
quality: 'pass'
---
```

### Full YAML (6+ files)

```yaml
---
task_id: 'XX-YY'
status: 'completed'
files: 8
quality: 'pass'
blocks_tasks: ['XX-YY']
depends_on: ['XX-YY']
decisions:
  pattern: 'Repository'
  rationale: 'Data access abstraction'
---
```

## Quality Gates

- **Any detection**: Fix immediately, no tolerance
- **Build must pass**: Before any commit
- **Tests must pass**: Before marking complete

## Command Memory

```bash
# Quality check (memorized)
npm run lint && npm run typecheck && npm run build

# Test execution (memorized)
npm test

# Dev server (memorized)
npm run dev
```

## /dev Execution Sequence

When user types `/dev`:

1. Check @progress/SUMMARY.md and IN_PROGRESS.md
2. Use tracker agent to analyze and select task
3. Execute workflow based on Decision Tree
4. Update progress with tracker agent
5. Recommend next task
