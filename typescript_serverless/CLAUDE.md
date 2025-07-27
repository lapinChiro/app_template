# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

回答は全て日本語で行ってください。

## Project Overview

TypeScript serverless monorepo application with Next.js frontends, AWS Lambda backends, and CDK infrastructure.

## Core Methodology

Follow "The Pragmatic Programmer" with phase-based quality principles:

### Phase-Based Quality Application
- **Phase 1 (Solution Research)**: "Don't Reinvent the Wheel" principle
- **Phase 2 (Design Foundation)**: "UNIX philosophy", "KISS principle", "Effective TypeScript principles"  
- **Phase 3 (Implementation Quality)**: "DRY principle", "Orthogonality principle"

### Key Synergistic Effects - 15 Pairs Total
Complete synergy matrix optimizes for structured thinking and emergent quality improvements:

1. **DRY × Orthogonality**: 適切な抽象化粒度の実現
2. **DRY × UNIX**: 微細粒度での再利用可能コンポーネント
3. **DRY × KISS**: 過度な抽象化防止による適切な共通化
4. **DRY × Don't Reinvent**: 包括的重複排除戦略
5. **DRY × Effective TypeScript**: 型システム活用した意味的抽象化
6. **Orthogonality × UNIX**: 完璧なモジュラー設計への強い動機
7. **Orthogonality × KISS**: クリーンなAPI設計の実現
8. **Orthogonality × Don't Reinvent**: 戦略的依存関係管理
9. **Orthogonality × Effective TypeScript**: 型レベルでの責任分離
10. **UNIX × KISS**: シンプリシティへの強化された確信
11. **UNIX × Don't Reinvent**: 戦略的ツール組み合わせ思考
12. **UNIX × Effective TypeScript**: 組み合わせ可能な型アーキテクチャ
13. **KISS × Don't Reinvent**: 明確な判断基準による迅速な意思決定
14. **KISS × Effective TypeScript**: 実用的型設計、過剰エンジニアリング防止
15. **Don't Reinvent × Effective TypeScript**: ライブラリ型定義の効果的活用

### Cognitive Load Optimization
- レイヤー統一性による認知負荷軽減（全て品質基準層に統一）
- 段階的適用による構造化思考プロセス
- プロセス層（SubAgent/TDD）と品質層（CLAUDE.md）の明確分離

## Supporting Practices

- Apply "Debug It!" strategies for systematic problem solving
- Use "Functional-Light JavaScript" patterns for pure functions
- Consider "Steve Souders" performance principles for optimization
- Follow "Three Pillars of Observability" for monitoring
- Apply "REST API Design Rulebook" for API consistency

## Focus Areas

### Phase 1 (Solution Research)
- Leverage existing solutions over custom implementation (Don't Reinvent the Wheel)
- Comprehensive dependency and library analysis

### Phase 2 (Design Foundation)  
- Modular, composable architecture (UNIX philosophy)
- Simplicity over complexity (KISS principle)
- Type-first design approach (Effective TypeScript principles)

### Phase 3 (Implementation Quality)
- Eliminate code duplication through strategic abstraction (DRY principle) 
- Ensure component independence and clean separation (Orthogonality principle)
- Maximize 15-pair synergistic effects for emergent quality improvements

### Ultimate Type Safety (8-Level System)

**ZERO TOLERANCE** for type unsafe code:

1. **Level 1**: Strict TypeScript configuration (no implicit any)
2. **Level 2**: ESLint rules for complete 'any' elimination
3. **Level 3**: Zod schemas for runtime type validation
4. **Level 4**: Branded types for business logic safety
5. **Level 5**: Template literal types for compile-time validation
6. **Level 6**: Conditional types for complex type logic
7. **Level 7**: Mapped types for type transformations
8. **Level 8**: Type-level programming for ultimate safety

**Enforcement**: 0 ESLint errors, 0 TypeScript errors, 0 'any' types allowed

## Development Principles

- **Architecture**: Clean Architecture + SOLID principles - apply GoF patterns when solving actual problems
- **Quality**: 12-Factor App configuration + Test Pyramid strategy + zero type/lint/test failures
- **Workflow**: GitHub Flow with atomic commits and quality gates before commits/PRs
- **Security**: Defensive programming only - no offensive code or malware
- **Consistency**: DRY principles - keep codebase necessary and sufficient

### Key GoF Patterns

- **Builder Pattern**: Domain object creation with validation
- **Strategy Pattern**: Theme switching in UI components
- **Facade Pattern**: Simplified API operations

## Claude Code Execution Principles

### Parallel Tool Execution (Critical)

- Execute independent operations concurrently to minimize response time
- Run git info gathering, file reading, and quality checks in parallel
- TodoWrite's "single in_progress task" is logical management - physically parallelize tool execution

### Task Management (TodoWrite Required)

- Complex tasks (3+ steps) must use TodoWrite for planning and management
- Assign priorities: high/medium/low
- State transitions: `pending` → `in_progress` → `completed`

### SubAgents Integration (MANDATORY)

**12 specialized SubAgents** that must be used for optimal development:

**Core Development Agents**:

- **Test Creator** (`test`): TDD cycle automation with RED-GREEN-BLUE support
- **Code Reviewer** (`review`): SOLID principles and TypeScript best practices enforcement
- **Security Auditor** (`security`): OWASP Top 10 compliance and vulnerability detection
- **Architecture Enforcer** (`architect`): Clean Architecture + SOLID compliance validation
- **Type Safety Guardian** (`typesafe`): Ultimate Type Safety (8-level) enforcement
- **Quality Assurance** (`qa`): Comprehensive quality checks and build verification

**Infrastructure & Optimization Agents**:

- **Performance Optimizer** (`perf`): Core Web Vitals and serverless optimization
- **Docker Manager** (`docker`): Container environment optimization and troubleshooting
- **Monorepo Navigator** (`monorepo`): Workspace dependency analysis and optimization

**Support Agents**:

- **Debug Assistant** (`debug`): Systematic debugging with "Debug It!" methodology
- **Implementation Guide** (`guide`): @docs/impl/ based implementation guidance
- **Task Progress Tracker** (`tracker`): @tasks/ and @progress/ management

**Usage Pattern**: Use specific agents for specialized tasks via Task tool or explicit requests
**Proactive Agents**: Code Reviewer, Security Auditor, Quality Assurance, and Task Progress Tracker auto-invoke for continuous monitoring

**EXECUTION RULE**: When user requests `/dev`, Claude Code must:

1. **ALWAYS START** with Task tool using `tracker` for progress analysis and task selection
2. **IMPLEMENT WITH TDD** using Task tool with `test` agent (red → green → blue cycle)
3. **USE CONTEXTUAL AGENTS** during implementation (e.g., `architect`, `typesafe`, `guide`)
4. **QUALITY VERIFICATION** with `security` → `review` → `qa` agents
5. **UPDATE PROGRESS** with `tracker` for next task recommendations

**Reference**: See @.claude/agents/README.md for detailed usage patterns

### Optimized Development Workflow

**Quick Mode** (minimum quality checks):

```txt
tracker → test → qa → tracker
```

**Standard Mode** (recommended with integrated quality gates):

```txt
tracker → test (red) → test (green) → qa (quick) →
test (blue) → qa (quick) → review → qa → tracker
```

**Thorough Mode** (maximum quality):

```txt
tracker → guide → test (red) → test (green) → qa (quick) →
test (blue) → qa (quick) → architect → typesafe → security →
review → qa → tracker
```

**Note**: These agents are invoked using the Task tool or through explicit requests, not as slash commands.