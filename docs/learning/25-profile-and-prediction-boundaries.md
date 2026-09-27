# Do not invent or overwrite personal data

**Date:** 2026-09-26
**Blueprint:** [5.2 AI output](../blueprint.md#52-ai-output-contract), [5.3 Independent fields](../blueprint.md#53-per-field-parallel-contracts), [6.6 Score](../blueprint.md#66-score-display), [9 Data model](../blueprint.md#9-data-model)
**Files changed:** app/src/auth/AuthGate.tsx; app/src/auth/__tests__/AuthGate.test.tsx; app/src/scan/api.ts; app/src/scan/__tests__/api.test.ts; app/src/screens/HistoryScreen.tsx; app/src/screens/__tests__/HistoryScreen.test.tsx; docs/design/screens/history.md.
**Prerequisites:** [09](09-profile-store-and-screen-tests.md), [11](11-inference-server.md), [18](18-scan-history-screen.md), [24](24-ui-and-request-lifecycle.md).

## 1. What this task was

The history screen guessed personal skin/acne values from explanation text,
even displaying Clear when no acne value existed. Authentication refreshes
could reload the same profile over unsaved edits, and the inference client
trusted every successful response without checking its contents. This task
repairs those boundaries. It corrects lesson 18: history rows are product
checks, not stored scan diagnoses, and explanation strings are not structured
profile fields.

## 2. The concept

A contract states what data must contain before another part of a program
uses it. A TypeScript type checks the code while developing; it does not
inspect a server's answer at runtime, meaning while the app is actually running.

The app therefore checks incoming prediction values. A successful HTTP status
means the request succeeded, not that its contents satisfy our contract.

We also distinguish identity from credentials. Identity is which account is
signed in. Credentials prove access and may refresh without changing the
person. Refreshing that proof should not discard their unfinished edits.

## 3. The decision

History now shows only stored product-check facts. Parsing words such as dry,
oily, or severe from explanations was rejected: explanations can mention a
product's target audience or a negated condition. Adding profile snapshot
columns was deferred because it needs a separate schema decision and migration.

The client validates allowed labels, a finite score from zero to one, and a
nonblank model version. Blind type assertions and a new validation dependency
were rejected; this three-field contract is small enough to check directly.

The authentication gate loads on account identity changes, not every auth event.
No locked architecture decision or verdict precedence changed. The existing
store still owns profile saving, as required by the architecture.

## 4. The code, line by line

### app/src/auth/AuthGate.tsx

This component restores authentication and loads the appropriate account's profile.

```ts
let alive = true;
let loadedId: string | null | undefined;
const load = async (id: string | null) => {
  if (!alive || loadedId === id) return;
  loadedId = id;
  // Existing profile load follows.
};
```

`undefined` means no initial decision yet; `null` means signed out. A repeated
account ID returns before loading, preserving unsaved edits during credential
refresh. A different ID continues through `setUserId` and `loadProfile`.

```ts
clearTimeout(pending);
pending = setTimeout(() => { void load(session?.user.id ?? null); }, 0);
```

Database work stays outside the authentication callback to avoid holding the
auth client's internal lock. New events cancel scheduled old work. Cleanup
marks the gate inactive, cancels the timer, increments the request generation,
and unsubscribes. The initial session promise now handles rejection explicitly.

### app/src/scan/api.ts

This module uploads a photo and checks the returned prediction contract.

```ts
typeof record.confidence !== 'number' ||
!Number.isFinite(record.confidence) ||
record.confidence < 0 || record.confidence > 1
```

`validatePrediction` first requires an object, then the endpoint's allowed label,
then a finite numeric score within bounds, then a nonempty version string. Only
after those checks does it construct a PredictResponse. Extra fields are not
copied. Skin accepts dry/normal/oily; acne accepts mild/moderate/severe. Clear
and combination are not in the blueprint's class sets. A bad response throws
an error that the existing scan workflow presents as a failure.

This validation does not establish model accuracy or calibration. A score of
0.80 is still a model score, not an 80% probability of a correct conclusion.

### app/src/screens/HistoryScreen.tsx

This screen renders saved product-check facts without guessing missing profile data.

```ts
const request = ++generation.current;
const data = await getScanHistory(userId, 50, 0);
if (request === generation.current) setHistory(data);
```

Every load gets a generation number. Later loads and effect cleanup invalidate
it, preventing a previous account's response from repopulating this screen.
Account changes clear rows; refreshes for the same account retain rows. A failed
refresh displays a visible warning instead of silently looking up-to-date.

```ts
if (compatFactors.length !== 3) return 'Compatibility details unavailable';
```

The score counts stored pass states. Missing factor details no longer become
zero of three. The history rows are Views, not buttons that do nothing. Skin
and acne badges derived from `reason.includes(...)` are removed entirely.
The footer stacks its timestamp and count to avoid a crowded single line.

### app/src/auth/__tests__/AuthGate.test.tsx

These tests control authentication events and profile loads at their boundaries.

They prove a same-account refresh loads once, a new account loads again, an
unmounted gate cancels scheduled work, and session rejection shows an error.
They do not exercise real Supabase token refresh or database policies.

### app/src/scan/__tests__/api.test.ts

These tests replace network responses with controlled valid and malformed answers.

They pass null, missing fields, unsupported labels, numeric strings, out-of-range
scores, NaN, and blank versions through the real API function. NaN means
not-a-number; JSON cannot normally encode it, but rejecting it protects the
validator when used with other data sources or test doubles.

### app/src/screens/__tests__/HistoryScreen.test.tsx

These tests verify truthful records, refresh warnings, and stale-account protection.

The prior badge test required incorrect behavior and is replaced by an assertion
that no personal skin/acne badge is derived from reasons. A controlled promise
finishes after sign-out to demonstrate that its records remain invisible.
Another fixture has missing compatibility factors and must not show zero of
three. The loading test now awaits its promise inside `act`, the testing helper
that waits for React to process state updates.

The History design document records the same behavior for future UI work.

## 5. How to verify it works

```powershell
Set-Location 'C:\Users\k5x6\Documents\Projects\Beautilyze-demo\app'
npm run typecheck
npm test -- --runInBand src/auth/__tests__/AuthGate.test.tsx src/scan/__tests__/api.test.ts src/screens/__tests__/HistoryScreen.test.tsx
```

Expect 30 tests across these three suites. They have been run as an auth group
(4 tests) and a scan/history group (26 tests); the final full suite includes
both. A failure prints the violated assertion. History still emits the existing
SafeAreaView deprecation warning, which is not a layout validation result.

## 6. What could go wrong

- A server returns a renamed class. The app now rejects it; update the contract
  and both sides deliberately rather than silently accepting a new class.
- History has no rows because no UI calls `saveCheck` yet. This task repairs
  reading, not persistence. The unwired save flow remains an explicit backlog item.
- A real phone scan remains disabled by the no-disk privacy guard. Contract
  tests do not make native capture available; an approved in-memory capture
  implementation and device testing are still required.

## 7. If you remember one thing

Only verified data may cross a boundary; missing facts and refreshed credentials must not rewrite the user's profile.

## 8. Questions to ask yourself before the defense

- Why does TypeScript not validate a server response? Its types are checked
  during development and do not inspect downloaded JSON at runtime.
- Why not infer oily from an explanation? The text may describe the product,
  not the user, and prose is not a stable data contract.
- Why skip same-account auth events? Refreshing access credentials should not
  overwrite unsaved edits with the last database copy.
- What does a passing mock test not prove? Real model quality, real device
  capture, and database ownership enforcement need separate checks.
- Why is unavailable better than zero? Zero claims a measured result; unavailable
  honestly reports that the required saved evidence is missing.
