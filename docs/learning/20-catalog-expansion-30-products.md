# Catalog expansion to 30 products

**Date:** 2026-09-26
**Blueprint:** §7 (catalog & annotation), §11 (acceptance: catalog ≥30 verified products)
**Files changed:** catalog/products.csv, supabase/seed/001_products.sql, scripts/validate-catalog.mjs (already existed, used as gate), TASKS.md, docs/learning/README.md
**Prerequisites:** 08-catalog-pipeline.md, 19-stabilization-review.md

## 1. What this task was

The catalog had 10 annotated products; the blueprint requires at least 30 for the MVP demo. This task appended 20 human-supplied products (cleansers, serums, moisturizers, sunscreens), validated them against the closed vocabularies, and regenerated the SQL seed so the app can serve all 30.

## 2. The concept

The catalog has three layers, and mixing them up breaks things. The CSV file is the source of truth a human edits. The seed script translates it into SQL. The SQL is what the database loads. A column is not just a label: its position under the header decides which database field each value lands in. Paste rows in a different column order and brand names end up where ingredient lists belong, silently.

## 3. The decision

What were the options? Why was this one chosen? What was rejected and why?

- Kept the canonical schema (no migration, no new columns). Rejected the prompt's alternative column set because the seed script, the validator, and the database all speak the canonical columns.
- Repaired the pasted rows mechanically (positional remap) instead of retyping them. Rejected hand-editing 20 long rows because retyping invites new typos; the remap script was deterministic and deleted after one run.
- Left the ingredient lookup table untouched. Rejected adding lookup rows because every entry needs a recorded source (§7.2) and none was supplied; unmatched ingredients honestly become partial_data flags instead.
- Fixed two malformed quote characters in the supplied data rather than rejecting the batch, and reported them.

## 4. The code, line by line

- catalog/products.csv: 20 rows appended (ids cerave-pm-moisturizing-lotion through naturium-niacinamide-serum-12-plus-zinc-2). Each carries skin_type_tags from dry/normal/oily, concern_tags from the closed five-tag vocabulary, a brand URL as annotation_source, and a rationale. The supplied rows arrived in the order id,brand,name,skin_type_tags,concern_tags,age_notes,ingredients_raw while the file header is id,name,brand,ingredients_raw,skin_type_tags,concern_tags,age_notes — so every value sat under the wrong header.
- One-off remap script (run once from scripts/, then deleted): parsed rows 11–30 positionally and rotated fields into header order (name↔brand swap; ingredients_raw, skin_type_tags, concern_tags, age_notes rotation). Verified by re-running the validator.
- scripts/validate-catalog.mjs: the gate. Before the fix it reported 20 errors (age-note text flagged as concern tags, concern tags flagged as skin tags). After the fix: zero errors, 27 warnings, all of the honest "unmatched ingredients → partial_data expected" kind.
- scripts/seed-catalog.mjs: generated 30 product inserts plus the unchanged 26 ingredient inserts with zero crashes. The seed diff adds 40 lines to supabase/seed/001_products.sql and nothing else.
- Naturium spot check: 7 of 10 ingredients resolve through the lookup table (niacinamide, glycerin, zinc pca, hyaluronic acid, tocopherol, ethylhexylglycerin, phenoxyethanol), so exactly 30% unmatched — correctly not flagged, correctly partial_data false.

## 5. How to verify it works

Copy-pasteable. Failure looks like ERROR lines or a non-zero exit.

```
node scripts/validate-catalog.mjs
node scripts/seed-catalog.mjs
git diff --stat supabase/seed
cd app && npx jest
```

Expect: validator OK with 30 products and zero errors; seed prints "Generated 30 product inserts"; the seed diff touches only 001_products.sql; all 357 app tests still pass.

## 6. What could go wrong

- Pasted rows in the wrong column order pass a quick eyeball test but corrupt every field. Always run the validator before the seed; it reads by header name and catches the shift.
- Pre-existing rows prod-2, prod-6, prod-9, prod-10 use skin tag "sensitive", which is outside the database enum (dry/normal/oily). The seed will generate SQL the live database may reject. Fixing means re-annotating those four rows with human approval — left as a flagged follow-up, not silently changed.
- New products with high unmatched ratios serve verdicts capped at caution for the allergy factor. That is the designed behavior (§7.5), not a bug — but it means expanding the sourced lookup table is the highest-value next catalog task.

## 7. If you remember one thing

Column order is data: validate by header name before seeding, because a shifted column corrupts every row without a single crash.

## 8. Questions to ask yourself before the defense

- Why did the first append produce 20 validation errors with zero crashes? Because CSV parsing is positional while validation is by header name — the seed happily wrote wrong-but-valid SQL.
- Why wasn't the ingredient lookup table expanded for the new products? Because every lookup entry needs a recorded source and none was supplied; inventing properties would violate §7.2.
- What does partial_data mean for a new product like the Beauty of Joseon sunscreen? That 90% of its ingredients are outside the lookup table, so the allergy factor returns insufficient_data and the verdict caps at caution.
- Why do four old rows carry a "sensitive" skin tag the database enum doesn't allow? Pre-existing annotation drift, flagged for human re-annotation, deliberately left untouched.
- How would you add product 31? Append one row in header order, run validator then seed, commit CSV and SQL together per ADR-003.
