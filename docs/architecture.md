# Architecture

System design for BeautiLyze. Derived from blueprint §8 and §9.

---

## Three deployables, one backend

    [React Native App]  ──►  [Supabase]         (auth, database, storage)
            │
            │  photo upload
            ▼
    [FastAPI Inference Server]  ──►  HuggingFace pretrained models

The app talks to Supabase directly (auth, catalog, profile).
The app talks to the FastAPI server for one thing only: scan prediction.
The FastAPI server talks to nothing else. It has no database access.

---

## Component responsibilities

### App (`app/`)
- All UI
- All user-facing state
- The verdict engine (deterministic, pure, TypeScript)
- Supabase reads/writes (via `lib/supabase.ts`)
- FastAPI calls for scan (via `lib/api.ts`)

### Inference server (`inference-server/`)
- Receives a photo
- Runs one of two pretrained models
- Returns `{ label, confidence, model_version }`
- Discards the photo immediately
- No database access
- No verdict logic

### Supabase (`supabase/`)
- Auth
- Postgres database
- Storage (product images only, if used)
- Row-Level Security on every user-scoped table

---

## Data flow

### Manual profile path
1. User sets profile fields in `ProfileScreen`.
2. App writes to `profiles`, `allergies`, `sensitivities` in Supabase.
3. RLS scopes all reads/writes to `user_id = auth.uid()`.

### Scan path
1. User captures photo in `ScanScreen`.
2. App uploads photo to FastAPI `/predict/skin-type` and
   `/predict/acne-severity`.
3. FastAPI preprocesses, runs the model, returns label + confidence +
   model_version.
4. FastAPI discards the photo (never written, never logged).
5. App writes only the derived results to `profiles`.
6. User can override any field; the override is stored in the `user_*`
   columns.

### Check path
1. User searches a product in `SearchScreen`.
2. App reads the product from Supabase (`products` table).
3. App fetches the user's profile from Supabase.
4. App calls `evaluate(profile, product)` from `app/src/verdict/`.
5. The engine returns a `Verdict` object (blueprint §6.8).
6. `VerdictScreen` renders the verdict, factors, and disclaimer.

No network round-trip for the verdict itself. The engine is local.

---

## Database schema (blueprint §9)

Tables:
- `profiles` — user profile fields (AI and user values, kept separate)
- `allergies` — user-declared allergens
- `sensitivities` — user-flagged concerns
- `products` — the catalog
- `ingredient_concerns` — the ingredient lookup table
- `checks` — optional history

Every user-scoped table has RLS with `user_id = auth.uid()`.

---

## Module boundaries

### `app/src/verdict/` — pure
- No I/O, no React, no network.
- Consumed via `evaluate(profile, product)`.
- Tests colocated in `__tests__/`.

### `app/src/lib/` — I/O
- `supabase.ts` — the Supabase client (anon key only)
- `api.ts` — the FastAPI client
- `catalog/queries.ts`, `profile/queries.ts` — data fetchers

### `app/src/screens/` — view
- One file per route.
- No business logic beyond view concerns.
- Does not import from other screens.

### `app/src/components/` — view
- `ui/` — generic primitives (no domain knowledge)
- Domain components — VerdictBadge, FactorBreakdown, etc.

### `app/src/theme/` — values
- All colors, fonts, spacing, radii.
- Imported by anything visual. Imports nothing from `lib/`, `components/`,
  or `screens/`.

---

## What is deliberately absent

- No state management library (Redux, Zustand, MobX). Local state + Supabase
  queries are sufficient.
- No GraphQL.
- No caching layer.
- No message queue.
- No microservices.
- No container orchestration.
- No monorepo tooling (no Nx, no Turborepo).
- No MCP servers.
- No ML in the verdict engine.

These are not omissions. They are decisions. See `docs/decisions.md`.

---

## Where the defensibility lives

The project's strongest claim is that the verdict is **deterministic,
inspectable, and traceable**.

- Deterministic: same inputs → same output. Enforced by `precedence.ts`
  being pure.
- Inspectable: each factor is one file. Each reason names the user
  attribute, the product attribute, and the rule.
- Traceable: every product tag has a recorded source
  (`docs/annotation-methodology.md`).

This is why the verdict engine is not an ML model (blueprint §5.6).