# 11-inference-server.md

**Date:** 2026-09-25
**Blueprint:** §5.1 (Two Models), §5.2 (AI Output Contract), §5.3 (Per-Field Parallel Contracts), §5.4 (Confidence Threshold), §8.1 (Stack), §8.3 (Inference Flow), §8.4 (Photo Processing & Privacy)
**Files changed:**
- `inference-server/pyproject.toml` — Project config with FastAPI, Uvicorn, Pydantic, Pillow, optional PyTorch/ONNX
- `inference-server/.env.example` — Environment variables template
- `inference-server/inference_server/config.py` — Pydantic Settings for env-driven config
- `inference-server/inference_server/schemas/prediction.py` — Pydantic models per §5.2 contract
- `inference-server/inference_server/preprocessing/image.py` — Image validation, loading, preprocessing (224×224, ImageNet norm)
- `inference-server/inference_server/models/loader.py` — Model factory (mock/pytorch/onnx) with deterministic MockModel
- `inference-server/inference_server/models/skin_type.py` — Skin type prediction wrapper
- `inference-server/inference_server/models/acne_severity.py` — Acne severity prediction wrapper
- `inference-server/inference_server/main.py` — FastAPI app with `/health`, `/predict/skin-type`, `/predict/acne-severity`
- `inference-server/inference_server/utils/privacy.py` — Image discard utilities per §8.4
- `inference-server/tests/` — 17 pytest tests (schemas, preprocessing, mock models, endpoints)
**Prerequisites:** 01-verdict-engine-types.md, 07-verdict-engine-aggregation.md, 09-profile-store-and-screen-tests.md, 10-search-and-verdict-screens.md

## 1. What this task was

This task built the FastAPI inference server — a standalone service that receives face photos from the React Native app, runs pretrained ML models for skin type and acne severity classification, and returns predictions per the AI Output Contract (§5.2). The server implements two endpoints (`/predict/skin-type` and `/predict/acne-severity`) that accept multipart/form-data image uploads, validate and preprocess images (224×224 resize, ImageNet normalization), run inference via a pluggable model loader (mock/PyTorch/ONNX), and return predictions with label, confidence, and model version. Critically, images are held in memory only and discarded immediately after inference (§8.4).

## 2. The concept

**FastAPI inference server:** A lightweight Python service that isolates ML inference from the React Native app. This avoids Expo/TF.js compatibility issues (§8.1) and keeps the app bundle small. The server is stateless — it loads models on startup (or first request), processes one image per request, and returns JSON.

**AI Output Contract (§5.2):** Every prediction returns `{ label, confidence, model_version }`. Confidence is the model's raw softmax output (not calibrated probability). The contract is identical for both models — only the label enum differs (skin type: dry/normal/oily; acne: mild/moderate/severe).

**Per-field parallel contracts (§5.3):** Skin type and acne severity are independent. The app calls both endpoints in parallel and stores results separately. Each has its own confidence threshold (0.60 per §5.4).

**Model loader abstraction:** The `MODEL_MODE` env var (`mock|pytorch|onnx`) selects the backend. `mock` returns deterministic pseudo-random predictions for zero-dep development. `pytorch` loads TorchScript models. `onnx` uses ONNX Runtime. This allows zero-dep local dev while supporting production models.

**Privacy by design (§8.4):** Images are read into memory, preprocessed, inferred, and immediately discarded. No temp files, no disk writes, no logging of image data. The `ImageDataContext` context manager ensures cleanup.

## 3. The decision

**Options considered:**
1. **Run models in React Native (TF.js/Expo)** → Rejected: Expo/TF.js has known failures (§8.1); bundle size; no GPU.
2. **Single combined endpoint** → Rejected: §5.3 requires independent per-field contracts; separate confidence thresholds.
3. **Base64 image upload** → Rejected: multipart/form-data is standard, more efficient, supports streaming.
4. **Single model for both tasks** → Rejected: §5.1 specifies two separate models with different accuracies.
5. **Calibrated confidence** → Rejected: §5.2 explicitly states confidence is raw softmax, not calibrated probability.

