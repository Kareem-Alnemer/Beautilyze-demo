# Verdict Engine Type Definitions

**Date:** 2026-09-25
**Blueprint:** §6.1, §6.3, §6.8
**Files changed:** app/src/verdict/types.ts
**Prerequisites:** none (first task)

---

## 1. What this task was

We created the foundational TypeScript type definitions for the BeautiLyze verdict engine. The verdict engine is the deterministic, inspectable core of the product — it takes a user profile and a product, applies pure rules, and returns a match/caution/mismatch verdict with explanations. Before any logic could be written, we needed the data structures that represent the inputs (Profile, Product), the intermediate results (FactorResult), and the final output (Verdict). This task defines those types in a single, self-contained file with zero dependencies.

---

## 2. The concept

**Type definitions** are TypeScript's way of describing the shape of data. They don't run at runtime — they exist only during development to catch mistakes early. Think of them as a contract: "any code that claims to be a `Profile` must have these exact fields with these exact types."

**Why this matters for the verdict engine:** The blueprint (§6) specifies exact input fields, exact factor states (pass/caution/fail/insufficient_data), and an exact output contract. If our types don't match the spec, the implementation will drift. By defining types first, we make the spec executable — TypeScript will error if we forget a field or use the wrong literal value.

**Key terms:**
- **Literal type** — a type that accepts only one specific value, e.g., `'match' | 'caution' | 'mismatch'` means a variable of this type can ONLY be one of those three strings.
- **Interface** — a named shape for an object, e.g., `interface Profile { user_skin_type: SkinType | null; ... }`
- **Tuple** — a fixed-length array where each position has a specific type, e.g., `[FactorResult, FactorResult, FactorResult]` means exactly three FactorResults in a fixed order.
- **Optional field** — marked with `?`, e.g., `reason?: string` means the field may be absent.

---

## 3. The decision

**Options considered:**
1. **Define types inline in each factor file** — rejected; types would be duplicated, hard to keep consistent, and the public API (`evaluate`) needs to export them.
2. **Put types in a shared `lib/types.ts`** — rejected; the verdict engine is deliberately isolated (ADR-001). Its types are part of its domain boundary, not general utilities.
3. **Single `types.ts` in `app/src/verdict/`** — chosen; matches the module structure in the verdict README, keeps the engine self-contained, makes the public API clean.

**Why `insufficient_data` not `insufficient`:** The blueprint §6.3 table explicitly writes "Insufficient data" as the column header and uses "insufficient_data" in the factor evaluation states. We match the spec exactly.

**Why `HardConstraintResult.reason` is optional:** Hard constraints (allergen conflict, sensitivity) only need a reason when they are `caution` or `fail` — a `pass` means "nothing to explain." Making it optional avoids forcing empty strings.

**Why `CompatibilityFactors` is a tuple:** The blueprint §6.8 says compatibility factors are exactly three, in fixed order: skin_type_fit, acne_fit, age_fit. A tuple enforces this at compile time; a plain array would not.

---

## 4. The code, line by line

### `app/src/verdict/types.ts`

**Lines 1–5: Primitive literal types**
```typescript
export type SkinType = 'dry' | 'normal' | 'oily';
export type AcneSeverity = 'mild' | 'moderate' | 'severe';
export type ConcernTag = 'acne' | 'oil_control' | 'hydration' | 'dryness' | 'sensitivity';
export type FactorState = 'pass' | 'caution' | 'fail' | 'insufficient_data';
export type VerdictValue = 'match' | 'caution' | 'mismatch';
```
These are the atomic values used everywhere. `SkinType` and `AcneSeverity` come from §6.1. `ConcernTag` is the closed 5-tag vocabulary from §7.1. `FactorState` matches the four states in §6.3 (using `insufficient_data` per blueprint). `VerdictValue` matches the three verdicts in §6.5.

**Lines 7–18: Profile interface**
```typescript
export interface Profile {
  user_skin_type: SkinType | null;
  user_acne_severity: AcneSeverity | null;
  allergies: string[];
  sensitivities: string[];
  age: number | null;
  ai_skin_type?: SkinType | null;
  ai_acne_severity?: AcneSeverity | null;
  skin_type_confidence?: number | null;
  acne_severity_confidence?: number | null;
  model_version?: string | null;
}
```
The first five fields are the **user-set values** that the verdict actually uses (per §6.1 and §5.3: "Verdict uses `user_*` values, not raw AI values"). The last five are AI-derived fields stored for transparency but **not used by the engine**. They are optional (`?`) because a user may never scan.

