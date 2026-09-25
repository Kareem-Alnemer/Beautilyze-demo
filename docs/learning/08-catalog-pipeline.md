# Catalog & Ingredient Database Pipeline

**Date:** 2026-09-25
**Blueprint:** §7.2, §7.5, §7.6, §7.8, §9.1, §9.2, ADR-003
**Files changed:**
- `supabase/migrations/001_types_and_tables.sql`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/migrations/003_indexes.sql`
- `app/src/catalog/normalize.ts`
- `app/src/catalog/__tests__/normalize.test.ts`
- `catalog/products.csv`
- `catalog/ingredients.csv`
- `scripts/seed-catalog.mjs`
- `supabase/seed/001_products.sql` (generated)
- `supabase/seed/002_ingredient_concerns.sql` (generated)
**Prerequisites:** 01-verdict-engine-types.md through 07-verdict-engine-aggregation.md

## 1. What this task was

This task implemented the **catalog and ingredient database pipeline** — the data layer that feeds the verdict engine. It includes:

1. **Supabase schema** (3 migrations): Custom ENUM types, core tables (`products`, `ingredient_concerns`, `profiles`, `allergies`, `sensitivities`, `checks`), RLS policies, and indexes
2. **Normalization utility** (`app/src/catalog/normalize.ts`): Implements the ingredient normalization pipeline from blueprint §7.5
3. **CSV seed files** (`catalog/products.csv`, `catalog/ingredients.csv`): Source of truth for catalog data per ADR-003
4. **Seed script** (`scripts/seed-catalog.mjs`): Reads CSVs, runs normalization, generates SQL seed files

The pipeline ensures that product ingredient lists are normalized (lowercased, trimmed, aliases resolved, parentheticals removed) before being stored, and that the `ingredient_concerns` lookup table is populated with canonical names and aliases for use by the verdict engine's sensitivity and acne factors.

## 2. The concept

**CSV → Normalization → SQL Seed** — Per ADR-003, the catalog source of truth is human-editable CSV files, not raw SQL. The seed script validates CSV data, runs the normalization pipeline, and generates idempotent SQL seed files. This makes the catalog reviewable in PRs and reproducible.

**Ingredient Normalization Pipeline (§7.5)** — Raw ingredient strings from product labels are messy (`Aqua`, `Water`, `SALICYLIC ACID`, `Niacinamide (5%)`). The pipeline:
1. **Splits** on commas (respecting parentheses)
2. **Lowercases** and **trims** each ingredient
3. **Removes parentheticals** (e.g., `Water (Aqua)` → `water`)
4. **Resolves aliases** via `ingredient_concerns` lookup table (e.g., `vitamin b3` → `niacinamide`, `bha` → `salicylic acid`)
5. **Flags unmatched** ingredients (preserved for audit, don't participate in matching)
6. **Computes `partial_data`** flag if >30% unmatched (caps allergy factor at `insufficient_data`)

**Ingredient Concerns Lookup Table (§7.2)** — A curated table of ~20-30 ingredients with metadata:
- `helps_with`: which concerns the ingredient addresses (e.g., `acne`, `oily`, `barrier`)
- `caution_for`: which skin types should be cautious (e.g., `dry`, `sensitive`)
- `is_sensitivity_flag`: common irritants (fragrance, essential oils)
- `is_strong_active`: potent actives (salicylic acid, retinol, benzoyl peroxide)
- `is_barrier_support`: barrier-repairing ingredients (ceramides, niacinamide, hyaluronic acid)
- Every entry cites a source (INCI Beauty, Paula's Choice)

**Catalog Annotation (§7.6)** — Each product is manually annotated with:
- `skin_type_tags`: which skin types the product suits
- `concern_tags`: from closed vocabulary (acne, oil_control, hydration, dryness, sensitivity)
- `age_notes`: free-text age suitability
- Source URL, rationale, annotator initials, date

## 3. The decision

**Options for catalog source of truth:**

1. **Direct SQL edits** — Rejected. Not reviewable in PRs, error-prone.
2. **Runtime script insertion** — Rejected. Not reproducible, not reviewable.
3. **CSV → Script → SQL** — Chosen. Human-editable CSV, script validates and generates SQL, committed seed files are reviewable.

**Options for normalization:**

1. **Simple split on commas** — Rejected. Breaks on ingredients like `Niacinamide (5%, pure)`.
2. **Regex-based split with paren tracking** — Chosen. Handles nested parentheses correctly.
3. **Full NLP parser** — Rejected. Overkill for MVP.

**Options for alias resolution:**

1. **Overwrite canonical with aliases** — Rejected. Causes generic names (e.g., `ceramides`) to overwrite specific ones (e.g., `ceramide np`).
2. **Canonical-first, aliases only fill gaps** — Chosen. Canonical names registered first; aliases only added if key doesn't exist. Preserves specific ingredient names.

**Options for partial_data threshold:**

1. **Configurable** — Rejected. MVP heuristic, not safety boundary.
2. **30% hardcoded** — Chosen. Per §7.5: "30% is an MVP engineering heuristic, not a safety boundary."

**RLS Strategy:**
- User-scoped tables (`profiles`, `allergies`, `sensitivities`, `checks`): `user_id = auth.uid()`
- Shared tables (`products`, `ingredient_concerns`): public read, no write policies

## 4. The code, line by line

### `supabase/migrations/001_types_and_tables.sql`

**Lines 1–4: Custom ENUM types**
```sql
CREATE TYPE skin_type AS ENUM ('dry', 'normal', 'oily');
CREATE TYPE acne_severity AS ENUM ('mild', 'moderate', 'severe');
CREATE TYPE concern_tag AS ENUM ('acne', 'oil_control', 'hydration', 'dryness', 'sensitivity');
```
Defined before tables that reference them.

**Lines 6–25: products table**
```sql
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  ingredients_raw text NOT NULL,
  ingredients_normalized text[] NOT NULL DEFAULT '{}',
  unmatched_count int NOT NULL DEFAULT 0,
  partial_data boolean NOT NULL DEFAULT false,
  skin_type_tags skin_type[] NOT NULL DEFAULT '{}',
  concern_tags concern_tag[] NOT NULL DEFAULT '{}',
  age_notes text,
  annotation_source text,
  annotation_rationale text,
  annotator text,
  annotated_at timestamptz DEFAULT now()
);
```
Stores both raw and normalized ingredients, plus annotation metadata per §7.6.

**Lines 27–40: ingredient_concerns table**
```sql
CREATE TABLE ingredient_concerns (
  ingredient_name text PRIMARY KEY,
  aliases text[] NOT NULL DEFAULT '{}',
  helps_with concern_tag[] NOT NULL DEFAULT '{}',
  caution_for skin_type[] NOT NULL DEFAULT '{}',
  is_common_allergen boolean NOT NULL DEFAULT false,
  is_sensitivity_flag boolean NOT NULL DEFAULT false,
  is_strong_active boolean NOT NULL DEFAULT false,
  is_barrier_support boolean NOT NULL DEFAULT false,
  reason text,
  source text
);
```
Lookup table for normalization and verdict engine factors.

**Lines 42–55: profiles, allergies, sensitivities, checks tables**
Standard user-scoped tables with `user_id` foreign keys to `auth.users`.

### `supabase/migrations/002_rls_policies.sql`

**Lines 1–6: Enable RLS on all tables**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensitivities ENABLE ROW LEVEL SECURITY;
ALTER TABLE checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_concerns ENABLE ROW LEVEL SECURITY;
```
Critical: RLS must be enabled before policies take effect.

