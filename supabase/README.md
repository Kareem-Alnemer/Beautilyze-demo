# Supabase

Database-as-code. Schema, migrations, policies, and seed data.

## Files

| Folder | Purpose |
|--------|---------|
| `migrations/` | Append-only SQL migrations. Applied in order. |
| `seed/` | Generated SQL seed files. Produced by `scripts/seed-catalog.ts`. |

## Migrations

Naming: `NNN_verb_noun.sql`, zero-padded, never renumbered.

Current migrations:
- `001_initial_schema.sql` — tables from blueprint §9
- `002_rls_policies.sql` — RLS on every user-scoped table (§8.6)
- `003_ingredient_concerns.sql` — ingredient lookup table (§7.2)

**Rules:**
- Never edit a migration after it has been merged. Add a new one.
- Every new table gets RLS enabled in the same migration.
- Every user-scoped table's policy pattern: `user_id = auth.uid()`.
- No secrets in migrations. No data in migrations.

## Seed data

`supabase/seed/*.sql` is **generated** by `scripts/seed-catalog.ts` from
`catalog/*.csv`. Do not edit it by hand.

To regenerate:
    cd scripts
    npx ts-node seed-catalog.ts

Then commit the updated `supabase/seed/*.sql` together with the CSV change.

## Applying migrations

### To local Supabase (if using Docker)

    supabase db push

### To cloud Supabase

Option A — CLI (requires Supabase CLI login):

    supabase db push

Option B — Dashboard (manual):
1. Open the Supabase project.
2. Go to SQL Editor.
3. Paste the contents of each migration in order.
4. Run.

This is a MANUAL_TASK. The agent writes the block; the human runs it.

## Applying seed data

Same options as migrations. Seed is safe to re-run if the SQL uses
`INSERT ... ON CONFLICT DO NOTHING` or truncates first.

## RLS rules

Every user-scoped table:
- RLS enabled.
- Policy for SELECT, INSERT, UPDATE, DELETE.
- All policies use `user_id = auth.uid()`.

If any is missing, the migration is not done (see
`.agents/skills/supabase-schema/SKILL.md`).

## What does NOT go here

- Secrets. Those go in `.env` (gitignored).
- Service-role keys. Those never ship in the client.
- Application logic. That's in the app or the inference server.