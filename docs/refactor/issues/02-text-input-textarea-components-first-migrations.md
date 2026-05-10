# Issue 2: Text Input + Textarea components + first migrations

## What to build

Build two ControlValueAccessor input wrapper components and migrate two consumer forms to validate them end-to-end.

### Components

**`<ui-text-input>`** (`src/app/shared/ui/input/ui-text-input.ts`)
Wraps `mat-form-field > mat-label > matInput > mat-error`. Supports inputs: `label` (required), `type` (text/email/password/number), `placeholder`, `prefixIcon`, `hint`, `maxlength`, `min`/`max`, `required`, `showPasswordToggle`, `errorMessages: Record<string, string>`. Standalone, OnPush, implements ControlValueAccessor for use with `formControlName`.

**`<ui-textarea>`** (`src/app/shared/ui/textarea/ui-textarea.ts`)
Same pattern as text-input but wraps `matInput` textarea. Inputs: `label` (required), `rows`, `maxlength`, `showCharCount`, `errorMessages`. Does NOT replace the comment-form textarea (which has custom @mention autocomplete).

### Migrations

1. **`register.html`** — replace 4 raw mat-form-field blocks (name, email, password, confirm password) with `<ui-text-input>`. This is the simplest form and the ideal first validation target.
2. **`stop-timer-dialog.component.html`** — replace the note textarea with `<ui-textarea>`.

### Tests

Unit tests for both components covering: value binding, validation error display, disabled state, password toggle (text-input), character count (textarea). Update existing tests for migrated consumers.

## Acceptance criteria

- [x] `<ui-text-input>` component exists with CVA, supports all specified inputs
- [x] `<ui-textarea>` component exists with CVA, supports all specified inputs
- [x] `register.html` uses `<ui-text-input>` for all 4 fields — form submission and validation still work
- [x] `stop-timer-dialog` uses `<ui-textarea>` for the note field
- [x] Unit tests for both new components
- [x] Existing register and stop-timer-dialog tests pass
- [x] `ng build` succeeds
- [x] Manual browser test: register form submits correctly, validation errors display, stop-timer dialog note works

## Blocked by

- Issue 1: Foundation
