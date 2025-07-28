# Development Execution Prompt

Execute optimal task based on current project state and automated workflow selection.

## Execution Sequence

### Pre-Flight Check: File Existence Validation

```bash
# STOP IMMEDIATELY if expected files are missing, except:
# - First task (01-01): @progress/SUMMARY.md and @progress/IN_PROGRESS.md do not exist yet
# - After first task: These files MUST exist

if (current_task != "01-01" && !exists("@progress/SUMMARY.md", "@progress/IN_PROGRESS.md")) {
  STOP("❌ Missing required progress files. Run task 01-01 first.");
}

# Check other critical files
if (!exists("@docs/impl/**", "@CLAUDE.md", "@tasks/**/*.md")) {
  STOP("❌ Missing critical project files. Verify repository integrity.");
}
```

### Step 0: Project State Analysis (MANDATORY)

```bash
# Parallel execution for state check
Parallel: 
  Read @progress/SUMMARY.md,
  Read @progress/IN_PROGRESS.md,
  Use Task tool with subagent_type: "tracker", prompt: "analyze"
```

### Step 1: Task Selection and Scope Detection

```bash
# Find and analyze current task
Glob: "tasks/**/*.md"
Read: [highest_priority_ready_task]

# Determine scope automatically
file_count = count_modified_files(task_description)
```

### Step 2: Automated Workflow Execution

#### No Code Changes (config/style/docs only)

```bash
implement → qa
```

#### 1-2 Files

```bash
test:red → implement → test:green → qa
```

#### 3-5 Files

```bash
test:red → implement → test:green → test:blue → review → qa
```

#### 6+ Files

```bash
tracker:start → test:red → implement → test:green → qa:quick → 
test:blue → qa:quick → architect → review → qa → tracker:complete
```

### Step 3: Special Case Agent Injection

```typescript
if (path.includes('auth', 'login', 'password', 'token', 'crypto')) {
  inject('security', before: 'review');
}

if (file.endsWith('.d.ts') || content.includes('interface', 'type')) {
  inject('typesafe', before: 'review');
}

if (description.includes('performance', 'optimize', 'speed')) {
  inject('perf', before: 'qa');
}
```

## Agent Command Reference

```bash
# Test-Driven Development
Use Task tool with subagent_type: "test", prompt: "red"    # Create failing test
Use Task tool with subagent_type: "test", prompt: "green"  # Minimal implementation
Use Task tool with subagent_type: "test", prompt: "blue"   # Refactor safely

# Quality Assurance
Use Task tool with subagent_type: "qa", prompt: "quick"    # ESLint + TypeScript only
Use Task tool with subagent_type: "qa"                     # Full quality check

# Task Management
Use Task tool with subagent_type: "tracker", prompt: "start XX-YY"
Use Task tool with subagent_type: "tracker", prompt: "complete XX-YY"

# Code Review and Architecture
Use Task tool with subagent_type: "review"      # SOLID principles check
Use Task tool with subagent_type: "architect"   # Clean Architecture validation
Use Task tool with subagent_type: "security"    # Vulnerability scan
Use Task tool with subagent_type: "typesafe"    # Type safety enforcement
```

## Parallel Execution Patterns

```bash
# File operations
Parallel: Read file1.ts, Read file2.ts, Read file3.ts

# Quality checks  
Parallel: 
  Bash "npm run lint",
  Bash "npm run typecheck", 
  Bash "npm test"

# Multi-agent validation
Parallel:
  Use Task tool with subagent_type: "security",
  Use Task tool with subagent_type: "review"
```

## Error Handling Protocol

### Immediate Stop Conditions

- TypeScript compilation errors
- ESLint errors (not warnings)
- Build failures
- Security vulnerabilities

### Resolution Sequence

1. Stop current workflow
2. Fix error immediately
3. Run `qa:quick` to verify fix
4. Resume from interruption point

## Progress Documentation

### Simple Tasks (1-5 files)

```yaml
---
task_id: 'XX-YY'
status: 'completed'
files: 3
quality: 'pass'
---
```

### Complex Tasks (6+ files)

```yaml
---
task_id: 'XX-YY' 
status: 'completed'
files: 8
quality: 'pass'
blocks_tasks: ['XX-ZZ', 'XX-AA']
depends_on: ['XX-BB']
decisions:
  architecture: 'Repository Pattern'
  rationale: 'Decoupled data access'
  alternatives: 'Direct DB access (rejected - coupling)'
---
```

## Quality Validation

- ✅ Zero TypeScript errors
- ✅ Zero ESLint errors  
- ✅ All tests passing
- ✅ Build successful
- ✅ Progress documented

## Fallback Commands (SubAgent unavailable)

```bash
# Manual quality check
npm run lint && npm run typecheck && npm run build && npm test

# Manual security scan
npm audit && grep -r "password\|token\|secret" --include="*.ts" src/

# Manual type check
npx tsc --noEmit --strict
```

## Immediate Execution

Begin workflow now:

1. Execute Step 0 (parallel state analysis)
2. Determine task scope automatically
3. Follow Decision Tree workflow
4. Document results and next steps
