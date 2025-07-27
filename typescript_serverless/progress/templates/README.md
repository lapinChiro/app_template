# Progress Templates

This directory contains templates used by the task-progress-tracker agent.

## Templates

- `task-frontmatter.yaml` - YAML frontmatter format for task files
- `task-categories.yaml` - Standard task category definitions
- `summary.md` - SUMMARY.md file template
- `in-progress.md` - IN_PROGRESS.md file template
- `task-file.md` - Individual task progress file template
- `output-format.md` - Standard output format for progress analysis
- `progress-dashboard.yaml` - Progress dashboard template

## Usage

These templates are referenced by the task-progress-tracker agent at:
`@repo/.claude/agents/task-progress-tracker.md`

The tracker reads these templates when generating or updating progress files.