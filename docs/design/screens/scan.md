# Scan Screen — Design Specification

**Status:** Locked for implementation
**Blueprint sections:** §5.1 (Scan User Flow), §5.3 (Per-Field Parallel Contracts), §5.4 (Confidence Threshold & UI Behavior), §10.2 (Terminology Discipline)

---

## 1. Screen Purpose

The Scan screen is the entry point for the AI-assisted profile path. It guides the user through:
1. Granting camera permission
2. Capturing or selecting a photo
3. Viewing analysis results with confidence indicators
4. Accepting or overriding AI predictions

The screen does **not** show a verdict — it only populates the profile store (`ai_skin_type`, `ai_acne_severity`, confidences, `model_version`). The user then navigates to Search → Verdict separately.

---

## 2. State Machine

```
PERMISSIONS_REQUIRED
    │
    ├─ User grants camera permission ──────────────────► CAMERA_ACTIVE
    │
    └─ User picks from gallery ────────────────────────► ANALYZING

CAMERA_ACTIVE
    │
    ├─ User captures photo ────────────────────────────► ANALYZING
    │
    └─ User picks from gallery ────────────────────────► ANALYZING

ANALYZING
    │
    ├─ Both predictions succeed ──────────────────────► RESULT_REVIEW
    │
    └─ Any prediction fails ──────────────────────────► ERROR_RETRY

RESULT_REVIEW
    │
    ├─ User presses "Looks right" / "Accept" ─────────► (hydrates profile store, stays on screen)
    │
    ├─ User presses "Set manually" ───────────────────► (navigate to Profile screen)
    │
    └─ User presses "Retake Photo" ───────────────────► CAMERA_ACTIVE

ERROR_RETRY
    │
    ├─ User presses "Retry" ──────────────────────────► ANALYZING (re-use captured image)
    │
    └─ User presses "Retake Photo" ───────────────────► CAMERA_ACTIVE
```

---

## 3. Visual Layout — Per State

### 3.1 PERMISSIONS_REQUIRED
- Centered container, vertical stack
- Title: "Camera Access Needed" (heading, primary text)
- Body: "BeautiLyze uses your camera to analyze your skin and provide personalized product recommendations." (body, secondary text, centered, max width 80%)
- Primary button: "Grant Camera Access" (brand accent bg, onAccent text, full width, 44px min height)
- Secondary button: "Choose from Gallery" (raised surface bg, rule border, full width, 44px min height)
- Spacing: lg between elements, xl after body text

### 3.2 CAMERA_ACTIVE
- Full-screen camera preview (expo-camera, 1:1 ratio, front-facing default)
- Framing overlay:
  - Circular reticle: 280px diameter, 2px border, brand accent color
  - Centered text: "Position your face here" (body, primary text, 16px below reticle)
- Bottom controls (row, space-around, lg horizontal padding, xl bottom padding):
  - Flip camera button: 56×56, raised surface, centered ↻ icon (unicode U+21C5), shadow elevation 3
  - Capture button: 72×72, brand accent bg, inner ring 64×64 with 3px onAccent border, inner circle 48×48 brand accent
    - Capturing state: inner circle replaced with small ActivityIndicator (onAccent), opacity 0.6
  - Gallery button: 56×56, raised surface, centered ▶ icon (unicode U+25B6), shadow elevation 3
- Permission denied fallback: same as PERMISSIONS_REQUIRED but with "Camera Permission Required" title

### 3.3 ANALYZING
- Full-screen centered
- Large ActivityIndicator (brand accent color)
- Message: "Analyzing your skin..." (lg, medium weight, primary text, lg top margin)
- Shimmer bars: 3 bars, 60×8, 4px radius, surface rule color, 8px gap, xl top margin

### 3.4 RESULT_REVIEW
- ScrollView with lg padding, xxxl bottom padding
- **Image preview**: full width, 200px height, md radius, overflow hidden, rule bg
  - Overlay at bottom: "Your scan" (md, onAccent text, centered, md padding, rgba(0,0,0,0.5) bg)
- **Prediction cards** (2 cards, lg vertical gap):
  - Card: raised surface, md radius, lg padding, rule border
  - Header row: title (heading, lg, semibold, primary) | icon container (32×32, 16px radius, rule bg, centered emoji)
  - Prediction row (space-between):
    - Left: "AI estimates" (xs, medium, tertiary, uppercase, 0.5 letter-spacing) + label (heading, lg, semibold, confidence color)
    - Right: "Model score" (xs, medium, tertiary, uppercase, 0.5 letter-spacing) + value (heading, lg, semibold, confidence color, 2 decimals)
  - Confidence bar: full-width bg (rule color, 8px height, 4px radius), fill (confidence color, width = confidence%, 4px radius), percentage text (sm, medium, secondary, right-aligned, min-width 50px)
  - Notice (if confidence < 0.60): "The model was uncertain about this scan" (sm, italic, caution color, sm top margin)
  - Action row (row, sm gap, md top margin):
    - Primary: "Looks right" (confidence ≥ 0.60) or "Accept" (confidence < 0.60) — brand accent bg, md vertical padding, md radius, semibold
    - Secondary: "Set manually" — raised surface, rule border, md vertical padding, md radius, semibold
