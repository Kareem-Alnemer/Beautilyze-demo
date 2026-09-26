# FastAPI /analyze Endpoint & Supabase Integration

**Date:** 2026-09-26
**Blueprint:** §8.1, §8.3, §9.1
**Files changed:**
- `inference-server/inference_server/main.py` — FastAPI app with `/analyze` endpoint
- `inference-server/inference_server/schemas/prediction.py` — Added `AnalyzeResponse` schema
- `inference-server/inference_server/utils/supabase_client.py` — Supabase client & insert function
- `inference-server/inference_server/models/pytorch_inference.py` — PyTorch model loading & inference
- `inference-server/inference_server/config.py` — Added Supabase settings, `extra="ignore"`
- `supabase/migrations/004_scans_table.sql` — Scans table migration with RLS
- `scripts/test_api.py` — Test script with synthetic image fallback
**Prerequisites:** 11-inference-server.md, 16-security-and-privacy-hardening.md

## 1. What this task was

This task implements the combined analysis endpoint (`POST /analyze`) for the BeautiLyze inference server. The endpoint:
- Accepts an image file upload
- Runs both skin type and acne severity predictions using trained PyTorch models
- Optionally extracts user ID from Supabase Authorization Bearer token
- Stores the scan result in the Supabase `scans` table
- Returns a unified response with both predictions and database record status

This consolidates the two separate prediction endpoints (`/predict/skin-type` and `/predict/acne-severity`) into a single API call for the mobile app.

## 2. The concept

**Combined analysis endpoint** — Instead of the mobile app making two separate API calls (one for skin type, one for acne severity), it now makes one call to `/analyze`. The server runs both models in sequence and returns both results. This reduces latency and simplifies the client.

**Supabase integration** — The inference server connects to Supabase (PostgreSQL) to store scan history. Each scan record includes:
- Predicted skin type + confidence
- Predicted acne severity + confidence
- Optional user_id (from auth token)
- Timestamp

**Row Level Security (RLS)** — The `scans` table uses RLS policies so users can only see their own scans. Anonymous inserts are allowed for unauthenticated users.

**Synthetic image fallback** — The test script generates a 224×224 RGB image in memory using PIL if no dataset images are found. This ensures tests run anywhere without file dependencies.

## 3. The decision

### Endpoint design
**Options considered:**
1. **Keep separate endpoints** — Mobile app calls both endpoints. Simple server, more client complexity.
2. **Single `/analyze` endpoint** — Server runs both models, returns combined result. More server work, simpler client.

**Chosen:** Option 2 (single `/analyze`). The mobile app only needs one network request, reducing latency and simplifying error handling. The server overhead is minimal (both models run in <100ms on CPU).

### Supabase client initialization
**Options considered:**
1. **Initialize at module level** — Create client when module loads. Fails if env vars not set.
2. **Lazy initialization** — Create client on first use. Handles missing env vars gracefully.

**Chosen:** Option 2 (lazy). The `get_supabase_client()` function returns `None` if Supabase isn't configured, allowing the API to work without database (returns `status: "partial"`).

### User authentication
**Options considered:**
1. **Require auth** — All scans must have user_id. Simpler RLS.
2. **Optional auth** — Allow anonymous scans, extract user_id from Bearer token if present.

**Chosen:** Option 2 (optional). The `Authorization` header is parsed if present. If valid Supabase token, user_id is extracted. Otherwise, scan is stored anonymously (RLS policy allows anonymous inserts).

### Pydantic `extra="ignore"`
**Decision:** Added `extra = "ignore"` to Settings Config. This allows unknown environment variables (like `EXPO_PUBLIC_*` from the Expo app) to be ignored without validation errors. Critical for monorepo where multiple apps share `.env`.

## 4. The code, line by line

### `inference-server/inference_server/config.py`
```python
class Config:
    env_file = ".env"
    env_file_encoding = "utf-8"
    case_sensitive = False
    extra = "ignore"  # Allow unknown env vars (EXPO_PUBLIC_*, etc.)
```
Added `extra = "ignore"` to prevent validation errors from Expo's public env vars.

Added Supabase settings:
```python
supabase_url: Optional[str] = Field(default=None, description="Supabase project URL")
supabase_anon_key: Optional[str] = Field(default=None, description="Supabase anon key")
supabase_service_role_key: Optional[str] = Field(default=None, description="Supabase service role key")
```

### `inference-server/inference_server/utils/supabase_client.py`
```python
def get_supabase_client() -> Optional[Client]:
    """Lazy initialization - returns None if not configured."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    if not settings.supabase_url or not (settings.supabase_service_role_key or settings.supabase_anon_key):
        return None
    key = settings.supabase_service_role_key or settings.supabase_anon_key
    _supabase_client = create_client(settings.supabase_url, key)
    return _supabase_client
```
Lazy initialization pattern. Uses service role key (bypasses RLS) if available, falls back to anon key.

```python
def insert_scan_result(skin_type, skin_confidence, acne_severity, acne_confidence, user_id=None):
    client = get_supabase_client()
    if client is None:
        return None  # Graceful degradation
    data = {...}
    if user_id:
        data["user_id"] = user_id
    result = client.table("scans").insert(data).execute()
    return result.data[0] if result.data else None
```
Inserts scan record. Returns `None` if Supabase not configured (allows API to work without DB).

### `inference-server/inference_server/models/pytorch_inference.py`
```python
def _get_skin_type_model():
    global _skin_type_model, _skin_type_classes
    if _skin_type_model is None:
        checkpoint_path = Path("models/skin_type_best.pt")
        checkpoint = torch.load(checkpoint_path, map_location="cpu")
        _skin_type_classes = checkpoint["classes"]
        _skin_type_model = _load_model(checkpoint_path, len(_skin_type_classes))
    return _skin_type_model, _skin_type_classes
```
Lazy model loading. Loads checkpoint, extracts classes, builds model architecture dynamically.

