# Inference Server

FastAPI service for AI prediction. Handles the scan path only.

## What it does

- Receives a photo.
- Runs one of two pretrained models.
- Returns `{ label, confidence, model_version }`.
- Discards the photo immediately.

It does **not**:
- Store the photo.
- Log the photo.
- Decide anything about the verdict.
- Touch the database.

The verdict engine lives in the app. This server is a prediction service,
nothing else.

## Endpoints

| Path | Method | Purpose |
|------|--------|---------|
| `/predict/skin-type` | POST | Returns `{ label, confidence, model_version }` for skin type |
| `/predict/acne-severity` | POST | Returns same shape for acne severity |

Response contract is fixed by blueprint §5.2. No extra fields.

## Stack

- Python 3.11+
- FastAPI
- `uv` for dependency management (`pyproject.toml`)
- HuggingFace `transformers` for model loading
- Pretrained models per blueprint §5.1

## Setup

    cd inference-server
    uv sync

## Run

    uv run uvicorn main:app --reload

Server listens on `http://127.0.0.1:8000` by default. Override with
`--host` and `--port`.

## Test

    uv run pytest

## Structure

- `main.py` — FastAPI app entrypoint. Wires routers only.
- `config.py` — reads env vars. No hardcoded paths or secrets.
- `models/loader.py` — loads pretrained models. Loaded once at startup.
- `models/preprocess.py` — the only place that touches pixel arrays.
- `routers/` — one router per prediction task.
- `tests/` — pytest. Fixtures in `tests/fixtures/`.

## Privacy commitments (blueprint §8.4)

- Photos are held in memory only.
- Photos are never written to disk.
- Photos are never logged.
- Request logs contain no image data.
- Only derived results are returned to the app.

If any change would violate these, STOP and escalate.

## What this server does NOT do

- Verdict computation. That's in the app (`app/src/verdict/`).
- Database access.
- Authentication. The app handles auth via Supabase.
- Image storage.
- Batch processing.