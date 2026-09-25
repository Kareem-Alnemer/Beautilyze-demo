# Acne-Concern Fit Factor Implementation

**Date:** 2026-09-25
**Blueprint:** §6.2, §6.3, §6.4, §6.5
**Files changed:**
- `app/src/verdict/factors/acneFit.ts`
- `app/src/verdict/factors/__tests__/acneFit.test.ts`
**Prerequisites:** 01-verdict-engine-types.md, 02-allergen-factor.md, 03-sensitivity-factor.md, 04-skin-type-fit.md

## 1. What this task was

This task implemented the **second compatibility factor**: **acne-concern fit**. Unlike skin-type fit which only checks product tags, acne-concern fit reads the product's ingredient list and cross-references it with the ingredient_concerns lookup table to verify that products claiming to address acne actually contain ingredients that help with acne — and for severe acne, that they contain both strong actives AND barrier-supporting ingredients.

The factor implements the three-tier severity logic from blueprint §6.4:
- **Mild**: Pass if product has `acne` OR `oil_control` concern tag
- **Moderate**: Pass if product has `acne` tag AND ≥1 ingredient with `helps_with: acne`
- **Severe**: Pass if moderate condition met AND ≥1 `strong_active` AND ≥1 `barrier_support` ingredient

A critical design decision is the **degradation rule**: if the product has `partial_data: true` (ingredient list >30% unmatched), severe degrades to the moderate rule and the result is capped at `caution`.

## 2. The concept

**Compatibility factor with ingredient-level analysis** — This is the only compatibility factor that goes beyond product tags and inspects individual ingredients. It needs the `ingredient_concerns` lookup table to know which ingredients help with acne, which are strong actives, and which support the skin barrier.

**Three severity tiers** — The blueprint defines different evidence thresholds for each acne severity:
- Mild acne: low threshold — product just needs to claim it addresses acne or oil
- Moderate acne: medium threshold — product must have acne claim + at least one acne-helping ingredient
- Severe acne: high threshold — product must have acne claim + acne-helping ingredient + strong active + barrier support

**Strong actives** — Five ingredients flagged as potent acne treatments: salicylic acid, benzoyl peroxide, glycolic acid, retinol, adapalene. These can irritate, especially on compromised skin.

**Barrier support** — Five ingredients that protect/repair the skin barrier: ceramides, niacinamide, hyaluronic acid, glycerin, panthenol. Required alongside strong actives for severe acne to prevent over-drying/irritation.

**Degradation rule** — If ingredient data is incomplete (`partial_data`), we cannot verify the presence of strong actives or barrier support. Per §6.4: "If either set is unavailable due to incomplete ingredient data, the severe rule degrades to the moderate rule, and the verdict caps at caution." This is a safety-first approach: we don't fail a product for missing data, but we don't give it a full pass either.

**FactorState** — Returns `pass`, `caution`, `fail`, or `insufficient_data`. All four states are used:
- `insufficient_data`: user hasn't set acne severity
- `pass`: severity-specific criteria met
- `fail`: product has acne tag but lacks required ingredients for that severity
- `caution`: product neutral (no acne tag) OR severe with partial_data (degraded + capped)

## 3. The decision

**Options for severe acne rule:**

1. **Require all three (helps_with_acne + strong_active + barrier_support)** — Strict, matches blueprint exactly.
2. **Require strong_active OR barrier_support** — More lenient.
3. **Only require strong_active** — Ignores barrier support.

**Chosen:** Option 1 (all three required). This is explicitly specified in blueprint §6.4: "Same as moderate, **and** product has ≥1 `strong_active` ingredient **and** ≥1 `barrier_support` ingredient." The "and" is deliberate — severe acne skin is compromised and needs both treatment AND protection.

**Options for degradation behavior:**

1. **Degrade to moderate + cap at caution** — Blueprint specified.
2. **Return insufficient_data** — Too conservative.
3. **Fail if can't verify** — Too aggressive.

**Chosen:** Option 1. The blueprint is explicit: "degrades to the moderate rule, and the verdict caps at caution."

**Why `fail` vs `caution` distinction matters:**
- `fail` = product claims to address acne but doesn't have the goods → counts as 0 pass in aggregate (pulls toward MISMATCH)
- `caution` = product doesn't claim to address acne (neutral) OR we can't verify due to incomplete data → caps at CAUTION but doesn't pull toward MISMATCH

This distinction is important: a product that *doesn't claim* to help acne shouldn't be penalized the same as one that *claims* to help but *doesn't deliver*.

**Alias resolution** — Same bidirectional approach as sensitivity factor: build sets of all names (canonical + aliases) for each ingredient category, then check product ingredients against these sets.

