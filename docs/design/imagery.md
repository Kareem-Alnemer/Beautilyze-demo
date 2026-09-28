# Imagery

What images, icons, and visual assets are allowed in BeautiLyze, and where
they come from.

---

## Icon set

**One set. Only one.** Lucide.

- Package: `lucide-react-native`
- Why: free (ISC license), consistent stroke weight, large coverage,
  maintained, no attribution required, works on React Native.
- Where: wrapped in `app/src/components/ui/Icon.tsx`.
- Rule: components never import from `lucide-react-native` directly. They
  import from `Icon.tsx`. This prevents icon-set drift.

**Icons actually used in the MVP (keep this list short):**

| Purpose | Icon name |
|---|---|
| Verdict: match | `check` |
| Verdict: caution | `alert-triangle` |
| Verdict: mismatch | `x` |
| Back navigation | `chevron-left` |
| Camera / scan | `camera` |
| Search | `search` |
| Profile | `user` |
| Settings | `settings` |
| Info / disclaimer | `info` |
| Close | `x` |
| Home navigation | `home` |
| Check history | `history` |
| Expand/collapse existing factor detail | `chevron-down` / `chevron-up` |
| Switch camera | `switch-camera` |
| Choose existing photo | `images` |

If a new icon is needed, it is added here first, then to `Icon.tsx`.

**Never:** emoji as icons. Mixed icon sets. Filled icons mixed with outline
icons. Custom-drawn SVG icons (unless reviewed and added here).

---

## Product images

**Source:** Open Beauty Facts, when a licensed image exists for a product.

**Rules:**
- Only images with a clear license (CC0, CC-BY, CC-BY-SA).
- Attribution stored in `catalog/products.csv` in a `image_source` column.
- If no licensed image exists, use the placeholder.
- Images are stored in Supabase Storage, not linked from the source.
- Never hotlink to an external image URL.
- Max size: 400×400px, ≤ 50KB per product.
- Never the user's own photos.

**Placeholder:**
A neutral, branded placeholder rendered by
`app/src/components/ui/EmptyState.tsx`. It shows the product name in
editorial type on a paper background. Never a gray box. Never a "no image"
icon.

---

## Lifestyle photography

**None inside the app.**

No faces. No stock skincare photos. No models. No before/after. No
"aspirational" imagery.

Why: the product's claim is honesty and specificity. Generic photography
undermines both. A face on the screen implies the app sees the user's face
— which it does not, and must not imply.

**The one exception:** the onboarding screen may have a single,
text-only hero, no image. See `screens/onboarding.md` (to be written when
that screen is designed).

---

## The user's scan photo

- Captured in `ScanScreen.tsx`.
- Sent to the inference server for prediction.
- **Never stored, never logged, never displayed back.**
- The app shows only the derived AI result, not the photo.

This is a privacy commitment (blueprint §8.4) and a design commitment:
the photo is not part of the interface.

---

## Illustrations

**None.** No unDraw. No Storyset. No custom illustration system.

Why: illustrations are a visual language of their own, and we have chosen
type as ours. Mixing them dilutes the direction and creates a second
system to maintain.

If a spot of visual relief is needed, use space, not illustration.

---

## Fonts

**Headings:** Fraunces (Google Fonts, OFL license, free for commercial use).

**Body:** Inter (Google Fonts, OFL license, free for commercial use).

**Weights used:**
- Fraunces: 500, 600
- Inter: 400, 500, 600

**Not used:** italic, black weights, condensed, extended.

**Loading:** bundled with the app via `expo-font`, not fetched at runtime.
The static asset manifest lives in `app/src/assets/fonts/`; font binaries and
their OFL licenses come from the installed `@expo-google-fonts/inter` and
`@expo-google-fonts/fraunces` packages. Metro bundles the selected five faces.
No font is downloaded by the running app. Text and text inputs resolve the
requested family/weight through the shared typography wrapper, avoiding
synthetic bold in place of the supplied medium and semibold faces.

**Fallback:** if a font fails to load, use the system default and log a
warning. Never crash.

---

## What this file is not

This is not a mood board. Decisions here are binding. If a design needs
imagery that is not on this list, the agent must STOP and ask the human.

---

## Summary

| Category | Allowed | Never |
|---|---|---|
| Icons | Lucide only | Emoji, mixed sets, custom SVG |
| Product images | Open Beauty Facts (licensed) | Hotlinks, unlicensed, user photos |
| Lifestyle photos | None | Any |
| User scan photo | Sent, not stored, not shown | Stored, logged, displayed |
| Illustrations | None | Any |
| Headings font | Fraunces 500/600 | Any other |
| Body font | Inter 400/500/600 | Any other |
