# Verdict Engine

A self-contained, deterministic TypeScript module. Given a profile and a
product, it returns the same verdict every time.

**This module is the core of the product's defensibility.** It is
deliberately not an ML model (blueprint §5.6).

## Why it's a separate folder

The engine is domain logic, not UI glue. It lives at `app/src/verdict/`
(NOT under `lib/`) to make its boundary visible.

## Why it's not a workspace package

See `docs/decisions.md` — ADR "Verdict Engine Remains an Internal Domain
Module."

Summary: the MVP has one consumer (the app). Extracting to
`packages/verdict-engine/` adds workspace tooling and failure modes without
providing functionality the MVP needs. The extraction trigger is documented
in the ADR: a second consumer appears.

## Public API

    import { evaluate } from '@/verdict';

    const verdict = evaluate(profile, product);

The output matches the contract in blueprint §6.8.

## File responsibilities

| File | Responsibility |
|------|---------------|
| `index.ts` | Public API. Exports `evaluate`. |
| `types.ts` | All types. `Profile`, `Product`, `Verdict`, `Factor`, etc. |
| `factors/*.ts` | One file per factor. Each returns `pass \| caution \| fail \| insufficient`. |
| `precedence.ts` | Implements blueprint §6.5. **The only file that decides the verdict.** |
| `score.ts` | Derives the score from the verdict (blueprint §6.6). Never the reverse. |
| `__tests__/` | All 12 cases from blueprint §12, plus fixtures. |

## Hard rules

- No I/O. No `fetch`, no Supabase, no filesystem.
- No React imports.
- No `Date.now()` or `Math.random()`. The engine is pure.
- No imports from `lib/`, `components/`, `screens/`, `theme/`.
- `precedence.ts` is the only place the verdict is decided.
- `score.ts` counts compatibility factors only (§6.6). Hard constraints
  are shown separately.

## Tests

    cd app
    pnpm test verdict

All 12 cases in blueprint §12 must pass. Adding a factor requires adding
a test for its four states.

## When to escalate

- Any change to `precedence.ts` → STOP. Ask the human.
- Any new factor → confirm its evaluation table with the human first.
- Any ambiguity between §6.3, §6.4, and §6.5 → STOP.

## Extraction trigger

Promote to `packages/verdict-engine/` if a **second consumer** appears:
a web client, a CLI, a separate backend service, or an independent test
package. Until then, it stays here. See `docs/decisions.md`.