## 4. The code, line by line

### `app/src/verdict/factors/acneFit.ts`

**Lines 1–2: Imports**
```typescript
import { Profile, Product, FactorState } from '../types';
```

**Lines 3–13: IngredientConcern interface**
```typescript
export interface IngredientConcern {
  ingredient_name: string;
  aliases: string[];
  helps_with: string[];
  is_strong_active: boolean;
  is_barrier_support: boolean;
}
```
Minimal shape from ingredient_concerns table (§7.2). Only fields needed for acne evaluation.

**Lines 15–28: JSDoc**
Documents factor role, return states, severity logic, and blueprint references.

**Lines 29–33: Function signature**
```typescript
export function evaluateAcneFit(
  profile: Profile,
  product: Product,
  ingredientConcerns: IngredientConcern[] = []
): FactorState
```
Optional ingredientConcerns (defaults to empty) for testability.

**Lines 34–37: Insufficient data check**
```typescript
if (profile.user_acne_severity === null) {
  return 'insufficient_data';
}
```
User hasn't set acne severity → cannot evaluate.

**Lines 39–49: No acne tag check**
```typescript
const hasAcneTag = product.concern_tags.includes('acne');
const hasOilControlTag = product.concern_tags.includes('oil_control');

if (!hasAcneTag) {
  if (profile.user_acne_severity === 'mild' && hasOilControlTag) {
    return 'pass';
  }
  return 'caution';
}
```
Product doesn't claim to address acne → neutral (`caution`) for moderate/severe. Mild is special: `oil_control` tag alone = `pass` (per §6.4 table: "acne OR oil_control").

**Lines 51–75: Build lookup sets**
```typescript
const helpsWithAcne = new Set<string>();
const strongActives = new Set<string>();
const barrierSupport = new Set<string>();

for (const concern of ingredientConcerns) {
  const canonical = concern.ingredient_name.toLowerCase();
  const allNames = [canonical, ...concern.aliases.map((a) => a.toLowerCase())];

  if (concern.helps_with.includes('acne')) {
    for (const name of allNames) helpsWithAcne.add(name);
  }
  if (concern.is_strong_active) {
    for (const name of allNames) strongActives.add(name);
  }
  if (concern.is_barrier_support) {
    for (const name of allNames) barrierSupport.add(name);
  }
}
```
Single pass through ingredientConcerns. Populates three sets with canonical + aliases (lowercased) for fast `has()` checks.

**Lines 77–88: Check product ingredients**
```typescript
const hasHelpsWithAcne = product.ingredients_normalized.some((ing) =>
  helpsWithAcne.has(ing.toLowerCase())
);
const hasStrongActive = product.ingredients_normalized.some((ing) =>
  strongActives.has(ing.toLowerCase())
);
const hasBarrierSupport = product.ingredients_normalized.some((ing) =>
  barrierSupport.has(ing.toLowerCase())
);
```
Check if product has at least one ingredient in each category. Case-insensitive.

**Lines 90–95: Mild severity**
```typescript
const severity = profile.user_acne_severity;
if (severity === 'mild') {
  return 'pass';
}
```
Already handled acne/oil_control tag check above. If we reach here, product has acne tag → pass for mild.

**Lines 97–104: Moderate severity**
```typescript
if (severity === 'moderate') {
  if (hasHelpsWithAcne) return 'pass';
  return 'fail';
}
```
Pass if has acne-helping ingredient, fail if has acne tag but no helping ingredient.

**Lines 106–123: Severe severity**
```typescript
if (severity === 'severe') {
  if (product.partial_data) {
    if (hasHelpsWithAcne) return 'caution';
    return 'caution';
  }
  if (hasHelpsWithAcne && hasStrongActive && hasBarrierSupport) {
    return 'pass';
  }
  return 'fail';
}
```
- Partial data → degrade to moderate rule, cap at `caution`
- Full data → need all three: helps_with_acne AND strong_active AND barrier_support
- Missing any → `fail`

**Line 126: Default**
```typescript
return 'caution';
```
Exhaustive check fallback (TypeScript would catch missing severity).

### `app/src/verdict/factors/__tests__/acneFit.test.ts`

**Test fixtures:**
- `baseProfile` — normal skin, mild acne, age 25
- `baseProduct` — basic hydration product
- `baseIngredientConcerns` — 6 ingredients covering all categories:
  - salicylic acid: helps_with_acne + strong_active
  - niacinamide: helps_with_acne + barrier_support
  - ceramide np: barrier_support
  - hyaluronic acid: barrier_support
  - glycerin: barrier_support
  - benzoyl peroxide: helps_with_acne + strong_active

