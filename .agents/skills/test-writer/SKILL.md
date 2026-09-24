---
name: test-writer
description: Rules for writing any test in the repository
---

# Test Writer

Applies when writing tests anywhere in the repo.

## Where tests live

| Code | Tests live in |
|------|---------------|
| `app/src/verdict/` | `app/src/verdict/__tests__/` |
| Other `app/src/lib/` | `app/tests/` |
| `app/src/screens/` | `app/tests/screens/` |
| `inference-server/` | `inference-server/tests/` |

## Naming

- JS/TS: `<thing>.test.ts` or `<Thing>.test.tsx`
- Python: `test_<thing>.py`

Test names read as sentences describing behavior:

- ✅ `returns MATCH when all factors pass`
- ✅ `caps verdict at CAUTION when ingredient data is incomplete`
- ❌ `works`
- ❌ `test1`

## Structure

    describe('precedence', () => {
      it('returns MISMATCH when a declared allergen matches', () => {
        // arrange
        // act
        // assert
      });
    });

One assertion per test where possible. Arrange / Act / Assert in that
order, no exceptions.

## Fixtures

- Verdict fixtures: `app/src/verdict/__tests__/fixtures/`
- App fixtures: `app/tests/fixtures/`
- Server fixtures: `inference-server/tests/fixtures/`
- Named exports. Minimal fields. Never mutated in a test.

## What to test

- Every branch of every function.
- The error path, not just the happy path.
- Every case in blueprint §12 for the verdict engine.

## What NOT to test

- React internals.
- Third-party library behavior.
- Snapshots of large components.
- Anything that requires a real network, real model weights, or real user
  data.

## Rules

- Never delete a failing test to make the suite pass.
- Never use `it.skip` without a written reason in a comment.
- Never mock the thing under test.
- Mock only at boundaries (network, filesystem, external services).
- If the test is genuinely wrong, explain why before changing it.

## When to escalate

- The behavior to test is not documented anywhere → STOP and ask.
- A test would require a real model or real database → STOP and propose
  a mock strategy.