# Held-Out Model Evaluation

Blueprint [5.7](../blueprint.md#57-ai-evaluation-protocol) requires actual accuracy
and a confusion matrix, separately for each model. No measured accuracy is
available from this enhancement pass. The supplied sample-images path was absent
and the endpoint/account details were placeholders. Do not publish unit-fixture
metrics as model quality.

## Required Evidence

Use an authorized, labeled dataset with 10-20 held-out images per class, separate
from training and model selection. The team must document provenance, consent or
license, labeling procedure, model checkpoint/version, preprocessing, and known
coverage limits. Keep face images out of this repository and out of logs.
This tooling neither downloads nor copies images.

Run the actual model on that dataset using the reviewed inference pipeline.
Record one row for every sample, including mistakes; do not remove difficult
examples. Failed inference must be counted and reported separately with the
total attempted sample count. Accuracy among successful predictions alone must
not be presented as overall pipeline accuracy.

## Label-Only Metrics

Export a CSV with these columns:

```csv
sample_id,model,model_version,true_label,predicted_label,held_out
```

`sample_id` is a non-identifying stable ID, never a person's name or photo path.
`model` is `skin_type` or `acne_severity`; labels follow blueprint 5.1. Use the
actual model version and `true` only when held-out status has been verified.
Do not add fabricated example prediction rows to the report.

From the repository root, after the approved data file exists:

```powershell
node scripts/evaluate-predictions.mjs <path-to-label-only-predictions.csv>
```

Replace the angle-bracket argument with the real CSV path. Output is aggregate
JSON: sample counts, correct count, accuracy (correct / total), and confusion
matrix. Rows are true classes; columns are predictions in the printed label
order. The command does not contact a service or write an image. It rejects
mock versions, duplicate samples, mixed versions, unknown labels, and fewer
than ten samples per class. Declaring held-out status is not proof of it.

The metrics unit tests need no dataset or server:

```powershell
node --test scripts/evaluate-predictions.test.mjs
```

## Release Gate

Report published source-model accuracy separately from your measured results.
Include inference failures, dataset size, class distribution, limitations, and
checkpoint identity. Never present a softmax score as measured accuracy or claim
clinical validation. No result is approved until the team can trace each count
to a real held-out prediction.
