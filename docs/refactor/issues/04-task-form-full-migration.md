# Issue 4: Task Form full migration

## What to build

Migrate `task-form.component.html` — the most complex form in the app — to use all four input components. This slice validates that all input components compose correctly in a single form with mixed input types.

### Migration

Replace the following in `task-form.component.html`:
- Task name text field → `<ui-text-input>`
- Description textarea → `<ui-textarea>`
- Priority and status dropdowns → `<ui-select>`
- Due date picker → `<ui-datepicker>`

The task-form currently uses `task-form.component.scss` — internalize any `::ng-deep` overrides from that file into the UI components if they represent generally-needed styling, or remove them if they were workarounds for inconsistency that the new components already handle.

### Tests

Update existing `task-form.component.spec.ts`. Ensure form submission, validation, and pre-population (edit mode) all work correctly with the new components.

## Acceptance criteria

- [x] `task-form.component.html` uses `<ui-text-input>`, `<ui-textarea>`, `<ui-select>`, and `<ui-datepicker>` for all form fields
- [x] Form submission works for both create and edit modes
- [x] Validation errors display correctly for all fields
- [x] Pre-populated values render correctly in edit mode
- [x] Any `::ng-deep` overrides are resolved (internalized into UI components or removed)
- [x] `task-form.component.spec.ts` passes
- [x] `ng build` succeeds
- [x] Manual browser test: create a task, edit a task, trigger validation errors — all work as before

## Blocked by

- Issue 2: Text Input + Textarea
- Issue 3: Select + Datepicker
