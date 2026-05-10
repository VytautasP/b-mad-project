# Issue 10: Pagination + Data Table components + table migrations

## What to build

Build the pagination and data table components — the capstone of the UI library — then migrate both table views in the app.

### Components

**`<ui-pagination>`** (`src/app/shared/ui/pagination/ui-pagination.ts`)
Inputs: `totalCount: number` (required), `page: number` (required), `pageSize: number` (required). Output: `pageChanged: number`. Uses computed signals internally for `paginationStart`, `paginationEnd`, `hasPreviousPage`, `hasNextPage`. Replaces 3 identical pagination implementations: task-list desktop, task-list mobile, project view.

**`<ui-data-table>`** (`src/app/shared/ui/data-table/ui-data-table.ts`)
Column-definition config approach (not a fully generic table — only 2-3 tables exist in the app).

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

Inputs: `data: T[]`, `columns: UiColumnDef<T>[]`, `selectable: boolean`, `loading: boolean`, `totalCount`/`page`/`pageSize`. Outputs: `sortChanged`, `selectionChanged`, `pageChanged`, `rowClicked`.

Content children: `#actions` template for row action menus, `#mobileCard` template for mobile card layout. Uses `<ui-status-badge>`, `<ui-priority-indicator>`, `<ui-pagination>` internally for built-in `cellType` rendering.

Handles dual layout: desktop (mat-table) and mobile (card grid) via the injected `#mobileCard` template.

### Migrations

1. **Task-list table** — the primary table in the app. Migrate to `<ui-data-table>` with column definitions, action menus, and the mobile card template.
2. **Project table** — the second table, validates the data-table component generalizes correctly.

### Tests

Unit tests for both components covering: pagination navigation and boundary states, column rendering, sorting, row selection, row clicks, mobile/desktop layout switching. Update task-list and project tests.

## Acceptance criteria

- [ ] `<ui-pagination>` component exists with computed signals for navigation state
- [ ] `<ui-data-table>` component exists with column config, sorting, selection, pagination
- [ ] Built-in `cellType` rendering works for 'status', 'priority', 'date' types
- [ ] `#mobileCard` content child template works for responsive mobile layout
- [ ] `#actions` content child template works for row action menus
- [ ] Task-list table migrated to `<ui-data-table>` — sorting, pagination, selection, actions all work
- [ ] Project table migrated to `<ui-data-table>` — validates generality
- [ ] Unit tests for both new components
- [ ] All affected consumer tests pass
- [ ] `ng build` succeeds
- [ ] Manual browser test: sorting, pagination, checkbox selection, action menus all work
- [ ] Responsive test: desktop table switches to mobile card layout correctly
- [ ] Compare before/after screenshots to verify visual consistency

## Blocked by

- Issue 7: Status Badge + Priority Indicator (used internally by data-table for built-in cell rendering)
- Issue 9: Spinner + Empty State + Error State (data-table uses spinner for loading state)
