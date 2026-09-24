# Server Testing (pytest)

Conventions for tests in `inference-server/`.

---

## Where tests live

    inference-server/tests/
    ├── test_endpoints.py
    ├── test_preprocess.py
    └── fixtures/
        ├── test_skin_dry.jpg
        ├── test_skin_oily.jpg
        └── ...

One test file per module in `inference-server/`.

---

## Naming

    test_<thing>.py

Test function names:

    def test_<behavior>():
        ...

Examples:
- `test_predict_skin_type_returns_label_and_confidence`
- `test_predict_skin_type_rejects_invalid_input`
- `test_image_not_written_to_disk`

---

## Structure

    def test_something():
        # arrange
        # act
        # assert

Rules:
- Use `pytest` fixtures for shared setup (`client`, `test_image`).
- One assertion per test where possible.
- Test the contract, not the implementation.
- If the endpoint returns JSON, assert on the JSON shape.

---

## What to test

- Every endpoint: happy path, invalid input, missing input.
- Response shape matches the blueprint §5.2 contract:
  `{ label, confidence, model_version }`.
- No image data is written to disk (verify with a filesystem check).
- No image data appears in logs.
- Preprocessing handles common input variations (resize, format).

---

## What NOT to test

- The pretrained model's accuracy on real data — that's an evaluation
  concern (blueprint §5.7), not a unit test.
- The HuggingFace library's behavior.
- GPU vs CPU equivalence.

---

## Model loading in tests

- Tests must not download models. Use a stubbed loader for endpoint tests.
- Real model loading is tested once, manually, before the demo.
- If a test needs a model output, mock the model's `predict` method to
  return a fixed `{ label, confidence }`.

---

## Running tests

    cd inference-server
    pytest
    pytest -v                    # verbose
    pytest tests/test_endpoints.py::test_specific  # single test

---

## Fixtures

- Small test images live in `tests/fixtures/`.
- Keep them under 100KB each.
- Maximum 10 images per class (blueprint §5.7).
- Never commit real user photos.

---

## When a test fails

Same rules as `app-testing.md`:
1. Read the failure completely.
2. Decide: test wrong, or code wrong.
3. Fix the correct one.
4. Never delete or skip a failing test without a written reason.