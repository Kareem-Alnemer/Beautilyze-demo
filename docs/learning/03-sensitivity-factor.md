# Sensitivity Factor Implementation

**Date:** 2026-09-25
**Blueprint:** §6.2, §6.3, §7.2
**Files changed:**
- `app/src/verdict/factors/sensitivity.ts`
- `app/src/verdict/factors/__tests__/sensitivity.test.ts`
**Prerequisites:** 01-verdict-engine-types.md, 02-allergen-factor.md

## 1. What this task was

This task implemented the second hard-constraint factor in the verdict engine: **Sensitivity**. While the allergen factor checks for declared allergies (which produce a MISMATCH verdict), the sensitivity factor checks for user-flagged sensitivities like "fragrance" or "essential oils" — ingredients that may irritate sensitive skin but aren't allergies. Per the blueprint precedence rule (§6.5), a sensitivity conflict produces a CAUTION verdict (cannot upgrade to MATCH), whereas an allergen conflict produces MISMATCH (overrides everything).

The factor reads the user's `sensitivities` array from their profile, compares each entry against the product's normalized ingredient list, and only flags a match if that ingredient is marked with `is_sensitivity_flag: true` in the ingredient_concerns lookup table (§7.2). It also handles alias resolution bidirectionally: the user might declare "parfum" (an alias) while the product contains "fragrance" (canonical), or vice versa.

## 2. The concept

**Hard constraint factor** — A verdict factor that can override or cap the final verdict regardless of how well the compatibility factors (skin type, acne, age) score. There are two hard constraints: declared-allergen conflict and sensitivity.

**Sensitivity vs. Allergy** — An allergy is an immune response; a sensitivity is an irritation or intolerance. In BeautiLyze, they are separate user inputs with different verdict consequences:
- Allergy match → MISMATCH (hard stop)
- Sensitivity match → CAUTION (proceed with warning)

**Ingredient concern lookup table** — A curated table (`ingredient_concerns`) mapping ~20–30 ingredients to metadata: what concerns they help with, what skin types they caution for, whether they are common allergens, whether they are sensitivity flags, strong actives, or barrier support. Every entry cites a source (INCIDecoder, INCI Beauty). The sensitivity factor only cares about `is_sensitivity_flag`.

**Alias resolution** — Ingredients have multiple names (e.g., "fragrance" = "parfum" = "perfume"). The normalization pipeline (§7.5) resolves product ingredients to canonical names. But users may enter aliases. The factor must match in both directions: user alias → product canonical, and user canonical → product canonical (since product is already normalized).

**FactorState** — Each factor returns one of four states: `pass`, `caution`, `fail`, `insufficient_data`. For sensitivity, valid states are `pass`, `caution`, `insufficient_data` — `fail` is not used (blueprint §6.3).

## 3. The decision

**Options considered:**

1. **Direct string match only** — Compare user sensitivities directly against `ingredients_normalized`. Simple, but misses alias matches (user enters "parfum", product has "fragrance").

2. **Alias resolution on user side only** — Build a map from alias → canonical for flagged ingredients. When user enters "parfum", resolve to "fragrance" and check product. Handles the common case.

