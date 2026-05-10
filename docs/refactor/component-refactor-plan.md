# Reusable UI Component Library — Refactoring Plan

## Context

The project is an Angular 21 app (standalone components, Angular Material 21.1.1, Tailwind CSS 4.1.12) with **zero reusable form/input wrapper components**. Every form repeats the same `mat-form-field > mat-label > matInput > @if mat-error` boilerplate. Status badges, loading states, empty states, and pagination are duplicated across 13-37 files each with inconsistent implementations.

This plan extracts a `src/app/shared/ui/` library of reusable components to eliminate duplication, enforce consistency, and speed up future feature development.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Form inputs | ControlValueAccessor | All forms already use ReactiveFormsModule; CVA integrates seamlessly with `formControlName` |
| Table | Column-definition config | Only 2-3 tables exist; a fully generic table is over-engineered |
| Location | `src/app/shared/ui/` | Single Angular app, no need for a separate library project; aligns with existing `shared/` structure |
| Storybook | Not now | Use unit tests + dev route later; avoids new tooling overhead |
| Migration | Incremental (per feature, per PR) | No big bang; existing raw Material usage continues working during migration |
| Styling | `.css` with Tailwind utilities | Matches newer components (shellbar.css, sidebar.css); Tailwind 4 via PostCSS |

---

## Phase 0: Foundation

**Create directory structure + shared types + path alias.**

### Files to create
- `src/app/shared/ui/index.ts` — barrel export
- `src/app/shared/ui/models/ui-types.ts` — shared types (`ButtonVariant`, `SelectOption<T>`, etc.)
- `src/app/shared/ui/utils/display.utils.ts` — extract duplicated helpers: `getStatusLabel()`, `getStatusIcon()`, `getStatusBadgeClass()`, `getPriorityLabel()`, `getPriorityIcon()`, `getPriorityClass()`, `formatDate()`

### Config change
- Add `@ui/*` path alias in `tsconfig.json` → `src/app/shared/ui/*`

### Why `display.utils.ts` first
These functions are duplicated across 5+ files (`task-list.component.ts`, `task-detail-dialog.ts`, `task-full-details-workspace.ts`, `project.ts`, `task-tree.component.ts`). The status-badge and priority-indicator components in Phase 3 depend on them.

---

## Phase 1: Input Components

All use `ControlValueAccessor`, `OnPush`, standalone, wrap Angular Material.

### 1A. `UiTextInputComponent` — `<ui-text-input>`
**Path**: `src/app/shared/ui/input/ui-text-input.ts`

| Input | Type | Default |
|-------|------|---------|
| `label` | `string` (required) | — |
| `type` | `'text' \| 'email' \| 'password' \| 'number'` | `'text'` |
| `placeholder` | `string` | `''` |
| `prefixIcon` | `string` | `''` |
| `hint` | `string` | `''` |
| `maxlength` | `number \| null` | `null` |
| `min` / `max` | `number \| null` | `null` |
| `required` | `boolean` | `false` |
| `showPasswordToggle` | `boolean` | `false` |
| `errorMessages` | `Record<string, string>` | `{}` |

**Replaces patterns in**: `register.html` (4 inputs), `task-form.component.html` (name), `task-filters` (search), `manual-time-entry-form.html` (hours/minutes), `login.html` (email/password), `shellbar.html` (search)

### 1B. `UiTextareaComponent` — `<ui-textarea>`
**Path**: `src/app/shared/ui/textarea/ui-textarea.ts`

| Input | Type | Default |
|-------|------|---------|
| `label` | `string` (required) | — |
| `rows` | `number` | `3` |
| `maxlength` | `number \| null` | `null` |
| `showCharCount` | `boolean` | `false` |
| `errorMessages` | `Record<string, string>` | `{}` |

**Replaces**: task-form description, stop-timer-dialog note, manual-time-entry note
**Does NOT replace**: comment-form textarea (has custom @mention autocomplete)

### 1C. `UiSelectComponent` — `<ui-select>`
**Path**: `src/app/shared/ui/select/ui-select.ts`

| Input | Type | Default |
|-------|------|---------|
| `label` | `string` (required) | — |
| `options` | `Array<{ value: T; label: string; icon?: string }>` (required) | — |
| `multiple` | `boolean` | `false` |
| `placeholder` | `string` | `''` |
| `errorMessages` | `Record<string, string>` | `{}` |

**Replaces**: task-form priority/status selects, task-filters multi-selects (status, assignee, priority, type)

### 1D. `UiDatepickerComponent` — `<ui-datepicker>`
**Path**: `src/app/shared/ui/datepicker/ui-datepicker.ts`

| Input | Type | Default |
|-------|------|---------|
| `label` | `string` (required) | — |
| `min` / `max` | `Date \| null` | `null` |
| `errorMessages` | `Record<string, string>` | `{}` |

