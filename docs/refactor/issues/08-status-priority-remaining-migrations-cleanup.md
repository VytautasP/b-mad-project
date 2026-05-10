# Issue 8: Status/Priority remaining migrations + cleanup

## What to build

Migrate all remaining consumers of inline status/priority rendering to `<ui-status-badge>` and `<ui-priority-indicator>`, then remove the now-unused duplicated helper methods from each component.

### Migrations

1. **`project.html` + `project.ts`** — replace inline status/priority rendering, remove helper methods
2. **`task-detail-dialog.html` + `.ts`** — replace inline rendering, remove helpers
3. **`task-full-details-workspace.html` + `.ts`** — this is an 827-line component with the most duplicated utilities; replace all inline status/priority rendering and remove helper methods
4. **`task-tree.component.ts`** — remove duplicated helpers if status/priority is rendered inline

After this slice, no component outside of `shared/ui/` should contain `getStatusLabel`, `getStatusBadgeClass`, `getStatusIcon`, `getPriorityLabel`, `getPriorityIcon`, or `getPriorityClass` methods.

### Tests

Update all affected component tests. Verify that the display utils in `shared/ui/utils/display.utils.ts` remain the single source of truth.

## Acceptance criteria

- [x] `project.html` uses `<ui-status-badge>` and `<ui-priority-indicator>`
- [x] `task-detail-dialog` uses `<ui-status-badge>` and `<ui-priority-indicator>`
- [x] `task-full-details-workspace` uses `<ui-status-badge>` and `<ui-priority-indicator>`
- [x] All duplicated status/priority helper methods removed from migrated component `.ts` files
- [x] No component outside `shared/ui/` contains `getStatusLabel`, `getStatusBadgeClass`, `getStatusIcon`, `getPriorityLabel`, `getPriorityIcon`, or `getPriorityClass`
- [x] All affected component tests pass
- [x] `ng build` succeeds
- [x] Manual browser test: project view, task detail dialog, and task details workspace render status/priority correctly

## Blocked by

- Issue 7: Status Badge + Priority Indicator + task-list migration
