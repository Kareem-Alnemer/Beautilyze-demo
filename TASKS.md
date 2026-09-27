# TASKS

Master task list. Updated by the agent after each task (workflow Phase 4).

Format: one task per entry, with status, blueprint reference, and
acceptance criteria.

---

## Status key

- `[ ]` — not started
- `[~]` — in progress
- `[x]` — done
- `[!]` — blocked (see notes)
- `[M]` — manual task pending (human must do)

---

## In flight

- [~] 2026-09-27: Native gallery upload (blueprint 5.1-5.4, 8.3-8.4). Owner approved custom build, dependency alignment, and Android ID com.beautilyze.app. Added local Android/iOS memory-backed gallery upload to existing HTTPS /analyze, validated-result adapter, cancellation/duplicate/late-result handling, and reselect-on-error UI. Installed expo-dev-client and SDK-compatible React DOM/Worklets/Reanimated after the initial ERESOLVE failure was reported and alignment approved. Typecheck passes; 418 app tests / 38 suites pass; lint 0 errors / 38 warnings; module discovery passes on Android/Apple; Android prebuild succeeds. Native compilation and device acceptance are tracked separately below. No claim that upload works in Expo Go. Native camera capture remains disabled. Learning chapter 28 and ADR proposal added.
- [x] 2026-09-27: Repository navigation pass (blueprint 8.1, 15). Added root/app/docs maps and root-level app commands, clarified route/source/native/generated folders, corrected setup examples, and preserved code paths and historical lessons. Root command wrappers verified with typecheck, lint, and 418 passing tests. This is navigation organization, not the final development-process cleanup. Learning chapter 29 added.

MANUAL_TASK
Owner: Project team
Action: Provide a reachable HTTPS inference endpoint; confirm iOS bundle/signing on a Mac; build/install the custom app and run docs/testing/native-upload.md using non-sensitive existing test images.
Acceptance: Native compilation succeeds; JPEG/PNG upload, cancel, error/reselect, double-tap, and navigation checks pass; no new app-owned image files or image logs; report provider/OS limits separately. Confirm real versus mock model output.
Status: Pending. No app installed on a phone and no iOS compilation or device privacy verification completed.

### Approved follow-up scope

Native verification update (2026-09-27): `app/android/gradlew.bat :beautilyze-memory-upload:compileDebugKotlin --console=plain` completed successfully in 6m 36s (63 tasks). Expo/Gradle dependency deprecation warnings remain. This compiles the Android module, not a complete installed app; iOS and on-device upload/privacy checks are still pending. Package manifests match both lockfiles and new local documentation links resolve.

- [ ] Discreet Save check action with duplicate/error handling (limited locked-screen change approved).
- [ ] Preserve guest draft through sign-in and ask before replacing account data.
- [ ] Improve discovery filters and missing-data explanations using existing catalog facts.
- [ ] Finish shared UI/icons/fonts and real-device accessibility checks, with dependency approval as needed.
- [ ] Complete live permission, offline, and user-journey verification; never infer these from mocked tests.

- [~] 2026-09-27: Profile/auth UI polish (blueprint 4.1, 5.3-5.5, 8.7). Implemented shared Button/ChoiceField, readable choice rows, larger ingredient controls, whole-age validation, explicit guest/account save status, profile-load retry, and the approved suggestion render-loop fix. Automated verification: 405 tests / 36 suites pass; typecheck passes; lint 0 errors / 41 warnings; git diff --check passes. Initial test run stalled and was interrupted; rerun passed after approval and fix. Learning chapter 27 and design docs updated. No dependencies, verdict rules, or schema changed in this pass. Native visual acceptance remains pending.

MANUAL_TASK
Owner: Project team
Action: Review Profile, onboarding, and sign-in on a small phone with enlarged text and the keyboard open; exercise guest entry, failed account save/retry, and profile-load retry with a test account.
Acceptance: No clipped labels or hidden actions; radio selection and busy states announced; guest draft clearly session-only; save failure never claims success. Record non-sensitive screenshots. Do not capture face images.
Status: Pending. Local Expo Metro is available on port 8082; unit tests do not verify native pixel layout. Existing font/icon and SafeAreaView follow-ups remain open.

