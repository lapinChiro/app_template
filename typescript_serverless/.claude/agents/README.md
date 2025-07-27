# Claude Code SubAgents

This directory contains specialized SubAgents that enhance Claude Code's development capabilities for the Ultimate Type Safety Template project.

## 🚀 Available SubAgents (12 Total)

### Core Development Agents

#### `/test` - Test Creator

**Purpose**: Automate TDD (Test-Driven Development) cycle following t_wada's practices
**Usage**: `/test`, `/test red`, `/test green`, `/test blue`
**Features**:

- Generate failing tests (RED phase)
- Create minimal implementation (GREEN phase)
- Suggest refactoring (BLUE phase)
- Maintain Test Pyramid (80% unit, 15% integration, 5% E2E)

#### `/review` - Code Reviewer

**Purpose**: Automated code review enforcing SOLID principles and TypeScript best practices
**Usage**: `/review`, `/review file.ts`, `/review --focus=types`
**Features**:

- Type safety validation (zero `any` tolerance)
- SOLID principles compliance check
- Clean Architecture verification
- Complexity metrics analysis

#### `/security` - Security Auditor

**Purpose**: Comprehensive security vulnerability detection and remediation
**Usage**: `/security`, `/security scan`, `/security fix`
**Features**:

- OWASP Top 10 compliance checking
- AWS security best practices
- Dependency vulnerability scanning
- Secret management validation

#### `/architect` - Architecture Enforcer

**Purpose**: Clean Architecture and SOLID principles compliance validation
**Usage**: `/architect`, `/architect check --layer=domain`, `/architect solid`
**Features**:

- Clean Architecture layers validation
- SOLID principles enforcement
- Dependency rules checking
- GoF patterns verification

#### `/typesafe` - Type Safety Guardian

**Purpose**: Ultimate Type Safety (8-Level System) enforcement for zero runtime errors
**Usage**: `/typesafe`, `/typesafe level-1`, `/typesafe fix`
**Features**:

- Complete `any` elimination
- Null/undefined safety
- Promise/async safety
- Type-level programming

#### `/qa` - Quality Assurance

**Purpose**: Comprehensive quality checks and build verification
**Usage**: `/qa`, `/qa quick`, `/qa deploy-ready`
**Features**:

- Zero ESLint/TypeScript errors
- Test coverage validation
- Build success verification
- Performance benchmarks

### Performance & Infrastructure Agents

#### `/perf` - Performance Optimizer

**Purpose**: Optimize application performance and Core Web Vitals
**Usage**: `/perf`, `/perf analyze`, `/perf optimize`
**Features**:

- Core Web Vitals optimization (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Lambda cold start reduction
- Bundle size optimization
- DynamoDB query optimization

#### `/docker` - Docker Manager

**Purpose**: Docker environment optimization and troubleshooting
**Usage**: `/docker`, `/docker optimize`, `/docker debug`
**Features**:

- Multi-stage build optimization
- Security hardening (non-root users)
- Compose profile management
- Build performance tuning

#### `/monorepo` - Monorepo Navigator

**Purpose**: Workspace dependency analysis and optimization
**Usage**: `/monorepo`, `/monorepo deps`, `/monorepo circular`
**Features**:

- Workspace structure analysis
- Circular dependency detection
- Build order optimization
- Version consistency checking

### Support Agents

#### `/debug` - Debug Assistant

**Purpose**: Systematic debugging following "Debug It!" methodology
**Usage**: `/debug`, `/debug analyze`, `/debug reproduce`
**Features**:

- Root cause analysis
- Hypothesis-driven debugging
- Minimal reproduction generation
- TypeScript-specific debugging patterns

#### `/tracker` - Task Progress Tracker

**Purpose**: Task and progress management for systematic development
**Usage**: `/tracker`, `/tracker complete XX-YY`, `/tracker next`
**Features**:

- Progress analysis and reporting
- Critical path optimization
- Dependency tracking
- YAML frontmatter management

#### `/guide` - Implementation Guide

**Purpose**: Provide concrete implementation examples from docs/impl/
**Usage**: `/guide [topic]`, `/guide architecture`, `/guide api`
**Features**:

- Architecture pattern examples
- API development guidance
- Testing implementation patterns
- Best practices documentation

## 🔄 Integrated Workflow

The SubAgents work together in a comprehensive development workflow:

```mermaid
graph LR
    A[/tracker] --> B[/test RED]
    B --> C[Implementation]
    C --> D[/test GREEN]
    D --> E[/qa quick]
    E --> F[/test BLUE]
    F --> G[/qa quick]
    G --> H[/architect]
    H --> I[/typesafe]
    I --> J[/security]
    J --> K[/perf]
    K --> L[/review]
    L --> M[/qa full]
    M --> N[/tracker update]
```

**Key Quality Gates:**

- After GREEN phase: Quick QA check for immediate eslint/tsc error fixes
- After BLUE phase: Second QA check to ensure refactoring maintains quality
- Final QA: Comprehensive quality verification before task completion

## 🎯 Usage Patterns

### Starting a New Feature

```bash
/tracker              # Check current progress
/test red MyFeature   # Generate failing tests
# Implement feature
/test green           # Verify tests pass
/review               # Review implementation
/security             # Security check
/qa                   # Final quality check
```

### Debugging an Issue

```bash
/debug analyze        # Analyze the error
/debug reproduce      # Create minimal repro
# Fix the issue
/test                 # Add regression test
/review               # Review the fix
```

### Performance Optimization

```bash
/perf analyze         # Identify bottlenecks
/perf optimize        # Apply optimizations
/docker optimize      # Optimize containers
/qa                   # Verify no regressions
```

## 🔧 Configuration

Each SubAgent can be configured through:

- Command-line options (e.g., `--focus`, `--quick`)
- Configuration files in `.claude/`
- Environment-specific settings

## 📊 Proactive Triggers

Some agents activate automatically:

- **Code Reviewer**: On file save or commit
- **Security Auditor**: When auth/data code changes
- **Performance Optimizer**: Before deployment

## 🚦 Success Metrics

All SubAgents enforce:

- ✅ Zero ESLint errors
- ✅ Zero TypeScript errors
- ✅ 90%+ test coverage
- ✅ All security checks pass
- ✅ Performance targets met

## 📚 Resources

Each SubAgent documentation includes:

- Detailed usage examples
- Best practices
- Common patterns
- Troubleshooting guides
- External resources

For detailed information about each SubAgent, see the individual documentation files in this directory.
