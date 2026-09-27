# Native Gallery Upload Without App-Created Image Files

**Date:** 2026-09-27
**Blueprint:** [5.1-5.4, 8.3-8.4](../blueprint.md)
**Files changed:** `app/modules/memory-upload/` configuration and native sources; `app/src/scan/nativeUpload.ts`, `api.ts`, `hooks/useScan.ts`, `ScanScreen.tsx`, `__tests__/nativeUpload.test.ts`, `__tests__/useScan.test.tsx`, `__tests__/ScanScreen.test.tsx`; `app/app.json`, `app/package.json`, `app/package-lock.json`; `docs/design/screens/scan.md`, `docs/testing/native-upload.md`, `docs/reviews/native-upload-decision.md`, learning index, TASKS.
**Prerequisites:** [12](12-scan-screen-and-ai-workflow.md), [25](25-profile-and-prediction-boundaries.md), [26](26-project-reading-map.md).

## 1. What this task was

Gallery upload was deliberately blocked on Android/iPhone because the installed
Expo picker copies images into app cache files. Removing the guard would break
the privacy promise. The owner instead approved a custom native build. This
task adds its gallery uploader and JavaScript integration, not a claim that
native camera capture or a deployed model has been verified.

## 2. The concept

A **native module** is code written for the phone's operating system rather
than the shared JavaScript application. A **bridge** is the boundary through
which those two parts communicate. Expo Go contains a fixed selection of native
modules; it cannot gain another one by reloading JavaScript.

The new module opens the system's photo selector, reads the chosen image into
memory, and sends it to the server. Only prediction data crosses back to
JavaScript. **Multipart** is the upload format: a short header identifies the
image, followed by its bytes. No intermediate image file is needed.

A photo selected from a gallery already exists somewhere. Avoiding a new
app-owned file does not mean deleting that original, or controlling every cache
inside the operating system or photo provider. That distinction is why source
review and mocked tests cannot replace inspection on an actual device.

## 3. The decision

The owner approved replacing Expo Go with a custom build for this feature.
The [ADR proposal](../reviews/native-upload-decision.md) records alternatives:
re-enabling the cache-file picker or deleting its files afterward was rejected.
Both still write image files. Moving base64 image strings into JavaScript was
also rejected because it adds another retained copy to application state.

The native code uploads once to the existing `/analyze` endpoint. Its two
predictions are still independent profile inputs, as required by blueprint
5.3; a single transport request does not merge the predictions. JPEG/PNG and
the 5 MiB limit mirror the existing server configuration. HTTP and redirects
are rejected rather than silently weakening transport protection.

## 4. The code, line by line

### Android: `app/modules/memory-upload/android/src/main/java/expo/modules/memoryupload/MemoryUploadModule.kt`

This module reads the selected content through a stream and uploads it without creating a file.

```kotlin
val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
  type = "image/*"
  addCategory(Intent.CATEGORY_OPENABLE)
  putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("image/jpeg", "image/png"))
}
```

`pickAndAnalyze` checks for an active screen, rejects overlapping operations,
validates HTTPS, and launches the chooser on the main UI thread. The result
callback handles cancellation as `null`, not an error. A worker reads the
selected `content:` URI, which identifies provider-managed data rather than
an app-created path. It reads at most the existing limit plus one byte to
detect oversize input, and rejects unapproved image types.

```kotlin
connection.useCaches = false
connection.instanceFollowRedirects = false
connection.setFixedLengthStreamingMode(header.size + image.size + tail.size)
connection.outputStream.use { it.write(header); it.write(image); it.write(tail) }
```

The request sends headers, bytes, and multipart ending directly. Fixed length
avoids a disk-spooled body. Connection and read waits have 60-second bounds.
The `finally` blocks disconnect and clear the main image byte array. This is
not a claim of forensic memory erasure: libraries and the OS may hold copies.
Failures return a fixed message without including the image or provider URI.

### iOS: `app/modules/memory-upload/ios/MemoryUploadModule.swift`

This module requests an in-memory photo representation and uses an ephemeral network session.

```swift
provider.loadDataRepresentation(forTypeIdentifier: type.identifier) { data, error in
  // Validate presence and size before upload.
}
```

The main module retains one operation while PHPicker is open. Cancel resolves
with no result. The operation requests JPEG or PNG data, checks size, constructs
the multipart body as `Data`, and submits it with `URLSession.dataTask`.
It never requests a temporary-file representation or uses a background upload.

```swift
let configuration = URLSessionConfiguration.ephemeral
configuration.urlCache = nil
configuration.httpCookieStorage = nil
configuration.urlCredentialStorage = nil
```

Ephemeral means the network session is not configured to persist its data.
The redirect delegate refuses another destination; completion releases the
operation. Provider loading may allocate the full image before the size check,
so low-memory device testing is especially important on iOS.

### Local module and build configuration

