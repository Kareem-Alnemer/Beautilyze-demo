# BeautiLyze — Master Project Blueprint

**Version 2.3 (Consolidated)**
**Status:** Ready for supervisor sign-off
**Team:** 2 students · ~8-week capstone
**Purpose of this document:** Single source of truth for the supervisor, the team, and any AI coding assistant working on this project.

---

## Table of Contents

1. Executive Summary
2. Problem & Target User
3. Solution & Positioning
4. Scope (In / Out)
5. AI/ML Scope & Contracts
6. Verdict Engine Specification
7. Catalog & Annotation Methodology
8. Architecture & Tech Stack
9. Data Model
10. Security, Privacy & Disclaimers
11. Acceptance Criteria
12. Test Strategy
13. Risks & Mitigations
14. Timeline & Roadmap
15. Deliverables
16. Appendix A — Glossary
17. Appendix B — Open Questions for Supervisor

---

## 1. Executive Summary

**What it is:** BeautiLyze is a "check before you buy" skincare tool. A user scans their face (or manually enters their profile), searches a specific product in a curated catalog, and gets a **match / caution / mismatch** verdict with a plain-language explanation of *which factors matched and which didn't*.

**Why it matters:** Young, first-time skincare buyers choose products based on TikTok trends and peer recommendations, not research. They have no quick way to check whether a product actually suits their skin before buying. Existing tools (Ulta's skin analysis, INCI Beauty, myAster) either recommend products passively or list ingredients without personalizing.

**What makes it defensible:**
- The verdict is **deterministic and explainable**, not a black-box ML score.
- The AI is an **assistive input** to the profile, not the decision-maker.
- Every catalog tag has a **recorded external source**.
- Product claims are constrained: BeautiLyze says *"matches the factors we check,"* not *"safe"* or *"suitable for you."*

**What it is not:** A diagnostic tool, a medical device, or a replacement for a dermatologist.

---

## 2. Problem & Target User

### 2.1 Problem

Young, first-time skincare buyers make purchase decisions based on trend/popularity (TikTok, friends, hauls) rather than research, and have no quick way to check whether a specific product actually suits their skin before buying it.

### 2.2 Target User

- Age range: roughly 16–25
- New to skincare, low product literacy
- Shops on impulse, influenced by social proof
- Owns a smartphone, comfortable with camera-based apps
- Not looking for a routine — looking for a **single decision check** at the moment of purchase

### 2.3 The Decision Moment

> *"I'm about to buy this product. Will it work for my skin, or am I wasting money?"*

BeautiLyze answers that question, and only that question.

---

## 3. Solution & Positioning

### 3.1 Core Flow

```
[Profile: AI scan or manual] → [Search product] → [Verdict + explanation]
```

### 3.2 Two Paths (both valid)

| Path | Steps | When used |
|------|-------|-----------|
| **Manual** | Set profile manually → check product | Cold start, no scan, or user prefers control |
| **Personalized** | Scan → confirm/override → check product | Default, richer personalization |

Neither path is gated. The user can check a product with manual fields alone.

### 3.3 Differentiation

| Competitor | What they do | What they don't do |
|-----------|-------------|-------------------|
| Ulta Skin Analysis | Passive recommendation feed | No "check this specific product" flow |
| INCI Beauty | Ingredient list + ratings | No personalization to user profile |
| myAster | Skincare advice | No pre-purchase product check |

**BeautiLyze's wedge:** an *impulse-purchase check*, not a recommendation engine.

### 3.4 Product Claims — What We Say vs. What We Don't

| We claim | We do NOT claim |
|----------|----------------|
| "This product matches the factors BeautiLyze checks" | "This product is safe for you" |
| "We identified a conflict with an ingredient you flagged" | "This product will cause an allergic reaction" |
| "The AI estimates your skin type as oily" | "Your skin type is oily" |
| "Deterministic rules applied to sourced data" | "Clinically validated recommendation" |

### 3.5 Deterministic ≠ Clinically Validated

> BeautiLyze is **deterministic in how it applies its rules**. It is **not clinically validated in the conclusions those rules produce**. Given the same profile and the same product data, the system always returns the same verdict — that is a property of the engine. Whether the verdict is medically correct for a given person is a separate, unclaimed property.

This distinction belongs in the report (Ch.1 or Ch.3) and in the supervisor conversation.

---

## 4. Scope (In / Out)

### 4.1 Must-Have

- Basic account/login (Supabase Auth)
- Facial scan → AI skin type + acne severity, with confidence display and per-field manual override
- Manual profile fields: skin type, acne severity, allergies, sensitivities, age
- Curated catalog: 30–50 hand-tagged products
- Core "Check this product" flow with explained verdict
- Verdict screen with per-factor breakdown + disclaimer

### 4.2 Should-Have (time-permitting)

- Check/scan history
- Short onboarding flow
- "Popular picks" home section (editorially selected, not live-trending)

### 4.3 Explicitly Cut

- Real affiliate implementation
- Barcode / OCR scanning
- Acne scars and enlarged-pore detection
- Progress tracking
- Push notifications
- Social sharing
- Formal WCAG compliance audit
- ML in the verdict layer (deliberate — see §5.6)

---

## 5. AI/ML Scope & Contracts

### 5.1 Two Models

| Model | Classes | Source | Published accuracy |
|-------|---------|--------|-------------------|
| Skin type | dry / normal / oily | Public Kaggle dataset | ~60–65% |
| Acne severity | mild / moderate / severe | ACNE04 academic dataset | ~70–75% |

**Strategy:** start from a fine-tuned public model and adapt. Not trained from zero. This is a deliberate, legitimate methodology choice for an 8-week capstone.

### 5.2 AI Output Contract

Every prediction returns:

```json
{
  "label": "oily",
  "confidence": 0.73,
  "model_version": "dima806/skin_types_image_detection"
}
```

- Confidence is the model's raw softmax output.
- **We do not claim the confidence is calibrated.** "Model score 0.73" ≠ "73% probability of being correct."

### 5.3 Per-Field Parallel Contracts

Skin type and acne severity are **independent inputs**. Correcting one must not silently change the other.

| Field | AI field | User field | Verdict uses |
|-------|----------|-----------|--------------|
| Skin type | `ai_skin_type` | `user_skin_type` | `user_skin_type` |
| Acne severity | `ai_acne_severity` | `user_acne_severity` | `user_acne_severity` |

Each carries its own confidence score. Each is evaluated against the threshold independently.

### 5.4 Confidence Threshold & UI Behavior

**Threshold: 0.60.** This is an **application-level UX threshold**, not a statistically validated confidence boundary.

| Confidence | UI |
|------------|-----|
| ≥ 0.60 | "AI estimates: Oily — model score 0.73. [Looks right] [Change]" |
| < 0.60 | "The model was uncertain about this scan. AI estimates: Oily. [Accept] [Set manually]" |
| Scan failed / no face | "We couldn't read the photo. [Retake] [Set manually]" |

### 5.5 Manual Path (Cold Start & Fallback)

The profile edit screen allows direct entry of **all fields** — skin type, acne severity, allergies, sensitivities, age. No field is gated behind the scan.

### 5.6 No ML in the Verdict Layer

> The matching engine is deliberately **not** an ML model. Its value derives from being deterministic, inspectable, and sourced. Adding ML to the verdict layer would weaken the project's strongest defensibility: that every verdict can be traced to a rule, a user attribute, and a sourced product attribute.

### 5.7 AI Evaluation Protocol

For the report and defense:

- **Model provenance:** pretrained model name, source, published accuracy
- **Our own validation set:** 10–20 images per class, held out from any fine-tuning
- **Metrics reported:** accuracy + confusion matrix on our validation set
- **Two separate figures:** published model accuracy vs. our validation accuracy — not blended
- **Known failure modes:** lighting variation, occlusion, underrepresented skin tones in source datasets

---

## 6. Verdict Engine Specification

### 6.1 Inputs

**User profile:**
- `user_skin_type`: dry / normal / oily
- `user_acne_severity`: mild / moderate / severe
- `allergies`: list of declared allergens
- `sensitivities`: list of user-flagged concerns
- `age`: integer

**Product record:**
- `ingredients`: normalized ingredient list
- `skin_type_tags`: which skin types this product suits
- `concern_tags`: from closed vocabulary (§7.1)
- `ingredient_flags`: derived from ingredient lookup table (§7.2)
- `age_notes`: optional

### 6.2 Factors — Five Total, Two Categories

| Category | Factors | Role |
|----------|---------|------|
| **Hard constraints** | Declared-allergen conflict, Sensitivity | Override / cap verdict |
| **Compatibility factors** | Skin-type fit, Acne-concern fit, Age fit | Combine into aggregate |

### 6.3 Factor Evaluation States

Each factor returns one of: **pass / caution / fail / insufficient_data**.

| Factor | Pass | Caution | Fail | Insufficient data |
|--------|------|---------|------|-------------------|
| **Declared-allergen conflict** | No ingredient matches a declared allergen | — | An ingredient matches a declared allergen | Ingredient list incomplete |
| **Sensitivity** | No flagged sensitivity ingredient present | A flagged sensitivity ingredient is present (not an allergy) | — | Ingredient list incomplete |
| **Skin-type fit** | Product tagged suitable for user's skin type | Product neutral | Product tagged unsuitable | Skin type not set |
| **Acne-concern fit** | See §6.4 | Product neutral | Product tagged as potentially aggravating | Acne severity not set |
| **Age fit** | No age note, or user within range | Mild age note | Strong age restriction user falls outside | Age not set |

### 6.4 Acne-Concern Fit Mapping

| `user_acne_severity` | Concern evaluated | Relevant if… |
|----------------------|-------------------|--------------|
| mild | Acne-related concern fit | `concern_tags` contains `acne` **or** `oil_control` |
| moderate | Acne-related concern fit | `concern_tags` contains `acne` **and** ≥1 ingredient flagged `helps_with: acne` |
| severe | Acne-related concern fit, strict | Same as moderate, **and** product has ≥1 `strong_active` ingredient **and** ≥1 `barrier_support` ingredient |

**`strong_actives` (lookup table set):** salicylic acid, benzoyl peroxide, glycolic acid, retinol, adapalene
**`barrier_support` (lookup table set):** ceramides, niacinamide, hyaluronic acid, glycerin, panthenol

> If either set is unavailable due to incomplete ingredient data, the severe rule degrades to the moderate rule, and the verdict caps at caution.

### 6.5 Precedence Rule (Deterministic)

```
1. If declared_allergen_conflict == FAIL          → verdict = MISMATCH
2. Else if declared_allergen_conflict == INSUFFICIENT → verdict = CAUTION
   (with explicit "couldn't fully verify" warning)
3. Else if sensitivity == FAIL                    → verdict = MISMATCH
4. Else if sensitivity == CAUTION                 → verdict = CAUTION (cannot upgrade)
5. Else compute pass count across
   {skin_type_fit, acne_fit, age_fit}:
      3 pass → MATCH
      2 pass → CAUTION
      0–1 pass → MISMATCH
   Factors in INSUFFICIENT state count as neither pass nor fail,
   but their presence caps the verdict at CAUTION.
6. Final verdict is the OUTPUT.
   Displayed score is DERIVED FROM the verdict, not used to determine it.
```

### 6.6 Score Display

The score counts **compatibility factors only** (3 total). Hard constraints are shown separately.

**UI shows:** *"2 of 3 compatibility factors matched. 1 hard constraint flagged."*

### 6.7 Declared-Allergen Conflict — Three States

| State | Meaning | UI |
|-------|---------|-----|
| Confirmed conflict | An ingredient matches a declared allergen | Mismatch, red, "Contains an ingredient you flagged" |
| No identified conflict | List checked; no match found | Neutral: *"No conflict identified in available ingredient data"* — never *"safe"* |
| Insufficient data | List incomplete or unavailable | Caution, "We couldn't fully verify this product's ingredients" |

### 6.8 Verdict Output Contract

```json
{
  "verdict": "match" | "caution" | "mismatch",
  "score": {
    "label": "Compatibility factors",
    "passed": 2,
    "total": 3
  },
  "hard_constraints": [
    { "name": "declared_allergen_conflict", "result": "pass" },
    { "name": "sensitivity", "result": "caution" }
  ],
  "compatibility_factors": [
    { "name": "skin_type_fit", "result": "pass", "reason": "..." },
    { "name": "acne_fit", "result": "caution", "reason": "..." },
    { "name": "age_fit", "result": "pass", "reason": "..." }
  ],
  "summary": "One sentence in plain language.",
  "disclaimer_shown": true
}
```

**Each `reason` field must name:**
1. The user attribute that triggered the rule
2. The product/ingredient attribute that triggered the rule
3. The rule that connected them

---

## 7. Catalog & Annotation Methodology

### 7.1 Closed Concern Vocabulary (5 Tags)

| Tag | Definition |
|-----|-----------|
| `acne` | Product claims or is evidenced to address breakouts |
| `oil_control` | Product targets excess sebum / shine |
| `hydration` | Product targets moisture retention |
| `dryness` | Product targets dry / flaky skin |
| `sensitivity` | Product explicitly formulated for reactive/sensitive skin |

Products outside this list get no concern tag. `anti_aging` was deliberately cut — it complicates the catalog for a young user base and adds no value to the core demo.

### 7.2 Ingredient-to-Concern Lookup Table

**Scope:** ~20–30 ingredients + the `strong_actives` and `barrier_support` sets (§6.4).

**Structure (Supabase table `ingredient_concerns`):**

| Field | Type | Example |
|-------|------|---------|
| `ingredient_name` | text | "salicylic acid" |
| `aliases` | text[] | ["BHA", "beta hydroxy acid"] |
| `helps_with` | text[] | ["oily", "acne"] |
| `caution_for` | text[] | ["dry", "sensitive"] |
| `is_common_allergen` | boolean | false |
| `is_sensitivity_flag` | boolean | true |
| `is_strong_active` | boolean | true |
| `is_barrier_support` | boolean | false |
| `reason` | text | "Exfoliant — effective for acne, can over-dry dry or sensitive skin" |
| `source` | text | "INCIDecoder; INCI Beauty" |

**Rule:** every entry cites a source. We do not invent ingredient properties.

### 7.3 Product Selection

- **Count:** 30–50 products
- **Criteria:** products a young, trend-driven first-time buyer would realistically consider — drugstore-accessible, TikTok-popular, or creator-recommended
- **Source:** manually chosen by team, then looked up on Open Beauty Facts

### 7.4 Data Provenance — Source vs. Annotation

| Layer | Source | Trust level |
|-------|--------|-------------|
| Product identity | Open Beauty Facts | Source data |
| Ingredient list | Open Beauty Facts | Source data, *may be incomplete* |
| Skin-type suitability tag | Team-annotated | Team judgment, sourced (§7.5) |
| Concern tags | Team-annotated | Team judgment, sourced |
| Sensitivity / allergen flags | Derived from lookup table | Rule-derived from sourced data |
| Age notes | Team-annotated | Team judgment, sourced |

### 7.5 Ingredient Normalization Pipeline

Product ingredient strings arrive messy (`Aqua`, `Water`, `SALICYLIC ACID`, etc.). Normalization runs before any matching:

1. **Lowercase** all ingredient strings
2. **Trim** whitespace, parentheses, trailing punctuation
3. **Resolve aliases** via the `aliases` column — if matched, replace with canonical `ingredient_name`
4. **Flag unmatched ingredients** — preserved in the record, do not participate in matching
5. **Record unmatched count** per product
6. If unmatched > **30%** of the list → mark `partial_data` and auto-cap allergy factor at `insufficient_data`

> **30% is an MVP engineering heuristic, not a safety boundary.** It exists to prevent silent matching failure on sparse ingredient lists. It is not a claim that products below the threshold are complete, nor that products above it are unsafe.

### 7.6 Annotation Template

Every tag recorded using the same fixed template. Both annotators use it. Disagreements resolved by discussion before the product enters the catalog.

| Field | Example |
|-------|---------|
| Product | CeraVe Foaming Facial Cleanser |
| Tag being assigned | `skin_type_suitability: oily` |
| Source | INCI Beauty product page (URL) |
| Evidence | "Brand describes as for normal-to-oily skin; contains niacinamide and ceramides" |
| Rationale | "Explicit brand positioning + ingredient profile consistent with oily-skin suitability" |
| Annotator | [initials] |
| Date | YYYY-MM-DD |

**Inter-annotator consistency:** for the first 10 products, both teammates tag independently and compare. Any disagreement triggers a rule clarification before continuing.

### 7.7 Definition of "Verified"

> **Verified** means: the ingredient list has been retrieved from a named external source, has been through the normalization pipeline (§7.5), and any tag assigned has a recorded source and rationale per §7.6.

### 7.8 Catalog Workload Estimate

| Task | Per product | For 30 products |
|------|-------------|-----------------|
| Retrieve + normalize ingredients | ~5 min | 2.5 hrs |
| Alias resolution, unmatched count | ~3 min | 1.5 hrs |
| Skin-type tag + source | ~3 min | 1.5 hrs |
| Concern tag + source | ~3 min | 1.5 hrs |
| Age note (where applicable) | ~2 min | 0.5 hrs |
| Rationale + annotator + date | ~2 min | 1 hr |
| **Subtotal** | | **~8.5 hrs** |
| First-10 independent comparison | | 1.5 hrs |
| **Total** | | **~10 hrs for 30 products** |

For 50 products: ~15–16 hrs. This is a **planning assumption**, not a firm estimate.

---

## 8. Architecture & Tech Stack

### 8.1 Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React Native + Expo | No Android Studio / Xcode required; JS/TS overlap with prior learning |
| Backend / Auth / DB | Supabase (free tier) | One stack for auth, Postgres, storage, RLS |
| AI inference | FastAPI + pretrained HuggingFace model | Server-side; simple; avoids Expo/TF.js known failures |
| Hosting (demo) | Local FastAPI + Supabase cloud | Zero cost, predictable demo |

### 8.2 System Diagram

```
[React Native App]
     │
     ├── HTTPS upload photo ──► [FastAPI inference server]
     │                                │
     │                                ├── loads pretrained model
     │                                ├── returns { label, confidence }
     │                                └── discards image
     │
     ├── reads/writes profile ──► [Supabase Postgres + Auth + RLS]
     │
     └── reads catalog + verdict ──► [Supabase]
```

### 8.3 Inference Flow

1. App captures photo → base64 or multipart
2. POST to FastAPI `/predict/skin-type` and `/predict/acne-severity`
3. FastAPI runs preprocessing + model → returns label + confidence
4. Image discarded immediately after response
5. App stores only `ai_skin_type`, `ai_acne_severity`, confidence scores, `model_version`

### 8.4 Photo Processing & Privacy

- Uploaded over HTTPS
- Held in memory for inference only
- **Not written to disk**
- **Not logged**
- Only derived results written to Supabase, scoped to the user
- Request logs contain no image data

### 8.5 Data Retention

| Data | Stored? | Where | Deleted on account deletion? |
|------|---------|-------|------------------------------|
| Face photo | No | — | N/A |
| AI prediction + confidence | Yes | Supabase, user-scoped | Yes |
| User-corrected profile | Yes | Supabase, user-scoped | Yes |
| Check history (if implemented) | Yes | Supabase, user-scoped | Yes |
| Account credentials | Yes | Supabase Auth | Yes |

### 8.6 Authentication & Authorization

- Supabase Auth for account creation and login
- **Row-Level Security enabled on every user-data table**
- Policy pattern: `user_id = auth.uid()` for select/insert/update/delete
- No user can read another user's profile, scan results, or history
- Service-role keys never ship in the client

### 8.7 Accessibility (Basic)

Designed with readable contrast (WCAG AA target for text) and adequate tap targets (≥44px). No formal WCAG audit for MVP.

---

## 9. Data Model

### 9.1 Tables (Supabase Postgres)

**`profiles`**
| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid | FK to auth.users |
| `ai_skin_type` | text | nullable |
| `user_skin_type` | text | nullable |
| `ai_acne_severity` | text | nullable |
| `user_acne_severity` | text | nullable |
| `skin_type_confidence` | numeric | nullable |
| `acne_severity_confidence` | numeric | nullable |
| `model_version` | text | nullable |
| `age` | int | nullable |
| `created_at`, `updated_at` | timestamptz | |

**`allergies`**
| Column | Type |
|--------|------|
| `id` | uuid |
| `user_id` | uuid |
| `allergen` | text |

**`sensitivities`**
| Column | Type |
|--------|------|
| `id` | uuid |
| `user_id` | uuid |
| `sensitivity` | text |

**`ingredient_concerns`** — see §7.2

**`products`**
| Column | Type |
|--------|------|
| `id` | uuid |
| `name` | text |
| `brand` | text |
| `ingredients_raw` | text |
| `ingredients_normalized` | text[] |
| `unmatched_count` | int |
| `partial_data` | boolean |
| `skin_type_tags` | text[] |
| `concern_tags` | text[] |
| `age_notes` | text |
| `annotation_source` | text |
| `annotation_rationale` | text |
| `annotator` | text |
| `annotated_at` | timestamptz |

**`checks`** (history, if implemented)
| Column | Type |
|--------|------|
| `id` | uuid |
| `user_id` | uuid |
| `product_id` | uuid |
| `verdict` | text |
| `factors_json` | jsonb |
| `created_at` | timestamptz |

All user-scoped tables have RLS policy `user_id = auth.uid()`.

---

## 10. Security, Privacy & Disclaimers

### 10.1 Disclaimers — Shown on Verdict Screen

> **BeautiLyze is a compatibility-checking tool, not a diagnostic or medical device.** It does not replace a dermatologist or professional skincare advice. Verdicts are based on the product information available in our catalog and the profile you provide (AI-estimated or manually set). **Allergies are checked against the ingredient list we have; if we don't have a complete ingredient list, absence of a detected conflict does not mean a product is safe for you.** If you have a known allergy, always check the physical product label before use.

### 10.2 Terminology Discipline

| Avoid | Use |
|-------|-----|
| "Allergy detection" | "Declared-allergen ingredient matching" |
| "Allergy conflict" | "Declared-allergen ingredient conflict" |
| "Treatment" | "Concern fit" |
| "73% confident" | "Model score 0.73" |
| "Product is safe" | "No conflict identified in available ingredient data" |
| "Product suitable for you" | "Product matches the factors BeautiLyze checks" |

---

## 11. Acceptance Criteria

MVP is "complete" when all of the following are demonstrably true:

**Auth & profile**
- [ ] User can create an account and log in
- [ ] User can set all profile fields manually without scanning
- [ ] User can scan and receive AI predictions with confidence
- [ ] User can override skin type and acne severity independently
- [ ] Verdict uses `user_*` values, not raw AI values
- [ ] User can add allergies and sensitivities

**Catalog**
- [ ] Catalog contains ≥30 verified products
- [ ] Each product's tags have a recorded source and rationale
- [ ] Ingredient normalization pipeline runs on import
- [ ] Products with >30% unmatched ingredients are flagged

**Check flow**
- [ ] User can search a catalog product and receive a verdict
- [ ] Verdict includes per-factor breakdown with reasons
- [ ] Declared-allergen conflict produces MISMATCH
- [ ] Insufficient ingredient data produces CAUTION, never MATCH
- [ ] Same inputs always produce the same verdict (deterministic)
- [ ] Score reflects compatibility factors only (out of 3)

**Scan handling**
- [ ] Below-threshold confidence shows the "not sure" UI
- [ ] Unreadable photo shows the "retake" UI
- [ ] No photo is stored on disk or in logs

**Security**
- [ ] RLS prevents cross-user access to profile and history

**Content**
- [ ] Disclaimer visible on verdict screen

---

## 12. Test Strategy

The matching engine is deterministic — cheap to test. Required cases:

| # | Case | Expected |
|---|------|----------|
| 1 | All factors pass | MATCH |
| 2 | Declared-allergen conflict | MISMATCH (overrides all) |
| 3 | Sensitivity conflict only | CAUTION |
| 4 | Skin-type mismatch, all else pass | Depends on pass count → CAUTION or MISMATCH |
| 5 | Insufficient ingredient data | CAUTION, never MATCH |
| 6 | Missing user skin type | Factor = insufficient, verdict capped at CAUTION |
| 7 | Missing user age | Same |
| 8 | Manual profile vs AI profile (same values) | Same verdict |
| 9 | AI profile with user override | Verdict uses override |
| 10 | Product not in catalog | "Not checked yet" state |
| 11 | Acne severity severe, no strong_actives | Degrades to moderate rule |
| 12 | Acne severity severe, strong_actives + barrier_support present | Strict rule applies |

These become the automated test suite for the verdict module.

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Verdict credibility challenged ("students decided") | High | High | Documented annotation methodology (§7) with per-product sources |
| Model accuracy challenged | High | Medium | AI is assistive, not determinative (§5); user override always available |
| Declared-allergen false negative | Medium | High | Three-state result (§6.7); explicit "not verified" wording; disclaimer |
| Scope creep | Medium | Medium | Acceptance criteria (§11) as gate |
| Catalog tagging takes longer than expected | High | Medium | ~10 hr estimate for 30 products (§7.8); cut to 30 if needed |
| Timeline (8 weeks, 2 people) | Medium | High | Weekly 15-min check-ins; milestone-based |
| Supervisor rejection of direction | Low | High | Sign-off before build |
| Expo/TF.js incompatibility | High | High | Avoided by server-side inference (§8.1) |
| Severe-acne rule degrades on incomplete data | Low | Low | Falls back to moderate rule + caution cap (§6.4) |

---

## 14. Timeline & Roadmap

**Duration:** ~8 weeks
**Team:** 2 active members
**Check-ins:** weekly, 15 minutes
**Milestones:** 2–3 major, tracked against weekly check-ins

### Proposed Sequence

| Week | Focus |
|------|-------|
| 1 | Supervisor sign-off · catalog sourcing starts · Supabase + Expo scaffolding |
| 2 | Catalog annotation (first 10 with cross-check) · verdict engine spec → code |
| 3 | Verdict engine + tests · profile CRUD |
| 4 | FastAPI inference server · model integration |
| 5 | Scan flow in app · manual override UI |
| 6 | Verdict UI · disclaimer · error states |
| 7 | End-to-end demo path · report chapters |
| 8 | Presentation deck · buffer · final demo rehearsal |

*Deadline confirmation is pending in the sign-off email.*

---

## 15. Deliverables

- Working demo (running locally + Supabase cloud)
- Updated report chapters:
  - Ch.1 — Introduction / Objectives
  - Ch.3 — Methodology
  - Ch.4 — SRS
  - Ch.5 — Design
- Presentation deck

---

## Appendix A — Glossary

| Term | Meaning |
|------|---------|
| **Verdict** | match / caution / mismatch |
| **Hard constraint** | Factor that overrides or caps the verdict (allergy, sensitivity) |
| **Compatibility factor** | Factor that combines into the score (skin type, acne, age) |
| **Declared-allergen ingredient conflict** | A user-declared allergen matches a normalized product ingredient |
| **Insufficient data** | Ingredient list too incomplete to evaluate |
| **Model score** | Raw softmax output from the AI model; not calibrated confidence |
| **Partial data** | Product flagged when >30% of ingredients are unmatched |
| **Strong active** | One of 5 flagged ingredients (salicylic acid, benzoyl peroxide, glycolic acid, retinol, adapalene) |
| **Barrier support** | One of 5 flagged ingredients (ceramides, niacinamide, hyaluronic acid, glycerin, panthenol) |

---

## Appendix B — Open Questions for Supervisor

1. **Deadline confirmation** — the doc references an ~8-week window, but the exact due date is not finalized. Confirm in the sign-off email.
2. **Data privacy acknowledgment** — server-side photo processing with immediate discard is the chosen approach. Confirm this is acceptable for the capstone's data-handling expectations.
3. **Scope lock** — confirm v2.3 is the frozen scope, and any additions require a re-plan.

---

**End of Blueprint — v2.3**

This document is the canonical specification. Any code, report chapter, or presentation should trace back to the sections here.