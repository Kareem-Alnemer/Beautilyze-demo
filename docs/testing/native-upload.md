# Native Gallery Upload

## What Changed

Expo Go has a fixed set of native modules. BeautiLyze's local gallery uploader
requires a custom build. Reloading Expo Go cannot enable it.

Source: `app/modules/memory-upload/`. Expo automatically discovers `app/modules/`.
The adapter is `app/src/scan/nativeUpload.ts`; UI transitions live in
`app/src/scan/hooks/useScan.ts`. See the [ADR proposal](../reviews/native-upload-decision.md).

## Prerequisites

- Android SDK and Java for Android builds; Xcode and CocoaPods on a Mac for iOS.
- Installed dependencies matching `app/package-lock.json`.
- A team-controlled HTTPS inference server serving the existing `/analyze`
  endpoint. Set `EXPO_PUBLIC_INFERENCE_SERVER_URL` in the app's local environment
  to that base address; do not put any secret or API key into public variables.
- Android application ID approved by the owner: `com.beautilyze.app`.
- iOS bundle identifier/signing must be confirmed by the owner before an iOS build.

`localhost` on a phone means the phone, not your computer. Plain HTTP is rejected
by the native uploader to protect the selected image. Do not disable TLS
certificate checks to make local development work. No server was deployed or
public endpoint invented in this task.

## Build Commands (Human/Approval Required)

From the repository root, after the prerequisites are satisfied:

```powershell
Set-Location app
node node_modules/expo/bin/cli prebuild --platform android --no-install
npm run android
```

`prebuild` generates the ignored `app/android/` directory from configuration.
`npm run android` compiles and installs the Android app on a connected device
or emulator. Native source/config changes require another build.

For iOS on a configured Mac, after approving the bundle ID/signing:

```sh
cd app
npm run ios
```

These installation commands are not a claim that a working phone build has
already been produced. Check TASKS for the latest verification outcome.

## Automated Checks

From the repository root:

```powershell
npm run app:typecheck
npm run app:lint
npm run app:test
```

Native registration can be checked without compiling:

```powershell
Set-Location app
node node_modules/expo-modules-autolinking/bin/expo-modules-autolinking.js resolve --platform android --json
node node_modules/expo-modules-autolinking/bin/expo-modules-autolinking.js resolve --platform apple --json
```

Both must list `beautilyze-memory-upload`. Discovery is not compilation.

## Device Acceptance

Start with an existing non-sensitive JPEG/PNG test image, not a face photo.
The agent must never create a face-image fixture on disk.

1. Open Scan with camera permission denied. Choose from Gallery must still work.
2. Cancel selection. No error or stuck loading indicator should remain.
3. Choose a JPEG/PNG below 5 MiB. Confirm both predictions arrive and no photo
   preview appears. Distinguish server mock output from real model inference.
4. Try an unsupported type, oversized file, unreachable server, and redirect.
   Failure must be recoverable via Choose photo again or Set profile manually.
5. Tap selection repeatedly. Only one operation should run.
6. Leave the flow during upload. A late result must not replace the new screen state.
7. Inspect the app sandbox/cache and logs before and after selection, cancellation,
   success, and failure. Confirm no new app-owned photo file or image data log.
8. Check a large photo on a low-memory device. iOS providers may allocate the full
   representation before the module can check its size; passing unit tests does
   not establish low-memory behavior.

The original gallery image and photo-provider caches are not controlled by
BeautiLyze. The module uses streams/data representations rather than file-copy
APIs, but operating-system behavior needs device evidence. Do not advertise a
verified end-to-end privacy guarantee until this checklist is recorded.

## Remaining Limits

Verification recorded 2026-09-27: 418 JavaScript tests pass; typecheck passes;
lint reports 0 errors / 38 warnings; Android module compilation succeeds.
Apple module discovery succeeds, but Swift compilation and phone installation
have not been performed. A reachable HTTPS deployment is still required.

- Native camera capture is still disabled, deliberately.
- HEIC-only images are not accepted; server contract currently supports JPEG/PNG.
- Retry reopens selection because image data is not retained by the app state.
- Device upload requires an HTTPS deployment; a successful native compilation
  alone cannot prove server reachability, model accuracy, or privacy.
