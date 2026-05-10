# Issue 9: Spinner + Empty State + Error State components + migration

## What to build

Build three state-display components that replace widely-duplicated loading, empty, and error patterns across the app.

### Components

**`<ui-spinner>`** (`src/app/shared/ui/spinner/ui-spinner.ts`)
Wraps `mat-spinner` with consistent sizing and optional message. Inputs: `diameter: number` (default 40), `message: string`, `inline: boolean` (default false). Normalizes 62 spinner occurrences that currently use varying diameters (18/20/28/40px).

**`<ui-empty-state>`** (`src/app/shared/ui/empty-state/ui-empty-state.ts`)
Icon + heading + description + optional CTA button pattern. Inputs: `icon: string` (default 'inbox'), `heading: string` (required), `description: string`, `ctaLabel: string`. Output: `ctaClicked`. Replaces 23 files with the same duplicated pattern.

**`<ui-error-state>`** (`src/app/shared/ui/error-state/ui-error-state.ts`)
Error display with retry. Inputs: `heading: string` (default 'Something went wrong'), `description: string`, `retryLabel: string` (default 'Retry'). Output: `retryClicked`.

### Migrations

Migrate spinner, empty-state, and error-state patterns across the app. Prioritize the highest-count files:
- Task-list (spinners + empty state + error state)
- Project view (spinners + empty state)
- Task details views (spinners + error states)
- Any remaining views with these patterns

### Tests

Unit tests for all three components. Update affected consumer tests.

## Acceptance criteria

- [ ] `<ui-spinner>` component exists with diameter, message, and inline mode support
- [ ] `<ui-empty-state>` component exists with icon, heading, description, and CTA
- [ ] `<ui-error-state>` component exists with heading, description, and retry
- [ ] Spinner occurrences across the app migrated to `<ui-spinner>`
- [ ] Empty state patterns migrated to `<ui-empty-state>`
- [ ] Error state patterns migrated to `<ui-error-state>`
- [ ] Unit tests for all three components
- [ ] All affected consumer tests pass
- [ ] `ng build` succeeds
- [ ] Manual browser test: loading spinners display correctly, empty states show with correct icons/text/CTAs, error states show retry button that works

## Blocked by

- Issue 1: Foundation