**Lines 8–25: Policies**
```sql
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);
```
User-scoped tables: users only see their own data. Shared tables: public read.

### `app/src/catalog/normalize.ts`

**Lines 1–30: splitIngredients**
```typescript
function splitIngredients(raw: string): string[] {
  let parenDepth = 0;
  for (const char of raw) {
    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === ',' && parenDepth === 0) { /* split */ }
  }
}
```
Splits on commas only at paren depth 0. Handles nested parentheses.

**Lines 32–50: normalizeIngredientString**
```typescript
let normalized = ingredient.toLowerCase().trim();
normalized = normalized.replace(/\([^)]*\)/g, '').trim();
normalized = normalized.replace(/[.,;]+$/, '').trim();
```
Lowercase, remove parentheticals, trim trailing punctuation.

**Lines 52–77: buildAliasMap**
```typescript
// First pass: register all canonical names
for (const concern of concerns) {
  aliasMap.set(canonical, canonical);
}
// Second pass: add aliases, but only if not already in map
for (const concern of concerns) {
  for (const alias of concern.aliases) {
    if (!aliasMap.has(normalizedAlias)) {
      aliasMap.set(normalizedAlias, canonical);
    }
  }
}
```
Canonical-first strategy: specific ingredient names (ceramide np) take precedence over generic aliases (ceramides).

**Lines 79–115: normalizeIngredients / normalizeFromRawString**
Main pipeline: split → normalize each → resolve alias → track unmatched → compute partial_data.