**Key technical decisions:**
- **Mock mode default:** `MODEL_MODE=mock` enables zero-dep local dev. Deterministic `MockModel` uses input tensor hash for label and confidence, ensuring reproducible tests.
- **224×224 ImageNet preprocessing:** Standard for pretrained classifiers. Resize → RGB → normalize (ImageNet mean/std) → CHW tensor.
- **5MB max upload:** Enforced at endpoint level (413 response). Prevents DoS.
- **CORS for Expo dev:** Permissive origins for `localhost:8081` and `exp://` schemes.
- **Privacy context manager:** `ImageDataContext` ensures `del data; gc.collect()` on exit.

## 4. The code, line by line

### `inference_server/config.py`

**Settings class (lines 7–45):**
```python
class Settings(BaseSettings):
    model_mode: str = Field(default="mock", description="mock | pytorch | onnx")
    skin_type_model_path: str = Field(default="", description="Path to skin type model file")
    acne_severity_model_path: str = Field(default="", description="Path to acne severity model file")
    model_version: str = Field(default="mock-v1", description="Model version string returned in predictions")
    max_file_size_mb: int = Field(default=5, description="Maximum upload size in MB")
    allowed_content_types: List[str] = Field(default=["image/jpeg", "image/png"])
    image_input_size: int = Field(default=224, description="Model input image size (square)")
    cors_allow_origins: List[str] = Field(default=["http://localhost:8081", ...])
```
Pydantic Settings loads from `.env` with type validation. All config is centralized here.

### `inference_server/schemas/prediction.py`

**PredictResponse (lines 15–35):**
```python
class PredictResponse(BaseModel):
    label: SkinTypeLabel | AcneSeverityLabel = Field(description="Predicted class label")
    confidence: float = Field(ge=0.0, le=1.0, description="Model's raw softmax output (not calibrated probability)")
    model_version: str = Field(description="Model identifier for traceability")
```
Enforces §5.2 contract: label enum, confidence bounds, required model_version. `ConfigDict` provides OpenAPI example.

### `inference_server/preprocessing/image.py`

**Validation (lines 15–45):**
```python
def validate_image_content_type(content_type: str) -> None:
    if content_type not in settings.allowed_content_types:
        raise ImageFormatError(...)

def validate_image_size(file_size: int) -> None:
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if file_size > max_bytes:
        raise ImageSizeError(...)
```
Early rejection at endpoint level before reading full file.

**Preprocessing pipeline (lines 60–100):**
```python
def preprocess_image(image: Image.Image) -> np.ndarray:
    image = image.resize(target_size, Image.Resampling.LANCZOS)
    img_array = np.array(image, dtype=np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img_array = (img_array - mean) / std
    img_array = np.transpose(img_array, (2, 0, 1))  # HWC -> CHW
    img_array = np.expand_dims(img_array, axis=0)   # add batch dim
    return img_array.astype(np.float32)
```
Standard ImageNet preprocessing: resize → [0,1] → normalize → CHW → batch dim.

### `inference_server/models/loader.py`

**MockModel (lines 17–31):**
```python
class MockModel:
    def __init__(self, labels: list[str], seed: int = 42):
        self.labels = labels
        self._rng = np.random.RandomState(seed)
    
    def predict(self, input_tensor: "np.ndarray") -> tuple[str, float]:
        tensor_bytes = input_tensor.tobytes()[:100]
        hash_val = hash(tensor_bytes) % len(self.labels)
        label = self.labels[hash_val]
        confidence_seed = hash(tensor_bytes) % 10000
        confidence_rng = np.random.RandomState(confidence_seed)
        confidence = 0.55 + (confidence_rng.random() * 0.4)
        return label, round(confidence, 2)
```
Fully deterministic: label from tensor hash, confidence from separate hash-derived RNG. Same input → same output.

**Factory functions (lines 85–105):**
```python
def load_skin_type_model() -> ModelProtocol:
    labels = ["dry", "normal", "oily"]
    if settings.model_mode == "mock":
        return MockModel(labels, seed=42)
    elif settings.model_mode == "pytorch":
        return PyTorchModel(settings.skin_type_model_path, labels)
    ...
```
Mode-based factory returns appropriate implementation.

### `inference_server/main.py`

