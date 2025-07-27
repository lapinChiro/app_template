# Task 1.3: Prettier + ESLint Integration

## Overview

Integrate Prettier with ESLint to resolve conflicts and establish unified code formatting across the team with automated pre-commit hooks.

## Description

Configure Prettier to work seamlessly with ESLint while maintaining the ultimate type safety rules. Set up VS Code integration and pre-commit hooks for automatic code formatting.

## Requirements

- Resolve ESLint and Prettier rule conflicts
- Unified VS Code settings for team consistency
- Pre-commit hooks for automatic formatting
- Automated code format enforcement in CI/CD

## Dependencies

- **Depends on**: Task 1.1 (monorepo foundation)
- **Blocks**: Task 2.3 (workflow setup with pre-commit hooks)
- **Can work in parallel with**: Task 1.2 (ESLint configuration)

## Implementation Reference

- [`@docs/impl/type-safety/prettier-integration.md`](../docs/impl/type-safety/prettier-integration.md)

## Acceptance Criteria

- [ ] Prettier configured with ESLint compatibility
- [ ] VS Code settings synchronized across team
- [ ] Pre-commit hooks functioning (lint + format)
- [ ] No formatting conflicts between ESLint and Prettier
- [ ] All code auto-formats on save
- [ ] Consistent formatting across all workspaces

## Technical Requirements

- **Code Style**: 100% consistent formatting
- **Developer Experience**: Format on save < 1 second
- **Team Consistency**: Unified VS Code configuration

## Key Integrations

```json
// Core Prettier + ESLint integration
{
  "extends": ["@typescript-eslint/recommended", "prettier", "prettier/@typescript-eslint"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error"
  }
}
```

## Progress Tracking (Claude Code Critical)

**MANDATORY**: Create `@progress/01-03-prettier-integration.md` with structured YAML frontmatter for automated progress analysis.

### Required YAML Frontmatter

```yaml
---
task_id: '01-03'
task_name: 'prettier-integration'
task_status: 'completed' # MUST update when done
developer: '[Your Name]'
start_date: 'YYYY-MM-DD'
end_date: 'YYYY-MM-DD' # when completed
estimated_hours: 4
actual_hours: X.X # track actual time
blocks_tasks: ['02-03'] # pre-commit hooks workflow
depends_on_completed: ['01-01'] # requires project structure
technical_decisions:
  prettier_config_approach: '[shared|workspace_specific|inherited]' # CRITICAL: affects all code formatting
  eslint_prettier_integration: '[plugin|config|disable_conflicts]' # conflict resolution strategy
  pre_commit_hook_tool: '[husky|pre_commit|git_hooks]' # automation choice
  format_on_save: '[enabled|disabled]' # developer experience setting
  max_line_length: '[80|100|120]' # code style standard
  tab_width: '[2|4]' # indentation standard
files_modified:
  - path: '.prettierrc'
    action: 'created'
    purpose: 'Prettier configuration'
  - path: '.vscode/settings.json'
    action: 'created'
    purpose: 'VS Code workspace settings'
  - path: 'package.json'
    action: 'modified'
    purpose: 'Pre-commit hooks configuration'
quality_metrics:
  eslint_errors: 0 # MUST be 0
  typescript_errors: 0 # MUST be 0
  format_conflicts: 0 # MUST be 0 between ESLint and Prettier
  format_time: 'X ms' # format on save performance
  build_success: true # MUST be true
acceptance_criteria_met: '6/6' # count completed criteria
---
```

### Critical Recording Requirements

1. **prettier_config_approach & eslint_prettier_integration** - affects ALL code formatting
2. **max_line_length & tab_width** - establishes team code style standards
3. **pre_commit_hook_tool** - automation foundation for all workflows
4. **Record format performance** - < 1 second requirement
5. **Verify zero conflicts** - ESLint and Prettier must work together

## Estimated Time

3-4 hours

## Implementation Steps

1. Install Prettier and ESLint integration packages
2. Configure Prettier rules without ESLint conflicts
3. Set up unified VS Code workspace settings
4. Implement pre-commit hooks (husky + lint-staged)
5. Test formatting across all workspace types
6. Create team setup documentation
7. Verify CI/CD formatting checks

---

_Task Status: Ready for Implementation_
_Can be done in parallel with Task 1.2_
