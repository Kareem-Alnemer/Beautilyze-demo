# Readable screens and correctly ordered requests

**Date:** 2026-09-26
**Blueprint:** [3.1 Core flow](../blueprint.md#31-core-flow), [4 Scope](../blueprint.md#4-scope-in--out), [10 Security and privacy](../blueprint.md#10-security-privacy--disclaimers)
**Files changed:** app/src/home/HomeScreen.tsx, ProfileSummaryCard.tsx, QuickActionsBar.tsx, RecentChecksSection.tsx; app/src/components/ProductSearchBar.tsx, RecentChecksList.tsx; app/src/catalog/api.ts; their seven test files; docs/design/screens/home.md, search.md.
**Prerequisites:** [10](10-search-and-verdict-screens.md), [13](13-home-screen-and-navigation.md), [23](23-ui-stability-audit.md).

## 1. What this task was

The home screen crowded values into narrow cards and described face scanning
as Scan Product. Search could display an old response over a newer one, and
network failures looked like an empty catalog or history. This task makes
the manual product-check journey clearer and prevents misleading screen states.
It corrects lesson 19's decision to restore Scan Product: the blueprint's
face scan takes precedence over the old home mockup. No verdict rules changed.

## 2. The concept

An asynchronous request is work whose answer arrives later. Two requests do
not necessarily finish in the order they started. If you search for A, then B,
the slower answer for A could arrive last. That is a race: the result depends
on timing rather than the current question.

Each search now owns a small active flag. When the question changes, its old
flag becomes false. The old answer may still arrive, but cannot change what
you see. Clearing a timer only stops work that has not started; the flag also
protects against work already running.

## 3. The decision

We keep the existing request functions and add effect cleanup, which runs when
the query changes or the component leaves the screen. A new search library was
rejected because this bounded list needs no new dependency. This ignores old
answers; it does not cancel their network traffic.

Results now take up normal space below the input. The old absolute-positioned
dropdown could cover later content and extend beyond the phone screen. Nested
scrolling lists were rejected: the parent screen already owns scrolling.

Home uses readable rows and stacked commands instead of decorative cards.
Search is primary because scanning is optional. Text commands need no icon
dependency; the separate Lucide/navigation mismatch still needs resolution.

## 4. The code, line by line

### app/src/components/ProductSearchBar.tsx

This component searches and displays the current query's results.

```tsx
let active = true;
setResults([]);
setError(false);
setLoading(Boolean(query.trim()));
// Inside the delayed request:
const data = await searchProducts(query);
if (active) setResults(data);
// Effect cleanup:
return () => { active = false; clearTimeout(timer); };
```

1. A query change clears stale results and the previous error.
2. The existing 300 ms delay avoids a request on every keystroke.
3. Only the active request updates results, loading, or error.
4. Blank input, loading, failure, no matches, and results are separate states.
5. Retry increments `attempt`, a dependency that restarts the same query.
6. Selecting a row calls the parent's callback with the product ID and clears
   the query. A visible label stays above the input. Without an image, product
   name and brand remain readable; no substitute product photo is invented.

### app/src/catalog/api.ts

`getRecentChecks` retrieves the signed-in user's recent records.

```ts
if (!userId?.trim()) return [];
// After the database query:
if (error) {
  console.error('getRecentChecks error:', error);
  throw new Error('Could not load recent checks');
}
```

The guest guard avoids an invalid empty database identifier. A database error
now rejects the request rather than returning `[]`. Those answers have different
meanings: failed retrieval is not evidence that the user has no records.

### app/src/components/RecentChecksList.tsx

This component renders bounded history with loading, failure/retry, and empty states.

It clears rows at the start of a load, uses the same active-flag cleanup as
search, and includes `userId`, `limit`, and `attempt` as effect dependencies.
A response for the previous account cannot populate the new account's list.
`showHeading` defaults to true; Home passes false to avoid two Recent Checks
headings. The actual database ownership rules remain necessary: UI cleanup
is not an authorization mechanism.

### app/src/home/HomeScreen.tsx

This screen arranges the brand heading, profile, actions, and recent checks.

The single ScrollView owns page scrolling. It does not fetch or calculate a
verdict. The BeautiLyze heading replaces generic welcome/feature-description copy.

### app/src/home/ProfileSummaryCard.tsx

This component displays confirmed profile values and an edit command.

It selects `user_skin_type`, `user_acne_severity`, and allergies from the store,
formats missing values, then maps three label/value pairs into wrapping rows.
It never substitutes an AI estimate for an unconfirmed value. Zero allergies
means None declared, not that a person has no allergies.

### app/src/home/QuickActionsBar.tsx

This component routes Search Catalog to `/search` and Scan Skin to `/scan`.

```tsx
onPress={onSearchPress ?? (() => router.push('/search'))}
```

A supplied callback takes precedence; otherwise the existing route is used.
Commands stack vertically and can grow with larger text. Existing ink and
onAccent tokens provide the primary command's contrast. There is no fabricated
claim that every catalog annotation has been independently verified.

### app/src/home/RecentChecksSection.tsx

This component supplies the Home history heading, limit, and navigation.

It passes `showHeading={false}` and `limit={3}` to the list, routes View All to
`/history`, and offers Find a product for empty signed-in history. Guests do
not get a View All action for records they cannot load.

### Regression tests

- `app/src/__tests__/components/ProductSearchBar.test.tsx` controls promise
  completion order to prove an old answer cannot replace a newer answer or
  restore results after clearing input; also checks retry and blank input.
- `app/src/__tests__/components/RecentChecksList.test.tsx` tests failed loads,
  retry, and account switching with an unfinished request.
- `app/src/catalog/__tests__/api.test.ts` proves a database error propagates;
  the fluent database client is mocked, not the query function under test.
- `app/src/home/__tests__/HomeScreen.test.tsx` checks the heading and composition.
- `app/src/home/__tests__/ProfileSummaryCard.test.tsx` checks confirmed values
  and the explicit edit action.
- `app/src/home/__tests__/QuickActionsBar.test.tsx` checks route callbacks,
  search priority, and the absence of misleading product-scan/verified copy.
- `app/src/home/__tests__/RecentChecksSection.test.tsx` checks the empty-state
  search action and history navigation. Its mocked child does not prove actual
  screen layout; that still requires a device.

The Home and Search design documents record the revised composition. They
replace the contradictory home mockup; the locked Verdict design is unchanged.

## 5. How to verify it works

From PowerShell on this project machine:

```powershell
Set-Location 'C:\Users\k5x6\Documents\Projects\Beautilyze-demo\app'
npm run typecheck
npm run lint
npm test -- --runInBand
```

Expect exit code zero. The first verification after this UI change passed 377
tests in 34 suites; later chapters add tests. Lint reported 52 warnings, not
zero warnings. SafeAreaView deprecation and unrelated scan-platform warnings
also appeared. A failed assertion prints FAIL and must not be ignored.

On a device, try a narrow screen, large text, long product names, failed
network requests, and keyboard-open scrolling. No device/screenshot validation
has been performed for this chapter; passing component tests is not visual QA.

## 6. What could go wrong

- A cancelled request still consumes network bandwidth. If that becomes a
  problem, add supported transport cancellation without removing stale-result
  guards; not every response races only because of the transport.
- A list becomes unbounded. Keep database limits or move to one top-level
  virtualized list, which renders only visible rows, instead of nesting lists.
- Home looks different on a phone because fonts are not bundled. The repository
  names Fraunces/Inter but lacks the specified font assets; resolve that release
  gap and verify real rendering rather than trusting a test snapshot.

## 7. If you remember one thing

The screen must answer the current request, and a failed request must never pretend to be an empty answer.

## 8. Questions to ask yourself before the defense

- Why is clearing the timer insufficient? A request already started continues;
  the active flag prevents its late result from changing the screen.
- Why is Scan Product incorrect? The optional scan estimates skin attributes,
  not a product barcode or ingredient list.
- Why not show an empty history on failure? The failure provides no evidence
  that the database has no records.
- Do these tests prove the UI fits a phone? No; they check behavior, not native
  font metrics, safe areas, keyboard placement, or pixel layout.
- Why keep the error in the query function? The caller needs to distinguish
  failure from successful retrieval of an empty list.
