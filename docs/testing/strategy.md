# Testing Strategy

The complete testing approach for BeautiLyze. Derived from blueprint §12.

---

## Principles

1. **The verdict engine is the highest-value test surface.** It is
   deterministic, pure, and the core of the product's defensibility.
   It gets the most tests.
2. **Test behavior, not implementation.** Test names describe what the
   system does, not how.
3. **Every bug fix gets a regression test.** No exceptions.
4. **Tests run fast.** Unit tests must complete in seconds. If they don't,
   they're integration tests and belong elsewhere.
5. **No test is better than a flaky test.** If a test is unreliable, fix
   it or delete it. Never leave a flaky test in the suite.

---

## Test layers

| Layer | What it covers | Tool | Where |
|-------|---------------|------|-------|
| Unit (app) | Verdict engine, pure helpers | Jest | `app/src/verdict/__tests__/` |
| Unit (server) | Endpoint response shapes, preprocessing | pytest | `inference-server/tests/` |
| Component (app) | Screen render smoke tests | Jest + React Native Testing Library | `app/tests/` |
| Integration (manual) | End-to-end demo path | Manual | Documented in `docs/testing/strategy.md` |
| E2E | Not implemented for MVP | — | — |

---

## What must be tested

### Verdict engine (blueprint §12 — all 12 cases)

1. All factors pass → MATCH
2. Declared-allergen conflict → MISMATCH (overrides all)
3. Sensitivity conflict only → CAUTION
4. Skin-type mismatch, all else pass → depends on pass count
5. Insufficient ingredient data → CAUTION, never MATCH
6. Missing user skin type → factor insufficient, verdict capped at CAUTION
7. Missing user age → same
8. Manual profile vs AI profile (same values) → same verdict
9. AI profile with user override → verdict uses override
10. Product not in catalog → "Not checked yet" state
11. Acne severity severe, no strong_actives → degrades to moderate rule
12. Acne severity severe, strong_actives + barrier_support present → strict rule

These are non-negotiable. They become the automated test suite for the
verdict module.

### Inference server

- `/predict/skin-type` returns `{ label, confidence, model_version }`
- `/predict/acne-severity` returns same shape
- Invalid input returns 4xx, not 5xx
- No image data is logged or written to disk

### App screens

- Each screen renders without crashing
- Empty states render correctly
- Error states render correctly

---

## What is NOT tested for MVP

- Real device camera capture (manual test)
- Network flakiness (out of scope)
- Performance (out of scope)
- Accessibility compliance audit (blueprint §4.3 explicitly cuts formal
  WCAG audit)

---

## CI

All tests run on every PR via `.github/workflows/`:
- `app-tests.yml` → Jest on `app/`
- `server-tests.yml` → pytest on `inference-server/`
- `catalog-validate.yml` → catalog validation script

A PR cannot merge if any workflow fails.

---

## Coverage targets

- Verdict engine: **100% branch coverage.** It's small and deterministic.
- App lib: best effort, no hard target.
- Screens: smoke tests only for MVP.
- Server: endpoint contract coverage.

Coverage is a diagnostic, not a goal. Do not chase 100% on UI code.