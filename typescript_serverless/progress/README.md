# Progress Tracking Directory

This directory contains task progress and implementation records.

## Important Files

### SUMMARY.md (Overall Progress)
- **Purpose**: Project-wide progress overview
- **Updates**: Automatically via `tracker` with `summary` command
- **Contents**: Completion rates, velocity metrics, critical path analysis
- **Template**: See templates/summary.md

### IN_PROGRESS.md (Active Tasks)
- **Purpose**: Track currently active and interrupted tasks
- **Updates**: Automatically when tasks start/pause/complete
- **Contents**: Active task details, interrupted task detection
- **Template**: See templates/in-progress.md

## Task Progress Files

- **Location**: Organized in subdirectories (completed/, in-progress/, backlog/)
- **Format**: XX-YY.md with YAML frontmatter
- **Contents**:
  - YAML frontmatter with structured metadata
  - Implementation notes and decisions
  - Code snippets and patterns used
  - Quality metrics and test results

## Workflow Integration

```bash
# Start of development session
Read @progress/SUMMARY.md         # Check overall state
Read @progress/IN_PROGRESS.md     # Check for interrupted work

# During development
tracker start XX-YY               # Mark task as started
tracker pause XX-YY               # Pause with state saved
tracker complete XX-YY            # Mark as completed
tracker summary                   # Update SUMMARY.md
```

## Interruption Handling

Tasks in IN_PROGRESS.md without activity for >2 hours are automatically marked as potentially interrupted, preserving all work state for easy resumption.

## Directory Structure

```
progress/
├── SUMMARY.md          # Overall progress summary (auto-generated)
├── IN_PROGRESS.md      # Currently active tasks (auto-generated)
├── README.md           # This file
├── templates/          # File format templates
│   ├── summary.md      # SUMMARY.md template
│   ├── in-progress.md  # IN_PROGRESS.md template
│   ├── task-file.md    # Individual task file template
│   └── ...             # Other templates
├── completed/          # Completed task records
│   ├── 01-01.md
│   └── 01-02.md
├── in-progress/        # Active task details
│   ├── 02-01.md
│   └── 03-01.md
└── backlog/           # Pending tasks
    ├── 04-01.md
    └── 05-01.md
```

## YAML Frontmatter Format

```yaml
---
task_id: 'XX-YY'
task_name: 'descriptive-name'
task_status: 'pending' | 'in_progress' | 'completed' | 'blocked'
developer: 'developer-name'
start_date: 'YYYY-MM-DD'
end_date: 'YYYY-MM-DD'
estimated_hours: X
actual_hours: X.X
blocks_tasks: ['XX-YY', 'XX-YY']
depends_on_completed: ['XX-YY']
technical_decisions:
  key_choice: 'chosen-option'
  pattern: 'implementation-approach'
files_modified:
  - path: 'path/to/file'
    action: 'created|modified|deleted'
    purpose: 'what this file does'
quality_metrics:
  eslint_errors: 0
  typescript_errors: 0
  build_success: true
acceptance_criteria_met: 'X/Y'
---
```

## Best Practices

1. **Always check IN_PROGRESS.md** at the start of each session
2. **Update task status immediately** when starting/pausing/completing
3. **Document technical decisions** in the YAML frontmatter
4. **Track quality metrics** for continuous improvement
5. **Use the tracker agent** for all progress management