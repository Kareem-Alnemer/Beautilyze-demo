# Trace the product from a tap to a verdict

**Date:** 2026-09-26
**Blueprint:** [3.1 Flow](../blueprint.md#31-core-flow), [5.6 No ML verdict](../blueprint.md#56-no-ml-in-the-verdict-layer), [6 Rules](../blueprint.md#6-verdict-engine-specification), [8 Architecture](../blueprint.md#8-architecture--tech-stack)
**Files changed:** docs/learning/README.md, this chapter, docs/reviews/2026-09-26-project-review.md, TASKS.md.
**Prerequisites:** [01](01-verdict-engine-types.md), [07](07-verdict-engine-aggregation.md), [24](24-ui-and-request-lifecycle.md), [25](25-profile-and-prediction-boundaries.md).

## 1. What this task was

This chapter turns the learning folder into a code-reading guide rather than
a list of claimed completions. It maps the real manual and AI paths, explains
where facts are stored and decisions happen, and identifies unfinished links.
Read it with the code open. Earlier chapters describe historical steps, not
guarantees about the current build.

## 2. The concept

A boundary is where one part of the system hands data to another. A screen
knows what to display; a request function knows how to retrieve records; the
verdict engine knows the rules. Keeping those jobs separate lets us ask which
part made an incorrect claim.

A pure function uses only its supplied inputs and produces a result without
changing the outside world. The verdict engine is pure: it does not fetch
products, read a camera, or save history. The same profile, product, and
ingredient lookup should produce the same result. This makes a verdict
explainable, not medically validated.

## 3. The decision

Keep one app-side engine, following [ADR-001 and ADR-002](../decisions.md).
Duplicating its rules in Python was rejected because the optional scan service
must not become necessary for manual checking. Catalog CSV remains the source,
following ADR-003; SQL seed output is not the place to hand-edit annotations.

This guide links older lessons to corrections rather than rewriting their
history. Claims of automatic profile saving in lesson 09 and server-side
Supabase storage in lesson 17 are not current behavior. The present store calls
an atomic RPC (one database operation whose related writes succeed or fail
together), and the inference server has no database responsibility.

## 4. The code, line by line

### Starting the app

`app/index.ts` starts Expo Router, the library that maps files to screens.
`app/app/_layout.tsx` places authentication and onboarding around those routes.

```tsx
return <AuthGate><OnboardingGate /><Stack screenOptions={{ headerShown: false }} /></AuthGate>;
```

Read AuthGate first: it establishes identity and loads the profile. Next read
OnboardingGate: it checks the device's onboarding flag. Then inspect
`app/app/(tabs)/_layout.tsx` and a route wrapper to see which screen is rendered.
Route files are not a second copy of business logic.

### Manual profile

`app/src/profile/ProfileScreen.tsx` edits confirmed fields. `store.ts` holds the
draft using Zustand, the existing shared-state library. Read `setUserId` to see
how personal state clears on account changes, then `loadProfile`, then
`persistToSupabase`.

```ts
const { error } = await client.rpc('save_profile', { payload: { /* profile fields */ } });
```

The payload is a snapshot of the draft. The `generation` counter detects an
account change; `revision` detects edits during saving so a newer draft is not
falsely called saved. Open `supabase/migrations/005_profile_integrity.sql` for
the database function. RLS, row-level security, restricts whose records a caller
can read/write independently of what the interface displays.

Architecture.md currently says there is no shared-state library; that conflicts
with existing Zustand code. A future ADR must reconcile this, not an invented
claim that the decision log already approved it.

### Search to verdict

`app/src/components/ProductSearchBar.tsx` delays a query and calls
`app/src/catalog/api.ts::searchProducts`. `SearchScreen` navigates by product ID.
`app/src/catalog/useVerdict.ts` fetches a product and the ingredient lookup:

```ts
const [record, concerns] = await Promise.all([
  getProduct(productId), getIngredientConcerns(),
]);
setVerdict(evaluate(JSON.parse(profileJson) as Profile, record, concerns));
```

Promise.all waits for both independent reads. Its presence does not make the
engine impure: those reads happen outside `app/src/verdict/`. The profile
snapshot, product record, and concerns enter the public `evaluate` function.

Read `app/src/verdict/index.ts`, then each factor, `precedence.ts`, and `score.ts`.
The hard constraints can cap or override the result. The three compatibility
factors produce a count, not a probability or weighted percentage. Do not
modify precedence without the special approval required by AGENTS.md.

`app/src/screens/VerdictScreen.tsx` displays that result; it does not recompute
rules. The existence of `api.ts::saveCheck` does not mean history saving works:
it has no caller yet. Distinguish rendering a verdict from persisting a check.

### Optional AI input

`app/src/scan/hooks/useScan.ts` moves among permission, camera, analyzing,
review, and error states. `app/src/scan/api.ts` sends the photo to two prediction
endpoints and validates each response. The server's
`inference_server/main.py::_process_prediction` reads a bounded upload, processes
it in memory, and calls the chosen model. Model work runs in a worker thread
so the asynchronous request handler is not occupied with that computation.

Back in `acceptAIInputs(field)`, AI values remain separate from confirmed user
values. Accepting skin type must not silently accept acne severity. Model score
is not measured validation accuracy. Native capture remains guarded off in
this build; do not present these code paths as a working phone scan demo.

### Catalog and evidence

`catalog/products.csv` and `ingredients.csv` hold source records.
`scripts/validate-catalog.mjs` checks their structure; `seed-catalog.mjs`
generates SQL. `app/src/catalog/normalize.ts` resolves known aliases while
preserving unknowns. The 30% unmatched threshold is an engineering heuristic,
not a medical safety boundary. Read blueprint 7.5 before explaining it.

### Documents changed in this task

The learning index provides linked topic paths and identifies historical
corrections. The review document lists confirmed problems, proposed fixes,
and release gates. TASKS tracks this pass as incomplete until manual gates
are satisfied. None of these documents substitutes for reading the functions.

## 5. How to verify it works

These read-only searches let you follow the actual call sites:

```powershell
Set-Location 'C:\Users\k5x6\Documents\Projects\Beautilyze-demo'
rg -n 'evaluate\(' app/src/catalog app/src/verdict
rg -n 'saveCheck' app/src
rg -n 'acceptAIInputs|acceptAISkinType|acceptAIAcneSeverity' app/src
node scripts/validate-catalog.mjs
```

Expect engine calls and tests for the first search; only the definition of
saveCheck for the second. The validator currently reports 30 products, 26
concerns, and 27 warnings. These warnings reflect unmatched ingredients,
not a clean coverage result. External annotation accuracy is not validated
by these commands.

## 6. What could go wrong

- A lesson and code disagree. Read the newest correction and actual function;
  record the discrepancy instead of repeating an outdated claim at the defense.
- A mock test passes while deployment fails. A mock supplies a controlled
  substitute; it cannot prove real credentials, database policies, or model files.
- A model predicts a label and the team calls it a diagnosis. Explain the
  separate confirmation step and the limits in blueprint 3.5 and 5.2.

## 7. If you remember one thing

Trace every verdict to confirmed profile fields, sourced product data, and a deterministic rule, never to an unexplained AI score.

## 8. Questions to ask yourself before the defense

- Can a manual check work without FastAPI? Yes; it still needs catalog data,
  but prediction is optional and the verdict engine runs in the app.
- Why fetch ingredient concerns separately? The factors need the sourced
  ingredient-level properties and aliases, not just product-level tags.
- Is an identical result for identical inputs proof of medical accuracy? No;
  determinism describes execution, not clinical validation.
- Where is account ownership enforced? In Supabase RLS and the authenticated
  save operation, not only in the UI's user selector.
- Which link is still missing in history? A defined user action that invokes
  saveCheck with duplicate and failure handling; reading history alone is incomplete.
