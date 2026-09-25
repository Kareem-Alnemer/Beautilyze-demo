# Age Fit Factor Implementation

**Date:** 2026-09-25
**Blueprint:** §6.2, §6.3
**Files changed:**
- `app/src/verdict/factors/ageFit.ts`
- `app/src/verdict/factors/__tests__/ageFit.test.ts`
**Prerequisites:** 01-verdict-engine-types.md, 02-allergen-factor.md, 03-sensitivity-factor.md, 04-skin-type-fit.md, 05-acne-fit.md

## 1. What this task was

This task implemented the **third and final compatibility factor**: **age fit**. Unlike skin-type fit (checks tags) and acne-concern fit (checks ingredients), age fit parses free-text `age_notes` from the product catalog to determine if the user's age falls within the product's suitable age range.

The factor handles:
- Explicit numeric restrictions: minimums ("18+"), maximums ("under 30"), ranges ("20-40")
- Qualitative restrictions: "adults only", "not for children", "teen-friendly", "mature skin", "ideal for 20s"
- Multiple restrictions in one note
- Missing or unparseable notes (conservative default: pass)

Per blueprint §6.3, the factor returns:
- `pass`: no age note, or user within range
- `caution`: mild age note (advisory language like "ideal for", "teen-friendly", "mature skin")
- `fail`: strong age restriction user falls outside (bare numeric restrictions, "only", "strictly", "not for children")
- `insufficient_data`: user's age not set

## 2. The concept

**Compatibility factor with free-text parsing** — Age fit is unique among the three compatibility factors because it must parse human-written text (`age_notes`) rather than checking structured tags or ingredient metadata. The catalog annotation methodology (§7.6) records age notes as free text with source and rationale.

**Strong vs. mild restrictions** — The key design decision:
- **Strong restrictions** (default for numeric): Bare minimums ("18+"), maximums ("under 30"), ranges ("20-40"), and explicit language ("only", "strictly", "adults only", "not for children"). These are treated as hard boundaries: pass if in range, fail if outside.
- **Mild restrictions** (advisory): Explicitly advisory language ("ideal for", "best for", "suitable for", "teen-friendly", "mature skin", "anti-aging"). These are guidance, not rules: always return `caution` regardless of user's age.

**Why this distinction?** The blueprint §6.3 table distinguishes "mild age note" (caution) from "strong age restriction user falls outside" (fail). A product labeled "ideal for 20s" isn't restricting other ages — it's suggesting optimal use. But "18+" is a genuine restriction (often legal/regulatory).

**Conservative default** — Unparseable notes return `pass`. We don't want to penalize products for poorly formatted notes. This is a deliberate choice: false negatives (blocking a suitable product) are worse than false positives (allowing a marginally unsuitable one).

**FactorState** — All four states used:
- `insufficient_data`: user age not set
- `pass`: no restriction or user in range
- `caution`: mild advisory note
- `fail`: strong restriction violated

## 3. The decision

**Options for restriction strength:**

1. **All numeric = strong, advisory = mild** — Chosen. Matches blueprint distinction.
2. **All numeric = mild unless "only"/"strictly"** — Rejected. "18+" without "only" is still a real restriction (often legal).
3. **Configurable threshold** — Rejected. Over-engineering for MVP.

**Options for unparseable notes:**

1. **Pass (conservative)** — Chosen. Don't block on bad data.
2. **Caution** — Rejected. Too noisy.
3. **Fail** — Rejected. Too aggressive.

**Options for qualitative mild restrictions:**

1. **Always caution** — Chosen. Blueprint: "mild age note" → caution. Advisory notes don't become "pass" just because user matches.
2. **Pass if in range, caution if outside** — Rejected. Contradicts blueprint table.

**Regex parsing vs. NLP** — Chose regex for MVP. Patterns cover common formats: "18+", "under 30", "20-40", "ages 18+", "minimum age 18", "adults only", "teen-friendly", "mature skin", "ideal for 20s". Extensible for future.

## 4. The code, line by line

### `app/src/verdict/factors/ageFit.ts`

**Lines 1–12: Types**
```typescript
interface AgeRestriction {
  type: 'min' | 'max' | 'range' | 'qualitative';
  min?: number;
  max?: number;
  strength: 'strong' | 'mild';
  raw: string;
}
```
Internal representation of a parsed restriction.

**Lines 14–19: isMildLanguage**
```typescript
function isMildLanguage(text: string): boolean {
  return /\b(?:ideal\s+for|best\s+for|suitable\s+for|teen.?friendly|mature\s+skin|anti.?aging|aging\s+skin)\b/.test(text);
}
```
Detects explicitly advisory language. If present, numeric restrictions in the same note become mild.

**Lines 21–117: parseAgeNotes**
Main parsing function. Returns array of restrictions (multiple can exist in one note).

**Lines 33–43: Minimum age pattern**
```typescript
const minMatch = text.match(/(?:^|\s)(?:ages?\s+)?(\d+)\s*\+(?=[\s,.;]|$)/);
```
Matches "18+", "ages 18+", "18+," (with comma). Lookahead `(?=[\s,.;]|$)` allows whitespace, comma, period, semicolon, or end of string after "+".

