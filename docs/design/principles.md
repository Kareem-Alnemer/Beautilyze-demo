# Design Principles — Editorial Honest

The visual direction for BeautiLyze. Every later design decision must trace
back to this document.

---

## The three adjectives

1. **Honest** — the interface does not oversell. No confetti, no fake
   enthusiasm, no promises the product does not make.
2. **Editorial** — it reads like a considered publication, not a
   dashboard. Type does the work. Layout breathes.
3. **Decisive** — the verdict is the point. Everything else gets out of
   its way.

These three constrain every choice. If a design decision does not serve at
least two of them, it is wrong.

---

## The emotional job

Blueprint §2.3 says the user is at the purchase moment asking:

> *"Will this work for me, or am I wasting money?"*

The design's job is to reduce anxiety and produce a clear answer. Not to
entertain. Not to impress. Not to sell.

Every screen either supports that job or gets cut.

---

## Visual philosophy

**Editorial / magazine.** Reference points:
- The layout discipline of *The Gentlewoman*
- The typographic honesty of *Stripe Press*
- The verdict clarity of *Wirecutter*

Not referenced:
- Health apps
- Beauty apps
- Dashboard UIs
- "Calm" or "mindful" wellness apps

**One positive reference we can name directly:**
The typography hierarchy of a good newspaper product page — headline,
standfirst, body, byline. Clean. Hierarchical. Honest.

**One anti-reference:**
We do NOT look like a medical app. No clinical white, no doctor stock
photos, no blue gradients, no cross icons, no trust-badge clutter.

---

## What this means concretely

- **Type is the primary visual element.** Not imagery. Not icons. Type.
- **Whitespace is content.** Empty space on the verdict screen is
  intentional, not wasteful.
- **One accent color.** Coral. Used sparingly. Everywhere else is paper
  and ink.
- **Verdict colors are the only saturated signals on screen.** When a user
  sees red, green, or amber, it means something. Nothing else competes.
- **Serif headings, sans body.** Fraunces for headings, Inter for body.
  This is the single most distinctive visual choice.
- **Sharp corners.** Radii are small (0–4px). Not rounded. Editorial
  layout is rectangular.
- **Minimal motion.** Type appears, doesn't bounce. The one exception is
  the verdict reveal (see `motion.md`).
- **No decorative illustrations.** If an image cannot be honest and useful,
  it doesn't belong.

---

## Color theory rationale

**Complementary accent.** Warm off-white paper (`#FBF7F2`) as the base.
Near-black warm ink (`#1F1B18`) as text. One coral accent (`#E85A4F`) for
CTAs and emphasis.

Verdict colors are a **separate triad** — green, amber, red — chosen for
perceptual distance, not for palette harmony. They are signals, not
decoration. This is deliberate: they must never be mistaken for brand
color, and brand color must never be mistaken for a verdict.

**Why warm paper, not white:** white backgrounds read as clinical.
Warm paper reads as considered. It also reduces eye strain on mobile at
night.

**Why coral and not red:** red is already the verdict-mismatch color. The
brand accent must not conflict with a signal. Coral is close enough to
feel warm and far enough to never be confused with "mismatch."

---

## Accessibility

- Body text contrast ≥ WCAG AA (4.5:1) against paper.
- Headings contrast ≥ AAA (7:1).
- Verdict colors are never the **only** signal. Every verdict also has:
  - A word ("Match", "Caution", "Mismatch")
  - An icon (check, exclamation, cross)
  - A position (top of screen for match, below factors for caution,
    prominent for mismatch)
- Tap targets ≥ 44pt.
- No text smaller than 14pt.

Full details in `accessibility.md`.

---

## What this direction commits us to

- No dark mode for MVP. (Warm paper is the identity. Dark mode is a
  second design, not a toggle.)
- No illustration system. (Type does the work.)
- No product photography inside the app. (Product images are only in the
  catalog list, as small thumbnails, if at all.)
- No avatars, no profile photos, no social affordances.
- No gradients. Ever.
- No shadows beyond one elevation level (see `tokens.md`).

---

## What this direction explicitly rejects

- "Modern" as a goal. Modern is not a design principle.
- "Delightful" as a goal. This is a decision tool, not a toy.
- "Engaging" as a goal. We want the user to leave the app and buy (or not
  buy). Engagement is the opposite of success here.
- Trendy = good. Editorial is not trendy. It is durable.

---

## References for the report

If the defense committee asks why this direction:

> BeautiLyze's product claim is honesty — it does not say "safe," it says
> "no conflict identified." The visual direction is the visual form of
> that claim: editorial rather than promotional, typographic rather than
> illustrative, decisive rather than decorative. The design is not
> separate from the product; it is the product's positioning, rendered.