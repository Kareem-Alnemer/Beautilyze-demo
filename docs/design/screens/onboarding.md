# Onboarding Screen — Design Specification

## Current Recovery Behavior (2026-09-28)

This enhancement supersedes the historical automatic-navigation-on-error rule
below. Keep all five fields and their order. Get started is genuinely disabled
until skin type is chosen; the shared Button supplies readable contrast and busy
semantics. On account save failure, do not mark onboarding complete or navigate:
show Retry save and Continue without saving. The latter explicitly acknowledges
the unsaved session draft. Only success or that choice sets the completion flag.
Guest notice states that profile entries are session-only, not persisted on disk.
The form uses keyboard avoidance and a scroll view; all controls grow with text.

**Status:** Locked for implementation
**Blueprint sections:** §4.1, §4.2 (should-have onboarding), §5.3, §6.1, §10.2
**Follows:** `profile.md` field order and primitives (Editorial Honest)

---

## 1. Screen Purpose

First-run form that collects the baseline profile before first use, so the
first verdict has data. One screen, one submit. No AI, no scan, no verdict
computation here. Returning users never see it (local completion flag).

## 2. Composition (Top to Bottom)

```
┌─────────────────────────────────────────────────────────────┐
│ SafeAreaView → ScrollView                                   │
│  Header: "Welcome to BeautiLyze" + byline                   │
│   "Set your baseline once. You can change everything later  │
│    in Profile."                                             │
│  1. Skin Type (required) — SkinTypeSelector                 │
│     Helper: "Required. This drives the skin-type fit factor."│
│  2. Acne Severity (optional) — AcneSeveritySelector         │
│  3. Age (optional) — AgeInput                               │
│  4. Sensitivities (optional) — SensitivityManager           │
│     Helper: "Quick chips are available for fragrance and    │
│      essential oils. Everything else is matched word-for-   │
│      word against ingredient names."                        │
│  5. Declared Allergies (optional) — AllergyManager          │
│     Helper: "Matched word-for-word against the ingredient   │
│      list we have. If our list is incomplete, we say so —   │
│      always check the physical label."                      │
│  Validation notice (only when submit pressed without skin   │
│   type): "Choose your skin type to continue."               │
│  Sync error (only when signed-in save fails): "We couldn't  │
│   save to your account. Your entries are kept on this       │
│   device."                                                  │
│  Submit: "Get started" (disabled until skin type chosen;    │
│   "Saving…" while submitting)                               │
└─────────────────────────────────────────────────────────────┘
```

Field order mirrors `profile.md`: skin type, acne severity, age,
allergens (here: sensitivities then allergies, matching ProfileScreen
section order visually — sensitivities listed before allergies is
intentional: softer concern first).

## 3. Behavior

- All inputs write straight into the profile store (same setters as
  ProfileScreen). No draft state; the store is the draft.
- Submit requires `user_skin_type` only. Everything else may stay unset
  (verdict reports `insufficient_data`, never a guess).
- On submit: set local `hasCompletedOnboarding`, persist it on-device,
  best-effort Supabase sync when signed in (guest = local only),
  then `router.replace('/')`.
- Sync failure does not block entry: inline error, still navigate.
  The store (local) is the verdict's source of truth.

## 4. States

- Initial: empty fields, disabled submit. (This is the "empty" state.)
- Incomplete submit press: validation notice.
- Submitting: button disabled, "Saving…".
- Sync error: inline notice, navigation still proceeds.
- Done: never rendered — navigation replaces the route.

## 5. Visual Tokens (All from `theme`)

Paper background, raised cards, `text.primary/secondary/tertiary`,
`brand.accent` submit, `verdict.caution` for notices. No new tokens.

## 6. Terminology (Blueprint §10.2)

- Never "safe", "treatment", "confident". Never "your skin type is X".
- Allergy copy says "declared-allergen ingredient matching" in effect:
  word-for-word matching, incomplete lists disclosed.

## 7. Accessibility

- Submit reachable by screen reader with descriptive label and disabled
  state announced. Tap targets ≥ 44px (inherited from primitives).
- Notices use `accessibilityRole="alert"` (validation) and plain text
  (sync error, non-blocking).

## 8. Acceptance Checklist

2026-09-27 shared-control update: SkinTypeSelector and AcneSeveritySelector now
use full-width radio rows; AgeInput and ChipManager inherit the Profile input
improvements. This does not change onboarding field order, required fields,
submission behavior, or navigation. Existing onboarding tests remain applicable.

- [ ] Route `/onboarding` renders all 5 sections in order
- [ ] Skin type required; all else optional
- [ ] Submit writes store, sets + persists flag, navigates to `/`
- [ ] Guest completes without account; signed-in sync attempted
- [ ] Sync failure shows notice, still navigates
- [ ] First-run gating redirects; completed users never see it
- [ ] All visual values from theme; no forbidden terminology
- [ ] Tests pass; typecheck + lint clean
