---
name: ui-theme
description: Rules for colors, typography, spacing, and all visual tokens
---

# UI Theme

Applies when touching `app/src/theme/` or any file that uses a visual value.

## The one rule

**Every visual value comes from `app/src/theme/`. No exceptions.**

Never write a hex code, font size, spacing value, radius, or shadow inline.
Import from `theme/`.

## What lives in theme

- `colors.ts` — semantic colors only. Not `blue500`. `verdict.match`.
- `typography.ts` — Fraunces for headings, Inter for body. Sizes:
  xs / sm / md / lg / xl.
- `spacing.ts` — one scale. Pick one (4 / 8 / 12 / 16 / 24 / 32 / 48).
- `radii.ts` — small values. Editorial style is sharp, not rounded.
- `theme.ts` — assembles the above.
- `index.ts` — re-exports. Components import from `theme/`, not from
  `theme/colors.ts`.

## Adding a token

1. Add it to the appropriate file.
2. Add it to `docs/design/tokens.md` in the same commit.
3. If it's a semantic color, explain the WHY in the doc.

If a token is added without a doc update, the change is not done.

## Colors — specific to this project

- Brand accent: coral `#E85A4F`. Used sparingly for CTAs and emphasis.
- Base: warm paper `#FBF7F2`. Not white.
- Ink: `#1F1B18`. Not `#000`.
- Verdict colors are a separate triad: green / amber / red. Not brand
  color. Never confused with brand color.
- No gradients. Ever.

## Typography — specific to this project

- Headings: Fraunces, weights 500 and 600.
- Body: Inter, weights 400, 500, 600.
- No italics. No black weights. No condensed variants.
- Editorial hierarchy: heading is much bigger than body. Not subtle.

## Radii — specific to this project

- Small: 0, 2, 4. Editorial layout is rectangular.
- No pill shapes. No 24px radii.

## When to escalate

- A design needs a color or size not in `theme/` → STOP. Ask the human.
- The existing scale doesn't fit → STOP. Propose extending it.
- You are tempted to write a hex value inline → STOP. That's the rule.