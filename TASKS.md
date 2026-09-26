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

(none)

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
- [ ] Remove `--passWithNoTests` from test script once real tests exist (post-verdict-engine)
- [x] `inference-server/pyproject.toml`
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

---

## Backlog — catalog (blueprint §7)

- [x] `catalog/products.csv` with headers
- [x] `catalog/ingredients.csv` with headers
- [x] First 10 products annotated (with cross-check)
- [x] `scripts/seed-catalog.mjs`
- [x] `app/src/catalog/normalize.ts`
- [ ] `scripts/validate-catalog.ts`

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
- [x] `app/src/catalog/api.ts` — Supabase product queries
- [x] `app/src/screens/ScanScreen.tsx` (implemented at `app/src/scan/ScanScreen.tsx` with full state machine, tests, design doc)
- [x] `app/src/screens/HomeScreen.tsx` (implemented at `app/src/home/HomeScreen.tsx` with tab navigation, 31 tests passing)
- [ ] `app/src/screens/HistoryScreen.tsx` (should-have)
- [ ] `app/src/screens/OnboardingScreen.tsx` (should-have)

---

## Manual tasks pending

(none)

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
