# Allergen Factor Implementation & Exact Matching

**Date:** 2026-09-25
**Blueprint:** §6.2, §6.3, §6.7, §7.5
**Files changed:**
- app/src/verdict/factors/allergen.ts
- app/src/verdict/factors/__tests__/allergen.test.ts
**Prerequisites:** 01-verdict-engine-types.md

---

## 1. What this task was

We implemented the **declared-allergen conflict factor** — the first of two hard-constraint factors in the verdict engine (the other is sensitivity). This factor checks whether any of the user's declared allergens appear in a product's normalized ingredient list. It is a "hard constraint" because per blueprint §6.5, a `fail` here immediately forces the final verdict to `MISMATCH`, overriding all compatibility factors. The implementation is a pure TypeScript function with no I/O, no side effects, and no external dependencies — consistent with the verdict engine's design as a deterministic, inspectable module.

---

## 2. The concept

### What is a "hard constraint"?
In the BeautiLyze verdict engine, factors are split into two categories (§6.2):
- **Hard constraints** (2 factors): declared-allergen conflict, sensitivity. These can *override* or *cap* the final verdict.
- **Compatibility factors** (3 factors): skin-type fit, acne-concern fit, age fit. These combine into a score (0–3 passed) that determines the verdict *only if* no hard constraint overrides.

### What does this factor do?
Given a `Profile` (which contains `allergies: string[]`) and a `Product` (which contains `ingredients_normalized: string[]`), the factor returns one of three states:
- **`pass`** — No declared allergen matches any ingredient in the product.
- **`fail`** — At least one declared allergen matches an ingredient.
- **`insufficient_data`** — The product's ingredient list is incomplete (`partial_data: true`), so we cannot fully verify.

**Key term: Exact normalized string matching** — We compare the user's allergen (lowercased + trimmed) against the product's `ingredients_normalized` array using exact equality (`===`), not substring matching (`includes()`). This prevents false positives where a partial name like `"amide"` would incorrectly match `"niacinamide"`.

---

## 3. The decision

### Decision 1: Exact matching vs. substring matching

**Options considered:**
1. **Substring matching** (`ingredients_normalized.some(ing => ing.includes(allergen))`) — rejected. Would cause false positives: `"amide"` matches `"niacinamide"`, `"acid"` matches `"hyaluronic acid"`, `"alcohol"` matches `"cetearyl alcohol"` (a fatty alcohol, not a drying alcohol).
2. **Exact matching after normalization** (`ingredients_normalized.includes(allergen.toLowerCase().trim())`) — chosen. The product's ingredients are already normalized per §7.5 (lowercased, trimmed, aliases resolved). The user's allergen input receives the same treatment. Only identical strings match.

**Why this matters:** Allergy matching is a safety-critical path. A false positive (flagging a safe product) erodes trust. A false negative (missing a real allergen) is a safety risk. Exact matching on normalized strings is the only approach that is both deterministic and auditable — we can show the user exactly which string matched.

### Decision 2: `partial_data` check runs first (caps at `insufficient_data` even with no allergies)

**Options considered:**
1. **Check allergies first** — if no allergies, return `pass` immediately, ignoring `partial_data`. Rejected. If the ingredient list is incomplete, we *cannot confirm* it's complete. Returning `pass` would imply "we checked and found nothing," which is misleading when we didn't actually check the full list.
2. **Check `partial_data` first** — chosen. Per §6.7 and §7.5, a product with >30% unmatched ingredients is flagged `partial_data: true`. The allergen factor *must* return `insufficient_data` in this case, regardless of whether the user has allergies. The UI then shows: "We couldn't fully verify this product's ingredients" (never "safe").

**Why this matters:** The blueprint §6.7 explicitly defines three states for declared-allergen conflict:
| State | Meaning | UI |
|-------|---------|-----|
| Confirmed conflict | Match found | Mismatch, red |
| No identified conflict | List checked; no match | Neutral: "No conflict identified in available ingredient data" — **never "safe"** |
| Insufficient data | List incomplete | Caution, "We couldn't fully verify..." |

Returning `pass` when `partial_data: true` would violate the "never 'safe'" rule because we didn't actually check a complete list.

### Decision 3: No `caution` state for this factor

**Options considered:**
1. **Add a `caution` state** (e.g., for "potential cross-contamination") — rejected. The blueprint §6.3 table explicitly shows only three states for declared-allergen conflict: Pass, Fail, Insufficient data. The `caution` column has an em dash (—). Adding a fourth state would require changing the precedence logic (§6.5) and the type definitions.
2. **Strictly follow the blueprint's three states** — chosen. The factor returns exactly `pass | fail | insufficient_data`. The `FactorState` union in types.ts includes `caution` for *other* factors (sensitivity, skin-type fit, etc.), but this factor simply never returns it.

**Why this matters:** The verdict engine's defensibility comes from being traceable to the spec. Every state in the code maps to a cell in the blueprint table. Inventing states not in the spec weakens that traceability.

---

## 4. The code, line by line

### `app/src/verdict/factors/allergen.ts`

**Lines 20–30: `partial_data` check first**
```typescript
if (product.partial_data) {
  return 'insufficient_data';
}
```
This runs before checking allergies. If the ingredient list is incomplete, we return `insufficient_data` immediately. This implements the "never 'safe'" rule from §6.7 — we cannot say "no conflict identified" if we haven't seen the full list.

