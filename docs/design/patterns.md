# Patterns

Screen-level conventions. Applies to every screen in
`app/src/screens/`.

Direction: `principles.md`.

---

## The rhythm of a screen

Every screen follows the same vertical rhythm:

1. **Top spacing** — `space.xl` from the safe area.
2. **Title** — Fraunces, `size.xl` (22pt), weight 600, ink.
3. **Standfirst (optional)** — Inter, `size.md` (15pt), secondary ink.
   One or two lines. Explains the screen.
4. **Content** — the screen's actual content.
5. **Action (optional)** — one `text` or `primary` button.
6. **Bottom spacing** — `space.xxl`.

No screen starts with a big hero image. No screen has a colored header.
No screen has a floating action button.

---

## One screen, one job

Each screen answers exactly one user question.

- Home → "What can I do?"
- Search → "Is this product in the catalog?"
- Verdict → "Does this product match me?"
- Profile → "What does BeautiLyze know about me?"
- Scan → "Can BeautiLyze read my photo?"

If a screen seems to need to do two things, it's two screens.

---

## States

Every screen defines all four:

1. **Loading** — use `Skeleton` matching the shape of the content.
2. **Empty** — use `EmptyState` with a full-sentence title.
3. **Error** — use `EmptyState` with a retry action.
4. **Success** — the screen's normal state.

A screen without all four is not done (`AGENTS.md` §12).

---

## Navigation

- Back navigation: `chevron-left` icon, top-left, 44pt tap target.
- No hamburger menus.
- No bottom tabs for MVP. Screens are reached from Home.
- Deep links: not implemented for MVP.

---

## Tone of voice on screen

All copy follows `copy-voice.md`.

- No exclamation marks.
- No emoji.
- No "Let's get started!" energy.
- No "Oops!" or "Uh oh!" for errors.
- Errors state what happened and what to do.

Examples:

- ✅ "We couldn't reach the catalog. Try again."
- ❌ "Oops! Something went wrong 😅"
- ✅ "No products matched your search."
- ❌ "Nothing here yet — try searching!"

---

## Whitespace

- Whitespace is not wasted space. It's a design element.
- Between major blocks: `space.xl` (24) minimum.
- If a screen feels crowded, remove content — do not reduce spacing.
- Never compress spacing to fit more in.

---

## Typography hierarchy on a screen

- There is exactly one `h1` per screen (the title).
- Section headings use uppercase Inter `size.xs` with letter-spacing.
  ("HARD CONSTRAINTS", "COMPATIBILITY FACTORS".)
- Body text uses Inter `size.md`.
- Captions and reasons use Inter `size.sm`, secondary ink.

No screen should have three different heading levels visible at once.

---

## Lists

When rendering a list:
- No cards around each item. Use whitespace.
- A 1px `surface.rule` between items is acceptable.
- The whole row is tappable, minimum height 56pt.
- No chevrons on the right unless the row navigates. (It usually doesn't.)

---

## Buttons

- One `primary` button per screen, maximum.
- Secondary actions are `text` buttons, underlined.
- Buttons are at the bottom of the content, not floating.
- Button label is a verb phrase. Not "OK". Not "Continue". Not "Next".

---

## Forms

- Label above input.
- Error message below input, `size.sm`, verdict.mismatch color.
- One field per row. No side-by-side fields on mobile.
- Save button is `primary`, at the bottom.

---

## Scroll

- Screens scroll vertically by default.
- No horizontal scroll anywhere.
- The disclaimer on the verdict screen does NOT scroll away. It's fixed
  at the bottom.

---

## What not to do

- Do not add a colored header bar.
- Do not add a bottom tab bar.
- Do not add a floating action button.
- Do not add a hero image.
- Do not add a greeting ("Hi there, [name]!").
- Do not add a "profile picture" affordance.
- Do not add gamification elements (streaks, badges, points).
- Do not add social features.

If a feature would require one of these, STOP and ask the human.