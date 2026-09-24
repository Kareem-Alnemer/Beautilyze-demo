# App Testing (Jest)

Conventions for tests in `app/`.

---

## Where tests live

| What | Where |
|------|-------|
| Verdict engine | `app/src/verdict/__tests__/` |
| Other lib code | `app/tests/` |
| Screens | `app/tests/screens/` |
| Fixtures | `__tests__/fixtures/` or `tests/fixtures/` |

Tests are colocated with the code they test when possible. The verdict
engine's tests live inside the verdict folder because the module is
self-contained.

---

## Naming

    <thing>.test.ts

Examples:
- `precedence.test.ts`
- `allergenConflict.test.ts`
- `VerdictScreen.test.tsx`

One test file per source file, unless the source file is trivial.

---

## Structure of a test

    describe('thing being tested', () => {
      it('does the specific behavior', () => {
        // arrange
        // act
        // assert
      });
    });

Rules:
- Test name reads as a sentence: *"returns MATCH when all factors pass"*.
- One assertion per test where possible.
- Prefer explicit fixtures over inline objects.
- No `it('works')`. Ever.

---

## Fixtures

- Live in `__tests__/fixtures/` for the verdict engine.
- Live in `tests/fixtures/` for other app tests.
- Named exports, not defaults.
- Keep fixtures minimal — only the fields the test cares about.
- Never mutate a fixture inside a test. Clone if needed.

Example:

    // fixtures/profiles.ts
    export const profileAllPass = {
      user_skin_type: 'normal',
      user_acne_severity: 'mild',
      allergies: [],
      sensitivities: [],
      age: 22,
    };

---

## What to test

- Every verdict factor: pass, caution, fail, insufficient.
- Precedence rule: each branch.
- Score derivation.
- Anything with a branch or an edge case.

---

## What NOT to test

- React internals.
- Third-party library behavior.
- Trivial getters and setters.
- Snapshot tests of large components (brittle, low value).

---

## Running tests

    cd app
    npm test                    # all tests
    npm test verdict            # verdict engine only
    npm test -- --watch         # watch mode

---

## When a test fails

1. Read the failure output completely.
2. Determine: is the test wrong, or is the code wrong?
3. If the test is wrong, fix the test and explain why.
4. If the code is wrong, fix the code.
5. Never delete a failing test to make the suite pass.
6. Never add `it.skip` without a comment explaining why.