**Lines 20–30: Product interface**
```typescript
export interface Product {
  id: string;
  name: string;
  brand: string;
  ingredients_normalized: string[];
  unmatched_count: number;
  partial_data: boolean;
  skin_type_tags: SkinType[];
  concern_tags: ConcernTag[];
  age_notes: string | null;
}
```
Matches §6.1 product record exactly. `id`, `name`, `brand` added for identification (needed for display and history). `ingredients_normalized` is the post-normalization array (§7.5). `partial_data` flags >30% unmatched ingredients (§7.5).

**Lines 32–36: FactorResult**
```typescript
export interface FactorResult {
  name: string;
  result: FactorState;
  reason: string;
}
```
Per §6.8: each factor returns a name, a state, and a reason that "must name: 1. The user attribute, 2. The product/ingredient attribute, 3. The rule that connected them." `reason` is required (not optional) to enforce this contract.

**Lines 38–42: HardConstraintResult**
```typescript
export interface HardConstraintResult {
  name: 'declared_allergen_conflict' | 'sensitivity';
  result: FactorState;
  reason?: string;
}
```
Only two hard constraints exist (§6.2). `name` is a literal union to prevent typos. `reason` is optional because a `pass` has no explanation needed — the UI only shows reasons for `caution`/`fail`/`insufficient_data`.

**Line 44: CompatibilityFactors tuple**
```typescript
export type CompatibilityFactors = [
  FactorResult,
  FactorResult,
  FactorResult
];
```
Enforces exactly three factors in fixed order: index 0 = skin_type_fit, index 1 = acne_fit, index 2 = age_fit. This is the "score" denominator (§6.6: "out of 3").

**Lines 46–56: Verdict interface**
```typescript
export interface Verdict {
  verdict: VerdictValue;
  score: {
    label: 'Compatibility factors';
    passed: number;
    total: 3;
  };
  hard_constraints: HardConstraintResult[];
  compatibility_factors: CompatibilityFactors;
  summary: string;
  disclaimer_shown: boolean;
}
```
Matches the output contract in §6.8 exactly. `score.passed` counts how many of the three compatibility factors are `pass`. `hard_constraints` always has two entries (allergen, sensitivity). `compatibility_factors` is the tuple. `summary` is the one-sentence plain-language explanation. `disclaimer_shown` is a boolean flag for compliance.

---

## 5. How to verify it works

```bash
# From repo root
cd app
npx tsc --noEmit          # Type check passes
npx eslint src/verdict/types.ts  # Lint passes
```

Expected: no output (success). If errors appear, they will show the exact line and type mismatch.

---

## 6. What could go wrong

| Failure mode | What it looks like | What to do |
|--------------|-------------------|------------|
| Blueprint changes a field name | TypeScript error in consumer code (e.g., `profile.user_skin_type` → `profile.skinType`) | Update `types.ts` first, then update consumers. The type is the source of truth. |
| A factor needs a new state | `FactorState` literal union doesn't include it | Add the new state to `FactorState` — this will cascade errors to all factor files, forcing them to handle it. |
| Hard constraint reason is missing in UI | UI shows "undefined" or blank for a caution/fail | The type allows `reason?: string` — add a fallback in the UI component: `reason ?? 'No details available'`. |

---

## 7. If you remember one thing

**The types ARE the spec.** Every field in `Profile`, `Product`, and `Verdict` exists because the blueprint (§6.1, §6.3, §6.8) requires it. If the blueprint changes, the types change first. The implementation follows.

---

## 8. Questions to ask yourself before the defense

1. **Why are AI fields (`ai_skin_type`, etc.) in `Profile` if the verdict doesn't use them?**
   *Answer:* They are stored for transparency and history (user can see what the AI predicted vs. what they set). The verdict engine only reads `user_*` fields per §5.3.

2. **What does `partial_data: true` on a Product mean for the verdict?**
   *Answer:* Per §7.5, if >30% of ingredients are unmatched after normalization, `partial_data` is true and the allergen factor auto-caps at `insufficient_data` (never `pass`).

3. **Why is `CompatibilityFactors` a tuple instead of `FactorResult[]`?**
   *Answer:* A tuple enforces exactly 3 elements in a fixed order at compile time. An array could have 0, 2, 5, or be reordered — the blueprint requires exactly three in a specific order (§6.8).

4. **What happens if a factor returns a `FactorState` not in the union?**
   *Answer:* TypeScript error at compile time. The literal union `FactorState` only allows the four states from §6.3.

5. **Where does the `summary` string in `Verdict` come from?**
   *Answer:* It's generated by the precedence logic (§6.5) after the verdict is decided. It's a plain-language sentence like "This product matches your skin type but contains an ingredient you're sensitive to." It is NOT used to compute the verdict (§6.5: "Displayed score is DERIVED FROM the verdict, not used to determine it").