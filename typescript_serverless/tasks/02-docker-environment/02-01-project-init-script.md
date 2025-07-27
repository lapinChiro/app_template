# Task 2.1: Interactive Project Initialization Script

## Overview

Create an interactive `npm run init` command that allows developers to configure project settings and optional features through a guided setup process.

## Description

Implement a comprehensive project initialization script that configures environment variables, optional features (async jobs, scheduled tasks), and generates necessary configuration files automatically.

## Requirements

- Interactive CLI for project configuration
- Optional feature selection (async jobs, scheduled tasks)
- Automatic environment file generation
- Project customization options

## Dependencies

- **Depends on**: Task 1.1 (monorepo foundation)
- **Blocks**: Task 2.2 (Docker environment), Tasks 10.1-10.4 (CDK Stack)
- **Can work in parallel with**: Task 2.3 (workflow setup)

## Implementation Reference

- [`@docs/impl/workflow/project-init.md`](../docs/impl/workflow/project-init.md)

## Acceptance Criteria

- [ ] `npm run init` command implemented
- [ ] Interactive prompts for project configuration
- [ ] Optional feature selection UI
- [ ] Automatic .env file generation
- [ ] Project name and settings customization
- [ ] Feature flags for async/scheduled jobs
- [ ] Configuration validation and error handling

## Technical Requirements

- **User Experience**: Setup completion < 10 minutes
- **Validation**: All generated configs must be valid
- **Flexibility**: Support different deployment targets

## Core Features to Implement

```typescript
interface ProjectConfig {
  projectName: string;
  domain?: string;
  features: {
    asyncJobs: boolean;
    scheduledTasks: boolean;
    adminPanel: boolean;
  };
  environment: 'development' | 'staging' | 'production';
  database: {
    tablePrefix: string;
  };
}
```

## Progress Tracking (Claude Code Critical)

**MANDATORY**: Create `@progress/02-01-project-init-script.md` with structured YAML frontmatter for automated progress analysis.

### Required YAML Frontmatter

```yaml
---
task_id: '02-01'
task_name: 'project-init-script'
task_status: 'completed' # MUST update when done
developer: '[Your Name]'
start_date: 'YYYY-MM-DD'
end_date: 'YYYY-MM-DD' # when completed
estimated_hours: 7
actual_hours: X.X # track actual time
blocks_tasks: ['02-02', '10-01', '10-02', '10-03', '10-04'] # Docker environment and CDK stacks
depends_on_completed: ['01-01'] # requires project structure
technical_decisions:
  cli_framework: '[inquirer|prompts|commander]' # CRITICAL: affects all interactive tooling
  config_generation_approach: '[template|programmatic|hybrid]' # file generation strategy
  env_file_structure: '[single|environment_specific|layered]' # environment management
  feature_flag_system: '[config_file|env_vars|both]' # optional features approach
  validation_strategy: '[zod|joi|custom]' # input validation choice
  project_customization_level: '[basic|advanced|full]' # configuration depth
files_modified:
  - path: 'scripts/init.js'
    action: 'created'
    purpose: 'Interactive project initialization script'
  - path: 'templates/env.template'
    action: 'created'
    purpose: 'Environment file template'
  - path: 'package.json'
    action: 'modified'
    purpose: 'Added init script command'
quality_metrics:
  eslint_errors: 0 # MUST be 0
  typescript_errors: 0 # MUST be 0
  init_completion_time: 'X minutes' # < 10 minutes requirement
  config_validation_coverage: '100%' # all inputs validated
  build_success: true # MUST be true
acceptance_criteria_met: '7/7' # count completed criteria
---
```

### Critical Recording Requirements

1. **cli_framework** - ALL future interactive tooling depends on this choice
2. **env_file_structure** - affects deployment and infrastructure setup
3. **feature_flag_system** - enables/disables async jobs, scheduled tasks
4. **Record setup time** - < 10 minutes user experience requirement
5. **Verify all configs validate** - generated files must be valid

## Estimated Time

6-8 hours

## Implementation Steps

1. Choose CLI framework (inquirer.js recommended)
2. Design interactive configuration flow
3. Implement project settings prompts
4. Create environment file generation logic
5. Add optional feature selection
6. Implement configuration validation
7. Test initialization flow end-to-end
8. Create user documentation

---

_Task Status: Ready for Implementation_
_Critical foundation for infrastructure setup_