**Replaces**: task-form due date, task-filters date range (2x), manual-time-entry date

### Migration order
1. `register.html` (simplest form, 4 fields — ideal validation target)
2. `task-filters` (search + multi-selects + date range)
3. `task-form` (name + description + due date + priority/status selects)
4. `manual-time-entry-form` (hours/minutes + date + note)
5. `stop-timer-dialog` (note textarea)
6. `login.html` (custom CSS inputs → Material style alignment)
7. `shellbar.html` (raw search input)

---

## Phase 2: Button Components

### 2A. `UiButtonComponent` — `<ui-button>`
**Path**: `src/app/shared/ui/button/ui-button.ts`

| Input | Type | Default |
|-------|------|---------|
| `variant` | `'primary' \| 'secondary' \| 'outlined' \| 'text' \| 'icon' \| 'danger'` | `'primary'` |
| `type` | `'button' \| 'submit'` | `'button'` |
| `icon` | `string` | `''` |
| `iconPosition` | `'start' \| 'end'` | `'start'` |
| `loading` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `ariaLabel` | `string` | `''` |

Variant mapping: `primary` → `mat-flat-button`, `secondary`/`outlined` → `mat-stroked-button`, `text` → `mat-button`, `icon` → `mat-icon-button`, `danger` → `mat-flat-button color="warn"`

Content projection for button text via `<ng-content>`.

### 2B. `UiQuickActionGroupComponent` — `<ui-quick-action-group>`
**Path**: `src/app/shared/ui/quick-action-group/ui-quick-action-group.ts`

For preset value buttons (quick time log: 15m/30m/1h/2h) and radio-group style selectors (task type).

| Input | Type | Default |
|-------|------|---------|
| `options` | `Array<{ value: T; label: string; icon?: string }>` (required) | — |
| `activeValue` | `T \| null` | `null` |
| `mode` | `'action' \| 'radio'` | `'action'` |

| Output | Type |
|--------|------|
| `optionClicked` | `T` |
| `selectionChanged` | `T` |

---

## Phase 3: Status & Priority Display

### 3A. `UiStatusBadgeComponent` — `<ui-status-badge>`
**Path**: `src/app/shared/ui/status-badge/ui-status-badge.ts`

| Input | Type | Default |
|-------|------|---------|
| `status` | `TaskStatus` (required) | — |
| `showIcon` | `boolean` | `true` |
| `showDot` | `boolean` | `true` |
| `size` | `'sm' \| 'md'` | `'md'` |

Encapsulates `getStatusLabel()`, `getStatusBadgeClass()`, `getStatusIcon()` — eliminates 50+ inline usages across 13 files.

### 3B. `UiPriorityIndicatorComponent` — `<ui-priority-indicator>`
**Path**: `src/app/shared/ui/priority-indicator/ui-priority-indicator.ts`

| Input | Type | Default |
|-------|------|---------|
| `priority` | `TaskPriority` (required) | — |
| `showLabel` | `boolean` | `true` |
| `showIcon` | `boolean` | `true` |
| `size` | `'sm' \| 'md'` | `'md'` |

### Migration order
1. `task-list.component.html` (highest density of status/priority rendering)
2. `project.html`
3. `task-detail-dialog.html`
4. `task-full-details-workspace.html`
5. Remove duplicated helper methods from each component's `.ts` file

---

## Phase 4: State Components

### 4A. `UiSpinnerComponent` — `<ui-spinner>`
**Path**: `src/app/shared/ui/spinner/ui-spinner.ts`

| Input | Type | Default |
|-------|------|---------|
| `diameter` | `number` | `40` |
| `message` | `string` | `''` |
| `inline` | `boolean` | `false` |

Normalizes 62 spinner occurrences (varying diameters: 18/20/28/40px).

### 4B. `UiEmptyStateComponent` — `<ui-empty-state>`
**Path**: `src/app/shared/ui/empty-state/ui-empty-state.ts`

| Input | Type | Default |
|-------|------|---------|
| `icon` | `string` | `'inbox'` |
| `heading` | `string` (required) | — |
| `description` | `string` | `''` |
| `ctaLabel` | `string` | `''` |

| Output | Type |
|--------|------|
| `ctaClicked` | `void` |

Replaces 23 files with the same icon + heading + description + CTA pattern.

### 4C. `UiErrorStateComponent` — `<ui-error-state>`
**Path**: `src/app/shared/ui/error-state/ui-error-state.ts`

| Input | Type | Default |
|-------|------|---------|
| `heading` | `string` | `'Something went wrong'` |
| `description` | `string` | `''` |
| `retryLabel` | `string` | `'Retry'` |

| Output | Type |
|--------|------|
| `retryClicked` | `void` |

---

## Phase 5: Pagination

### `UiPaginationComponent` — `<ui-pagination>`
**Path**: `src/app/shared/ui/pagination/ui-pagination.ts`