**20 tests covering:**
1. User acne severity null → `insufficient_data`
2. Mild + acne tag → `pass`
3. Mild + oil_control only → `pass`
4. Mild + neither tag → `caution`
5. Moderate + acne tag + helps_with_acne → `pass`
6. Moderate + helps_with_acne via alias → `pass`
7. Moderate + acne tag, NO helps_with_acne → `fail`
8. Moderate + no acne tag → `caution`
9. Severe + all three conditions → `pass`
10. Severe + strong_active/barrier_support via aliases → `pass`
11. Severe + missing strong_active → `fail`
12. Severe + missing barrier_support → `fail`
13. Severe + missing helps_with_acne → `fail`
14. Severe + no acne tag → `caution`
15. Severe + partial_data + helps_with_acne → `caution` (degraded, capped)
16. Severe + partial_data, NO helps_with_acne → `caution` (degraded, capped)
17. Moderate + acne tag, empty concerns → `fail` (no helps_with_acne known)
18. Severe + acne tag, empty concerns → `fail`
19. All three severities with same full product → all `pass`
20. Moderate/severe with acne tag but only oil_control ingredient → `fail`

## 5. How to verify it works

```bash
cd app
npm test -- --testPathPattern="acneFit.test.ts"
```

Expected output: 20 tests pass, 0 fail.

Full test suite:
```bash
cd app
npm test
```
Expected: 54 tests pass (9 allergen + 14 sensitivity + 9 skinTypeFit + 20 acneFit + 2 theme).

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

1. **Ingredient concerns not fetched** — Empty array passed → all ingredient checks fail → moderate/severe with acne tag return `fail`. The calling code must fetch ingredient_concerns before evaluating.

2. **Product ingredients not normalized** — If `ingredients_normalized` contains aliases instead of canonical names, the `has()` checks might miss matches. The alias resolution in the factor handles canonical→alias but product ingredients should already be canonical per §7.5.

3. **Partial data flag incorrect** — If `partial_data` is false but ingredient list is actually incomplete, severe might incorrectly pass/fail based on incomplete data. The 30% threshold (§7.5) is a heuristic.

4. **Missing ingredient_concerns entries** — If the lookup table doesn't have an ingredient that helps with acne, the factor will miss it. The table must be comprehensive for the catalog.

5. **Case sensitivity in product ingredients** — Code assumes `ingredients_normalized` is lowercased (per §7.5). If not, `.toLowerCase()` in the check handles it.

## 7. If you remember one thing

Acne-concern fit is the **only compatibility factor that reads ingredients**. It implements a three-tier severity ladder (mild → moderate → severe) with increasing evidence requirements. Severe acne requires BOTH a strong active (treatment) AND barrier support (protection) — this is the key clinical insight encoded in the engine. Incomplete ingredient data (`partial_data`) degrades severe to moderate and caps at `caution`.

## 8. Questions to ask yourself before the defense

1. **Why does mild acne accept `oil_control` tag but moderate/severe don't?**
   - Blueprint §6.4 table: mild evaluates "acne OR oil_control". Moderate/severe only evaluate "acne". Mild acne often overlaps with oiliness; oil-control products help mild acne indirectly.

2. **What's the difference between `fail` and `caution` for this factor?**
   - `fail`: product HAS acne tag but lacks required ingredients → counts as 0 pass (toward MISMATCH).
   - `caution`: product has NO acne tag (neutral) OR severe with partial_data (degraded + capped) → caps at CAUTION but doesn't pull toward MISMATCH.

3. **How does the degradation rule work for severe acne with partial_data?**
   - If `product.partial_data === true`, severe uses the moderate rule (check helps_with_acne only) but result is capped at `caution` regardless. So even if helps_with_acne is present, returns `caution` not `pass`.

4. **Why does severe require BOTH strong_active AND barrier_support?**
   - Strong actives (salicylic acid, retinol, etc.) are effective but can damage the skin barrier. Severe acne skin is already compromised. Barrier support (ceramides, niacinamide, etc.) protects against irritation. Both are needed for safe, effective treatment.

5. **What happens if ingredient_concerns is empty?**
   - All ingredient sets are empty → `hasHelpsWithAcne`, `hasStrongActive`, `hasBarrierSupport` all false.
   - Mild with acne tag → `pass` (doesn't check ingredients)
   - Moderate with acne tag → `fail` (no helps_with_acne)
   - Severe with acne tag → `fail` (missing all three)
   - This is correct: if we don't know ingredient properties, we can't verify claims.