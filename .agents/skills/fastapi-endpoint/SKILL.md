---
name: fastapi-endpoint
description: Rules for adding or editing endpoints in the FastAPI inference server
---

# FastAPI Endpoint

Applies when editing `inference-server/main.py`, `routers/`, or `models/`.

## Structure

- One router file per prediction task in `inference-server/routers/`.
- `main.py` only wires routers. No business logic.
- `models/loader.py` is the only place that loads model weights.
  Loaded once at app startup.
- `models/preprocess.py` is the only place that touches pixel arrays.
- `config.py` reads environment variables. No hardcoded paths or secrets.

## Response contract

Every prediction endpoint returns exactly (blueprint §5.2):

    {
      "label": "...",
      "confidence": 0.0,
      "model_version": "..."
    }

No extra fields. No nested objects. No exception.

## Hard rules

- Images are processed in memory. Never written to disk.
- Images are never logged. Never.
- Request logs contain no image data.
- Errors return 4xx with a JSON body, not 5xx with a stack trace.
- Model version is always included in the response.
- Endpoints do not call each other.

## Naming

- Endpoints: `/predict/<thing>` (e.g., `/predict/skin-type`)
- Router files: `snake_case.py`
- Functions: `snake_case`

## Testing

- Test the contract shape for each endpoint.
- Test invalid input.
- Test that no image is written to disk.
- Never test model accuracy in a unit test (that's an evaluation concern).

## When to escalate

- Any new endpoint → confirm the response contract with the human.
- Any change to preprocessing → confirm expected input format.
- Any model change → STOP. This affects the blueprint §5 AI scope.