| Input | Type |
|-------|------|
| `totalCount` | `number` (required) |
| `page` | `number` (required) |
| `pageSize` | `number` (required) |

| Output | Type |
|--------|------|
| `pageChanged` | `number` |

Computed signals internally: `paginationStart`, `paginationEnd`, `hasPreviousPage`, `hasNextPage`.

Replaces 3 identical implementations: task-list desktop pagination, task-list mobile pagination, project pagination.

---

## Phase 6: Data Table

### `UiDataTableComponent` — `<ui-data-table>`
**Path**: `src/app/shared/ui/data-table/ui-data-table.ts`

Column definition model:
```typescript
interface UiColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  cellType?: 'text' | 'status' | 'priority' | 'date' | 'custom';
  cellTemplate?: TemplateRef<any>;
  width?: string;
  getValue?: (row: T) => any;
}
```

| Input | Type |
|-------|------|
| `data` | `T[]` (required) |
| `columns` | `UiColumnDef<T>[]` (required) |
| `selectable` | `boolean` |
| `loading` | `boolean` |
| `totalCount` / `page` / `pageSize` | `number` |

| Output | Type |
|--------|------|
| `sortChanged` | `{ sortBy: string; sortOrder: 'asc' \| 'desc' }` |
| `selectionChanged` | `Set<string>` |
| `pageChanged` | `number` |
| `rowClicked` | `T` |

Content children: `#actions` template for row action menus, `#mobileCard` template for mobile card layout.

Uses `UiStatusBadgeComponent`, `UiPriorityIndicatorComponent`, `UiPaginationComponent` internally for built-in `cellType` rendering.

---

## File Tree

```
src/app/shared/ui/
  index.ts
  models/
    ui-types.ts
  utils/
    display.utils.ts
  input/
    ui-text-input.ts, .html, .css, .spec.ts
  textarea/
    ui-textarea.ts, .html, .css, .spec.ts
  select/
    ui-select.ts, .html, .css, .spec.ts
  datepicker/
    ui-datepicker.ts, .html, .css, .spec.ts
  button/
    ui-button.ts, .html, .css, .spec.ts
  quick-action-group/
    ui-quick-action-group.ts, .html, .css, .spec.ts
  status-badge/
    ui-status-badge.ts, .html, .css, .spec.ts
  priority-indicator/
    ui-priority-indicator.ts, .html, .css, .spec.ts
  spinner/
    ui-spinner.ts, .html, .css, .spec.ts
  empty-state/
    ui-empty-state.ts, .html, .css, .spec.ts
  error-state/
    ui-error-state.ts, .html, .css, .spec.ts
  pagination/
    ui-pagination.ts, .html, .css, .spec.ts
  data-table/
    ui-data-table.ts, .html, .css, .spec.ts
```

**13 components total** (+ 1 utils file, 1 types file, 1 barrel export).

---

## Known Challenges

1. **Login page uses raw HTML inputs** (not Material) — migrating to `<ui-text-input>` will change its visual style to match the rest of the app. May need design review.
2. **Comment form textarea** has custom `@mention` autocomplete — should NOT be migrated to `<ui-textarea>`. Keep as-is.
3. **CSS specificity** — existing `::ng-deep` overrides in task-form, task-list need to be internalized into the UI components so consumers don't need them.
4. **Dual table layouts** — task-list has different desktop (mat-table) and mobile (card grid) views; the data-table component handles this via injected `#mobileCard` template.

---

## Verification Plan

After each phase:
1. Run `npx vitest run` — all existing tests must pass
2. Run `ng build` — no compilation errors
3. Manual browser test on migrated features — verify form submission, validation errors, visual consistency
4. Check accessibility — focus indicators, aria attributes, keyboard navigation

After Phase 6 (table):
- Verify sorting, pagination, checkbox selection, action menus
- Test responsive layout (desktop table ↔ mobile cards)
- Compare before/after screenshots

---

## Critical Files to Modify

| File | Phases | Why |
|------|--------|-----|
| `tsconfig.json` | 0 | Add `@ui/*` path alias |
| `src/app/features/auth/register/register.html` | 1 | First migration target (simplest form) |
| `src/app/features/tasks/task-form/task-form.component.html` | 1, 2 | Most complex form |
| `src/app/features/tasks/task-list/task-list.component.html` + `.ts` | 3, 4, 5, 6 | Largest consumer of duplicate patterns |
| `src/app/features/tasks/task-full-details-workspace/` | 3, 4 | 827-line component with most duplicated utilities |
| `src/app/features/project/project.ts` + `.html` | 3, 5 | Second table, validates generality |
| `src/app/features/tasks/components/manual-time-entry-form/` | 1 | Number inputs + date + textarea |
| `src/app/shared/components/stop-timer-dialog/` | 1 | Textarea migration |
