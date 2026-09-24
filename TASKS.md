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

- [ ] `app/src/verdict/types.ts`
- [ ] `app/src/verdict/index.ts`
- [ ] `app/src/verdict/precedence.ts`
- [ ] `app/src/verdict/score.ts`
- [ ] `app/src/verdict/factors/allergenConflict.ts`
- [ ] `app/src/verdict/factors/sensitivity.ts`
- [ ] `app/src/verdict/factors/skinTypeFit.ts`
- [ ] `app/src/verdict/factors/acneFit.ts`
- [ ] `app/src/verdict/factors/ageFit.ts`
- [ ] All 12 tests from blueprint §12
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

- [ ] `supabase/migrations/001_initial_schema.sql`
- [ ] `supabase/migrations/002_rls_policies.sql`
- [ ] `supabase/migrations/003_ingredient_concerns.sql`

---

## Backlog — catalog (blueprint §7)

- [ ] `catalog/products.csv` with headers
- [ ] `catalog/ingredients.csv` with headers
- [ ] First 10 products annotated (with cross-check)
- [ ] `scripts/validate-catalog.ts`
- [ ] `scripts/seed-catalog.ts`
- [ ] `scripts/normalize-ingredients.ts`

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

(agent moves completed tasks here with a date)