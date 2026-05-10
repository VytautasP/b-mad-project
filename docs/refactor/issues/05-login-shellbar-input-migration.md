# Issue 5: Login + Shellbar input migration (HITL)

## What to build

Migrate the login page and shellbar search to use `<ui-text-input>`. This is marked HITL because the login page currently uses raw HTML inputs (not Angular Material), so switching to `<ui-text-input>` will change its visual style to match the rest of the app. This needs design review before merging.

### Migration

1. **`login.html`** — replace the raw email and password `<input>` elements with `<ui-text-input>`. The login page has custom CSS styling for its inputs; this will be replaced by the Material-based styling from the UI component. Verify that the login page still looks intentional and polished after migration.
2. **`shellbar.html`** — replace the raw search `<input>` with `<ui-text-input>`. The shellbar search may need a compact/dense variant or custom styling to fit the header layout.

### Design review checklist

- Does the login page look good with Material-styled inputs?
- Does the shellbar search input fit the header layout without looking oversized?
- Are focus states and placeholder text consistent with the rest of the app?

## Acceptance criteria

- [ ] `login.html` uses `<ui-text-input>` for email and password fields
- [ ] `shellbar.html` uses `<ui-text-input>` for the search field
- [ ] Login form submission and validation still work
- [ ] Search functionality still works
- [ ] Design review approved — visual style is acceptable
- [ ] Existing tests pass
- [ ] `ng build` succeeds

## Blocked by

- Issue 2: Text Input + Textarea