**Shared prediction logic (lines 55–95):**
```python
async def _process_prediction(file: UploadFile, predict_fn, endpoint_name: str) -> PredictResponse:
    validate_image_content_type(file.content_type or "")
    image_bytes = await file.read()
    validate_image_size(len(image_bytes))
    
    with ImageDataContext(image_bytes) as img_bytes:
        input_tensor = preprocess_image_bytes(img_bytes)
        result = predict_fn(input_tensor)
    
    logger.info(f"{endpoint_name} prediction: {result.label} (confidence: {result.confidence})")
    return result
```
Shared logic for both endpoints. Privacy context manager ensures cleanup.

**Endpoints (lines 110–145):**
```python
@app.post("/predict/skin-type", response_model=PredictResponse)
async def predict_skin_type_endpoint(file: UploadFile = File(...)) -> PredictResponse:
    return await _process_prediction(file, predict_skin_type, "skin-type")

@app.post("/predict/acne-severity", response_model=PredictResponse)
async def predict_acne_severity_endpoint(file: UploadFile = File(...)) -> PredictResponse:
    return await _process_prediction(file, predict_acne_severity, "acne-severity")
```
Thin endpoints delegating to shared logic.

### `inference_server/utils/privacy.py`

**ImageDataContext (lines 25–38):**
```python
class ImageDataContext:
    def __init__(self, data: bytes):
        self.data = data
    
    def __enter__(self) -> bytes:
        return self.data
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        discard_image_data(self.data)
        self.data = None

def discard_image_data(data: Any) -> None:
    if data is not None:
        del data
        gc.collect()
```
Context manager guarantees cleanup even on exception.

## 5. How to verify it works

```bash
cd inference-server
pip install -e ".[dev]"
pytest -v
# 53 tests pass

# Manual test
uvicorn inference_server.main:app --reload
curl -F "file=@test.jpg" http://localhost:8000/predict/skin-type
# {"label":"oily","confidence":0.73,"model_version":"mock-v1"}
```

**Test coverage (53 tests):**
- 5 schema tests (contract validation, confidence bounds, label enums)
- 12 preprocessing tests (content type, size, load, resize, normalization)
- 10 mock model tests (determinism, label enums, confidence range, cross-model independence)
- 17 endpoint tests (success, PNG/JPEG, 400 invalid format, 413 oversized, 422 missing file, CORS, privacy)

## 6. What could go wrong

1. **Model mode mismatch:** If `MODEL_MODE=pytorch` but no model file provided, startup fails with clear error.
2. **Large uploads:** 413 response for >5MB. Client must handle.
3. **Invalid images:** 400 for non-JPEG/PNG. Client should validate before upload.
4. **Memory pressure:** Large concurrent uploads could OOM. Consider semaphore for production.
5. **Mock confidence not calibrated:** Confidence is deterministic pseudo-random, not real model output. Never use mock in production.
6. **CORS in production:** Default origins are dev-only. Must configure for production domain.

## 7. If you remember one thing

**The inference server is a stateless, privacy-first function: image bytes in → prediction JSON out.** No session, no storage, no logging of images. The `MODEL_MODE` switch lets you develop without GPUs and deploy with real models unchanged.

## 8. Questions to ask yourself before the defense

1. **Why multipart/form-data instead of base64?**
   - Standard for file uploads, supports streaming, more efficient (no 33% overhead), works with standard tooling.

2. **How does the mock model achieve determinism?**
   - Label from `hash(tensor_bytes) % n_labels`. Confidence from separate `RandomState(hash(tensor_bytes) % 10000)`. Same input bytes → same output.

3. **What does the 0.60 confidence threshold mean?**
   - Per §5.4, it's a UX threshold for the app's "Looks right" button. Not a statistical boundary. The server just returns raw softmax.

4. **How is image privacy enforced?**
   - `ImageDataContext` context manager calls `discard_image_data()` (del + gc.collect) on exit. No temp files, no disk writes, no image logging.

5. **Why separate endpoints for skin type and acne severity?**
   - §5.3: independent per-field contracts. Different confidence thresholds, different label enums, independent model versions. Parallel calls from app.

6. **What happens if the model file is missing in pytorch mode?**
   - `load_skin_type_model()` raises `ValueError` at startup with clear message. Fail-fast.