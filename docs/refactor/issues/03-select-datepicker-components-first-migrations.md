# Issue 3: Select + Datepicker components + first migrations

## What to build

Build two ControlValueAccessor wrapper components for selection inputs and migrate their simplest consumers.

### Components

**`<ui-select>`** (`src/app/shared/ui/select/ui-select.ts`)
Wraps `mat-select` inside `mat-form-field`. Inputs: `label` (required), `options: Array<{ value: T; label: string; icon?: string }>` (required), `multiple: boolean`, `placeholder`, `errorMessages`. Standalone, OnPush, ControlValueAccessor.

**`<ui-datepicker>`** (`src/app/shared/ui/datepicker/ui-datepicker.ts`)
Wraps `mat-datepicker` inside `mat-form-field`. Inputs: `label` (required), `min`/`max: Date | null`, `errorMessages`. Standalone, OnPush, ControlValueAccessor.

### Migrations

1. **`task-filters`** — replace the status, assignee, priority, and type multi-select dropdowns with `<ui-select multiple>`. Replace the date range pickers (2x) with `<ui-datepicker>`. Replace the search input with `<ui-text-input>` (from Issue 2).
2. **`manual-time-entry-form`** — replace the date picker with `<ui-datepicker>`. Replace hours/minutes number inputs with `<ui-text-input type="number">` and the note textarea with `<ui-textarea>` (from Issue 2).

### Tests

Unit tests for both components covering: single/multiple selection, option rendering with icons, date min/max constraints, CVA binding, disabled state. Update existing consumer tests.

## Acceptance criteria

- [x] `<ui-select>` component exists with CVA, supports single and multiple selection with optional icons
- [x] `<ui-datepicker>` component exists with CVA, supports min/max date constraints
- [x] `task-filters` uses `<ui-select>` for all dropdown filters and `<ui-datepicker>` for date range
- [x] `manual-time-entry-form` uses `<ui-datepicker>` for date, `<ui-text-input>` for number inputs, `<ui-textarea>` for note
- [x] Unit tests for both new components
- [x] Existing task-filters and manual-time-entry tests pass
- [x] `ng build` succeeds
- [x] Manual browser test: filters work correctly, manual time entry form submits, date pickers enforce constraints

## Blocked by

- Issue 1: Foundation
- Issue 2: Text Input + Textarea (needed for task-filters search input and manual-time-entry migrations)
