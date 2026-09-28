# Design Tokens

The visual values for BeautiLyze, and the reasoning behind each.

**Code is the source of truth.** This file explains the *why*. If this
file and `app/src/theme/` disagree, the code wins and this file is updated.

Direction: see `principles.md` (Editorial Honest).

---

## Colors

### Brand

| Token | Value | Where used | Why |
|-------|-------|------------|-----|
| `brand.accent` | `#E85A4F` | CTAs, one emphasis per screen | Coral. Warm, not alarming. Distinct from verdict-mismatch red. |
| `brand.paper` | `#FBF7F2` | App background | Warm off-white. Reads as considered, not clinical. |
| `brand.ink` | `#1F1B18` | Primary text | Near-black with warmth. Never pure black. |

### Text

| Token | Value | Where used |
|-------|-------|------------|
| `text.primary` | `brand.ink` | Body, headings |
| `text.secondary` | `#6B6259` | Captions, bylines, reasons |
| `text.tertiary` | `#9A9088` | Placeholders, disabled |
| `text.onAccent` | `#FFFFFF` | Text on coral |

### Surface

| Token | Value | Where used |
|-------|-------|------------|
| `surface.base` | `brand.paper` | Default background |
| `surface.raised` | `#FFFFFF` | Cards on paper (sparingly) |
| `surface.rule` | `#1F1B1810` | 1px divider rules (ink at 10% opacity) |
| `surface.transparent` | `transparent` | Camera overlay cutouts (see-through, not a color) |
| `surface.scrim` | `rgba(0,0,0,0.5)` | Photo legibility scrim over camera images |

### Badge (history scan list)

| Token | Value | Where used |
|-------|-------|------------|
| `badge.skinType` | `#007AFF` | Skin-type badge |
| `badge.acneClear` | `#43a047` | Acne clear badge |
| `badge.acneMild` | `#f9a825` | Acne mild badge |
| `badge.acneModerate` | `#e53935` | Acne moderate badge |
| `badge.acneSevere` | `#e53935` | Acne severe badge |

### Verdict — the signal triad

These are signals, not brand color. They never appear outside verdict
contexts.

| Token | Value | Meaning |
|-------|-------|---------|
| `verdict.match` | `#3D8B5F` | MATCH |
| `verdict.caution` | `#D98C2B` | CAUTION |
| `verdict.mismatch` | `#C43F3B` | MISMATCH |
| `verdict.neutral` | `#6B6259` | Insufficient data / not evaluated |

**Rules for verdict colors:**
- Never used as decoration.
- Always accompanied by a word (Match / Caution / Mismatch) and an icon.
- Never the only signal on a screen.

### Forbidden

- No gradients.
- No shadows with color.
- No colors outside this list. If a new color is needed, it's added here
  first, then to `theme/colors.ts`.

---

## Typography

### Families

| Token | Value | License |
|-------|-------|---------|
| `font.heading` | Fraunces | OFL (free) |
| `font.body` | Inter | OFL (free) |

Loaded from `app/src/assets/fonts/`. Never fetched at runtime.

### Weights

| Token | Value | Use |
|-------|-------|-----|
| `weight.regular` | 400 | Body |
| `weight.medium` | 500 | Emphasis, headings small |
| `weight.semibold` | 600 | Headings, verdict word |

No italics. No black. No condensed.

### Sizes

| Token | Value | Use |
|-------|-------|-----|
| `size.xs` | 12 | Metadata, uppercase labels |
| `size.sm` | 13 | Captions, reasons, bylines |
| `size.md` | 15 | Default body |
| `size.lg` | 17 | Emphasized body, button text |
| `size.xl` | 22 | Section headings |
| `size.xxl` | 32 | Verdict word |

### Line heights

| Token | Value |
|-------|-------|
| `line.tight` | 1.2 |
| `line.normal` | 1.5 |
| `line.relaxed` | 1.7 |

### Rules

- Headings use Fraunces, body uses Inter. Never mix.
- Uppercase labels (e.g., "HARD CONSTRAINTS") use Inter 12pt with
  letter-spacing 0.08em.
- Never smaller than 12pt anywhere.
- Never larger than 32pt except the verdict word.

---

## Spacing

One scale. No exceptions.

| Token | Value |
|-------|-------|
| `space.xs` | 4 |
| `space.sm` | 8 |
| `space.md` | 12 |
| `space.lg` | 16 |
| `space.xl` | 24 |
| `space.xxl` | 32 |
| `space.xxxl` | 48 |

Rules:
- Screen horizontal padding: `space.lg` (16).
- Between major blocks: `space.xl` (24) or larger.
- Between related items: `space.sm` (8).
- Never use a value not in this scale. If 20 feels right, it's wrong — use
  16 or 24.

---

## Radii

Editorial direction is sharp, not rounded.

| Token | Value | Use |
|-------|-------|-----|
| `radius.none` | 0 | Default. Cards, blocks. |
| `radius.sm` | 2 | Small elements (badges) |
| `radius.md` | 4 | Buttons |

No pill shapes. No `radius.lg`. No circular except icon containers if
needed.

---

## Elevation

One level only.

| Token | Value |
|-------|-------|
| `elevation.flat` | none (default) |
| `elevation.raised` | shadow: 0 1 2 rgba(31,27,24,0.08) |

Rules:
- Most surfaces are flat.
- Only the verdict badge uses `elevation.raised`.
- No drop shadows elsewhere.

---

## Motion

One motion moment in the entire app.

| Token | Value | Use |
|-------|-------|-----|
| `motion.reveal.duration` | 300ms | Verdict badge fade + scale |
| `motion.reveal.easing` | ease-out | Verdict badge |
| `motion.follow.delay` | 100ms | Content below the verdict |

No other motion. No springs. No bounce.

---

## What this file commits us to

If a design needs a value not in this file:
1. STOP.
2. Ask the human whether to extend the system.
3. If yes, add the token here AND to `theme/` in the same change.
4. If no, use the closest existing token.
# Bundled Font Faces (2026-09-28)

`typography.face` maps headingMedium/headingSemibold to Fraunces_500Medium and
Fraunces_600SemiBold, and bodyRegular/bodyMedium/bodySemibold to Inter_400Regular,
Inter_500Medium, and Inter_600SemiBold. These are the existing specified weights,
now named explicitly for Expo's asset loader. Shared Text/TextInput use these
faces only after loading succeeds; otherwise system fonts remain usable.
