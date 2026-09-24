# Accessibility

Minimum accessibility requirements for BeautiLyze MVP.

Blueprint §4.3 explicitly cuts formal WCAG audit. This file defines the
practices we follow anyway, because they're cheap and they matter.

Direction: `principles.md`.

---

## Contrast

- **Body text** against its background: minimum 4.5:1 (WCAG AA).
- **Headings** against their background: minimum 7:1 (WCAG AAA).
- **Text on coral accent** (`#FFFFFF` on `#E85A4F`): verify before shipping.
  If contrast is insufficient, use ink on paper and skip the coral fill.
- **Verdict colors** are always paired with text and an icon, so contrast
  alone is never the only signal.

---

## Tap targets

- Minimum 44×44pt for every tappable element.
- If a button looks smaller, add invisible padding to reach 44pt.
- Icons used as buttons: 44pt container, icon itself can be 20pt.

---

## Text size

- Never smaller than 12pt.
- Body text: 15pt.
- Do not shrink text to fit. Redesign the layout.

---

## Motion

- The only motion in the app is the verdict reveal (300ms fade + scale).
- No auto-playing animations.
- No looping animations.
- No parallax.
- No motion that carries meaning that isn't also stated in text.

If a user has "reduce motion" enabled (React Native
`AccessibilityInfo.isReduceMotionEnabled()`), the verdict reveal becomes
a 0ms appearance. No fade, no scale.

---

## Screen readers

- Every interactive element has an accessible label.
- Icons used alone have `accessibilityLabel`.
- The verdict badge has `accessibilityRole="text"` and an
  `accessibilityLabel` that reads the verdict and summary:
  "Verdict: Caution. This product may not suit your skin type."
- The disclaimer is reachable by screen reader, not decorative.

---

## Color is never the only signal

Every verdict conveys state through three channels:
1. **Color** (green / amber / red)
2. **Icon** (check / alert / x)
3. **Word** ("Match" / "Caution" / "Mismatch")

A user who cannot perceive color still receives the verdict.

Same rule applies to form errors: not just a red border, but a text
message below.

---

## Language and terminology

All UI copy follows `copy-voice.md` and blueprint §10.2. Plain language.
No jargon. No medical terms. No "dermatologically tested."

---

## What we are NOT doing for MVP

- Full WCAG 2.1 AA audit.
- Screen reader walkthrough of every screen (spot-check the verdict
  screen and profile).
- Localization / i18n. English only.
- Dynamic type support (system font scaling). May break layouts.
- High contrast mode.

These are explicitly out of scope per blueprint §4.3. If time permits
after the demo works end-to-end, dynamic type is the highest-value
addition.

---

## Checklist for any new screen

- [ ] Text contrast ≥ 4.5:1 for body, ≥ 7:1 for headings
- [ ] Every tappable element ≥ 44pt
- [ ] Every interactive element has an accessibility label
- [ ] No information conveyed by color alone
- [ ] No text smaller than 12pt
- [ ] No motion beyond the verdict reveal
- [ ] If a verdict is shown, the word and icon are present

If any box is unchecked, the screen is not done.