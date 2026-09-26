# Stabilization review — typecheck, lint, tests, and boundary fixes

**Date:** 2026-09-26
**Blueprint:** §5–§9 (cross-cutting stabilization per docs/repair-plan.md)
**Files changed:** app/jest.config.js, app/src/home/QuickActionsBar.tsx, app/src/theme/colors.ts + tokens test + docs/design/tokens.md, app/src/catalog/normalize test + app/src/catalog/api.ts + app/src/catalog/useVerdict.ts (unchanged, verified), app/src/verdict/factors/allergen.ts + sensitivity.ts + tests, app/src/components/* (FactorBreakdownCard, HardConstraintBanner, ScoreBar, Recommendations, DisclaimerBlock), app/src/scan tests + CameraViewport/ScanResultView/VerdictScreen/services/api theme fixes, app/app/(tabs)/_layout.tsx (deleted legacy app/(tabs)/ + app/services/), supabase/migrations/005_save_profile.sql, scripts/validate-catalog.mjs, catalog/README.md, inference-server/inference_server/main.py + config.py + tests + pyproject.toml + .env.example
**Prerequisites:** 02-allergen-factor.md, 03-sensitivity-factor.md, 07-verdict-engine-aggregation.md, 08-catalog-pipeline.md, 11-inference-server.md

## 1. What this task was

The repo claimed many completed tasks, but the baseline did not pass its own gates: app typecheck and lint failed, and Jest had 11 failing tests across 7 suites. This task reviewed the whole repo against the blueprint and the approved repair plan, then fixed what was wrong until `tsc`, `eslint --quiet`, `jest` (357 tests), and `pytest` (70 tests) all passed.

## 2. The concept

A gate is a check that must pass before work counts as done. Think of it like a spell-checker for code: the type-checker catches wrong shapes, the linter catches forbidden styles, and tests catch wrong behavior. One idea matters here: missing evidence is not negative evidence. An empty ingredient list does not mean "no allergen" — it means "we could not check." That is why empty normalization returns partial data, and why a detected allergen match overrides an insufficient-data flag.

## 3. The decision

What were the options? Why was this one chosen? What was rejected and why?

- Allergen/sensitivity ordering: fail/caution before insufficient-data. Rejected the old order (partial-data first) because it hid a known match behind a "could not verify" flag. Blueprint §6.5 step 1 precedes step 2.
- Empty normalization returns partial_data true. Rejected false because an empty list cannot verify anything.
- QuickActionsBar text follows the design doc ("Scan Product", "Browse 30+ verified products"), not the drifted component strings. Rejected editing the test because the design doc is the locked spec.
- One router root: inlined the tab layout into app/app/(tabs)/_layout.tsx and deleted the legacy app/(tabs)/ folder and stray app/services/inference.py. Rejected keeping both because two roots cause exactly this kind of drift.
- Server has no database: deleted inference_server/utils/supabase_client.py, the Supabase config keys, env block, and dependency. Rejected keeping dead DB code because the repair plan assigns persistence to the app (atomic save_profile RPC).
- Oversized-image test message follows the implementation ("File too large"), not the stale "exceeds maximum" string. The test was genuinely wrong; the implementation is the contract.
- New theme tokens surface.transparent/surface.scrim + badge palette documented in docs/design/tokens.md. Rejected eslint-disable comments because AGENTS.md §7 requires theme values with docs.

## 4. The code, line by line

- app/jest.config.js: widened transformIgnorePatterns so expo-* ESM packages are transformed; this fixed the "Cannot use import statement" suite failures.
- app/src/verdict/factors/allergen.ts: alias-aware fail check first, then partial/empty, then pass; removed the dead second raw-includes loop.
- app/src/verdict/factors/sensitivity.ts: same reorder — compute hasConflict from flagged ingredients first, return caution, then partial, then pass.
- app/src/catalog/normalize.ts (unchanged): totalCount === 0 gives partial_data true; the test was updated to expect true.
- app/src/catalog/api.ts: replaced any with Record<string, unknown> casts for the Supabase join normalization.
- app/src/home/QuickActionsBar.tsx: titles/descriptions restored to the design-doc strings.
- app/src/theme/colors.ts: added badge palette and surface.transparent/surface.scrim; tokens test and docs/design/tokens.md updated in the same change.
- app/src/components/*: FactorBreakdownCard uses its index prop (testID), HardConstraintBanner keys by name+index, ScoreBar/Recommendations/AIOverrideBanner/CameraViewport/ScanResultView/services/api use theme tokens.
- app/app/(tabs)/_layout.tsx: full tab layout inlined; legacy app/(tabs)/ and app/services/ removed.
- supabase/migrations/005_save_profile.sql: new migration only (no edits in place) adding insert WITH CHECK policies and the atomic save_profile(payload) RPC the app already calls.
- scripts/validate-catalog.mjs: new validator (closed vocab, evidence present, unmatched warnings); catalog/README.md drift fixed (.mjs names, annotations/ clarified as supplement).
- inference-server/inference_server/main.py: acne endpoint takes only Request (was Request + UploadFile, which consumed the stream and broke every acne test with "Stream consumed").
- inference-server/tests/conftest.py + test_endpoints.py: oversized fixture uses noise + padding so it truly exceeds 5MB; oversize assertions match the real "File too large" message.

## 5. How to verify it works

Copy-pasteable. Failure looks like a non-zero exit or FAILED lines.

```
cd app
npx tsc --noEmit
npx eslint src --ext .ts,.tsx --quiet
npx jest
cd ../inference-server
python -m pytest
cd ..
node scripts/validate-catalog.mjs
node scripts/seed-catalog.mjs
git status --porcelain supabase/seed catalog
```

Expect: tsc clean, eslint clean, 32 suites / 357 tests pass, 70 pytest pass, validator OK (10 products, 26 concerns, warnings only), seed prints "Generated 10 product inserts" with no diff.

## 6. What could go wrong

- Expo-router ESM errors return if a new test imports a screen without mocking expo-router. Fix: add the same useRouter mock used in ScanScreen.test.tsx.
- A new hardcoded color breaks lint (react-native/no-color-literals). Fix: add a theme token first, document it in docs/design/tokens.md, then use it.
- Supabase saves fail with RLS errors on a real project. Fix: apply migrations in order through 005 and confirm rpc save_profile exists; the app calls it atomically.

## 7. If you remember one thing

Missing evidence is not negative evidence: a known match always overrides an insufficient-data flag, and an empty list is partial, never clean.

## 8. Questions to ask yourself before the defense

- Why does the allergen factor check for a match before checking partial_data? Because hiding a detected conflict behind "could not verify" would be a false negative; blueprint §6.5 step 1 precedes step 2.
- Why does empty normalization return partial_data true? Because there is nothing to check against; pass would claim a clean list that does not exist.
- Why does the server have no database code? Because architecture.md gives persistence to the app via Supabase; the server only predicts and discards the image.
- Why was the acne endpoint failing with "Stream consumed"? Because declaring an UploadFile param made FastAPI consume the request body before the raw-stream reader ran.
- Why delete app/(tabs)/ instead of keeping both route trees? Because two roots drift; the router root is app/app/, so the layout lives there exactly once.