**Lines 32–35: No allergies = pass (but only after partial_data check)**
```typescript
if (!profile.allergies || profile.allergies.length === 0) {
  return 'pass';
}
```
If the user has no declared allergies, there is nothing to conflict with. This returns `pass` *only* when we have a complete ingredient list (because `partial_data` was already checked).

**Lines 37–41: Normalize user allergens**
```typescript
const normalizedAllergens = profile.allergies.map((a) =>
  a.toLowerCase().trim()
);
```
Each user-declared allergen is lowercased and trimmed. This matches the normalization applied to product ingredients in §7.5 (step 1: lowercase, step 2: trim). The product's `ingredients_normalized` is already in this form.

**Lines 43–48: Exact match loop**
```typescript
for (const allergen of normalizedAllergens) {
  if (product.ingredients_normalized.includes(allergen)) {
    return 'fail';
  }
}
```
We iterate the user's normalized allergens and check for exact presence in the product's normalized ingredient array using `Array.includes()` (which uses strict equality `===`). No substring matching. First match returns `fail` immediately.

**Line 51: No matches = pass**
```typescript
return 'pass';
```
Complete ingredient list checked, no matches found. This is the "No identified conflict" state from §6.7.

---

### `app/src/verdict/factors/__tests__/allergen.test.ts`

The test file covers all three states plus edge cases:

| Test | What it verifies |
|------|------------------|
| No declared allergies | `pass` (complete list) |
| Allergens don't match | `pass` |
| Case-insensitive match (`NIACINAMIDE`) | `fail` |
| Whitespace-trimmed match (`  niacinamide  `) | `fail` |
| Any one of multiple allergens matches | `fail` |
| `partial_data: true` with allergies | `insufficient_data` |
| `partial_data: true` with no allergies | `insufficient_data` |
| Mixed-case + whitespace normalization | `fail` |
| Partial name (`amide` vs `niacinamide`) | `pass` (no substring match) |

The last test is the **critical safety test** — it proves substring matching is NOT used. If the implementation accidentally used `ing.includes(allergen)`, this test would fail (it would return `fail` instead of `pass`).

---

## 5. How to verify it works

```bash
# From repo root
cd app
npm test -- --testPathPattern=allergen.test.ts
# Expected: 9 tests pass

npm run lint
# Expected: no errors

npm run typecheck
# Expected: no errors
```

---

## 6. What could go wrong

| Failure mode | What it looks like | What to do |
|--------------|-------------------|------------|
| Substring matching accidentally used | Test "does not match partial ingredient names" fails (returns `fail` for `amide`) | Fix the comparison to use `includes(allergen)` on the array (exact match), not `ing.includes(allergen)` (substring). |
| `partial_data` check moved after allergy check | Test "returns insufficient_data when product.partial_data is true even with no allergies" fails (returns `pass`) | Move the `partial_data` check to the top of the function. |
| User enters allergen with different casing/spacing than catalog | Test "returns fail when allergen matches after normalization" fails | Ensure both sides use `toLowerCase().trim()` — product ingredients are pre-normalized per §7.5, user allergens normalized at match time. |
| New allergen added to profile but not in catalog | Returns `pass` (correct — no match in available data) | This is correct behavior. The UI shows "No conflict identified in available ingredient data" per §6.7. |

---

## 7. If you remember one thing

**Exact normalized string matching prevents false positives.** The allergen factor compares `allergen.toLowerCase().trim()` against `ingredients_normalized` using exact equality (`Array.includes` with `===`). This is why `"amide"` does NOT match `"niacinamide"` — a substring match would be a safety bug. The `partial_data` check runs first so we never claim "no conflict" on an incomplete ingredient list.

---

## 8. Questions to ask yourself before the defense

1. **Why does the allergen factor return `insufficient_data` when `partial_data: true` even if the user has no allergies?**
   *Answer:* Because we cannot say "no conflict identified" (the `pass` state's UI message) if we haven't seen the complete ingredient list. The blueprint §6.7 explicitly says the "No identified conflict" state means "List checked; no match found." If the list is incomplete, we didn't check it fully.

2. **What would happen if we used substring matching (`ing.includes(allergen)`) instead of exact matching?**
   *Answer:* False positives. `"amide"` would match `"niacinamide"`, `"acid"` would match `"hyaluronic acid"`, `"alcohol"` would match `"cetearyl alcohol"`. The test "does not match partial ingredient names" catches this.

3. **Why is there no `caution` state for declared-allergen conflict?**
   *Answer:* The blueprint §6.3 table shows only three states for this factor (Pass, Fail, Insufficient data). The `caution` column has an em dash. Adding a `caution` state would require changing the precedence logic (§6.5) and the type system.

4. **Where does the product's `ingredients_normalized` come from?**
   *Answer:* It is produced by the ingredient normalization pipeline (§7.5) during catalog import: lowercase → trim → resolve aliases → flag unmatched. The verdict engine receives the already-normalized array.

5. **How does this factor interact with the precedence rule (§6.5)?**
   *Answer:* If this factor returns `fail`, rule 1 triggers: `verdict = MISMATCH` (overrides everything). If it returns `insufficient_data`, rule 2 triggers: `verdict = CAUTION` with "couldn't fully verify" warning. If it returns `pass`, precedence continues to the sensitivity factor (rule 3).