- [~] 2026-09-26: General enhancement pass (blueprint 3-10). Implemented clearer Home, ordered search/history requests, distinct error states, truthful history facts, auth refresh draft protection, and prediction validation. Verified: typecheck pass; 392 app tests / 35 suites; lint 0 errors / 52 warnings; 70 server tests / 2 warnings; catalog 30 products / 26 concerns / 27 warnings. Learning chapters 24-26 added. Full project remains incomplete: see docs/reviews/2026-09-26-project-review.md. No verdict precedence, locked spec, or new migration changed in this pass.

### Enhancement release gates

- [ ] Wire check saving to a defined user action with duplicate/error handling.
- [ ] Resolve native memory-only scanning without weakening photo privacy.
- [ ] Finish icons, bundled fonts, shared controls, and device visual verification.
- [x] Add explicit profile save feedback (2026-09-27; automated checks pass).
- [ ] Complete guest-to-account transition.
- [ ] Reconcile architecture documentation with existing Zustand through an ADR proposal.

MANUAL_TASK
Owner: Project team
Action: Answer the Lucide dependency and memory-only native-build questions; review current migration history on staging; validate with two accounts; test the edited screens on a narrow phone and enlarged text; run the held-out model evaluation.
Acceptance: Record dependency/build decisions, applied migration versions, ownership and deletion checks, device screenshots, and measured model results. Do not delete database rows or overwrite deployed migrations based on historical task notes alone.
Status: Pending. Automated tests do not satisfy these release gates.

- [~] 2026-09-26: Approved stabilization and learning corrections. Track acceptance in docs/repair-plan.md. App gates green (typecheck, eslint --quiet, Jest 357 pass; server pytest 70 pass). Remaining release gates need a human: live migrations incl. 005, catalog seed, Expo Go device run, real-photo /analyze.

---

## Done — stabilization review 2026-09-26

- [x] Foundation: single router root (inlined tab layout, removed legacy `app/(tabs)/` + stray `app/services/`), typecheck + lint clean, Jest ESM config fixed, ScanScreen/CameraViewport mocks fixed
- [x] Identity: atomic `save_profile` RPC added as migration 005 (insert WITH CHECK + one-transaction profile/allergies/sensitivities); AuthGate + store verified, no schema edits in place
- [x] Manual flow: QuickActionsBar restored to design-doc copy, catalog/api `any` fixed, VerdictScreen confirmed user_* only, useVerdict path confirmed (`app/src/catalog/useVerdict.ts`)
- [x] Scanning: acne endpoint stream-consumed bug fixed (Request-only), oversize fixture + message fixed, server DB code removed (no credentials, no client, no dep, no env block) per repair plan
- [x] Catalog/history: `scripts/validate-catalog.mjs` added and passing (10 products, 26 concerns), seed reproducible (no diff), README drift fixed, no evidence fabricated
- [x] Release: CI contract verified (`npm run typecheck`, `npm run lint`, `npm test`, `pytest`); live DB/device checks left as explicit MANUAL tasks below
- [x] Learning: `docs/learning/19-stabilization-review.md` + index row added in AGENTS.md §15 format

---

## Backlog — documentation

- [x] Repo structure created
- [x] AGENTS.md written
- [x] Orchestrator docs written
- [x] Testing docs written
- [x] Design docs written (Editorial Honest direction)
- [x] Skills written (10)
- [x] Playbooks written (5)
- [x] READMEs written (6)
- [x] ADRs written (5)
- [x] Architecture, glossary, privacy written
- [x] Blueprint pasted into docs/blueprint.md
- [ ] LICENSE chosen
- [ ] docs/annotation-methodology.md written
- [ ] opencode.json written
- [ ] **Repo polish: archive development process artifacts** (run at the end of the build — see `docs/development-process/cleanup-plan.md`)

---

## Backlog — scaffolding

