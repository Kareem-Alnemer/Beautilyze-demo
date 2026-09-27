# Audit-first UI stability + token polish

**Date:** 2026-09-26
**Blueprint:** §10.2 (terminology), §6.8 + §4 (screen composition); design tokens per docs/design/tokens.md
**Files changed:** app/src/components/RecentChecksList.tsx, app/src/components/ProductSearchBar.tsx, app/src/profile/components/ChipManager.tsx, app/src/home/RecentChecksSection.tsx, app/src/__tests__/components/RecentChecksList.test.tsx
**Prerequisites:** 10-search-and-verdict-screens.md, 13-home-screen-and-navigation.md, 19-stabilization-review.md

## 1. What this task was

A broad "fix nesting bugs and overhaul the aesthetic" prompt arrived with directives that contradicted locked decisions (percentage scores, "safe" language, a new palette, a verdict redesign). After the gate narrowed it to audit-first fixes plus token-consistent polish, this task removed every real VirtualizedList-in-ScrollView nesting, fixed the one theme-token violation, and repaired a dead "View All" button — without touching verdict logic, scoring, or screen compositions.

## 2. The concept

React Native warns when a scrolling list lives inside another scrolling list, because two scrollers fight over the same swipe. The fix is about matching the tool to the data size: virtualization (FlatList) exists for hundreds of rows; for five recent checks or a few suggestion chips, a plain map renders the same pixels with no nested scroller and no warning.

## 3. The decision

What were the options? Why was this one chosen? What was rejected and why?

- Plain `.map()` in a `View` with `gap` for the three nested lists. Rejected `ListHeaderComponent` restructuring because these lists are bounded (≤5 checks, ≤20 dropdown results, a handful of chips) and never need windowing; restructuring screens around them would churn compositions for zero benefit.
- Kept HistoryScreen's top-level FlatList untouched — it is not nested, so "fixing" it would be churn, not repair.
- Rejected the prompt's percentage heroes, "safe" badges, replacement palette, Georgia font, and verdict redesign at the plan gate (blueprint §10.2, locked tokens, locked verdict composition). Visual work stayed inside the existing token set.
- Enabled the dead "View All → /history" navigation instead of leaving the TODO. Rejected leaving it because a button that does nothing is a defect, and the route already existed.

## 4. The code, line by line

- app/src/components/RecentChecksList.tsx: FlatList replaced with `checks.map` in a gap-spaced View (fixes nesting inside both SearchScreen and HomeScreen ScrollViews, which share this component). `getVerdictColor` now returns `theme.colors.verdict.*` instead of raw hex — the only true token violation found (AGENTS.md §7).
- app/src/components/ProductSearchBar.tsx: results dropdown FlatList replaced with map plus explicit empty state (previously `ListEmptyComponent`); the mid-file `import { Image }` moved to the top import block.
- app/src/profile/components/ChipManager.tsx: suggestion-chip FlatList replaced with map (fixes nesting inside Profile and Onboarding ScrollViews).
- app/src/home/RecentChecksSection.tsx: "View All" now routes to `/history`; removed the stale TODO claiming the screen wasn't implemented.
- app/src/__tests__/components/RecentChecksList.test.tsx: new regression test asserting no FlatList instance exists in the rendered tree (`UNSAFE_queryByType`), so the nesting fix cannot silently regress.

## 5. How to verify it works

Copy-pasteable.

```
cd app
npx tsc --noEmit
npx eslint src --ext .ts,.tsx --quiet
npx jest src/__tests__/components/RecentChecksList.test.tsx
npx jest
```

Expect: typecheck clean, lint clean, 367 tests pass. Device check (human): scroll Search, Home, Profile, and Onboarding screens and confirm zero VirtualizedList warnings in the console.

## 6. What could go wrong

- If a list ever grows unbounded (hundreds of checks), plain map costs scroll performance. The limits (5 recent, 20 results) are the guardrail — raising them means revisiting virtualization with a `ListHeaderComponent` restructure instead.
- `UNSAFE_queryByType` is an explicitly unstable testing API. If a React Native upgrade removes it, replace the regression test with a console.warn spy for the nesting warning.

## 7. If you remember one thing

Match the list tool to the data size: map for handfuls, FlatList for hundreds — and never nest scrollers.

## 8. Questions to ask yourself before the defense

- Why is FlatList wrong inside a ScrollView? Because two nested virtualized scrollers compete for gestures and layout, producing warnings and collapsed content.
- Why was HistoryScreen's FlatList left alone? Because it is a top-level scroller, not a nested one — the warning never applied.
- Why do the raw hex colors matter if they look identical? Because hardcoded values bypass the theme contract and drift silently when tokens evolve.
- Why enable View All instead of leaving the TODO? Because the route existed and a dead button is a user-facing defect, fixed in one line.
- What was deliberately not done from the original prompt, and why? Percentage scores and "safe" language (§10.2), palette/font swap (locked tokens), verdict redesign (locked composition without approval).
