# Issue 7: Status Badge + Priority Indicator + task-list migration

## What to build

Build two display components that encapsulate the duplicated status/priority rendering logic, then migrate the highest-density consumer (task-list) to validate them.

### Components

**`<ui-status-badge>`** (`src/app/shared/ui/status-badge/ui-status-badge.ts`)
Encapsulates `getStatusLabel()`, `getStatusBadgeClass()`, `getStatusIcon()` from display.utils.ts. Inputs: `status: TaskStatus` (required), `showIcon: boolean` (default true), `showDot: boolean` (default true), `size: 'sm' | 'md'` (default 'md'). Eliminates 50+ inline usages across 13 files.

**`<ui-priority-indicator>`** (`src/app/shared/ui/priority-indicator/ui-priority-indicator.ts`)
Encapsulates `getPriorityLabel()`, `getPriorityIcon()`, `getPriorityClass()`. Inputs: `priority: TaskPriority` (required), `showLabel: boolean` (default true), `showIcon: boolean` (default true), `size: 'sm' | 'md'` (default 'md').

### Migration

Migrate `task-list.component.html` and `task-list.component.ts`:
- Replace all inline status rendering (badge classes, icons, labels) with `<ui-status-badge>`
- Replace all inline priority rendering with `<ui-priority-indicator>`
- Remove the duplicated helper methods from `task-list.component.ts` that are now handled by the components

Task-list is the highest-density consumer and the best first target to validate these components cover all use cases.

### Tests

Unit tests for both components covering: all status/priority values render correctly, size variants, icon/label/dot toggles. Update task-list tests.

## Acceptance criteria

- [ ] `<ui-status-badge>` renders correct label, icon, dot, and CSS class for every `TaskStatus` value
- [ ] `<ui-priority-indicator>` renders correct label, icon, and CSS class for every `TaskPriority` value
- [ ] `task-list.component.html` uses `<ui-status-badge>` and `<ui-priority-indicator>` everywhere
- [ ] Duplicated helper methods removed from `task-list.component.ts`
- [ ] Unit tests for both new components
- [ ] `task-list.component.spec.ts` passes
- [ ] `ng build` succeeds
- [ ] Manual browser test: task list renders status badges and priority indicators identically to before

## Blocked by

- Issue 1: Foundation (for display.utils.ts)
