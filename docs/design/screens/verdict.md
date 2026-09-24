# Verdict Screen — Locked Composition

The most important screen in the app. Locked design. Do not redesign
without explicit human approval (enforced by `AGENTS.md` §8).

Blueprint references: §6.6 (score), §6.8 (output contract), §10.1
(disclaimer), §10.2 (terminology discipline).

---

## Purpose

Show the user a single, decisive answer to one question:

> *"Does this product match the factors BeautiLyze checks for me?"*

Every element on this screen serves that purpose. Nothing else is on this
screen.

---

## Composition (top to bottom)

### 1. Verdict badge — the hero
- Full-width block at the top of the screen.
- Paper background, ink text, verdict-colored border (2px) and verdict-
  colored small icon.
- Text: **"Match"**, **"Caution"**, or **"Mismatch"** — Fraunces, 32pt,
  weight 600, ink color.
- Below the word: one sentence summary in Inter 16pt, secondary ink.
  This is the `summary` field from the verdict output contract (§6.8).
- No emoji. No illustration. No background pattern.

Example:
> **Caution**
> This product may not suit your skin type, but no allergens were found.

### 2. Score line
- Inter 14pt, secondary ink.
- Format: *"2 of 3 compatibility factors matched."*
- If hard constraints flagged: on the same line or a second line:
  *"1 hard constraint flagged."*
- This is derived from the verdict, not used to compute it (§6.6).

### 3. Hard constraints block
- Only shown if any hard constraint is not `pass`.
- Heading: **"Hard constraints"** — Inter 12pt, uppercase, letter-spaced,
  secondary ink.
- Each constraint is one row:
  - Icon: the verdict state (check / alert / x)
  - Name in Inter 15pt, ink
  - Result word in Inter 13pt, secondary ink
  - Reason in Inter 13pt, secondary ink — naming the user attribute, the
    product attribute, and the rule (§6.8)
- Background: paper. Separated from the rest by a thin 1px ink-10% rule.

Example row:
> ⚠ **Declared-allergen conflict** — Caution
> We couldn't fully verify this product's ingredients.

### 4. Compatibility factors block
- Heading: **"Compatibility factors"** — Inter 12pt, uppercase,
  letter-spaced, secondary ink.
- Three rows, in fixed order:
  1. Skin-type fit
  2. Acne-concern fit
  3. Age fit
- Each row:
  - Icon: pass / caution / fail / insufficient
  - Name in Inter 15pt, ink
  - Result word in Inter 13pt, secondary ink
  - Reason in Inter 13pt, secondary ink, 2-line maximum

Example row:
> ✓ **Skin-type fit** — Pass
> Your skin type is oily; this product is tagged suitable for oily skin.

### 5. Disclaimer
- Fixed bottom block. Not scrollable away.
- Paper background, thin ink-10% top rule.
- Body: Inter 12pt, secondary ink, exactly the text from blueprint §10.1
  (verbatim).
- No icon. No close button. No "I understand."

### 6. Primary action
- One button at the bottom, above the disclaimer.
- Text: **"Check another product"**
- Style: text button, ink, Inter 15pt, weight 500. Underlined.
- No filled button. The verdict is the visual weight, not the CTA.

---

## What is NOT on this screen

- No product image (unless the product was found via search — in which
  case, a small 40×40 thumbnail next to the product name at the top, above
  the verdict badge).
- No product name as a heading. The verdict is the heading. Product name
  is a small byline above the verdict badge: Inter 13pt, secondary ink.
- No "share" button.
- No "add to favorites."
- No "tell us if this was helpful."
- No star rating.
- No confetti for MATCH.
- No red alarm for MISMATCH.
- No score ring, gauge, or percentage.
- No "AI-powered" badge.
- No animations except the verdict badge reveal (see `motion.md`).

---

## States

### Loading
- The verdict badge area shows a shimmer placeholder.
- Text: *"Checking..."* in Inter 16pt, secondary ink, centered.
- Duration: only as long as the check actually takes (usually <100ms).

### Error
- "We couldn't check this product right now."
- Retry button.
- No verdict shown.

### Insufficient data (all factors insufficient)
- Verdict is still shown, but as CAUTION.
- A note above the hard constraints: *"We don't have enough information
  about this product to give a confident answer."*

---

## Motion

The verdict badge reveal is the single motion moment in the app.

- On entry: the badge fades in over 300ms.
- The verdict word scales from 0.95 to 1.0 over the same 300ms.
- No bounce. No spring. Ease-out.
- Everything below the badge fades in 100ms after, no scale.

This is the only place in the app where motion carries meaning. It says:
*this is the answer.* Everywhere else, motion is absent.

---

## Copy rules (blueprint §10.2)

Never use on this screen:
- "Safe"
- "Suitable for you"
- "Allergy" / "allergic"
- "Treatment"
- "73% confident" (always "model score 0.73")

Always use:
- "No conflict identified in available ingredient data"
- "Matches the factors BeautiLyze checks"
- "Declared-allergen ingredient matching"
- "Model score" for the AI confidence

The summary field in the verdict output contract is the only place
free-form copy is generated. That copy follows the same rules.

---

## Do not redesign this screen

If a task requires changing this screen:
1. The agent must STOP and escalate (`AGENTS.md` §5).
2. The human approves the change.
3. This document is updated FIRST.
4. Then the code is updated to match.

This ordering is non-negotiable. The document is the source of truth.