3. **Full bidirectional alias resolution** — Also handle the reverse: if product somehow has an alias (though §7.5 says it shouldn't), and user enters canonical. More robust.

**Chosen:** Option 3 (bidirectional). The product ingredients *should* be canonical per §7.5, but defensive coding costs little and prevents silent failures if normalization is skipped or incomplete. The implementation builds:
- `flaggedIngredients` — Set of all canonical names + aliases (lowercased) for fast `has()` checks
- `aliasToCanonical` — Map from alias → canonical for resolving user input

**Rejected:** Option 1 (too brittle), Option 2 (incomplete defense).

**Why `caution` not `fail`?** Blueprint §6.3 explicitly lists only `pass`, `caution`, `insufficient_data` for sensitivity. The precedence rule (§6.5) treats sensitivity `caution` as a cap: "Else if sensitivity == CAUTION → verdict = CAUTION (cannot upgrade)." This is intentional: a sensitivity is a warning, not a block.

## 4. The code, line by line

### `app/src/verdict/factors/sensitivity.ts`

**Lines 1–11: Types**
```typescript
export interface IngredientConcern {
  ingredient_name: string;
  aliases: string[];
  is_sensitivity_flag: boolean;
}
```
Minimal shape from the ingredient_concerns table (§7.2). Only fields needed for sensitivity evaluation. Kept separate from the full table type to keep the factor's dependencies minimal.

**Lines 13–31: JSDoc**
Documents the factor's role, return states, and alias handling. References blueprint sections for traceability.

**Lines 32–36: Function signature**
```typescript
export function evaluateSensitivity(
  profile: Profile,
  product: Product,
  ingredientConcerns: IngredientConcern[] = []
): FactorState
```
Third parameter is optional (defaults to empty array) so the factor can be tested without a full lookup table. In production, the caller passes the fetched ingredient_concerns rows.

**Lines 37–41: Partial data check**
```typescript
if (product.partial_data) {
  return 'insufficient_data';
}
```
Per §6.3 and §7.5: if >30% of ingredients are unmatched, `partial_data` is true. We cannot verify sensitivities on incomplete data, so we return `insufficient_data` which caps the verdict at CAUTION (§6.5 step 2).

**Lines 43–46: No sensitivities declared**
```typescript
if (!profile.sensitivities || profile.sensitivities.length === 0) {
  return 'pass';
}
```
Nothing to check → pass.

**Lines 48–59: Build lookup sets**
```typescript
const flaggedIngredients = new Set<string>();
const aliasToCanonical = new Map<string, string>();
for (const concern of ingredientConcerns) {
  if (concern.is_sensitivity_flag) {
    const canonical = concern.ingredient_name.toLowerCase();
    flaggedIngredients.add(canonical);
    for (const alias of concern.aliases) {
      const normalizedAlias = alias.toLowerCase();
      flaggedIngredients.add(normalizedAlias);
      aliasToCanonical.set(normalizedAlias, canonical);
    }
  }
}
```
Single pass through the lookup table. Only processes rows where `is_sensitivity_flag === true`. Populates:
- `flaggedIngredients` — all names (canonical + aliases) that should trigger caution, lowercased for case-insensitive matching
- `aliasToCanonical` — maps each alias to its canonical name for resolution

**Lines 61–65: Normalize user sensitivities**
```typescript
const normalizedSensitivities = profile.sensitivities.map((s) =>
  s.toLowerCase().trim()
);
```
Same normalization as allergen factor: lowercase + trim. User might enter "  FRAGRANCE  ".

**Lines 67–80: Match loop**
```typescript
for (const sensitivity of normalizedSensitivities) {
  // Direct match: user sensitivity matches a product ingredient directly
  if (product.ingredients_normalized.includes(sensitivity)) {
    if (flaggedIngredients.has(sensitivity)) {
      return 'caution';
    }
  }
  // Alias match: user sensitivity is an alias for a flagged ingredient;
  // check if product has the canonical name
  const canonical = aliasToCanonical.get(sensitivity);
  if (canonical && product.ingredients_normalized.includes(canonical)) {
    return 'caution';
  }
}
```
Two checks per sensitivity:
1. **Direct** — user entry exactly matches a product ingredient (e.g., user "fragrance", product "fragrance"). Then verify it's flagged.
2. **Alias-resolved** — user entry is an alias (e.g., "parfum"). Look up canonical ("fragrance"), check if product has canonical.

Returns `caution` on first match. Short-circuits — one flagged ingredient is enough.

**Line 82: Default pass**
```typescript
return 'pass';
```
No flagged matches found in a complete ingredient list.

### `app/src/verdict/factors/__tests__/sensitivity.test.ts`

**Test fixtures:**
- `baseProfile` — normal skin, mild acne, age 25, empty sensitivities
- `baseProduct` — ingredients: water, glycerin, niacinamide, fragrance
- `baseIngredientConcerns` — fragrance (flagged, aliases: parfum, perfume), essential oil (flagged, aliases: lavender oil, tea tree oil), niacinamide (not flagged)

**14 tests covering:**
1. No sensitivities → pass
2. Sensitivities don't match any ingredient → pass
3. Sensitivity matches ingredient but ingredient not flagged (niacinamide) → pass
4. Sensitivity matches flagged ingredient (fragrance) → caution
5. Case-insensitive match → caution
6. Whitespace handling → caution
7. **Alias match** — user "parfum" → product "fragrance" → caution
8. Multiple sensitivities, one matches → caution
9. `partial_data: true` → insufficient_data (even with matching sensitivity)
10. `partial_data: true` with no sensitivities → insufficient_data
11. Empty ingredient concerns list → pass (no flags known)
12. Normalization (lowercase + trim) → caution
13. Partial name ("grance") does not match "fragrance" → pass
14. Canonical sensitivity ("essential oil") matches product canonical ("essential oil") → caution

## 5. How to verify it works

```bash
cd app
npm test -- --testPathPattern="sensitivity.test.ts"
```

Expected output: 14 tests pass, 0 fail.

Full test suite:
```bash
cd app
npm test
```
Expected: 25 tests pass (9 allergen + 14 sensitivity + 2 theme).

Lint:
```bash
cd app
npm run lint
```
Expected: no output (clean).

Type check:
```bash
cd app
npx tsc --noEmit
```
Expected: no output (clean).

## 6. What could go wrong

1. **Ingredient concerns not fetched** — If the caller passes an empty array (or fails to fetch), the factor returns `pass` silently. The verdict would miss sensitivity warnings. Mitigation: the calling code (verdict index.ts) must fetch ingredient_concerns before evaluating factors, and handle fetch errors explicitly.

2. **Product ingredients not normalized** — If `ingredients_normalized` contains aliases instead of canonical names (normalization pipeline skipped), the direct match might fail. The alias resolution handles the reverse case (user canonical → product alias) but not user alias → product alias. Mitigation: trust the pipeline (§7.5), but the bidirectional design catches one direction.

3. **Case sensitivity in product ingredients** — The code assumes `ingredients_normalized` is already lowercased (per §7.5 step 1). If not, matches fail. Mitigation: normalization pipeline contract.

## 7. If you remember one thing

The sensitivity factor is a **hard constraint that caps at CAUTION** — it never produces MISMATCH. It checks user sensitivities against ingredients flagged with `is_sensitivity_flag: true` in the lookup table, with bidirectional alias resolution so "parfum" matches "fragrance" and vice versa.

## 8. Questions to ask yourself before the defense

1. **What's the difference between the allergen factor and the sensitivity factor in terms of verdict impact?**
   - Allergen `fail` → MISMATCH (overrides everything). Sensitivity `caution` → CAUTION (caps verdict, cannot upgrade to MATCH).

2. **Why does the sensitivity factor need the ingredient_concerns lookup table but the allergen factor doesn't?**
   - Allergen factor does exact string match: user declares "peanut", check if "peanut" is in ingredients. Sensitivity factor only flags ingredients *known to be sensitivity concerns* (per curated table), not every ingredient the user dislikes.

3. **What happens if `product.partial_data` is true and the user has a sensitivity that matches a flagged ingredient?**
   - Returns `insufficient_data` (line 40). The partial data check runs first, before any matching. This caps the verdict at CAUTION per precedence rule step 2.

4. **How does alias resolution work in both directions?**
   - `flaggedIngredients` set contains both canonical and aliases (lowercased) for fast `has()` check on direct matches.
   - `aliasToCanonical` map resolves user alias → canonical, then checks if product has canonical.

5. **Why is `fail` not a valid state for sensitivity?**
   - Blueprint §6.3 table explicitly lists only pass/caution/insufficient_data. Sensitivity is a warning, not a block. The precedence rule (§6.5) treats sensitivity `caution` as a cap, not an override.