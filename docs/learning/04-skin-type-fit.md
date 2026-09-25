# Skin-Type Fit Factor Implementation

**Date:** 2026-09-25
**Blueprint:** §6.2, §6.3, §6.5
**Files changed:**
- `app/src/verdict/factors/skinTypeFit.ts`
- `app/src/verdict/factors/__tests__/skinTypeFit.test.ts`
**Prerequisites:** 01-verdict-engine-types.md, 02-allergen-factor.md, 03-sensitivity-factor.md

## 1. What this task was

This task implemented the **first compatibility factor** in the verdict engine: **skin-type fit**. Unlike the hard-constraint factors (allergen, sensitivity) which can override or cap the verdict, compatibility factors combine into an aggregate score. Per the precedence rule (§6.5 step 5), the three compatibility factors (skin-type fit, acne-concern fit, age fit) are counted: 3 pass → MATCH, 2 pass → CAUTION, 0–1 pass → MISMATCH. Factors in `insufficient_data` state count as neither pass nor fail but cap the verdict at CAUTION.

The skin-type fit factor checks whether the product's `skin_type_tags` array includes the user's `user_skin_type`. The logic is straightforward:
- `pass`: user's skin type is in the product's tags
- `fail`: product has tags but user's type is not among them (product targets other skin types)
- `caution`: product has no skin-type tags (neutral, not targeted)
- `insufficient_data`: user hasn't set their skin type

## 2. The concept

**Compatibility factor** — A verdict factor that contributes to an aggregate score rather than overriding the verdict directly. There are three: skin-type fit, acne-concern fit, age fit. They are evaluated independently and their `pass` count determines the base verdict (before hard constraints apply).

**Hard constraint vs. compatibility factor** — Hard constraints (allergen, sensitivity) are evaluated first in the precedence chain and can immediately determine the verdict (MISMATCH or CAUTION cap). Compatibility factors only matter if no hard constraint has already decided the outcome.

**Skin-type tags** — Per the catalog annotation methodology (§7.6), each product is tagged with the skin types it suits (e.g., `skin_type_suitability: oily`). The `skin_type_tags` array contains only *suitable* types — there is no separate "unsuitable" tag list in the schema.

**Neutral vs. unsuitable** — This is a key design decision:
- If a product explicitly targets skin types (has tags) but not yours → `fail` (unsuitable)
- If a product has no skin-type targeting (empty tags) → `caution` (neutral, unknown fit)
- This distinction matters because a `fail` counts as 0 pass (pulling toward MISMATCH), while `caution` counts as neither pass nor fail but caps at CAUTION.

**FactorState** — Each factor returns one of four states: `pass`, `caution`, `fail`, `insufficient_data`. For skin-type fit, all four are valid per blueprint §6.3.

## 3. The decision

**Options considered for "neutral" interpretation:**

1. **Empty tags = fail** — If product doesn't say it's for you, assume it's not.
2. **Empty tags = caution** — If product doesn't target any skin type, we don't know; treat as neutral.
3. **Empty tags = pass** — If product doesn't exclude you, assume it's fine.

**Chosen:** Option 2 (empty tags = caution). Rationale:
- The blueprint §6.3 table explicitly lists "Product neutral" as the condition for `caution`
- A product with no skin-type tags hasn't been evaluated for skin-type suitability — it's not "unsuitable," it's "unknown"
- This is more honest to the user: "we don't have data" vs "this is wrong for you"
- The precedence rule treats `caution` as a cap (cannot upgrade to MATCH), which is appropriate for missing data

**Rejected:** Option 1 (too aggressive, false negatives), Option 3 (too permissive, false positives).

**Why `fail` when tags exist but don't match?** The product *has* been annotated for skin-type suitability, just not for the user's type. This is a positive signal that the product targets specific skin types, and the user's type isn't one of them. This is different from "no data."

**No external dependencies** — Unlike the sensitivity factor which needs the ingredient_concerns lookup table, skin-type fit only needs the profile and product objects. This makes it simple and fast.

## 4. The code, line by line

### `app/src/verdict/factors/skinTypeFit.ts`

**Lines 1–2: Imports**
```typescript
import { Profile, Product, FactorState } from '../types';
```
Only the types needed. `SkinType` not imported directly (used via Profile/Product).

**Lines 3–16: JSDoc**
Documents the factor's role, return states, and blueprint references.

