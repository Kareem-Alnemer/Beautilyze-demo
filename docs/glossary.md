# Glossary

Controlled vocabulary for BeautiLyze. Canonical. If another file uses a
term from this list, it uses this definition.

---

## Product terms

**Verdict** — `match` | `caution` | `mismatch`. The output of the verdict
engine.

**Hard constraint** — A factor that overrides or caps the verdict.
Currently: declared-allergen conflict, sensitivity.

**Compatibility factor** — A factor that combines into the score.
Currently: skin-type fit, acne-concern fit, age fit.

**Declared-allergen ingredient conflict** — A user-declared allergen
matches a normalized product ingredient.

**Insufficient data** — Ingredient list too incomplete to evaluate. Caps
the verdict at `caution`.

**Model score** — Raw softmax output from the AI model. Not calibrated
confidence. Never displayed as a percentage.

**Partial data** — Product flagged when more than 30% of ingredients are
unmatched after normalization.

**Strong active** — One of five flagged ingredients: salicylic acid,
benzoyl peroxide, glycolic acid, retinol, adapalene.

**Barrier support** — One of five flagged ingredients: ceramides,
niacinamide, hyaluronic acid, glycerin, panthenol.

**Verified** — Ingredient list retrieved from a named external source,
normalized, and tagged with recorded source + rationale (blueprint §7.7).

---

## Concern vocabulary (closed — 5 tags only)

**`acne`** — Product claims or is evidenced to address breakouts.

**`oil_control`** — Product targets excess sebum / shine.

**`hydration`** — Product targets moisture retention.

**`dryness`** — Product targets dry / flaky skin.

**`sensitivity`** — Product explicitly formulated for reactive / sensitive
skin.

No other concern tags exist. `anti_aging` was deliberately cut (blueprint
§7.1).

---

## Profile terms

**`user_skin_type`** — The user's skin type, either manually set or
accepted from AI. Values: `dry` | `normal` | `oily`.

**`ai_skin_type`** — The AI's prediction. Never used by the verdict unless
the user accepted it (which writes to `user_skin_type`).

**`user_acne_severity`** — The user's acne severity. Values: `mild` |
`moderate` | `severe`.

**`ai_acne_severity`** — The AI's prediction. Same rule as above.

**Allergies** — User-declared allergens (list of strings).

**Sensitivities** — User-flagged concerns (list of strings).

---

## Forbidden terminology (blueprint §10.2)

Never used in code, docs, UI copy, or commit messages:

| Forbidden | Use instead |
|-----------|-------------|
| Allergy detection | Declared-allergen ingredient matching |
| Allergy conflict | Declared-allergen ingredient conflict |
| Allergic reaction | (Never used) |
| Treatment | Concern fit |
| 73% confident | Model score 0.73 |
| Product is safe | No conflict identified in available ingredient data |
| Suitable for you | Matches the factors BeautiLyze checks |
| Clinically validated | (Never used) |
| Dermatologist approved | (Never used) |

If a phrase from the left column appears anywhere, that's a bug. Fix it.

---

## Agent / repo terms

**Orchestrator** — The AI coding agent. Player-coach: plans, builds, tests,
reports. Does not manage other agents.

**Skill** — A procedure loaded by the agent before a specific task type.
Lives in `.agents/skills/`.

**Playbook** — A step-by-step workflow for a recurring task. Lives in
`.agents/playbooks/`.

**Zone A / B / C** — The agent's autonomy levels. Defined in
`docs/orchestrator/terminal-policy.md`.

**MANUAL_TASK** — A block the agent writes when a step requires a human.
Format in `docs/orchestrator/manual-tasks.md`.

**ADR** — Architecture Decision Record. Entries in `docs/decisions.md`.