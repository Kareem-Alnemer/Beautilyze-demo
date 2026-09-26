# Scan Screen & AI Workflow

**Date:** 2026-09-26
**Blueprint:** §5.1, §5.3, §5.4, §8.3, §8.4, §10.2
**Files changed:**
- `app/src/scan/ScanScreen.tsx` — Main scan workflow screen with state machine
- `app/src/scan/hooks/useScan.ts` — Scan workflow hook managing state & API calls
- `app/src/scan/api.ts` — Inference API client (concurrent predictions)
- `app/src/scan/types.ts` — Scan workflow types
- `app/src/scan/components/CameraViewport.tsx` — Camera preview with framing overlay
- `app/src/scan/components/ScanResultView.tsx` — AI result review with confidence UI
- `app/src/scan/components/AnalysisShimmer.tsx` — Loading animation during inference
- `app/src/scan/__tests__/ScanScreen.test.tsx` — ScanScreen component tests
- `app/src/scan/__tests__/CameraViewport.test.tsx` — CameraViewport component tests
- `app/src/scan/__tests__/ScanResultView.test.tsx` — ScanResultView component tests
- `app/src/scan/__tests__/api.test.ts` — API client tests
- `docs/design/screens/scan.md` — Scan screen design specification
**Prerequisites:** 01-verdict-engine-types.md, 07-verdict-engine-aggregation.md, 09-profile-store-and-screen-tests.md, 11-inference-server.md

---

## 1. What this task was

This task implemented the **Scan screen** — the entry point for the AI-assisted profile path in BeautiLyze. The screen guides users through: granting camera permission → capturing/selecting a photo → sending it to the inference server for skin type and acne severity prediction → reviewing results with confidence indicators → accepting or overriding AI predictions into the profile store.

The scan flow is separate from the verdict flow. The scan only populates the profile store (`ai_skin_type`, `ai_acne_severity`, confidences, `model_version`). The user then navigates to Search → Verdict separately to check a product.

---

## 2. The concept

### State Machine

The scan screen operates as a **finite state machine** with 5 states:

```
PERMISSIONS_REQUIRED → CAMERA_ACTIVE → ANALYZING → RESULT_REVIEW / ERROR_RETRY
```

- **PERMISSIONS_REQUIRED**: Camera access not granted. Shows "Grant Camera Access" and "Choose from Gallery" buttons.
- **CAMERA_ACTIVE**: Live camera preview with circular framing reticle. Three controls: flip camera, capture, gallery.
- **ANALYZING**: Full-screen loading spinner with "Analyzing your skin..." message and shimmer bars.
- **RESULT_REVIEW**: Shows captured image + two prediction cards (Skin Type, Acne Severity) with confidence bars, model scores, and action buttons.
- **ERROR_RETRY**: Shows error message with "Retry" (re-use image) and "Retake Photo" buttons.

### Confidence Evaluation (Blueprint §5.4)

Each prediction gets a confidence evaluation:

| Confidence | isHighConfidence | Button Label | Notice Text |
|------------|------------------|--------------|-------------|
| ≥ 0.60     | true             | "Looks right" | (none) |
| < 0.60     | false            | "Accept"      | "The model was uncertain about this scan" |

**Confidence bar color:**
- ≥ 0.60 → green (verdict.match)
- 0.40–0.59 → amber (verdict.caution)
- < 0.40 → red (verdict.mismatch)

### Terminology Discipline (Blueprint §10.2)

| Forbidden | Required |
|-----------|----------|
| "73% confident" | "Model score 0.73" |
| "Your skin type is oily" | "AI estimates: Oily" |
| "Safe", "treatment", "diagnosed", "cure" | "No conflict identified in available ingredient data" |

### Per-Field Parallel Contracts (Blueprint §5.3)

Skin type and acne severity are **independent predictions** sent concurrently via `Promise.all`. Each has its own confidence threshold evaluation. Correcting one does not silently change the other.

### Privacy (Blueprint §8.4)

- Image held in memory only (React state)
- Uploaded via multipart/form-data over HTTPS
- **Never written to disk** by the app
- **Never logged**
- Only derived predictions stored in Supabase (user-scoped, RLS)

---

## 3. The decision

### Why a state machine?

Alternative: Multiple separate screens (PermissionScreen, CameraScreen, ResultScreen).
Rejected because: The flow is linear and short-lived. A single screen with state transitions avoids navigation complexity, preserves the captured image in state, and matches the blueprint's "Photo capture → Inference API request → Confidence evaluation → Profile store updates" sequence (§5.1).

