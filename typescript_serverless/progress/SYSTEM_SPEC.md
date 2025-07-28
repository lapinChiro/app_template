# Progress Management System Specification

## Overview

This document defines the specification for the progress management system used in this project. The system tracks task completion, dependencies, and project velocity using a combination of YAML frontmatter and markdown files.

## Directory Structure

```
progress/
├── SUMMARY.md          # Overall project progress summary (auto-generated)
├── IN_PROGRESS.md      # Currently active tasks
├── HANDOVER.md         # Task handover notes for continuity
├── SYSTEM_SPEC.md      # This specification document
├── completed/          # Completed task records
│   ├── 01-01.md       # Individual completed task files
│   └── ...
├── in-progress/        # In-progress task details (when active)
└── templates/          # File format templates
    ├── summary.md      # Template for SUMMARY.md
    ├── in-progress.md  # Template for IN_PROGRESS.md
    └── task-file.md    # Template for individual task files
```

## Important Notes

- **NO @progress/ directory**: The `@progress/` directory is deprecated. All progress files are in `progress/` directory.
- **Path references**: Always use `progress/` without the `@` symbol. All paths are relative to project root.
- **Automatic management**: Files should be managed by the tracker SubAgent, not edited manually

## File Formats

### Task File Format (YAML Frontmatter)

```yaml
---
task_id: 'XX-YY'
task_name: 'descriptive-name'
task_status: 'completed|in_progress|pending'
developer: 'name'
start_date: 'YYYY-MM-DD'
estimated_hours: N
actual_hours: N
blocks_tasks: ['XX-YY', 'XX-YY']    # Tasks that depend on this
depends_on_completed: ['XX-YY']      # Prerequisites
technical_decisions:
  key: 'value'
files_modified: ['file1', 'file2']
quality_metrics:
  eslint_errors: 0
  typescript_errors: 0
  build_success: true
acceptance_criteria_met: 'N/M'
---
```

### SUMMARY.md Format

The SUMMARY.md file contains:
- Overall progress metrics in YAML frontmatter
- Recently completed tasks
- Critical path analysis
- Velocity metrics
- Next recommended tasks
- Category-based progress

### IN_PROGRESS.md Format

Tracks currently active tasks with:
- Task ID and name
- Developer assignment
- Start time and last update
- Current status and progress percentage
- Current focus and next steps

## Task States

1. **pending**: Task not yet started
2. **in_progress**: Currently being worked on (limit to ONE at a time)
3. **completed**: Task finished successfully
4. **blocked**: Task cannot proceed due to dependencies

## Workflow

### Starting a Task

1. Tracker agent selects optimal task based on dependencies
2. Creates entry in IN_PROGRESS.md
3. Creates file in in-progress/ directory
4. Updates task file with `task_status: 'in_progress'`

### Completing a Task

1. Remove entry from IN_PROGRESS.md
2. Move file from in-progress/ to completed/
3. Update task file with `task_status: 'completed'`
4. Update dependent tasks' status
5. Regenerate SUMMARY.md
6. Add handover notes to HANDOVER.md

## Integration Points

### /dev Command

1. Reads progress/SUMMARY.md and progress/IN_PROGRESS.md
2. Uses tracker agent to analyze and select next task
3. Follows workflow defined in prompt.md
4. Updates progress using tracker agent

### SubAgent Commands

- `analyze`: Analyze progress and select next task
- `start XX-YY`: Mark task as started
- `complete XX-YY with handover: [...]`: Complete task with notes
- `summary`: Update SUMMARY.md with latest metrics

## Best Practices

1. **Single source of truth**: Progress files are the authoritative source
2. **Atomic updates**: All related files updated together
3. **Dependency tracking**: Always update blocked/unblocked tasks
4. **Handover notes**: Document important information for continuity
5. **Regular summaries**: Keep SUMMARY.md current with task completions

## Migration from Legacy System

The previous `@progress/` directory has been deprecated. If you encounter references to `@progress/`:
1. Replace with `progress/` (without the @)
2. Report the outdated reference for correction
3. Do not create new files in `@progress/`

## Version History

- v2.0 (2025-07-28): Current system with progress/ directory
- v1.0 (2025-01-28): Legacy system with @progress/ directory (deprecated)