- [ ] `app/package.json` — Expo app init
- [ ] `app/app.json` — Expo config
- [ ] `app/tsconfig.json`
- [ ] `app/babel.config.js`
- [ ] `app/jest.config.js`
- [ ] `app/.eslintrc.cjs`
- [ ] `app/.prettierrc`
- [x] `inference-server/Dockerfile` — Multi-stage Dockerfile (builder + runtime, non-root user, healthcheck)
- [x] `inference-server/.dockerignore` — Excludes tests, caches, env files, model weights
- [x] `docker-compose.yml` — Root compose for local inference server orchestration
- [x] `app/eas.json` — EAS build profiles (development, preview, production)
- [x] `inference-server/main.py`
- [x] `inference-server/config.py`
- [x] `inference-server/.env.example`
- [x] `inference-server/inference_server/schemas/prediction.py`
- [x] `inference-server/inference_server/preprocessing/image.py`
- [x] `inference-server/inference_server/models/loader.py`
- [x] `inference-server/inference_server/models/skin_type.py`
- [x] `inference-server/inference_server/models/acne_severity.py`
- [x] `inference-server/inference_server/utils/privacy.py`
- [x] `inference-server/tests/` (53 tests)
- [x] `.github/workflows/ci.yml` (unified CI: mobile-test + inference-test)
- [ ] `.github/workflows/catalog-validate.yml`
- [ ] `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] `.github/CODEOWNERS`

---

## Backlog — verdict engine (blueprint §6, §12)

- [x] `app/src/verdict/types.ts`
- [x] `app/src/verdict/index.ts`
- [x] `app/src/verdict/precedence.ts`
- [x] `app/src/verdict/__tests__/precedence.test.ts`
- [x] `app/src/verdict/score.ts`
- [x] `app/src/verdict/__tests__/score.test.ts`
- [x] `app/src/verdict/__tests__/index.test.ts`
- [x] `app/src/verdict/factors/allergen.ts`
- [x] `app/src/verdict/factors/__tests__/allergen.test.ts`
- [x] `app/src/verdict/factors/sensitivity.ts`
- [x] `app/src/verdict/factors/__tests__/sensitivity.test.ts`
- [x] `app/src/verdict/factors/skinTypeFit.ts`
- [x] `app/src/verdict/factors/__tests__/skinTypeFit.test.ts`
- [x] `app/src/verdict/factors/acneFit.ts`
- [x] `app/src/verdict/factors/__tests__/acneFit.test.ts`
- [x] `app/src/verdict/factors/ageFit.ts`
- [x] `app/src/verdict/factors/__tests__/ageFit.test.ts`
- [x] All 12 tests from blueprint §12 (implemented in index.test.ts)
- [ ] Fixtures (`profiles.ts`, `products.ts`)

---

## Backlog — theme (blueprint + design docs)

- [ ] `app/src/theme/colors.ts`
- [ ] `app/src/theme/typography.ts`
- [ ] `app/src/theme/spacing.ts`
- [ ] `app/src/theme/radii.ts`
- [ ] `app/src/theme/theme.ts`
- [ ] `app/src/theme/index.ts`

---

## Backlog — UI primitives

- [ ] `app/src/components/ui/Button.tsx`
- [ ] `app/src/components/ui/Card.tsx`
- [ ] `app/src/components/ui/Input.tsx`
- [ ] `app/src/components/ui/Badge.tsx`
- [ ] `app/src/components/ui/Text.tsx`
- [ ] `app/src/components/ui/Screen.tsx`
- [ ] `app/src/components/ui/EmptyState.tsx`
- [ ] `app/src/components/ui/Skeleton.tsx`
- [ ] `app/src/components/ui/Icon.tsx`

---

## Backlog — database (blueprint §9)

- [x] `supabase/migrations/001_types_and_tables.sql`
- [x] `supabase/migrations/002_rls_policies.sql`
- [x] `supabase/migrations/003_indexes.sql`
- [x] `supabase/migrations/004_scans_table.sql`
- [x] 2026-09-26: `supabase/migrations/006_remap_sensitive_tags.sql` — idempotent `sensitive`→`sensitivity` remap on prod-2/6/9/10 (text-space comparison; seed script UUID + enum fixes alongside)
- [x] 2026-09-26: `docs/ai-evaluation.md` — §5.7 methodology with [PENDING] placeholders, canonical 3-class sets, learning doc 22

---

## Backlog — catalog (blueprint §7)

- [x] `catalog/products.csv` with headers
- [x] `catalog/ingredients.csv` with headers
- [x] First 10 products annotated (with cross-check)
- [x] 2026-09-26: 20 additional products annotated (catalog now 30 total, validator zero errors, seed regen clean; learning doc 20)
- [x] 2026-09-26: Audit-first UI stability (nesting audit: RecentChecksList/ProductSearchBar/ChipManager FlatList→map, View All→/history, verdict colors to theme; History/Verdict left intact; §10.2 + locked tokens/composition preserved; 367 tests pass; learning doc 23)
- [x] 2026-09-26: Guest-mode uuid crash fix (`getRecentChecks`/`getScanHistory` return [] on empty userId instead of querying; new `src/catalog/__tests__/api.test.ts`; 370 tests pass)
- [x] `scripts/seed-catalog.mjs`
- [x] `app/src/catalog/normalize.ts`
- [x] `scripts/validate-catalog.mjs` — Closed-vocab, evidence, and unmatched-threshold checks (run: `node scripts/validate-catalog.mjs`)

---

## Backlog — screens (blueprint §4)

- [x] `app/src/profile/ProfileScreen.tsx` (moved from screens/ to profile/)
- [x] `app/src/profile/store.ts` + `__tests__/store.test.ts` — Profile Zustand store with debounced Supabase sync
- [x] `app/src/profile/__tests__/supabaseSync.test.ts` — Supabase sync integration tests
- [x] `app/src/profile/__tests__/ProfileScreen.test.tsx` — ProfileScreen component tests
- [x] `app/src/screens/SearchScreen.tsx` — Search with debounced Supabase query, recent checks
- [x] `app/src/screens/VerdictScreen.tsx` — Locked composition per design doc
- [x] `app/src/components/VerdictBadge.tsx` — Hero verdict badge
- [x] `app/src/components/ScoreLine.tsx` — Compatibility factors score
- [x] `app/src/components/HardConstraintBanner.tsx` — Hard constraints block
- [x] `app/src/components/FactorBreakdownCard.tsx` — Collapsible factor cards
- [x] `app/src/components/DisclaimerBlock.tsx` — Fixed bottom disclaimer
- [x] `app/src/components/ProductSearchBar.tsx` — Search input with dropdown
- [x] `app/src/components/RecentChecksList.tsx` — Recent checks from Supabase
- [x] `app/src/verdict/hooks/useVerdict.ts` — Fetch product + evaluate verdict hook
  (implemented at `app/src/catalog/useVerdict.ts`; TASKS path above is stale — canonical path is the catalog one)
- [x] `app/src/catalog/api.ts` — Supabase product queries
- [x] `app/src/screens/ScanScreen.tsx` (implemented at `app/src/scan/ScanScreen.tsx` with full state machine, tests, design doc)
- [x] `app/src/screens/HomeScreen.tsx` (implemented at `app/src/home/HomeScreen.tsx` with tab navigation, 31 tests passing)
- [x] `app/src/screens/HistoryScreen.tsx` (should-have)
- [x] `app/src/screens/OnboardingScreen.tsx` (should-have) — 2026-09-26 first-run baseline form with local completion flag, route + gate, 7 tests, learning doc 21

---

## Manual tasks pending

- [M] Gate 1: apply migrations 001–006 on a live Supabase project; confirm 006 runs cleanly (idempotent; expect 0 rows changed on freshly seeded DBs)
- [M] Gate 2: regenerate + apply seed (`node scripts/seed-catalog.mjs`, 30 distinct UUIDs verified); confirm 30 products / 26 concerns load. NOTE: a DB seeded with the pre-fix seed holds 20 rows colliding on prod-1's UUID — delete those before re-seeding
- [M] Gate 3: Expo Go device run — OnboardingScreen → HomeScreen → ScanScreen → VerdictScreen → HistoryScreen
- [M] Gate 4 (corrected): live /analyze scan; verify in-memory processing only — zero /tmp or disk writes, zero DB/storage calls for image bytes, logs carry telemetry without image data

---

## Done

- [x] 2026-09-25: `app/src/verdict/types.ts` — Verdict engine type definitions (Profile, Product, FactorResult, Verdict, etc.) per blueprint §6.1, §6.3, §6.8
- [x] 2026-09-25: `app/src/verdict/factors/allergen.ts` + `__tests__/allergen.test.ts` — Declared-allergen conflict factor (hard constraint) per blueprint §6.2, §6.3, §6.7. Uses `allergen.toLowerCase().trim()` against `ingredients_normalized`. Returns pass/fail/insufficient_data. All 9 tests pass.
- [x] 2026-09-25: `app/src/verdict/factors/sensitivity.ts` + `__tests__/sensitivity.test.ts` — Sensitivity factor (hard constraint) per blueprint §6.2, §6.3. Checks user sensitivities against product ingredients flagged with `is_sensitivity_flag` in ingredient_concerns lookup. Resolves aliases bidirectionally. Returns pass/caution/insufficient_data. All 14 tests pass.
- [x] 2026-09-25: `app/src/verdict/factors/skinTypeFit.ts` + `__tests__/skinTypeFit.test.ts` — Skin-type fit compatibility factor per blueprint §6.2, §6.3, §6.5. Checks user_skin_type against product.skin_type_tags. Returns pass/caution/fail/insufficient_data. Empty tags = caution (neutral). All 9 tests pass.
- [x] 2026-09-25: `app/src/verdict/factors/acneFit.ts` + `__tests__/acneFit.test.ts` — Acne-concern fit compatibility factor per blueprint §6.2, §6.3, §6.4, §6.5. Three-tier severity logic (mild/moderate/severe) with ingredient-level checks for helps_with_acne, strong_actives, barrier_support. Partial data degrades severe to moderate + caution cap. Bidirectional alias resolution. All 20 tests pass.
- [x] 2026-09-25: `app/src/verdict/factors/ageFit.ts` + `__tests__/ageFit.test.ts` — Age fit compatibility factor per blueprint §6.2, §6.3. Parses free-text age_notes into structured restrictions. Bare numeric (18+, under 30, 20-40) = strong (fail outside range). Advisory language (ideal for, teen-friendly, mature skin) = mild (always caution). Unparseable = pass. All 40 tests pass.
- [x] 2026-09-25: `app/src/verdict/precedence.ts` + `__tests__/precedence.test.ts` — Precedence rule implementation per blueprint §6.5. Exact if/else chain: allergen fail→mismatch, allergen insufficient→caution, sensitivity fail→mismatch, sensitivity caution→caution, then compat pass count (3→match, 2→caution, 0-1→mismatch) with insufficient_data cap at caution. All 23 tests pass.
- [x] 2026-09-25: `app/src/verdict/score.ts` + `__tests__/score.test.ts` — Compatibility score computation per blueprint §6.6. Counts pass states among 3 compat factors only. Returns {label: "Compatibility factors", passed: 0-3, total: 3}. All 9 tests pass.
- [x] 2026-09-25: `app/src/verdict/index.ts` + `__tests__/index.test.ts` — Public evaluate() entry point per blueprint §6.1, §6.8. Runs all 5 factors, applies precedence, computes score, generates reasons & summary. 15 integration tests covering all 12 §12 scenarios + determinism + terminology checks.
- [x] 2026-09-25: `supabase/migrations/001_types_and_tables.sql`, `002_rls_policies.sql`, `003_indexes.sql` — Supabase schema per blueprint §9.1, §9.2. Custom ENUMs, core tables (products, ingredient_concerns, profiles, allergies, sensitivities, checks), RLS policies (user_id = auth.uid()), GIN indexes on array columns.
- [x] 2026-09-25: `app/src/catalog/normalize.ts` + `__tests__/normalize.test.ts` — Ingredient normalization pipeline per blueprint §7.5. Split (paren-aware), lowercase, trim, remove parentheticals, alias resolution (canonical-first), unmatched tracking, 30% partial_data threshold. 30 tests pass.
- [x] 2026-09-25: `catalog/products.csv`, `catalog/ingredients.csv` — 10 products, 26 ingredient concerns per blueprint §7.2, §7.6, §7.8. Products cover major brands; ingredients cover strong_actives, barrier_support, sensitivity flags.
- [x] 2026-09-25: `scripts/seed-catalog.mjs` — Seed script per ADR-003. Reads CSVs, runs normalization, generates idempotent SQL seed files (supabase/seed/001_products.sql, 002_ingredient_concerns.sql). Canonical-first alias resolution preserves specific ingredient names.
- [x] 2026-09-25: pp/src/profile/store.ts + __tests__/store.test.ts � Profile Zustand store per blueprint �4, �5.3, �9. User fields (skin type, acne severity, age, allergies, sensitivities) + AI fields. Debounced (500ms) Supabase persistence via lazy getter for testability. 21 unit tests pass.
- [x] 2026-09-25: pp/src/profile/__tests__/supabaseSync.test.ts � Supabase sync integration tests. Per-table mock chains for profiles/allergies/sensitivities with fluent API (delete().eq()). Verifies upsert, delete+insert, empty array handling, sync status, error handling. 8 tests pass.
- [x] 2026-09-25: pp/src/profile/ProfileScreen.tsx + __tests__/ProfileScreen.test.tsx � Profile screen per blueprint �4, �5.3. Renders all sections with AI override banners. Conditional "Looks right" button (=0.60 confidence) and low-confidence notice (<0.60). Fixed import paths (../theme, ./store). 14 tests pass.
- [x] 2026-09-25: pp/src/catalog/api.ts � Supabase product queries (searchProducts, getProduct, getRecentChecks) per blueprint �7, �9.
- [x] 2026-09-25: pp/src/verdict/hooks/useVerdict.ts � Hook fetching product, reading profile, calling evaluate() per blueprint �5.1, �6.8. Returns {verdict, product, loading, error, refetch}.
- [x] 2026-09-25: pp/src/components/VerdictBadge.tsx � Hero badge per design doc �1. Full-width, paper bg, 2px verdict border, Fraunces 32pt verdict word, Inter 16pt summary.
- [x] 2026-09-25: pp/src/components/ScoreLine.tsx � Score line per design doc �2, blueprint �6.6. "X of 3 compatibility factors matched. Y hard constraint(s) flagged."
- [x] 2026-09-25: pp/src/components/HardConstraintBanner.tsx � Hard constraints block per design doc �3. Shows only when flagged; allergen/sensitivity with icons, names, results, reasons.
- [x] 2026-09-25: pp/src/components/FactorBreakdownCard.tsx � Collapsible factor cards per design doc �4. Fixed order (skin-type, acne, age); icon, name, result, reason (2-line clamp).
- [x] 2026-09-25: pp/src/components/DisclaimerBlock.tsx � Fixed bottom disclaimer per design doc �5, blueprint �10.1. Verbatim text, paper bg, thin rule, no close button.
- [x] 2026-09-25: pp/src/components/ProductSearchBar.tsx � Search input with 300ms debounce, Supabase query, 40x40 thumbnails, dropdown results. Fixed always-render TextInput.
- [x] 2026-09-25: pp/src/components/RecentChecksList.tsx � Recent checks from Supabase checks table (limit 5), thumbnails, verdict badges, empty state.
- [x] 2026-09-25: pp/src/screens/SearchScreen.tsx � Search bar + recent checks. Product select ? navigate to /verdict/:productId.
- [x] 2026-09-25: pp/src/screens/VerdictScreen.tsx � Locked composition per design doc. All 6 sections in order: byline, badge, score, hard constraints, compat factors, disclaimer + action.
- [x] 2026-09-25: Tests for all components and screens (288 total tests pass).
- [x] 2026-09-25: inference-server/pyproject.toml � FastAPI project config with mock/PyTorch/ONNX optional deps, pytest config.
- [x] 2026-09-25: inference-server/.env.example � Environment variables template (MODEL_MODE, model paths, CORS, image limits).
- [x] 2026-09-25: inference-server/inference_server/config.py � Pydantic Settings for env-driven config per blueprint �8.1.
- [x] 2026-09-25: inference-server/inference_server/schemas/prediction.py � Pydantic models per blueprint �5.2 AI Output Contract (label, confidence, model_version).
- [x] 2026-09-25: inference-server/inference_server/preprocessing/image.py � Image validation, loading, preprocessing (224x224, ImageNet norm) per �8.3.
- [x] 2026-09-25: inference-server/inference_server/models/loader.py � Model factory (mock/pytorch/onnx) with deterministic MockModel per �5.1, �5.2.
- [x] 2026-09-25: inference-server/inference_server/models/skin_type.py � Skin type prediction wrapper returning PredictResponse.
- [x] 2026-09-25: inference-server/inference_server/models/acne_severity.py � Acne severity prediction wrapper returning PredictResponse.
- [x] 2026-09-25: inference-server/inference_server/main.py � FastAPI app with /health, /predict/skin-type, /predict/acne-severity per �8.3.
- [x] 2026-09-25: inference-server/inference_server/utils/privacy.py � Image discard utilities per �8.4 (in-memory only, no disk writes).
- [x] 2026-09-25: inference-server/tests/ � 53 pytest tests (schemas, preprocessing, mock models, endpoints) covering all 17 test cases.

- [x] 2026-09-26: \pp/src/scan/\ � Scan screen with 5-state machine (PERMISSIONS_REQUIRED ? CAMERA_ACTIVE ? ANALYZING ? RESULT_REVIEW / ERROR_RETRY), camera/gallery capture, concurrent inference API calls, confidence evaluation (threshold 0.60), terminology-compliant UI, profile store hydration. 26 tests pass. Design doc at \docs/design/screens/scan.md\.
- [x] 2026-09-26: \pp/src/home/\ + \pp/(tabs)/\ � Home screen dashboard (ProfileSummaryCard, QuickActionsBar, RecentChecksSection) with root tab navigation (Home, Scan, Search, Profile). Expo Router (tabs) layout, Ionicons, theme-driven styling. 31 tests pass. Design doc at \docs/design/screens/home.md\.
- [x] 2026-09-26: \.github/workflows/ci.yml\ � Unified CI/CD pipeline with parallel jobs: mobile-test (Node 20, typecheck + lint + Jest) and inference-test (Python 3.11, pytest). Concurrency cancellation, npm/pip caching, working-directory isolation. 62+ tests pass across both stacks.
- [x] 2026-09-26: \inference-server/Dockerfile\ + \.dockerignore\ + \docker-compose.yml\ + \pp/eas.json\ � Production deployment scaffolding: multi-stage Dockerfile (python:3.11-slim, non-root user, uvicorn workers, healthcheck), .dockerignore, root compose (port 8000), EAS profiles (development/preview/production). Learning doc at \docs/learning/15-production-deployment-scaffolding.md\.
- [x] 2026-09-26: \inference-server/inference_server/main.py\ + \config.py\ + \tests/test_privacy.py\ � Security & privacy hardening per blueprint §8.1, §8.4. Rate limiting (10 req/min shared across /predict/* via application_limits + custom key function), privacy headers (Cache-Control: no-store, Pragma: no-cache on all /predict/* responses), CORS lockdown (explicit origins in production, wildcard in dev), health endpoint exempt. 15 new tests, all 68 tests pass. Learning doc at \docs/learning/16-security-and-privacy-hardening.md\.
- [x] 2026-09-26: \inference-server/inference_server/main.py\ + \schemas/prediction.py\ + \utils/supabase_client.py\ + \models/pytorch_inference.py\ + \config.py\ + \supabase/migrations/004_scans_table.sql\ + \scripts/test_api.py\ � FastAPI /analyze endpoint per blueprint §8.1, §8.3, §9.1. Combined skin type + acne severity analysis in single POST, optional user_id from Bearer token, Supabase scans table insert with RLS, graceful degradation to "partial" status if DB unavailable. PyTorch models loaded lazily from checkpoints with dynamic class loading. Test script with synthetic image fallback. All 68 tests pass. Learning doc at \docs/learning/17-fastapi-analyze-endpoint.md\.

- [x] 2026-09-26: \app/src/screens/HistoryScreen.tsx + __tests__/HistoryScreen.test.tsx + catalog/api.ts (getScanHistory) + theme/colors.ts (badge palette) � Scan history screen per blueprint §4.2, §9.1. Chronological FlatList with verdict, skin type badge (#007AFF), acne severity badges (green/yellow/red), compatibility score, formatted timestamps (MMM DD, YYYY • h:mm A), pull-to-refresh, loading/empty/error states, graceful offline/unauthenticated fallback. 10 tests pass. Learning doc at \docs/learning/18-scan-history-screen.md\.
