---
name: catalog-annotator
description: Rules for adding or editing products in the BeautiLyze catalog
---

# Catalog Annotator

Applies when adding, editing, or validating products in `catalog/`.

## Source of truth

- `catalog/products.csv` — one row per product
- `catalog/ingredients.csv` — the ingredient-to-concern lookup table
- `docs/annotation-methodology.md` — the rules
- `docs/glossary.md` — the closed concern vocabulary

## Hard rules

- Every product needs a recorded external source (URL).
- Every tag needs a rationale (blueprint §7.6).
- Concern tags come from the closed 5-tag vocabulary only (§7.1).
- Ingredient entries must cite a source (§7.2).
- Run `scripts/validate-catalog.ts` after every edit.
- Never invent ingredient properties.
- Never add `anti_aging` or any other tag outside the vocabulary.

## The 5 concern tags

`acne`, `oil_control`, `hydration`, `dryness`, `sensitivity`

No others. Ever.

## Ingredient normalization

The pipeline in `scripts/normalize-ingredients.ts` runs after every
product edit. It:
1. Lowercases
2. Trims
3. Resolves aliases
4. Flags unmatched
5. Records unmatched count
6. Marks `partial_data` if >30% unmatched

If >30% unmatched, the product's allergy factor becomes
`insufficient_data` automatically (blueprint §7.5).

## When to escalate

- A product's ingredients are unavailable → ask the human whether to include
  it with `partial_data: true` or skip it.
- A tag assignment is ambiguous → ask.
- The 30% threshold is hit → note it in the PR description.