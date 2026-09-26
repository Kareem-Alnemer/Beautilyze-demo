# Catalog

The hand-annotated product catalog. This folder is the **source of truth**
for what products BeautiLyze knows about and what each is tagged with.

## Files

| File | Purpose |
|------|---------|
| `products.csv` | One row per product. Includes all tags and annotation metadata. |
| `ingredients.csv` | The ingredient-to-concern lookup table (~20–30 rows). |
| `annotations/` | One Markdown file per product, with the full annotation rationale. |

## Distinction from `datasets/`

- **`catalog/`** — products we intentionally curate. Committed. Human-edited.
  Every tag has a recorded source.
- **`datasets/`** — ML training data. Gitignored. Downloaded, not edited.

These have different provenance, licensing, and lifecycle. They are not
the same thing and must not be mixed.

## Rules

- Every product has a recorded external source (URL).
- Every tag has a rationale (blueprint §7.6).
- Concern tags come from the closed 5-tag vocabulary:
  `acne`, `oil_control`, `hydration`, `dryness`, `sensitivity`.
- Every ingredient entry cites a source (blueprint §7.2).
- No product is added without confirming it with the human first.

## Workflow

1. Read `docs/annotation-methodology.md`.
2. Follow `.agents/playbooks/add-product.md`.
3. Run `node scripts/validate-catalog.mjs` after every edit.
4. Run `node scripts/seed-catalog.mjs` to regenerate `supabase/seed/*.sql`.
5. Commit the CSV change and the regenerated SQL **together**.

## Definition of "verified" (blueprint §7.7)

An ingredient list is verified when:
- It has been retrieved from a named external source.
- It has been through the normalization pipeline (`app/src/catalog/normalize.ts`, mirrored in `scripts/seed-catalog.mjs`).
- Any tag assigned has a recorded source and rationale.

Per-product deep-dives may live in `annotations/` (one Markdown file per
product). The CSV columns `annotation_source` / `annotation_rationale` are
the minimum evidence and must always be filled; `annotations/` files are
optional supplements, never substitutes.

## What is NOT in this folder

- Product images. Those go in Supabase Storage (see `docs/design/imagery.md`).
- User data. Ever.
- ML datasets. Those are in `datasets/`.