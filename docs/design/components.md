# Components

When to use each UI primitive, what states it has, and what not to do.

Direction: `principles.md`.

All primitives live in `app/src/components/ui/`. Domain components
(VerdictBadge, FactorBreakdown, etc.) live in `app/src/components/`.

---

## When to add a new component

Before creating any component:
1. Check this file.
2. Check `app/src/components/ui/`.
3. If something close exists, extend it. Do not duplicate.

If nothing exists: propose the component to the human first. Do not create
it silently.

---

## Primitives

### `Button`

**Use for:** the single primary action on a screen.

**Variants:**
- `primary` — coral background, white text. Used once per screen, maximum.
- `text` — ink text, underlined. Used for secondary actions.

**States:** default, pressed (opacity 0.7), disabled (opacity 0.4).

**Rules:**
- Only one `primary` per screen.
- No icon-only buttons except back/close.
- Minimum height: 44pt.
- Label is a verb: "Check product", "Save profile". Not "OK", not "Submit".

**Do not:** use a primary button for "Check another product" on the
verdict screen. That's a `text` button.

---

### `Card`

**Use for:** grouping related content when whitespace alone isn't enough.

**Rules:**
- Most content does not need a Card. Editorial layout uses space, not
  boxes.
- If you're adding a Card, ask: does the grouping need a visual boundary?
  If not, don't add one.
- No shadow. No border by default. Optional 1px rule in `surface.rule`.
- Radius: `radius.none` (0).

**Do not:** wrap every block in a Card. That's dashboard thinking, not
editorial.

---

### `Input`

**Use for:** text entry in profile, search, and allergies/sensitivities.

**Rules:**
- Label above the input, always visible. No placeholder-as-label.
- Placeholder text is a hint, not a label.
- Error state: red border (verdict.mismatch), error message below in
  `size.sm`.
- Height: 44pt minimum.

**Do not:** use floating labels. No labels inside the field.

---

### `Badge`

**Use for:** verdict state indicators, tag chips.

**Variants:**
- `verdict` — match / caution / mismatch / neutral. Uses verdict colors.
- `tag` — neutral background, ink text, for concern tags.

**Rules:**
- Always includes an icon for verdict badges (check / alert / x).
- Never uses verdict colors for anything other than verdicts.
- Radius: `radius.sm` (2).

---

### `Text`

**Use for:** all text in the app.

**Why it exists:** it enforces the typography tokens. A raw React Native
`<Text>` bypasses the theme. Always use our `Text`.

**Props:** `variant` (`body`, `bodyEmphasis`, `caption`, `label`, `h1`,
`h2`, `h3`, `verdict`), `color` (semantic token name).

**Rules:**
- Never set font size or family inline. Use a variant.
- Never set color to a hex. Use a semantic token.

---

### `Screen`

**Use for:** the outer wrapper of every screen.

**What it does:** safe area, background (`brand.paper`), horizontal
padding (`space.lg`), optional scroll.

**Rules:**
- Every screen is wrapped in `<Screen>`.
- No screen sets its own background color.

---

### `Icon`

**Use for:** all icons in the app.

**What it does:** wraps Lucide, enforces stroke width, size, and color
tokens.

**Props:** `name` (from the allowed list in `imagery.md`), `size`
(`sm`/`md`/`lg`), `color` (semantic token).

**Rules:**
- Never import from `lucide-react-native` directly.
- Never use emoji as an icon.
- Never use an icon not in `imagery.md`.

---

### `EmptyState`

**Use for:** any screen state where there's nothing to show yet, or an
error occurred.

**Props:** `title`, `body`, `action` (optional button).

**Rules:**
- Every screen that can be empty must use this.
- No illustrations. Type only.
- Title is a full sentence, not a fragment.

Example:
> **You haven't checked any products yet.**
> Search for a product to see how it matches your profile.

---

### `Skeleton`

**Use for:** loading states.

**Rules:**
- Use instead of spinners.
- Match the shape of what will load.
- Animate opacity only. No shimmer gradient.

---

## Domain components

These live in `app/src/components/` (not `ui/`) because they know about
the product.

### `VerdictBadge`
The hero of the verdict screen. Composition locked in
`screens/verdict.md`.

### `FactorBreakdown`
Renders compatibility factors and hard constraints. One row per factor.

### `ConfidenceBadge`
Shows "model score 0.73" for AI-derived values. Never "73% confident"
(blueprint §10.2).

### `DisclaimerBanner`
Renders the blueprint §10.1 text verbatim. No close button. No "I
understand."

---

## What not to build

- Accordions, tabs, drawers.
- Modals beyond OS-level alerts.
- Toasts, snackbars.
- Carousels.
- Onboarding tours.
- Floating action buttons.
- Star ratings.
- Progress rings.

If a feature seems to need one of these, STOP and ask the human. The
answer is usually "redesign the screen so it doesn't."