`expo-module.config.json` names the Android and Swift classes Expo must link.
The local `package.json` identifies the module without publishing it. Android's
`build.gradle` uses the installed Expo module plugin; its manifest declares
network access. The iOS podspec tells CocoaPods, the iOS dependency/build tool,
which Swift sources to compile with ExpoModulesCore. None is a downloaded
third-party image-processing implementation.

`app/app.json` uses the owner's approved Android ID, `com.beautilyze.app`.
`app/package.json` and its lockfile add the approved development client and
align React DOM, Worklets, and Reanimated to Expo's installed compatibility
table. The first install failed with `ERESOLVE`: React DOM 19.3.0 expected
React 19.3.0, while the app uses 19.2.3. After approval, compatible versions
were installed without force flags. Prebuild updates Android/iOS run scripts
to native build commands. Generated native folders remain ignored.

### JavaScript adapter: `app/src/scan/nativeUpload.ts`

This adapter requires the custom module and validates server results before exposing them to the UI.

```ts
const native = requireOptionalNativeModule<MemoryUploadModule>('BeautilyzeMemoryUpload');
const json = await native.pickAndAnalyze(serverUrl);
if (json === null) return null;
```

Before the call, missing-module and non-HTTPS configuration errors get clear
messages. Afterwards, require the success response and validate both labels,
scores, and model identifiers using the existing `validatePrediction` from
`api.ts`, now exported. The legacy result type still contains `capturedUri`,
but native results set it to an empty string; no image URI crosses this boundary.

### Workflow: `app/src/scan/hooks/useScan.ts` and `ScanScreen.tsx`

The hook connects native selection to the existing loading/result/error states; the screen makes retry usable without a retained image.

```ts
if (picking.current) return;
picking.current = true;
const request = ++generation.current;
```

The immediate guard blocks double taps. The request number prevents a late
result from overwriting a newer flow. Native cancellation returns to entry;
success evaluates each prediction independently; failure enters the error
state; `finally` releases busy state. An initial camera-permission response
cannot overwrite a gallery operation that has already started. The screen's
retry action uses `pickFromGallery` when there is no retained URI. Web behavior
and native camera capture are not newly enabled by this change.

### Tests and supporting documents

`nativeUpload.test.ts` replaces the native boundary and checks missing modules,
HTTPS, cancellation, response validation, and failures. `useScan.test.tsx`
mounts the actual hook to exercise cancellation, permission independence,
duplicate taps, and late results. `ScanScreen.test.tsx` verifies that retry
reopens selection. They do not compile or execute Kotlin/Swift.

The scan design amendment and native-upload testing guide state current UI
behavior and manual gates. The ADR proposal records the boundary change without
editing locked decisions. TASKS and the learning index make the status findable.

## 5. How to verify it works

From the repository root with dependencies installed:

```powershell
npm run app:typecheck
npm run app:lint
npm run app:test
```

Observed: TypeScript passes; lint exits successfully with 0 errors and 38
unused-variable warnings; 418 tests pass in 38 suites. Existing SafeAreaView
deprecation and Android-only StatusBar warnings remain. Native module discovery
passes for Android and Apple, and Android prebuild succeeds. For compilation
outcome and remaining device gates, consult TASKS and the
[build guide](../testing/native-upload.md); these JavaScript results are not a
native release certification.

Android compilation also completed successfully using:

```powershell
Set-Location 'C:\Users\k5x6\Documents\Projects\Beautilyze-demo\app\android'
.\gradlew.bat :beautilyze-memory-upload:compileDebugKotlin --console=plain
```

Result: `BUILD SUCCESSFUL in 6m 36s`, 63 tasks executed. Expo/Gradle dependency
deprecation warnings remain. This verifies the Kotlin module and required
dependencies, not a full APK installation. Swift/iOS compilation was not run
on this Windows host, and device upload/privacy acceptance remains pending.

## 6. What could go wrong

1. Expo Go or an old custom binary does not contain the module. Rebuild and
   install the custom app; a JavaScript reload cannot repair that.
2. The server uses HTTP, localhost, or an invalid certificate. Configure a
   reachable HTTPS base address; never bypass certificate validation.
3. A provider returns an unsupported format, large allocation, or platform
   error. Test with non-sensitive JPEG/PNG input, inspect the native failure,
   and use manual profile entry while investigating. Do not add a cache-file fallback.

## 7. If you remember one thing

Keep image handling on the native side, return only validated predictions, and distinguish source-level privacy design from device-verified behavior.

## 8. Questions to ask yourself before the defense

1. **Why does Expo Go fail?** It cannot load our custom native module.
2. **Why not delete the temporary image afterward?** The contract forbids
   creating it, not just retaining it after upload.
3. **Why does retry reopen selection?** The app deliberately does not retain
   image bytes or an image path for reuse.
4. **What do the tests not prove?** Native compilation, provider behavior,
   disk/log privacy, network reachability, and real model accuracy.
5. **Does one upload combine the two profile fields?** No. The response still
   carries separate predictions and separate acceptance actions.
