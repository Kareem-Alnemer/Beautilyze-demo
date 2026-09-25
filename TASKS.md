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
- [ ] `inference-server/pyproject.toml`
- [ ] `inference-server/main.py`
- [ ] `inference-server/config.py`
- [ ] `.env.example`
- [ ] `.github/workflows/app-tests.yml`
- [ ] `.github/workflows/server-tests.yml`
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

- [ ] `app/src/screens/ProfileScreen.tsx`
- [ ] `app/src/screens/SearchScreen.tsx`
- [ ] `app/src/screens/VerdictScreen.tsx`
- [ ] `app/src/screens/ScanScreen.tsx`
- [ ] `app/src/screens/HomeScreen.tsx`
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