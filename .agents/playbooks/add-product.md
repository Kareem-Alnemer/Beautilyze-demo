---
name: add-product
description: Step-by-step for adding one product to the BeautiLyze catalog
---

# Playbook — Add a Product

Use this every time a product is added to the catalog. Follow it in order.
Do not skip steps.

## Preconditions

- `catalog/products.csv` exists and has headers.
- `catalog/ingredients.csv` exists and has the ingredient lookup.
- `docs/annotation-methodology.md` has been read.
- `docs/glossary.md` has been read (closed vocabulary).

## Steps

### 1. Pick the product
- Confirm with the human: which product, which brand.
- Confirm it belongs to the target user's realistic consideration set
  (blueprint §7.3).

### 2. Fetch the source data
- Look up the product on Open Beauty Facts.
- If not found: STOP. Ask the human whether to skip it or find another
  source.
- Record the source URL.

### 3. Retrieve raw ingredients
- Copy the ingredient list as shown on the source page, verbatim.
- Paste into the `ingredients_raw` column.

### 4. Normalize ingredients
- Run `scripts/normalize-ingredients.ts` on the raw string.
- Record the normalized list in `ingredients_normalized`.
- Record the `unmatched_count`.
- If `unmatched_count / total > 0.30`, set `partial_data = true` and note
  it in the PR description.

### 5. Assign tags — each with a source

For every tag, fill in the annotation template (blueprint §7.6):

    Product:            <name>
    Tag being assigned: <field>: <value>
    Source:             <URL>
    Evidence:           <quote or paraphrase>
    Rationale:          <why this tag is correct>
    Annotator:          <initials>
    Date:               YYYY-MM-DD

Fields to tag:
- `skin_type_tags`: which skin types this product suits
- `concern_tags`: from the closed 5-tag vocabulary only
- `age_notes`: if applicable, otherwise leave blank

### 6. Check the closed vocabulary
Concern tags may ONLY be one of:
`acne`, `oil_control`, `hydration`, `dryness`, `sensitivity`

If the product's purpose is not in this list, it gets no concern tag.

### 7. Write the annotation file
Create `catalog/annotations/NNN-product-slug.md` with the filled template.

### 8. Validate
Run `scripts/validate-catalog.ts`. Fix any reported issue before
proceeding.

### 9. Regenerate the seed SQL
Run `scripts/seed-catalog.ts`. This writes updated SQL into
`supabase/seed/`.

### 10. Update TASKS.md
Mark the product as added.

### 11. Propose the commit
Write the proposed commit to
`.agent-state/pending-commits/feat-catalog-<slug>.md`. Print the commands
for the human.

## What NOT to do

- Do not invent ingredient properties.
- Do not add a tag outside the vocabulary.
- Do not skip the source.
- Do not add a product without confirming it with the human first.
- Do not modify `supabase/seed/*.sql` by hand. Regenerate it.

## Escalate if

- Product not found on Open Beauty Facts.
- Ingredient list is incomplete (>30% unmatched).
- No licensed image is available.
- A tag assignment is ambiguous.