### Why concurrent predictions?

Alternative: Sequential requests (skin type, then acne severity).
Rejected because: Blueprint §5.3 explicitly requires "Per-field parallel contracts" — both predictions must be independent and concurrent. `Promise.all` achieves this with minimal latency.

### Why not navigate after acceptance?

Alternative: Auto-navigate to Search or Verdict after "Looks right".
Rejected because: Blueprint §5.4 shows the user stays on the result review screen after acceptance. The user manually navigates to Search → Verdict. This keeps the scan flow focused on profile population only.

### Why multipart/form-data?

Alternative: Base64 JSON payload.
Rejected because: The inference server (FastAPI) expects multipart file upload per §8.3. Multipart is more efficient for binary images and matches the server implementation.

---

## 4. The code, line by line

### `app/src/scan/types.ts` — Type definitions

**Purpose:** Central type definitions for the scan workflow.

Key types:
- `ScanState` — Union of 5 state machine states
- `CameraPermissionStatus` — 'undetermined' | 'granted' | 'denied'
- `PredictResponse` — Matches blueprint §5.2 AI Output Contract: `{ label, confidence, model_version }`
- `ScanResult` — Combined result from both endpoints + captured URI + timestamp
- `ConfidenceEvaluation` — Per-field confidence UI data (field, confidence, isHighConfidence, actionLabel, noticeText)
- `UseScanReturn` — Hook return type with all state + actions

### `app/src/scan/api.ts` — Inference API client

**Purpose:** Send camera images to FastAPI inference server.

```typescript
// Lines 36-57: predictSkinType
// POSTs to /predict/skin-type with multipart/form-data
// Converts file URI → Blob → FormData

// Lines 63-84: predictAcneSeverity
// Same pattern for /predict/acne-severity

// Lines 91-103: predictBoth
// Runs both concurrently via Promise.all
// Returns ScanResult with both predictions + capturedUri + timestamp
```

**Key design:** `uriToBlob` (lines 27-30) fetches the local file URI and converts to Blob for FormData. This works with Expo's `file://` and `content://` URIs.

### `app/src/scan/hooks/useScan.ts` — Scan workflow hook

**Purpose:** Manages the entire scan state machine and side effects.

**State (lines 26-35):**
- `state` — Current ScanState
- `cameraPermission` — Permission status
- `capturedUri` — Image URI from camera/gallery
- `scanResult` — Combined predictions from API
- `error` — InferenceError if failed
- `isAnalyzing` — Loading flag
- `skinTypeEvaluation`, `acneSeverityEvaluation` — ConfidenceEvaluation objects

**Permission check on mount (lines 39-49):**
```typescript
useEffect(() => {
  const { status } = await Camera.getCameraPermissionsAsync();
  setCameraPermission(status === 'granted' ? 'granted' : ...);
  if (status === 'granted') setState('CAMERA_ACTIVE');
  else setState('PERMISSIONS_REQUIRED');
}, []);
```

**Gallery pick (lines 65-79):**
Uses `expo-image-picker` with 1:1 aspect, 80% quality, allows editing. On success: sets URI, transitions to ANALYZING, calls `analyzePhoto`.

**Analyze photo (lines 81-110):**
```typescript
const analyzePhoto = useCallback(async (uri?: string) => {
  const imageUri = uri || capturedUri;
  if (!imageUri) return;
  setIsAnalyzing(true);
  setError(null);
  try {
    const result = await predictBoth(imageUri);  // Concurrent API calls
    setScanResult(result);
    setSkinTypeEvaluation(evaluateConfidence('skinType', result.skinType));
    setAcneSeverityEvaluation(evaluateConfidence('acneSeverity', result.acneSeverity));
    setState('RESULT_REVIEW');
  } catch (err) {
    setError({ message: err.message, code: 'INFERENCE_ERROR' });
    setState('ERROR_RETRY');
  } finally {
    setIsAnalyzing(false);
  }
}, [capturedUri]);
```

**Confidence evaluation (lines 112-124, 194-206):**
```typescript
const evaluateConfidence = useCallback(
  (field, prediction) => {
    const isHighConfidence = prediction.confidence >= 0.60;
    return {
      field,
      confidence: prediction.confidence,
      isHighConfidence,
      actionLabel: isHighConfidence ? 'Looks right' : 'Accept',
      noticeText: !isHighConfidence ? 'The model was uncertain about this scan' : undefined,
    };
  },
  []
);
```