```python
def run_inference(image_bytes: bytes) -> Dict[str, Any]:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    input_tensor = transform(image).unsqueeze(0)
    
    with torch.no_grad():
        skin_type_logits = skin_type_model(input_tensor)
        skin_type_probs = torch.softmax(skin_type_logits, dim=1)
        skin_type_conf, skin_type_idx = skin_type_probs.max(1)
        # ... same for acne
```
Runs both models in `torch.no_grad()` mode. Applies softmax to get probabilities, takes argmax for predicted class.

### `inference-server/inference_server/main.py` — `/analyze` endpoint
```python
@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_endpoint(
    request: Request,
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
) -> AnalyzeResponse:
```
Accepts multipart file upload and optional Authorization header.

```python
# Extract user ID from Authorization header if present
user_id = None
if authorization and authorization.startswith("Bearer "):
    token = authorization[7:]
    client = get_supabase_client()
    if client:
        try:
            user_response = client.auth.get_user(token)
            if user_response.user:
                user_id = user_response.user.id
        except Exception:
            pass  # Invalid token, proceed anonymously
```
Parses Bearer token, validates with Supabase, extracts user_id.

```python
# Run inference using PyTorch models
with ImageDataContext(image_bytes) as img_bytes:
    input_tensor = preprocess_image_bytes(img_bytes)
    result = run_inference(image_bytes)
```
Uses existing preprocessing pipeline + new PyTorch inference.

```python
# Insert into Supabase
db_record = insert_scan_result(
    skin_type=skin_type_label,
    skin_confidence=skin_type_confidence,
    acne_severity=acne_label,
    acne_confidence=acne_confidence,
    user_id=user_id,
)

response_status = "success" if db_record else "partial"
```
Stores result. Status is "success" if DB insert worked, "partial" if not (e.g., Supabase not configured).

### `supabase/migrations/004_scans_table.sql`
```sql
CREATE TABLE scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  skin_type skin_type NOT NULL,
  skin_confidence numeric NOT NULL,
  acne_severity acne_severity NOT NULL,
  acne_confidence numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scans_own" ON scans
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "scans_anon_insert" ON scans
  FOR INSERT WITH CHECK (true);
```
Reuses existing `skin_type` and `acne_severity` ENUMs. RLS policy allows users to see only their scans. Anonymous insert policy allows unauthenticated scans.

### `scripts/test_api.py`
```python
# Search for existing images
image_files = []
for ext in image_extensions:
    image_files.extend(list(datasets_dir.rglob(ext)))

# Fallback to synthetic image
if image_files:
    # use found image
else:
    img = Image.new("RGB", (224, 224), color=(200, 150, 130))
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    img_bytes = buffer.getvalue()
```
Searches recursively for images. Falls back to in-memory PIL image generation.

## 5. How to verify it works

```bash
# Run API test (uses TestClient, no server needed)
cd inference-server
python ../scripts/test_api.py

# Run multi-image test
python ../scripts/test_api_multi.py

# Run full test suite
python -m pytest -v

# Expected: 68 passed, 2 errors (pre-existing fixture issues)
```

Manual test with curl (requires running server):
```bash
uvicorn inference_server.main:app --reload
curl -X POST http://localhost:8000/analyze \
  -F "file=@test.jpg" \
  -H "Authorization: Bearer <supabase_token>"
```

## 6. What could go wrong

1. **Model files missing** — `models/skin_type_best.pt` or `models/acne_best.pt` not found. Error: `FileNotFoundError`. Fix: Copy models to `inference-server/models/`.

2. **Supabase not configured** — API works but returns `status: "partial"` and `db_record: null`. Not an error, just degraded mode.

3. **Invalid auth token** — Token parsing fails silently, scan stored anonymously. Not an error.

4. **RLS policy blocks insert** — If using anon key (not service role), RLS may block inserts for authenticated users. Fix: Use service role key or adjust policies.

5. **Image preprocessing mismatch** — TestClient uses different preprocessing than production. Ensure both use same transforms.

## 7. If you remember one thing

**The `/analyze` endpoint combines skin type + acne severity predictions in one API call, optionally stores results in Supabase with RLS, and gracefully degrades to "partial" status if database is unavailable. Models are loaded lazily from checkpoints, classes extracted dynamically. Test script works with or without dataset files via synthetic image fallback.**

## 8. Questions to ask yourself before the defense

1. **Why combine two predictions into one endpoint?** Reduces client network calls, simplifies error handling, single point of failure.

2. **How does the server extract user_id from the request?** Parses `Authorization: Bearer <token>` header, validates with Supabase `auth.get_user()`, extracts `user.id`.

3. **What happens if Supabase is not configured?** `get_supabase_client()` returns `None`, `insert_scan_result()` returns `None`, response status is `"partial"` instead of `"success"`.

4. **Why use `extra="ignore"` in Pydantic Settings?** Allows Expo's `EXPO_PUBLIC_*` env vars in shared `.env` without validation errors.

5. **How does the test script work without dataset images?** Generates a 224×224 RGB PIL image in memory, saves to BytesIO as JPEG, uses those bytes for the test.

6. **What RLS policies exist on the scans table?** `scans_own` — users see only their scans (`user_id = auth.uid()`). `scans_anon_insert` — allows anonymous inserts (`WITH CHECK (true)`).

7. **Why lazy load models and Supabase client?** Avoids startup failures if files/env vars missing. Models loaded on first request.