- **Model info card**: base surface, md radius, md padding, rule border
  - "Model: {model_version}" (sm, tertiary)
  - "Both predictions use the same model version." (sm, tertiary)
- **Retake button**: raised surface, rule border, md vertical padding, md radius, centered "Retake Photo" (md, medium, primary)

### 3.5 ERROR_RETRY
- Centered container, lg padding
- Title: "Analysis Failed" (heading, xl, semibold, mismatch color)
- Message: error message or "Unable to analyze your photo. Please try again." (body, md, secondary, centered, xl bottom margin)
- Action row (full width, md gap):
  - Primary: "Retry" (brand accent, onAccent text)
  - Secondary: "Retake Photo" (raised surface, rule border)

---

## 4. Confidence Evaluation (Blueprint §5.4)

| Confidence | isHighConfidence | Button Label | Notice Text |
|------------|------------------|--------------|-------------|
| ≥ 0.60     | true             | "Looks right" | (none) |
| < 0.60     | false            | "Accept"      | "The model was uncertain about this scan" |

**Confidence bar color:**
- ≥ 0.60 → verdict.match (green)
- 0.40–0.59 → verdict.caution (amber)
- < 0.40 → verdict.mismatch (red)

**Terminology (Blueprint §10.2):**
- ✅ "AI estimates: Oily — model score 0.73"
- ✅ "Model score 0.73"
- ❌ "73% confident"
- ❌ "Your skin type is oily"
- ❌ "Safe", "treatment", "diagnosed", "cure"

---

## 5. Accessibility

- All buttons: `accessibilityLabel` with context (e.g., "Looks right for Skin Type")
- Live region on AnalysisShimmer: `accessibilityLiveRegion="polite"`
- Tap targets ≥ 44px (all buttons meet this)
- Text contrast ≥ WCAG AA (theme tokens enforce this)

---

## 6. Navigation

- Scan screen is at route `/scan` (Expo Router)
- "Set manually" → navigate to `/profile` (ProfileScreen)
- After accepting AI inputs, user manually navigates to `/search` → `/verdict/:productId`
- No automatic navigation after acceptance (user stays to review)

---

## 7. Data Flow

```
Camera capture / Gallery pick
        │
        ▼
predictBoth(imageUri)  ──►  POST /predict/skin-type + POST /predict/acne-severity (concurrent)
        │
        ▼
ScanResult { skinType, acneSeverity, capturedUri, timestamp }
        │
        ▼
evaluateConfidence() per field  ──► ConfidenceEvaluation { field, confidence, isHighConfidence, actionLabel, noticeText }
        │
        ▼
acceptAIInputs()  ──►  profileStore.setAIProfile({ ai_skin_type, ai_acne_severity, skin_type_confidence, acne_severity_confidence, model_version })
```

---

## 8. Error Handling

- Network error → ERROR_RETRY with message from server
- Timeout → ERROR_RETRY with "Request timed out"
- No face detected (server returns 400) → ERROR_RETRY with "We couldn't read the photo. Please retake."
- Camera permission denied → PERMISSIONS_REQUIRED with gallery fallback always available

---

## 9. Privacy (Blueprint §8.4)

- Image URI held in memory only (React state)
- Uploaded via multipart/form-data over HTTPS
- **Never written to disk** by the app
- **Never logged**
- Only derived predictions stored in Supabase (user-scoped, RLS)

---

## 10. Acceptance Checklist

- [ ] PERMISSIONS_REQUIRED renders with both buttons
- [ ] CAMERA_ACTIVE shows live preview with reticle and 3 control buttons
- [ ] Gallery pick works from both PERMISSIONS_REQUIRED and CAMERA_ACTIVE
- [ ] ANALYZING shows shimmer with message
- [ ] RESULT_REVIEW shows both predictions with correct labels, confidence bars, and action labels per threshold
- [ ] Confidence < 0.60 shows "Accept" + notice text; ≥ 0.60 shows "Looks right"
- [ ] "Set manually" button present for each prediction
- [ ] Retake button returns to CAMERA_ACTIVE
- [ ] ERROR_RETRY shows error message with Retry and Retake Photo
- [ ] No forbidden terminology appears anywhere
- [ ] Model version displayed
- [ ] acceptAIInputs hydrates profile store correctly
- [ ] All tests pass (component + hook + API)
- [ ] TypeScript and lint pass