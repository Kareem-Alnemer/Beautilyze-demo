# Migration 006 + AI evaluation documentation

**Date:** 2026-09-26
**Blueprint:** §5.7 (AI evaluation), §7.1 (concern vocabulary), §9 (schema)
**Files changed:** supabase/migrations/006_remap_sensitive_tags.sql, scripts/seed-catalog.mjs, supabase/seed/001_products.sql, docs/ai-evaluation.md
**Prerequisites:** 08-catalog-pipeline.md, 19-stabilization-review.md, 20-catalog-expansion-30-products.md

## 1. What this task was

Two things the manual verification gates needed. First, four catalog rows carried a `sensitive` skin tag the database enum rejects, so a live seed or migration run needed a repair path. Second, the §5.7 accuracy story existed only as a blueprint paragraph — this task wrote it down as methodology with explicit placeholders instead of invented numbers.

## 2. The concept

A database enum is a bouncer with a fixed guest list: `skin_type` admits dry, normal, oily — nothing else. `sensitive` belongs to a different list (concern tags). The seed script already quietly fixed this at generation time, but databases filled by other means still need the same fix as SQL. Separately: a confusion matrix with no measurements is a wish, not evidence — so the evaluation doc has empty tables labeled pending rather than plausible-looking fiction.

## 3. The decision

What were the options? Why was this one chosen? What was rejected and why?

- Migration 006 repairs only the four known rows and only when the stray tag is present (idempotent WHERE clause). Rejected a blanket rewrite because touching rows nobody flagged risks silent annotation drift.
- Fixed the seed script's `toUuid` (slug ids all hashed to ...0001: 30 inserts, 10 distinct UUIDs — a live apply would PK-violate) while preserving the legacy prod-N mapping. Rejected changing prod-N UUIDs because existing seeded databases already reference them.
- Removed `combination` from the seed script's valid skin types to match the real enum. Rejected keeping it because generating SQL the database rejects is a latent Gate 2 failure.
- Left the CSV rows verbatim (human annotation preserved) since the seed already sanitizes at generation. Rejected editing the CSV because ADR-003 makes it the human-owned source of truth.
- Evaluation doc reports methodology only. Rejected "target" matrices because the repair plan forbids fabricated validation results.

## 4. The code, line by line

- supabase/migrations/006_remap_sensitive_tags.sql: one UPDATE over the four deterministic UUIDs (prod-2/6/9/10 → ...0002/0006/0009/0010). It strips the tag via text comparison (`u.tag::text <> 'sensitive'`) because casting the literal to the enum would itself error. It appends `sensitivity` to concern_tags only when absent. New migration file, nothing edited in place.
- scripts/seed-catalog.mjs `toUuid`: prod-N and bare numbers keep byte-identical output; slugs now hash via double FNV-1a into stable UUIDs. Verified: 30 inserts, 30 distinct UUIDs.
- scripts/seed-catalog.mjs `sanitizeSkinTypeTags`: valid set is now exactly the DB enum. Regenerated seed diff adds the 20 new products with distinct ids.
- docs/ai-evaluation.md: class sets, provenance (mock-v1 default, fine-tune strategy), output contract (uncalibrated softmax), validation protocol (10–20 held-out images/class, accuracy + confusion matrices, two-figure rule), 0.60 threshold table, per-field independence, failure-mode definitions with counting rules, privacy restatement, and [PENDING REAL VALIDATION RUN] everywhere a number would go.

## 5. How to verify it works

Copy-pasteable.

```
node scripts/validate-catalog.mjs
node scripts/seed-catalog.mjs
node -e "const fs=require('fs');const sql=fs.readFileSync('supabase/seed/001_products.sql','utf8');const ids=[...sql.matchAll(/VALUES \('([0-9a-f-]{36})'/g)].map(m=>m[1]);console.log(ids.length,'inserts,',new Set(ids).size,'distinct');"
cd app && npx jest
```

Expect: validator exit 0, "30 inserts, 30 distinct", 364 tests pass. Human Gate 1: apply migrations 001–006 on the live project and confirm 006 reports its UPDATE cleanly.

## 6. What could go wrong

- Applying the regenerated seed to a database that already holds the old colliding rows will still conflict on ids ...0001 (the old seed wrote 20 rows onto prod-1's UUID). A live database seeded with the broken seed needs those rows deleted first — flag it during Gate 2.
- Migration 006 matches four hardcoded UUIDs. If a live database was seeded with different ids, it matches nothing and changes nothing — safe, but the stray tags would remain; the validator output is the backstop.

## 7. If you remember one thing

Sanitize at the boundary the database enforces (the enum), and never let two different products share one id.

## 8. Questions to ask yourself before the defense

- Why does casting 'sensitive' to skin_type fail instead of returning false? Because enum casts reject unknown labels with an error — comparison must happen in text space.
- Why keep the legacy prod-N UUID mapping instead of rehashing everything? Because live databases already reference those ids; stability beats elegance.
- Why does the evaluation doc contain empty tables? Because an unmeasured matrix presented as finished would be fabricated evidence.
- Why is 0.60 not a statistical claim? Because it was chosen as a UX threshold for showing the "uncertain" UI, never validated as a probability boundary.
- What breaks if the seed and the CSV disagree on tags? Nothing at runtime — but the validator exists precisely to catch the drift before it ships.
