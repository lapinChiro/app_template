# Task 2.2: Docker Compose Development Environment

## Overview

Build a comprehensive Docker Compose setup with profile-based feature control, supporting all application services and optional features for local development.

## Description

Create Dockerfiles for all applications and a docker-compose.yml with profile functionality to selectively enable optional features (async jobs, scheduled tasks). Include DynamoDB Local and all development services.

## Requirements

- Docker Compose V2 compliant configuration
- Profile-based feature control (frontend, backend, full, async, scheduled)
- DynamoDB Local integration
- Development service containers
- Security hardening and best practices

## Dependencies

- **Depends on**: Task 2.1 (project initialization configuration)
- **Blocks**: Task 4.3 (Repository with DynamoDB), Task 11.1 (test environment)
- **Can work in parallel with**: Tasks 1.2-1.3 (type safety configuration)

## Implementation References

- [`@docs/impl/docker/dockerfile-strategy.md`](../docs/impl/docker/dockerfile-strategy.md) - Dockerfile strategy
- [`@docs/impl/docker/compose-architecture.md`](../docs/impl/docker/compose-architecture.md) - Docker Compose design
- [`@docs/impl/docker/security-hardening.md`](../docs/impl/docker/security-hardening.md) - Security hardening

## Acceptance Criteria

- [ ] Multi-stage Dockerfiles for all apps
- [ ] Docker Compose with profile support
- [ ] DynamoDB Local service configured
- [ ] Optional services (LocalStack for SQS/S3)
- [ ] Development tools (DynamoDB Admin, MailHog)
- [ ] Volume optimization for performance
- [ ] Security hardening implemented
- [ ] Profile commands documented

## Technical Requirements

- **Performance**: Container startup < 2 minutes
- **Security**: Non-root users, read-only filesystems where possible
- **Development UX**: Hot reload functional in all services
- **Compliance**: Docker Compose V2 best practices

## Profile Structure

```yaml
# Core profiles to implement:
profiles:
  - frontend # Member + Admin frontends
  - backend # APIs + Database
  - full # All core services
  - async # Async job processing
  - scheduled # Scheduled tasks
  - tools # Development tools
```

## Progress Tracking (Claude Code Critical)

**MANDATORY**: Create `@progress/02-02-docker-compose.md` with structured YAML frontmatter for automated progress analysis.

### Required YAML Frontmatter

```yaml
---
task_id: '02-02'
task_name: 'docker-compose'
task_status: 'completed' # MUST update when done
developer: '[Your Name]'
start_date: 'YYYY-MM-DD'
end_date: 'YYYY-MM-DD' # when completed
estimated_hours: 10
actual_hours: X.X # track actual time
blocks_tasks: ['04-03', '11-01'] # Repository with DynamoDB, test environment
depends_on_completed: ['02-01'] # requires project initialization
technical_decisions:
  base_image_strategy: '[node_bookworm|alpine|debian]' # CRITICAL: affects all containers
  compose_version: '[v2|v1_compatibility]' # Docker Compose version
  profile_architecture: '[service_based|feature_based|environment_based]' # service organization
  volume_mount_strategy: '[bind|named|tmpfs]' # performance optimization
  security_user_strategy: '[non_root|dedicated_users|root_with_caps]' # container security
  database_local_choice: '[dynamodb_local|localstack|real_aws]' # local development DB
  hot_reload_implementation: '[nodemon|tsc_watch|native]' # development experience
files_modified:
  - path: 'docker-compose.yml'
    action: 'created'
    purpose: 'Main development environment configuration'
  - path: 'apps/*/Dockerfile'
    action: 'created'
    purpose: 'Application container configurations'
  - path: '.dockerignore'
    action: 'created'
    purpose: 'Docker build optimization'
quality_metrics:
  container_startup_time: 'X minutes' # < 2 minutes requirement
  hot_reload_time: 'X seconds' # development experience
  security_scan_results: '0 high vulnerabilities' # container security
  build_success: true # MUST be true
acceptance_criteria_met: '8/8' # count completed criteria
---
```

### Critical Recording Requirements

1. **base_image_strategy** - ALL containers depend on this choice
2. **profile_architecture** - determines development workflow patterns
3. **security_user_strategy** - affects all container security
4. **Record startup performance** - < 2 minutes requirement
5. **Verify hot reload functionality** - development experience requirement

## Estimated Time

8-12 hours

## Implementation Steps

1. Create multi-stage Dockerfiles for each app
2. Design Docker Compose profile architecture
3. Configure DynamoDB Local service
4. Set up optional services (LocalStack, tools)
5. Implement security hardening measures
6. Optimize volume mounts for performance
7. Test all profile combinations
8. Document usage and troubleshooting
9. Verify hot reload functionality

---

_Task Status: Ready for Implementation_
_Critical for all subsequent development tasks_
