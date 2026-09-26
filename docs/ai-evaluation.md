# AI Evaluation — Methodology & Status (Blueprint §5.7)

The AI assists the profile; it never decides the verdict. This document
defines how its accuracy is measured, what the confidence numbers mean,
and what is still unmeasured. Numbers appear here only after a real
validation run. Placeholders say so explicitly.

## 1. Canonical class sets (Blueprint §5.1)

| Model | Classes | Count |
|-------|---------|-------|
| Skin type | `dry` / `normal` / `oily` | 3 |
| Acne severity | `mild` / `moderate` / `severe` | 3 |

There is no fourth class. Any dataset, prompt, or UI text mentioning
`clear` (or any other label) contradicts the blueprint and must be fixed,
not accommodated.

## 2. Model provenance

| Item | Value |
|------|-------|
| Serving modes | `mock` / `pytorch` / `onnx` (env `MODEL_MODE`) |
| Current deployed default | `mock-v1` (deterministic MockModel for pipeline development) |
| Strategy | Fine-tune a public pretrained model, not train from zero (§5.1) |
| Published accuracy (literature) | Skin type ~60–65% (Kaggle source); acne ~70–75% (ACNE04) |
| Our validation accuracy | [PENDING REAL VALIDATION RUN] |

Published and measured figures are reported separately and never blended.

## 3. AI output contract (§5.2)

Every prediction returns `{ label, confidence, model_version }`.
Confidence is the raw softmax score. **It is not calibrated**: a model
score of 0.73 is not a 73% probability of being correct, and no UI text
may phrase it that way (see terminology, §6).

## 4. Validation protocol (to be executed)

- **Held-out set:** 10–20 images per class, excluded from any fine-tuning.
- **Metrics:** accuracy + confusion matrix per model (primary). Per-class
  precision/recall are read off the same matrices.
- **Two figures:** published model accuracy vs. our validation accuracy.
- **Results:** [PENDING REAL VALIDATION RUN]

### Skin-type confusion matrix (rows = true, columns = predicted)

| | dry | normal | oily |
|---|---|---|---|
| dry | [PENDING] | [PENDING] | [PENDING] |
| normal | [PENDING] | [PENDING] | [PENDING] |
| oily | [PENDING] | [PENDING] | [PENDING] |

### Acne-severity confusion matrix

| | mild | moderate | severe |
|---|---|---|---|
| mild | [PENDING] | [PENDING] | [PENDING] |
| moderate | [PENDING] | [PENDING] | [PENDING] |
| severe | [PENDING] | [PENDING] | [PENDING] |

## 5. Confidence threshold & fallback contract (§5.4, §5.3)

Threshold **0.60** is an application UX threshold, not a statistical boundary.

| Condition | UI behavior |
|---|---|
| Score ≥ 0.60 | "AI estimates: X — model score 0.XX. [Looks right] [Change]" |
| Score < 0.60 | "The model was uncertain about this scan…" with [Accept] [Set manually] |
| Scan failed / no face | "We couldn't read the photo. [Retake] [Set manually]" |

Skin type and acne severity are independent inputs: each carries its own
score, each is judged against 0.60 independently, and correcting one
never changes the other. The verdict consumes only `user_*` values.

## 6. Known failure modes (to confirm on the validation set)

From §5.7, plus definitions of what counts as each:

- **Lighting variation:** harsh side light or deep shadow shifting apparent
  oiliness or redness. Counts when a re-shoot in diffuse daylight flips
  the label.
- **Occlusion:** hair, hands, glasses covering cheeks/forehead. Counts
  when >~25% of the facial oval is covered.
- **Underrepresented skin tones:** source datasets skew light; errors
  concentrated on deeper tones count here even if lighting is good.
- **Heavy makeup / filters:** treated as occlusion of natural texture.
- **Motion blur / low resolution:** face bounding box under ~200px counts.

Each validation image failing for one of these reasons is tagged with the
reason; the defense reports error rate with and without flagged images.

## 7. Privacy during evaluation

Evaluation images are handled exactly like production scans: HTTPS,
in-memory inference only, never written to disk, never logged, only
`{ label, confidence, model_version }` retained. The `/analyze` endpoint
persists nothing; the app persists only derived results. See Gate 4.

## 8. Status & next step

Methodology is locked by this document. Empirical content (matrices,
accuracy, failure-mode tags) is [PENDING REAL VALIDATION RUN]: assemble
the held-out set, run inference in `pytorch`/`onnx` mode, and fill §4 in
place — never in a separate "target" table.
