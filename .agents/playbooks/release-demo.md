---
name: add-endpoint
description: Step-by-step for adding a new endpoint to the FastAPI inference server
---

# Playbook — Add an Endpoint

Use this every time an endpoint is added to `inference-server/`.

## Preconditions

- The endpoint is listed in `docs/blueprint.md` §5 or §8.
- The response contract is defined (blueprint §5.2).
- The human has confirmed the model to use.

## Steps

### 1. Confirm the contract
Before writing code, write down:
- Path (e.g., `/predict/skin-type`)
- Method (POST)
- Request shape
- Response shape — must match `{ label, confidence, model_version }`

Get the human to confirm.

### 2. Create the test first
Create `inference-server/tests/test_<endpoint>.py` with:
- Happy path returns the correct shape
- Invalid input returns 4xx
- Missing input returns 4xx

Confirm they fail.

### 3. Write the router
Create `inference-server/routers/<endpoint>.py`:
- One router per task
- No business logic beyond the endpoint's responsibility
- No direct model loading (uses `models/loader.py`)
- No direct preprocessing (uses `models/preprocess.py`)

### 4. Wire the router
Update `inference-server/main.py` to include the new router. Nothing else
changes in `main.py`.

### 5. Test image handling
If the endpoint takes an image, verify:
- The image is processed in memory only.
- The image is not written to disk.
- The image is not logged.

Add a test that asserts these.

### 6. Run all tests
All existing tests must pass. All new tests must pass.

### 7. Propose the commit
Write the proposed commit to
`.agent-state/pending-commits/feat-endpoint-<slug>.md`.

## What NOT to do

- Do not deviate from the response contract.
- Do not write images to disk.
- Do not log image data.
- Do not call one endpoint from another.
- Do not load models outside `loader.py`.
- Do not return 5xx for user input errors.

## Escalate if

- The model choice is unclear → STOP.
- The response contract needs a new field → STOP.
- A test requires the real model → propose a mock strategy.