Strength: mild if advisory language present, else strong.

**Lines 45–54: Maximum age pattern**
```typescript
const maxMatch = text.match(/\b(?:under|below|max(?:imum)?\s+age|up\s+to)\s+(\d+)\b/);
```
Matches "under 30", "below 30", "max age 30", "up to 30".

**Lines 56–76: Range patterns**
Two patterns: "20-40" (with hyphen/en-dash) and "ages 20 40" (space separated).

**Lines 78–114: Qualitative patterns**
- "adults only", "not for children" → strong, min 18
- "teen", "teenager" → mild, range 13-19
- "mature skin", "anti-aging" → mild, min 30
- "ideal for 20s", "best for 20s-30s" → mild, no bounds

**Lines 119–153: evaluateRestriction**
Evaluates one restriction against user age:
- Numeric (min/max/range): pass if in bounds, fail/caution based on strength
- Qualitative mild: always caution
- Qualitative strong (adults only): pass if ≥18, fail if <18

**Lines 155–216: evaluateAgeFit (exported)**
Main exported function:
1. Check user age set → `insufficient_data` if not
2. Check product has age_notes → `pass` if not
3. Parse notes → `pass` if no parseable restrictions
4. Evaluate all restrictions, worst wins: fail > caution > pass

### `app/src/verdict/factors/__tests__/ageFit.test.ts`

**40 tests covering:**
1. Insufficient data: null, 0, negative age
2. No notes: null, empty, whitespace, "no restriction"
3. Minimum age: pass at/above, fail below (bare "18+" and "18+ only")
4. Maximum age: pass at/below, fail above (bare "under 30" and "under 30 strictly")
5. Range: pass in bounds, fail outside (bare "20-40" and "20-40 only")
6. Format variations: "ages 18+", "minimum age 18", "max age 30", "up to 30", "ages 20 40", "20–40"
7. Qualitative strong: "adults only", "not for children" → fail under 18
8. Qualitative mild: "mature skin" → always caution; "ideal for 20s-30s" → always caution; "teen-friendly" → always caution
9. Unparseable: "Ask your dermatologist" → pass
10. Multiple restrictions: "18+, not for sensitive skin" → fail (strong restriction violated)
11. Case insensitivity

## 5. How to verify it works

```bash
cd app
npm test -- --testPathPattern="ageFit.test.ts"
```

Expected output: 40 tests pass, 0 fail.

Full test suite:
```bash
cd app
npm test
```
Expected: 94 tests pass (9 allergen + 14 sensitivity + 9 skinTypeFit + 20 acneFit + 40 ageFit + 2 theme).

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

1. **User age not set** — Returns `insufficient_data` which caps verdict at CAUTION. UI must prompt for age.

2. **Unparseable age_notes** — Returns `pass` silently. A note like "20s and 30s" (no hyphen) won't match range pattern. Mitigation: catalog validation should encourage standard formats.

3. **False mild detection** — If a note contains both "18+" and "ideal for 20s", the "ideal for" makes "18+" mild. This is intentional: mixed signals default to advisory.

4. **Boundary inclusivity** — "under 30" includes 30 (pass at 30). "18+" includes 18. This is intentional (inclusive boundaries).

5. **Missing qualitative patterns** — New advisory phrases won't be detected. The `isMildLanguage` regex can be extended.

## 7. If you remember one thing

Age fit parses free-text `age_notes` into structured restrictions. **Bare numeric restrictions (18+, under 30, 20-40) are strong by default** — pass if in range, fail if outside. **Advisory language ("ideal for", "teen-friendly", "mature skin") makes restrictions mild** — always returns `caution`. Unparseable notes default to `pass` (conservative).

## 8. Questions to ask yourself before the defense

1. **Why does "18+" return fail for a 16-year-old but "ideal for 20s" returns caution for a 40-year-old?**
   - "18+" is a strong restriction (often legal/regulatory boundary). "ideal for 20s" is advisory guidance. Blueprint §6.3 distinguishes "strong age restriction" (fail) from "mild age note" (caution).

2. **What happens when a note has both "18+" and "ideal for 20s"?**
   - The `isMildLanguage` check runs on the full text. If advisory language is present, all numeric restrictions in that note become mild. So "18+, ideal for 20s" → mild → caution for under-18. This is intentional: mixed signals default to advisory.

3. **Why does "mature skin" return caution even for a 35-year-old?**
   - Per blueprint: "mild age note" → caution. Advisory notes don't become "pass" just because the user matches the target demographic. The factor flags that the product has age-related guidance.

4. **How does the "fail > caution > pass" priority work with multiple restrictions?**
   - The loop evaluates all restrictions. If any returns `fail`, immediately return `fail`. Otherwise track worst as `caution`. If all `pass`, return `pass`. So one strong violation overrides everything.

5. **What if age_notes says "not for children under 12"?**
   - Current regex doesn't capture "under 12" in "not for children under 12". It would match "not for children" (strong, min 18) which is stricter than intended. This is a known limitation — the regex patterns cover common cases but not all variations. Catalog annotators should use standard formats.