---
name: add-screen
description: Step-by-step for adding a new screen to the React Native app
---

# Playbook — Add a Screen

Use this every time a screen is added to `app/src/screens/`.

## Preconditions

- The screen is listed in `docs/blueprint.md` §4.
- A design doc exists at `docs/design/screens/<screen>.md`.
- `docs/design/principles.md` has been read.

## Steps

### 1. Confirm the screen is in scope
If the screen is not in the blueprint, STOP. Ask the human if it should
be added.

### 2. Confirm the design doc exists
If `docs/design/screens/<screen>.md` does not exist, STOP. Ask the human
to define it. Do not invent the layout.

### 3. Plan
Output the plan (Phase 1 of the workflow):
- Screen name and route
- Which lib functions it needs
- Which components it uses
- Which states it must handle (loading / empty / error / success)
- What tests will cover it

Get approval.

### 4. Create the test first
Create `app/tests/screens/<ScreenName>.test.tsx` with:
- A render smoke test
- An empty-state render test
- An error-state render test

Confirm they fail.

### 5. Create the screen
Create `app/src/screens/<ScreenName>.tsx`:
- Named export (not default)
- Wrapped in `<Screen>` from `components/ui/Screen`
- No hardcoded colors, fonts, or spacing — import from `theme/`
- No direct Supabase or API calls — go via `lib/`
- Handles all four states

### 6. Add to navigation
Update the navigation file to register the route. Confirm the route name
matches the design doc.

### 7. Run tests and linter
All tests must pass. Linter must be clean. Type check must pass.

### 8. Propose the commit
Write the proposed commit to
`.agent-state/pending-commits/feat-screen-<slug>.md`.

## What NOT to do

- Do not invent the screen layout.
- Do not hardcode visual values.
- Do not fetch directly from Supabase or the API.
- Do not skip the empty state.
- Do not import from another screen.
- Do not redesign the verdict screen.

## Escalate if

- The design doc does not exist → ask human to define it.
- The screen needs data not available in `lib/` → propose the query.
- The screen needs a new component → check `docs/design/components.md`
  first, then ask.