# Issue 1: Foundation — shared types, display utils, path alias

## What to build

Set up the `src/app/shared/ui/` directory structure that all subsequent UI library components depend on. This includes:

- **Barrel export** (`index.ts`) so consumers import from a single path.
- **Shared types** (`models/ui-types.ts`) — `ButtonVariant`, `SelectOption<T>`, and any other types shared across UI components.
- **Display utilities** (`utils/display.utils.ts`) — extract the duplicated helper functions `getStatusLabel()`, `getStatusIcon()`, `getStatusBadgeClass()`, `getPriorityLabel()`, `getPriorityIcon()`, `getPriorityClass()`, and `formatDate()` that currently live in 5+ component files (task-list, task-detail-dialog, task-full-details-workspace, project, task-tree).
- **Path alias** — add `@ui/*` mapping to `tsconfig.json` pointing at `src/app/shared/ui/*`.

The display utils extraction is the most important part: these functions are the foundation for the status-badge and priority-indicator components later. Write unit tests for all extracted utils.

Do NOT remove the duplicated helpers from their current files yet — that happens in later slices when the consumer components are migrated.

## Acceptance criteria

- [x] `src/app/shared/ui/index.ts` barrel export exists
- [x] `src/app/shared/ui/models/ui-types.ts` defines shared types (`ButtonVariant`, `SelectOption<T>`, etc.)
- [x] `src/app/shared/ui/utils/display.utils.ts` contains all 7 extracted helper functions
- [x] `src/app/shared/ui/utils/display.utils.spec.ts` has unit tests covering all helpers
- [x] `tsconfig.json` has `@ui/*` path alias pointing to `src/app/shared/ui/*`
- [x] `ng build` succeeds with no errors
- [x] All existing tests continue to pass

## Blocked by

None - can start immediately