### `scripts/seed-catalog.mjs`

**Lines 1–50: Imports and normalization functions** (same logic as TypeScript version, in ESM JavaScript)

**Lines 140–170: generateProductInsert**
Runs normalization on product's `ingredients_raw`, builds INSERT with normalized array, unmatched count, partial_data flag.

**Lines 172–195: generateIngredientInsert**
Generates upsert (INSERT ... ON CONFLICT DO UPDATE) for ingredient_concerns.

**Lines 197–230: main**
Reads CSVs, parses, builds concerns array, generates SQL files.

### `catalog/products.csv` & `catalog/ingredients.csv`

10 sample products covering major brands (CeraVe, La Roche-Posay, The Ordinary, Neutrogena, Paula's Choice, Cetaphil, The Inkey List, Vanilla Co, EltaMD, First Aid Beauty) with diverse skin types, concerns, and ingredient profiles.

26 ingredient concerns covering the strong_actives set (salicylic acid, benzoyl peroxide, glycolic acid, retinol, adapalene), barrier_support set (ceramides, niacinamide, hyaluronic acid, glycerin, panthenol), plus common allergens/sensitivities (fragrance, essential oils).

## 5. How to verify it works

```bash
# Run normalization tests
cd app && npm test -- --testPathPattern="normalize.test.ts"
# 30 tests pass

# Run full test suite
cd app && npm test
# 182 tests pass

# Generate seed files
cd .. && node scripts/seed-catalog.mjs
# Generated 10 product inserts
# Generated 26 ingredient inserts
# Output written to supabase/seed/

# Verify generated SQL
cat supabase/seed/001_products.sql
cat supabase/seed/002_ingredient_concerns.sql

# Lint and typecheck
cd app && npm run lint && npx tsc --noEmit
# Clean
```

## 6. What could go wrong

1. **CSV format changes** — If CSV columns change, seed script breaks. Mitigation: script validates required columns.

2. **Alias collisions** — Two ingredients with same alias. Mitigation: canonical-first strategy; first canonical wins.

3. **Parentheses parsing edge cases** — Unmatched parentheses, nested too deep. Mitigation: paren depth tracking with max(0, ...) guard.

4. **Partial_data false positives** — Products with many uncommon ingredients flagged as partial. Mitigation: 30% threshold is heuristic; expand ingredient_concerns table over time.

5. **RLS blocking legitimate access** — If policies too restrictive. Mitigation: test with Supabase CLI `supabase db reset` and manual queries.

6. **Seed script idempotency** — Re-running should not duplicate. Mitigation: `ON CONFLICT DO UPDATE` for ingredients; products use explicit IDs.

## 7. If you remember one thing

The catalog pipeline is **CSV → Normalize → SQL**. Human-editable CSVs are source of truth. The normalization pipeline (split → lowercase → trim → remove parentheticals → resolve aliases → flag unmatched) runs at seed time, not runtime. The `ingredient_concerns` table is the single source of truth for ingredient metadata used by both normalization and the verdict engine. Canonical-first alias resolution prevents generic names from overwriting specific ones.

## 8. Questions to ask yourself before the defense

1. **Why CSV instead of direct SQL for the catalog?**
   - ADR-003: CSV is human-editable, reviewable in PRs, reproducible. SQL is not.

2. **How does the normalization pipeline handle `Water (Aqua)`?**
   - `splitIngredients` keeps it as one ingredient. `normalizeIngredientString` removes `(Aqua)` → `water`. Alias map resolves `aqua` → `water`.

3. **What happens if an ingredient isn't in the lookup table?**
   - Preserved in `ingredients_normalized` as-is, added to `unmatched_ingredients`, counted in `unmatched_count`. If >30% unmatched, `partial_data = true`.

4. **Why does `ceramide np` not become `ceramides`?**
   - Canonical-first alias resolution: `ceramide np` is registered as canonical first. When `ceramides` tries to add it as alias, the key already exists, so it's skipped.

5. **What does `partial_data = true` mean for the verdict?**
   - Per §6.5 and §7.5: caps the declared-allergen conflict factor at `insufficient_data`, which caps the final verdict at `CAUTION`.

6. **How are the seed files applied to Supabase?**
   - Run migrations 001, 002, 003 first (via `supabase db reset` or migration CLI), then run the seed SQL files in order.

7. **Why are `products` and `ingredient_concerns` public read?**
   - They contain no user data. The catalog is shared across all users. RLS is enabled but policies allow public SELECT.