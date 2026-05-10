# Issue 6: Button + Quick Action Group components + migration

## What to build

Build two button-type components and migrate representative consumers.

### Components

**`<ui-button>`** (`src/app/shared/ui/button/ui-button.ts`)
Unified button component with content projection for text. Inputs: `variant` ('primary' | 'secondary' | 'outlined' | 'text' | 'icon' | 'danger'), `type` ('button' | 'submit'), `icon`, `iconPosition` ('start' | 'end'), `loading: boolean`, `disabled: boolean`, `ariaLabel`.

Variant mapping to Material directives: `primary` → `mat-flat-button`, `secondary`/`outlined` → `mat-stroked-button`, `text` → `mat-button`, `icon` → `mat-icon-button`, `danger` → `mat-flat-button color="warn"`.

When `loading` is true, show a spinner and disable interaction.

**`<ui-quick-action-group>`** (`src/app/shared/ui/quick-action-group/ui-quick-action-group.ts`)
For preset value buttons (quick time log: 15m/30m/1h/2h) and radio-group style selectors (task type). Inputs: `options: Array<{ value: T; label: string; icon?: string }>` (required), `activeValue: T | null`, `mode: 'action' | 'radio'`. Outputs: `optionClicked`, `selectionChanged`.

### Migrations

Migrate buttons in task-form (submit/cancel), dialogs (confirm/cancel patterns), and the time-log quick-action buttons.

### Tests

Unit tests covering: variant rendering, loading state, disabled state, icon positioning, content projection. Quick action group: option clicks, active state, radio mode selection.

## Acceptance criteria

- [ ] `<ui-button>` component exists with all 6 variants, loading state, icon support
- [ ] `<ui-quick-action-group>` component exists with action and radio modes
- [ ] At least 3 consumer forms/dialogs migrated to `<ui-button>`
- [ ] Time-log quick buttons migrated to `<ui-quick-action-group>`
- [ ] Unit tests for both components
- [ ] Existing tests pass for migrated consumers
- [ ] `ng build` succeeds
- [ ] Manual browser test: buttons render correctly in all variants, loading state works, quick actions fire correctly

## Blocked by

- Issue 1: Foundation
