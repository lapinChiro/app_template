# Development Execution Prompt

Execute optimal task based on current project state using standard workflow.

This prompt defines specific implementation details following the principles in CLAUDE.md.

## Execution Sequence

### Step 0: Project State Analysis (MANDATORY)

```bash
# Use tracker agent for complete state analysis
Use Task tool with subagent_type: "tracker", prompt: "analyze"
# The tracker agent will read all necessary files and provide consolidated analysis
```

### Step 1: Task Selection

```bash
# Tracker agent already selected the task in Step 0
# Read the selected task file for detailed requirements
Read: [selected_task_file]
```

### Step 2: Workflow Agent Execution

#### Core Workflow Agents (Execute for ALL tasks)

1. `tracker:start` - Mark task as started
2. `test:red` - Write failing test
3. `implement` - Write code to pass test
4. `test:green` - Verify test passes
5. **MANDATORY: `qa:quick` - Fix ESLint/TypeScript errors immediately**
6. `test:blue` - Refactor code  
7. **MANDATORY: `qa:quick` - Fix any new errors from refactoring**
8. `security` - Security audit (ALWAYS run for comprehensive quality)
9. `review` - Code review for SOLID principles
10. `qa` - Final quality check
11. `tracker:complete` - Mark task complete with handover

**CRITICAL**: Steps 5 and 7 (qa:quick) are MANDATORY. If errors are found, they MUST be fixed before proceeding to the next step. Skipping these steps will result in error accumulation.

#### Additional Specialized Agents (Add based on task context)

```txt
When modifying authentication/crypto files:
  → Add additional security deep-scan after main security check

When modifying type definitions (*.d.ts):
  → Add typesafe agent after review

When addressing performance issues:
  → Add perf agent before qa

When making architectural changes:
  → Add architect agent after review

When modifying Docker files:
  → Add docker agent after implement
```

## Agent Command Reference

```bash
# Test-Driven Development (t_wada's TDD)
Use Task tool with subagent_type: "test", prompt: "red [FULL_PATH/component_name]"   # Write failing test
# CRITICAL: Always use FULL PATH (e.g., "red packages/ui/src/components/Button")
# Never use just component name (e.g., "red Button") - this will create test in wrong location
Use Task tool with subagent_type: "test", prompt: "green"                            # Verify test passes
Use Task tool with subagent_type: "test", prompt: "blue"                             # Refactor with tests

# Quality Assurance
Use Task tool with subagent_type: "qa"                     # Full quality analysis
Use Task tool with subagent_type: "qa", prompt: "quick"    # Quick check with auto-fix during TDD (MANDATORY after test:green and test:blue)
Use Task tool with subagent_type: "qa", prompt: "fix"      # Fix auto-fixable issues
Use Task tool with subagent_type: "qa", prompt: "report"   # Generate detailed report

# CRITICAL: qa:quick MUST be run after test:green and test:blue
# If qa:quick finds errors, workflow MUST stop until all errors are fixed

# Task Management
Use Task tool with subagent_type: "tracker", prompt: "analyze"        # Analyze and select task
Use Task tool with subagent_type: "tracker", prompt: "start XX-YY"    # Mark task as started
Use Task tool with subagent_type: "tracker", prompt: "complete XX-YY with handover: [
  - Generated: report-XX-YY.md, logs/test-results.log
  - Environment: New packages installed via npm
  - Commands: npm test, npm run build  
  - Issues: Any warnings or known issues
  - Cleanup: Temporary files removed
]"                                                                     # Complete with handover
Use Task tool with subagent_type: "tracker", prompt: "summary"        # Update SUMMARY.md

# Code Review
Use Task tool with subagent_type: "review"                          # Review all changes
Use Task tool with subagent_type: "review", prompt: "file1.ts file2.ts"  # Review specific files
Use Task tool with subagent_type: "review", prompt: "--quick"       # Quick review
Use Task tool with subagent_type: "review", prompt: "--focus=types,solid"  # Focused review

# Architecture Enforcement
Use Task tool with subagent_type: "architect"                       # Full architecture check
Use Task tool with subagent_type: "architect", prompt: "check --layer=domain"  # Check specific layer
Use Task tool with subagent_type: "architect", prompt: "solid"      # SOLID principles check
Use Task tool with subagent_type: "architect", prompt: "deps"       # Dependency rules check

# Security Audit
Use Task tool with subagent_type: "security"                        # Security analysis
Use Task tool with subagent_type: "security", prompt: "scan"        # Scan with fix suggestions
Use Task tool with subagent_type: "security", prompt: "--scope=auth"  # Auth-focused scan
Use Task tool with subagent_type: "security", prompt: "--scope=api"   # API security scan

# Type Safety
Use Task tool with subagent_type: "typesafe"                        # Full type safety check
Use Task tool with subagent_type: "typesafe", prompt: "level-3"     # Check specific level
Use Task tool with subagent_type: "typesafe", prompt: "fix"         # Fix type issues
Use Task tool with subagent_type: "typesafe", prompt: "generate"    # Generate type-safe code
```

## Parallel Execution Patterns

### Sequential Execution (when dependencies exist)

