# Task 5.1: shadcn/ui + Tailwind CSS Foundation

## Overview

Establish the UI foundation using shadcn/ui and Tailwind CSS with a dual-theme system supporting both Member and Admin interfaces with proper type safety.

## Description

Set up the complete UI foundation including shadcn/ui integration, Tailwind CSS configuration, Member/Admin theme system using Strategy Pattern, and Class Variance Authority (CVA) for component variants.

## Requirements

- shadcn/ui integration with Tailwind CSS
- Dual-theme system (Member/Admin)
- CVA-based component variants
- Type-safe theme configuration
- Responsive design system

## Dependencies

- **Depends on**: Task 1.1 (monorepo), Task 3.3 (Strategy Pattern for themes)
- **Blocks**: Tasks 5.2-5.3 (UI components), Tasks 8.1-8.3 (Member Frontend), Tasks 9.1-9.3 (Admin Frontend)
- **Can work in parallel with**: None (UI foundation required first)

## Implementation Reference

- [`@docs/impl/ui/shadcn-tailwind.md`](../docs/impl/ui/shadcn-tailwind.md)

## Acceptance Criteria

- [ ] shadcn/ui properly configured in packages/ui
- [ ] Tailwind CSS with custom theme configuration
- [ ] Member theme (colors, typography, spacing)
- [ ] Admin theme (colors, typography, spacing)
- [ ] Theme strategy pattern implementation
- [ ] CVA component variant system
- [ ] Dark/light mode support for both themes
- [ ] Type-safe theme utilities

## Technical Requirements

- **Theme Switching**: < 100ms theme change performance
- **Type Safety**: Full TypeScript support for all theme values
- **Responsive Design**: Mobile-first responsive system
- **Accessibility**: WCAG 2.1 AA compliance

## Theme Architecture

```typescript
// Core theme system to implement:
interface ThemeConfig {
  member: {
    colors: ColorPalette;
    typography: TypographyScale;
    spacing: SpacingScale;
    components: ComponentTokens;
  };
  admin: {
    colors: ColorPalette;
    typography: TypographyScale;
    spacing: SpacingScale;
    components: ComponentTokens;
  };
}

// CVA variant system
const buttonVariants = cva('base-button-classes', {
  variants: {
    variant: {
      member: 'member-button-styles',
      admin: 'admin-button-styles',
    },
    size: {
      sm: 'small-button-styles',
      md: 'medium-button-styles',
      lg: 'large-button-styles',
    },
  },
});
```

## Progress Tracking (Claude Code Critical)

**MANDATORY**: Create `@progress/05-01-shadcn-tailwind-foundation.md` with structured YAML frontmatter for automated progress analysis.

### Required YAML Frontmatter

```yaml
---
task_id: '05-01'
task_name: 'shadcn-tailwind-foundation'
task_status: 'completed' # MUST update when done
developer: '[Your Name]'
start_date: 'YYYY-MM-DD'
end_date: 'YYYY-MM-DD' # when completed
estimated_hours: 9
actual_hours: X.X # track actual time
blocks_tasks: ['05-02', '05-03', '08-01', '08-02', '08-03', '09-01', '09-02', '09-03'] # All UI and frontend development
depends_on_completed: ['01-01', '03-03'] # requires monorepo and Strategy Pattern
technical_decisions:
  ui_framework_integration: '[shadcn_full|shadcn_selective|custom_components]' # CRITICAL: affects all UI development
  theme_switching_mechanism: '[css_variables|context_api|class_based]' # theme implementation
  color_system_approach: '[hsl|rgb|oklch]' # color space choice
  responsive_breakpoint_strategy: '[mobile_first|desktop_first|container_queries]' # responsive design
  component_variant_library: '[cva|stitches|vanilla_extract]' # variant system
  dark_mode_implementation: '[system_preference|user_toggle|both]' # dark mode strategy
  accessibility_testing_approach: '[automated|manual|hybrid]' # a11y verification
files_modified:
  - path: 'packages/ui/package.json'
    action: 'created'
    purpose: 'UI package with shadcn/ui dependencies'
  - path: 'packages/ui/tailwind.config.js'
    action: 'created'
    purpose: 'Tailwind CSS theme configuration'
  - path: 'packages/ui/src/themes/'
    action: 'created'
    purpose: 'Member and Admin theme definitions'
quality_metrics:
  eslint_errors: 0 # MUST be 0
  typescript_errors: 0 # MUST be 0
  theme_switch_time: 'X ms' # < 100ms requirement
  accessibility_score: 'AA' # WCAG 2.1 AA compliance
  build_success: true # MUST be true
acceptance_criteria_met: '8/8' # count completed criteria
---
```

### Critical Recording Requirements

1. **ui_framework_integration & theme_switching_mechanism** - ALL UI development depends on these
2. **component_variant_library** - affects all component implementations
3. **responsive_breakpoint_strategy** - determines mobile/desktop experience
4. **Record theme switch performance** - < 100ms requirement
5. **Verify accessibility compliance** - WCAG 2.1 AA requirement

## Estimated Time

8-10 hours

## Implementation Steps

1. Initialize shadcn/ui in packages/ui workspace
2. Configure Tailwind CSS with custom theme tokens
3. Implement Member theme configuration
4. Implement Admin theme configuration
5. Set up theme strategy pattern
6. Create CVA variant system
7. Test theme switching functionality
8. Verify accessibility compliance
9. Document theme usage patterns

---

_Task Status: Ready for Implementation_
_Critical foundation for all UI development_
