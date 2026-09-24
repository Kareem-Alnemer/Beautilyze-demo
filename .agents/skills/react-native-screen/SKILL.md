---
name: react-native-screen
description: Rules for adding or editing screens in the React Native app
---

# React Native Screen

Applies when creating or editing a file in `app/src/screens/`.

## Structure of a screen

Every screen file:

    import { Screen } from '@/components/ui/Screen';
    // other imports

    export function MyScreen() {
      // state
      // data hooks
      return (
        <Screen>
          {/* composition */}
        </Screen>
      );
    }

- One screen per file.
- File name: `PascalCase.tsx`.
- Screen component is a named export, not default.
- The `Screen` wrapper handles safe area, background, and padding.

## What a screen MAY do

- Read data from `lib/catalog/` or `lib/profile/`
- Call the verdict engine (via `lib/verdict/` or directly)
- Render `components/ui/*` and domain components from `components/`
- Handle local UI state

## What a screen MUST NOT do

- Fetch directly from Supabase or the inference server (go via `lib/`)
- Hardcode colors, fonts, or spacing (import from `theme/`)
- Compute a verdict itself (the engine does that)
- Import from another screen
- Contain business logic beyond view concerns

## States

Every screen must define all four:
1. Loading
2. Empty
3. Error
4. Success

Use `components/ui/Skeleton.tsx` for loading,
`components/ui/EmptyState.tsx` for empty and error.

A screen without an empty state is not done.

## Design

- Read `docs/design/screens/<screen>.md` first. If it does not exist, STOP
  and ask the human to define it.
- Follow the direction in `docs/design/principles.md`.
- Typography comes from `theme/typography.ts`. Not inline.
- The verdict screen is locked. Do not change it without approval.

## Testing

- At minimum: a render smoke test in `app/tests/screens/`.
- Verify the empty state renders.
- Verify the error state renders.

## When to escalate

- The screen needs a design decision not documented → STOP.
- The screen needs data that is not available in `lib/` → STOP and propose
  the query.