```txt
First message: Use Read tool with file_path: "config.ts"
Second message: Use Read tool with file_path: "implementation.ts"  # Depends on config
```

### Parallel Execution (when tasks are independent)

Single message containing multiple tool calls:

```markdown
- Use Read tool with file_path: "src/file1.ts"
- Use Read tool with file_path: "src/file2.ts"
- Use Read tool with file_path: "src/file3.ts"
```

### Common Parallel Patterns

#### Quality Check Bundle

```markdown
- Use Bash tool with command: "npm run lint"
- Use Bash tool with command: "npm run typecheck"
- Use Bash tool with command: "npm test"
```

#### Multi-Agent Validation

```markdown
- Use Task tool with subagent_type: "security", prompt: "analyze current implementation"
- Use Task tool with subagent_type: "review", prompt: "check SOLID principles"
- Use Task tool with subagent_type: "typesafe", prompt: "level-3"
```

#### File Analysis Bundle

```markdown
- Use Read tool with file_path: "package.json"
- Use Read tool with file_path: "tsconfig.json"
- Use Read tool with file_path: "eslint.config.js"
```

## Error Handling Protocol

### Immediate Stop Conditions

- TypeScript compilation errors
- ESLint errors (not warnings)  
- Build failures
- Security vulnerabilities

### MANDATORY Quality Checkpoints

After EACH of these steps, run `qa:quick`:

- After `test:green` - MUST run before proceeding to refactoring
- After `test:blue` - MUST run before security check

If `qa:quick` finds ANY errors:

1. **STOP immediately** - Do NOT proceed to next step
2. Fix all errors using `qa:fix` or manual fixes
3. Run `qa:quick` again to verify all errors are fixed
4. Only then proceed to next step

### Resolution Sequence

1. Stop current workflow
2. Fix error immediately
3. Run `qa:quick` to verify fix (not just `qa`)
4. Resume from interruption point

## Progress Tracking

### When to Use Tracker Agent

#### Task Start (MANDATORY - Beginning of workflow)

```bash
Use Task tool with subagent_type: "tracker", prompt: "start 02-03"
```

#### Task Completion (MANDATORY - End of workflow)

```bash
Use Task tool with subagent_type: "tracker", prompt: "complete 02-03 with handover: [
  - Generated: zod-schemas.ts, validation-tests.spec.ts
  - Environment: Installed zod@3.22.4
  - Commands: npm test src/schemas, npm run build
  - Issues: None
  - Cleanup: Removed temporary test data files
]"
```

#### Summary Update (OPTIONAL - After task completion)

```bash
Use Task tool with subagent_type: "tracker", prompt: "summary"
```

### What Gets Tracked

The tracker agent automatically manages task progress, including status transitions, time tracking, dependencies, quality metrics, technical decisions, and file changes.

## Quality Validation

- ✅ Zero TypeScript errors
- ✅ Zero ESLint errors  
- ✅ All tests passing
- ✅ Build successful
- ✅ Progress and handover documented (tracker:complete executed)

## Error Priority

1. **Stop immediately**: Build errors, TypeScript errors, Security vulnerabilities
2. **Fix after task**: Lint warnings, Performance issues

## Quality Gates

- **Any detection**: Fix immediately, no tolerance
- **Build must pass**: Before any commit
- **Tests must pass**: Before marking complete

## Common Commands

```bash
# Quality check (run before any task completion)
npm run lint && npm run typecheck && npm run build

# Test execution (run after implementing features)
npm test

# Dev server (for local development)
npm run dev
```

## SubAgent Failure Protocol

If any SubAgent invocation fails:

1. **STOP immediately** - Do not attempt manual workarounds
2. **Report the failure** with:
   - Which SubAgent failed (e.g., "test", "qa", "security")
   - Exact invocation attempted (e.g., `Use Task tool with subagent_type: "test", prompt: "red"`)
   - Error message received
   - Current task context (task ID, step in workflow)
3. **Wait for resolution** - User may need to check SubAgent configuration or Claude Code setup

Example failure report:

```markdown
❌ SubAgent invocation failed
- Agent: test
- Command: Use Task tool with subagent_type: "test", prompt: "red"
- Error: [error message]
- Context: Task 02-02, TDD red phase
- Action: Stopping workflow. Please check SubAgent configuration.
```

## /dev Command Execution

When user types `/dev`, immediately execute:

1. **Step 0**: Use tracker agent to analyze project state and select optimal task
2. **Step 1**: Read selected task file for detailed requirements
3. **Step 2**: Execute core workflow agents for ALL tasks in EXACT order:
   - tracker:start
   - test:red (with FULL PATH)
   - implement
   - test:green
   - **qa:quick (MANDATORY - STOP if errors found)**
   - test:blue
   - **qa:quick (MANDATORY - STOP if errors found)**
   - security
   - review
   - qa (final check)
   - tracker:complete
4. **Step 3**: Add specialized agents based on task context
5. **Complete**: Use tracker:complete with comprehensive handover

**Key principles**:

- One workflow for all tasks with comprehensive quality assurance
- Security is not optional
- qa:quick after test:green and test:blue is MANDATORY
- If ANY errors are found, STOP and fix before proceeding