**Accept AI inputs (lines 126-140):**
Hydrates the profile store via `setAIProfile` from Zustand store:
```typescript
setAIProfile({
  ai_skin_type: scanResult.skinType.label,
  ai_acne_severity: scanResult.acneSeverity.label,
  skin_type_confidence: scanResult.skinType.confidence,
  acne_severity_confidence: scanResult.acneSeverity.confidence,
  model_version: scanResult.skinType.model_version,
});
```

**Retake/Retry/Dismiss (lines 142-165):**
- `retakePhoto` — Clears all state, returns to CAMERA_ACTIVE
- `retryAnalysis` — Re-runs `analyzePhoto` with same capturedUri
- `dismissError` — Clears error, re-analyzes if image exists, else returns to CAMERA_ACTIVE

### `app/src/scan/components/CameraViewport.tsx` — Camera preview

**Purpose:** Live camera preview with framing overlay and controls.

**Permission handling (lines 59-80):**
- `denied` → Shows permission prompt with "Grant Camera Permission" and "Choose from Gallery"
- `undetermined` → Shows loading spinner "Requesting camera access..."
- `granted` → Renders camera preview

**Camera preview (lines 91-143):**
- `expo-camera` with 1:1 ratio, front-facing default
- Circular reticle: 280px diameter, 2px brand accent border
- "Position your face here" text centered below reticle
- Three control buttons (bottom row, space-around):
  - Flip camera (↻) — toggles front/back
  - Capture (72×72 ring with inner circle) — calls `onAnalyze(uri)`
  - Gallery (▶) — calls `onGalleryPick()`
- Capturing state: inner circle replaced with spinner, button opacity 0.6

### `app/src/scan/components/ScanResultView.tsx` — Result review

**Purpose:** Displays both predictions with confidence UI and action buttons.

**Layout (ScrollView):**
1. Captured image preview (200px height, md radius, overlay "Your scan")
2. Skin Type prediction card
3. Acne Severity prediction card
4. Model info card (shows model_version)
5. Retake Photo button

**Prediction card (renderPredictionCard, lines 54-125):**
- Header: Title + icon
- Prediction row: "AI estimates" + label (confidence color) | "Model score" + value (2 decimals, confidence color)
- Confidence bar: Full-width track + fill (width = confidence%, confidence color) + percentage text
- Notice text (if confidence < 0.60): "The model was uncertain about this scan" (italic, caution color)
- Action row: Primary button ("Looks right" or "Accept") + Secondary button ("Set manually")

**Confidence color function (lines 48-52):**
```typescript
const getConfidenceColor = (confidence) => {
  if (confidence >= 0.60) return theme.colors.verdict.match;
  if (confidence >= 0.40) return theme.colors.verdict.caution;
  return theme.colors.verdict.mismatch;
};
```

### `app/src/scan/components/AnalysisShimmer.tsx` — Loading animation

**Purpose:** Accessible loading state during inference.

```tsx
<View accessibilityLiveRegion="polite">
  <ActivityIndicator size="large" color={theme.colors.brand.accent} />
  <Text>{message}</Text>
  <View style={styles.shimmerContainer}>
    {[1,2,3].map(i => <View key={i} style={styles.shimmerBar} />)}
  </View>
</View>
```

### `app/src/scan/ScanScreen.tsx` — Main screen component

**Purpose:** Composes the state machine, renders appropriate child per state.

**State consumption (lines 16-32):**
Destructures all state + actions from `useScan()`.

**Status bar (lines 35-38):**
Sets dark-content style and surface background color.

**Render switch (lines 40-132):**
```typescript
switch (state) {
  case 'PERMISSIONS_REQUIRED': return permission UI;
  case 'CAMERA_ACTIVE': return <CameraViewport ... />;
  case 'ANALYZING': return <AnalysisShimmer message="Analyzing your skin..." />;
  case 'RESULT_REVIEW': return <ScanResultView ... />;
  case 'ERROR_RETRY': return error UI with Retry/Retake buttons;
}
```

**RESULT_REVIEW passes (lines 84-100):**
```tsx
<ScanResultView
  result={{
    skinType: scanResult.skinType,
    acneSeverity: scanResult.acneSeverity,
    capturedUri: scanResult.capturedUri,
  }}
  skinTypeEval={skinTypeEvaluation}
  acneSeverityEval={acneSeverityEvaluation}
  onAccept={acceptAIInputs}
  onRetake={retakePhoto}
  onSetManually={() => { retakePhoto(); }} // TODO: navigate to Profile
/>
```

