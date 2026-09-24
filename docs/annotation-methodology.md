# Annotation Methodology

Rules for annotating products in the BeautiLyze catalog. Derived from
blueprint §7.

Every tag in `catalog/products.csv` was assigned by following this
document. If a tag's origin cannot be traced back to a rule here, the tag
is wrong.

---

## The five concern tags (closed vocabulary)

Only these five exist. No others. Products outside this list get no
concern tag.

| Tag | Definition |
|-----|-----------|
| `acne` | Product claims or is evidenced to address breakouts |
| `oil_control` | Product targets excess sebum / shine |
| `hydration` | Product targets moisture retention |
| `dryness` | Product targets dry / flaky skin |
| `sensitivity` | Product explicitly formulated for reactive / sensitive skin |

`anti_aging` was deliberately cut (blueprint §7.1) — it complicates the
catalog for a young user base and adds no value to the core demo.

---

## Data provenance — source vs. annotation

Not everything in the catalog comes from the same place. Know which layer
you're working with.

| Layer | Source | Trust level |
|-------|--------|-------------|
| Product identity (name, brand) | Open Beauty Facts | Source data |
| Ingredient list | Open Beauty Facts | Source data, *may be incomplete* |
| Skin-type suitability tag | Team-annotated | Team judgment, sourced |
| Concern tags | Team-annotated | Team judgment, sourced |
| Sensitivity / allergen flags | Derived from lookup table | Rule-derived from sourced data |
| Age notes | Team-annotated | Team judgment, sourced |

**Team-annotated** means a human decided it, and that decision has a
recorded source and rationale (see the template below).

**Rule-derived** means the value comes from `catalog/ingredients.csv`,
which itself has recorded sources per row.

---

## The annotation template

Every tag assigned to a product uses this exact template. Both annotators
use it. Any disagreement is resolved by discussion *before* the product
enters the catalog.

    Product:            CeraVe Foaming Facial Cleanser
    Tag being assigned: skin_type_suitability: oily
    Source:             https://incibeauty.com/en/produit/...
    Evidence:           "Brand describes as for normal-to-oily skin;
                         contains niacinamide and ceramides"
    Rationale:          "Explicit brand positioning + ingredient profile
                         consistent with oily-skin suitability"
    Annotator:          AB
    Date:               2026-10-01

### Field rules

- **Product** — exact name as it will appear in `products.csv`.
- **Tag being assigned** — `<field>: <value>`. One tag per template block.
- **Source** — a URL. Never a book title. Never "common knowledge."
- **Evidence** — a direct quote or close paraphrase from the source. Not
  your opinion.
- **Rationale** — why the evidence supports the tag. One sentence.
- **Annotator** — your initials.
- **Date** — ISO format (`YYYY-MM-DD`).

Where these go: `catalog/annotations/NNN-product-slug.md`, one file per
product. The CSV holds the summary; the annotation file holds the full
reasoning.

---

## Ingredient normalization pipeline

Ingredients arrive from Open Beauty Facts in messy form:
`Aqua`, `Water`, `SALICYLIC ACID`, `(Niacinamide)`, etc. Normalization
runs before any matching happens.

The pipeline (`scripts/normalize-ingredients.ts`) runs these steps in
order:

1. **Lowercase** all ingredient strings.
2. **Trim** whitespace, parentheses, and trailing punctuation.
3. **Resolve aliases** via the `aliases` column in
   `catalog/ingredients.csv`. If matched, replace with the canonical
   `ingredient_name`.
4. **Flag unmatched** ingredients — preserved in the record, but they do
   not participate in matching.
5. **Record the unmatched count** per product.
6. If unmatched is more than **30%** of the list, mark `partial_data` and
   auto-cap the allergy factor at `insufficient_data`.

### About that 30%

30% is an MVP engineering heuristic, not a safety boundary. It exists to
prevent silent matching failure on sparse ingredient lists. It is not a
claim that products below the threshold are complete, nor that products
above it are unsafe.

If you're tempted to change the threshold, that's a scope change. Escalate.

---

## Product selection criteria

Not every product belongs in the catalog. The target is 30–50 products
that a young, trend-driven, first-time skincare buyer would realistically
consider.

Criteria:
- Drugstore-accessible, OR
- TikTok-popular, OR
- Creator-recommended.

Source: team picks the product, then looks it up on Open Beauty Facts. If
it's not on OBF, ask before including it — don't source ingredients from
random blogs.

---

## The three-state allergen result

The declared-allergen factor is never binary. It has three states (blueprint
§6.7):

| State | Meaning | UI |
|-------|---------|-----|
| Confirmed conflict | An ingredient matches a declared allergen | Mismatch, "Contains an ingredient you flagged" |
| No identified conflict | List checked; no match found | "No conflict identified in available ingredient data" — never "safe" |
| Insufficient data | List incomplete or unavailable | Caution, "We couldn't fully verify this product's ingredients" |

When annotating, do not collapse these. A product with a partial ingredient
list is *insufficient*, not *no conflict*.

---

## Definition of "verified"

A product is verified when **all** of these are true:

1. Its ingredient list has been retrieved from a named external source.
2. That list has been through the normalization pipeline.
3. Every tag assigned has a recorded source and rationale per the template
   above.

If any is missing, the product is not verified and must not enter the
catalog.

---

## Inter-annotator consistency

For the first **10 products**, both teammates annotate independently
(without seeing each other's work), then compare.

Rules for the comparison:
- If both annotators assigned the same tags with the same rationale: done.
- If they disagree on a tag: **stop** and discuss. The disagreement is
  usually a rule gap, not a judgment difference.
- If the rule gap is real: clarify this document, then re-annotate.
- Do not continue to product 11 until the first 10 are agreed.

After product 10, annotation proceeds solo unless something is ambiguous.

---

## What is NOT allowed

- Inventing ingredient properties.
- Tagging outside the 5-tag vocabulary.
- Sourcing from anywhere other than a named URL.
- Skipping the rationale.
- Adding a product without confirming it with the human first.
- Editing `supabase/seed/*.sql` by hand. Regenerate it.
- Changing the 30% threshold on your own.
- Using "safe" or "suitable for you" in any rationale or tag.

---

## Workflow

Follow `.agents/playbooks/add-product.md` every time.

Summary:
1. Read this document.
2. Pick the product, confirm with the human.
3. Fetch ingredients from Open Beauty Facts.
4. Run normalization.
5. Assign tags, each with the template filled in.
6. Write `catalog/annotations/NNN-product-slug.md`.
7. Run `scripts/validate-catalog.ts`.
8. Run `scripts/seed-catalog.ts` to regenerate SQL.
9. Propose the commit.

---

## Workload expectation

Blueprint §7.8 estimates ~10 hours for 30 products (including the
first-10 cross-check). For 50 products: ~15–16 hours.

This is a planning assumption, not a firm estimate. If it's taking much
longer, stop and tell the human — the rules may need clarifying.