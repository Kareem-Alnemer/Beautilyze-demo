---
name: ui-visual
description: Rules for imagery, motion, and screen composition
---

# UI Visual

Applies when a change involves images, icons, motion, or screen layout.

## Imagery

Read `docs/design/imagery.md` before adding any image or icon.

- Icons: Lucide only, via `components/ui/Icon.tsx`.
- Product images: Open Beauty Facts only, licensed, stored in Supabase
  Storage. Never hotlink.
- No lifestyle photography inside the app.
- No illustrations.
- User scan photos are never displayed back and never stored.

If an image is needed and not on the allowed list: STOP and ask the human.

## Motion

The only motion in the app is the **verdict badge reveal** on
`VerdictScreen`:
- Fade-in over 300ms
- Scale from 0.95 to 1.0 over the same duration
- Ease-out, no bounce
- Everything below fades in 100ms later

No other decorative motion. No parallax. No confetti. No spring animations.
No loading spinners beyond the standard skeleton.

## Screen composition

Before designing any screen:
- Read `docs/design/screens/<screen>.md`. If missing, STOP.
- Follow `docs/design/principles.md` (Editorial Honest).
- Type is the primary visual element. Whitespace is content.

Every screen must define: loading, empty, error, success states.

The verdict screen is **locked**. Do not redesign it.

## What not to do

- Do not add a new icon set.
- Do not add a background pattern.
- Do not add a gradient.
- Do not add a shadow beyond elevation level 1 (defined in `theme/`).
- Do not add a hero image.
- Do not add an avatar.

## When to escalate

- The screen needs imagery not on the allowed list → STOP.
- The screen needs motion beyond the verdict reveal → STOP.
- The screen design doc doesn't exist → STOP.
- You're unsure whether a visual choice fits the direction → STOP.