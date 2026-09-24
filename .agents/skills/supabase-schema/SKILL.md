---
name: supabase-schema
description: Rules for Supabase schema, migrations, RLS, and seed data
---

# Supabase Schema

Applies when touching `supabase/migrations/`, `supabase/seed/`, or any
SQL that affects the database.

## Hard rules

- Migrations are append-only. Never edit a merged migration. Add a new one.
- Every user-scoped table has RLS enabled (blueprint §8.6).
- RLS policy pattern: `user_id = auth.uid()` for all four operations.
- Service-role key never appears in app code. Only in seed scripts run
  locally.
- No secrets in migrations.
- No data in migrations. Data goes in `supabase/seed/`.

## Table conventions

- `snake_case` for tables and columns.
- `id uuid` primary key on every table.
- `created_at timestamptz` and `updated_at timestamptz` on every mutable
  table.
- Foreign keys named `<table_singular>_id`.
- Text columns that reference a closed vocabulary get a CHECK constraint
  OR a foreign key to a lookup table.

## Naming migrations

    NNN_verb_noun.sql

Zero-padded. Never renumbered. Never renamed after merge.

Examples:
- `001_initial_schema.sql`
- `002_rls_policies.sql`
- `003_ingredient_concerns.sql`

## RLS checklist for every new table

- [ ] `ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;`
- [ ] Policy for SELECT
- [ ] Policy for INSERT
- [ ] Policy for UPDATE
- [ ] Policy for DELETE

If any is missing, the migration is not done.

## When to escalate

- Any migration that drops a column or table → STOP.
- Any policy that allows cross-user access → STOP.
- Any need to store image data → STOP (blueprint §8.4 forbids it).