---
name: verdict-engine
description: Rules for working on the deterministic verdict engine in app/src/verdict/
---

# Verdict Engine

Applies when touching anything in `app/src/verdict/`.

## What this module is

A pure, deterministic TypeScript module. Given the same profile and product,
it always returns the same verdict. No randomness. No time dependence. No
network. No database. No React.

## Hard rules

- No imports from `lib/`, `components/`, `screens/`, `theme/`, or `expo-*`.
- No `fetch`, `axios`, or any I/O.
- No `Date.now()`, `Math.random()`, or environment reads.
- No side effects. Functions return values; they do not mutate inputs.
- `precedence.ts` is the ONLY file that decides the final verdict.
- `score.ts` derives the score FROM the verdict. Never the reverse.

## File responsibilities

- `index.ts` — public API. Exports `evaluate(profile, product): Verdict`.
- `types.ts` — all types. The verdict output matches blueprint §6.8.
- `factors/*.ts` — one file per factor. Each returns
  `'pass' | 'caution' | 'fail' | 'insufficient'`.
- `precedence.ts` — implements §6.5 exactly.
- `score.ts` — counts compatibility factors only (§6.6).

## Testing

Every change requires a test in `app/src/verdict/__tests__/`. The 12 cases
from blueprint §12 are the minimum suite.

## When to escalate

- Any change to `precedence.ts` → STOP. Ask the human.
- Any new factor → confirm the evaluation table with the human first.
- Any ambiguity between blueprint §6.3, §6.4, and §6.5 → STOP.