---

## 5. How to verify it works

### Run all scan tests
```bash
cd app
npm test -- --testPathPattern="scan"
```
**Expected:** 26 tests pass (7 ScanScreen, 6 CameraViewport, 10 ScanResultView, 3 api)

### Run typecheck
```bash
cd app
npm run typecheck
```
**Note:** Pre-existing type errors in other modules (ProfileScreen, etc.) are unrelated to scan. Scan-specific files should be clean.

### Run lint
```bash
cd app
npm run lint
```
**Note:** Pre-existing style ordering/color literal errors exist throughout codebase. Scan files have similar style ordering warnings.

### Run inference server tests
```bash
cd inference-server
python -m pytest tests/ -v
```
**Expected:** 53 tests pass

### Manual verification (requires running app + inference server)
1. Start inference server: `cd inference-server && python -m inference_server.main`
2. Start Expo app: `cd app && npx expo start`
3. Navigate to `/scan` route
4. Grant camera permission → see live preview with reticle
5. Capture photo → see "Analyzing..." shimmer
6. See RESULT_REVIEW with both predictions, confidence bars, action buttons
7. Test confidence < 0.60: "Accept" button + notice text appears
8. Test confidence ≥ 0.60: "Looks right" button, no notice
9. Press "Retake Photo" → returns to camera
10. Test error: disconnect server, capture photo → ERROR_RETRY with Retry/Retake

---

## 6. What could go wrong

| Failure Mode | Symptoms | Resolution |
|--------------|----------|------------|
| Inference server not running | Network error, ERROR_RETRY state | Start FastAPI server on port 8000; check `EXPO_PUBLIC_INFERENCE_SERVER_URL` |
| Camera permission denied | Stuck in PERMISSIONS_REQUIRED | User must grant in OS settings; gallery fallback always available |
| Expo Camera not installed | "Cannot find module 'expo-camera'" | Run `npx expo install expo-camera` |
| Image URI invalid | `uriToBlob` fetch fails | Ensure URI is from `expo-camera` or `expo-image-picker` |
| Confidence threshold wrong | Wrong button label shown | Verify `CONFIDENCE_THRESHOLD = 0.60` in useScan.ts matches blueprint §5.4 |
| Profile store not updated | Verdict uses old AI values | Check `acceptAIInputs` calls `setAIProfile` with correct keys |

---

## 7. If you remember one thing

The scan screen is a **self-contained state machine** that only populates the profile store — it does not show verdicts. The AI predictions are assistive inputs; the user must explicitly accept or override them before checking products.

---

## 8. Questions to ask yourself before the defense

1. **What are the 5 states of the scan state machine?**
   PERMISSIONS_REQUIRED, CAMERA_ACTIVE, ANALYZING, RESULT_REVIEW, ERROR_RETRY

2. **How are skin type and acne severity predictions sent to the server?**
   Concurrently via `Promise.all([predictSkinType(uri), predictAcneSeverity(uri)])` — per blueprint §5.3 per-field parallel contracts.

3. **What happens when confidence is 0.45 vs 0.75?**
   0.45 → "Accept" button + "The model was uncertain about this scan" notice + amber/red confidence bar. 0.75 → "Looks right" button + no notice + green confidence bar.

4. **Where is the captured image stored?**
   Only in React state (`capturedUri`). Never written to disk, never logged. Only derived predictions go to Supabase.

5. **What does "Looks right" actually do?**
   Calls `acceptAIInputs()` which hydrates the Zustand profile store with `ai_skin_type`, `ai_acne_severity`, both confidences, and `model_version`. Does not navigate.

6. **Why does the scan screen not navigate after acceptance?**
   Blueprint §5.4 shows the user stays on result review. Navigation to Search → Verdict is a separate user action.

7. **What terminology is forbidden on the scan screen?**
   "73% confident", "Your skin type is X", "safe", "treatment", "diagnosed", "cure". Must use "Model score 0.73", "AI estimates: X".

8. **How does the gallery fallback work?**
   Available in both PERMISSIONS_REQUIRED and CAMERA_ACTIVE states. Uses `expo-image-picker` with 1:1 aspect, editing allowed.

9. **What happens on inference error?**
   Transitions to ERROR_RETRY with error message. "Retry" re-uses the same image; "Retake Photo" clears image and returns to camera.

10. **How is the confidence bar color determined?**
    Green ≥ 0.60, amber 0.40–0.59, red < 0.40 — using theme verdict colors (match/caution/mismatch).