**Lines 17–20: Function signature**
```typescript
export function evaluateSkinTypeFit(
  profile: Profile,
  product: Product
): FactorState
```
Pure function, no side effects, no external dependencies.

**Lines 21–24: Insufficient data check**
```typescript
if (profile.user_skin_type === null) {
  return 'insufficient_data';
}
```
User hasn't set skin type → cannot evaluate. This runs first because it's a property of the user, not the product.

**Lines 26–29: Neutral check**
```typescript
if (!product.skin_type_tags || product.skin_type_tags.length === 0) {
  return 'caution';
}
```
Product has no skin-type tags → neutral. Runs before the match check because an empty array would never match anyway, but we want the explicit `caution` state, not `fail`.

**Lines 31–34: Pass check**
```typescript
if (product.skin_type_tags.includes(profile.user_skin_type)) {
  return 'pass';
}
```
User's skin type is in the product's tags → pass.

**Line 37: Default fail**
```typescript
return 'fail';
```
Product has tags, user has skin type, but no match → fail.

### `app/src/verdict/factors/__tests__/skinTypeFit.test.ts`

**Test fixtures:**
- `baseProfile` — normal skin, mild acne, age 25
- `baseProduct` — tags: ['normal', 'oily']

**9 tests covering:**
1. User skin type null → `insufficient_data`
2. User type in tags (single tag) → `pass`
3. User type in tags (multiple tags) → `pass`
4. User type not in tags, product has tags → `fail`
5. Product tags empty → `caution`
6. User null, product has tags → `insufficient_data`
7. User null, product tags empty → `insufficient_data`
8. All three SkinType enum values pass when matched
9. All three SkinType enum values fail when product targets others

## 5. How to verify it works

```bash
cd app
npm test -- --testPathPattern="skinTypeFit.test.ts"
```

Expected output: 9 tests pass, 0 fail.

Full test suite:
```bash
cd app
npm test
```
Expected: 34 tests pass (9 allergen + 14 sensitivity + 9 skinTypeFit + 2 theme).

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

1. **User skin type not set** — Returns `insufficient_data` which caps verdict at CAUTION. This is correct per precedence rule, but the UI must explain why (missing profile field).

2. **Product skin_type_tags not populated** — If catalog annotation skipped this field, all products return `caution`. The verdict would never get a `pass` from this factor. Mitigation: catalog validation script should require skin_type_tags.

3. **Type mismatch** — If `user_skin_type` or `skin_type_tags` contain values outside the `SkinType` enum, the `includes` check fails silently. TypeScript prevents this at compile time if types are correct.

## 7. If you remember one thing

Skin-type fit is a **compatibility factor** (not a hard constraint). It returns `pass`/`caution`/`fail`/`insufficient_data` based on whether the user's skin type is in the product's `skin_type_tags`. Empty tags = `caution` (neutral), not `fail` — this distinction is the core design decision.

## 8. Questions to ask yourself before the defense

1. **What's the difference between a hard constraint and a compatibility factor?**
   - Hard constraints (allergen, sensitivity) are evaluated first and can immediately determine the verdict (MISMATCH or CAUTION cap). Compatibility factors (skin-type, acne, age) combine into a pass count: 3→MATCH, 2→CAUTION, 0-1→MISMATCH.

2. **Why does empty `skin_type_tags` return `caution` not `fail`?**
   - Blueprint §6.3 explicitly lists "Product neutral" as the `caution` condition. A product with no skin-type tags hasn't been evaluated for suitability — it's unknown, not unsuitable. `caution` caps at CAUTION; `fail` counts as 0 pass toward MISMATCH.

3. **How does `insufficient_data` affect the final verdict?**
   - Per §6.5 step 5: "Factors in INSUFFICIENT state count as neither pass nor fail, but their presence caps the verdict at CAUTION." So if skin-type is `insufficient_data`, the best possible verdict is CAUTION even if acne and age both pass.

4. **What happens if the product has `skin_type_tags: ['oily']` and user has `user_skin_type: 'dry'`?**
   - Returns `fail`. The product explicitly targets oily skin, not dry. This counts as 0 pass in the aggregate.

5. **Why doesn't this factor need the ingredient_concerns lookup table?**
   - Skin-type suitability is a product-level tag assigned during catalog annotation (§7.6), not derived from ingredient analysis. The sensitivity factor needs the lookup table because it checks individual ingredients; skin-type fit checks a pre-computed product tag.