# Building the Android development app

**Date:** 2026-09-27
**Blueprint:** [Sections 8.1 and 8.4](../blueprint.md#8-architecture--tech-stack)
**Files changed:** docs/testing/native-upload.md, docs/learning/30-android-development-build.md, docs/learning/README.md, TASKS.md
**Prerequisites:** [28-native-gallery-upload.md](28-native-gallery-upload.md), [29-repository-navigation.md](29-repository-navigation.md)

## 1. What this task was

Prepare the Android development app so the team can use the custom gallery uploader. Starting the code server alone does not install the app. The uploader needs an Android build because Expo Go does not contain our native module.

## 2. The concept

An APK is an Android installation file. A development build is an app made for testing: it includes our native modules and developer tools. Native modules are code compiled specifically for Android, rather than JavaScript loaded while the app runs.

Metro is the local server that supplies JavaScript to the installed development app. Gradle is the tool that compiles and packages the Android app. These do different jobs: Gradle makes the app; Metro supplies the changing screen and application code during development.

A QR code is a connection address, not an installation file. Scanning it cannot add our uploader to Expo Go.

## 3. The decision

Use a local Android development build with the existing application ID, `com.beautilyze.app`. This supports the uploader's memory-backed processing without changing the verdict engine or backend architecture.

Continuing to use Expo Go for upload was rejected because it cannot load this module. Switching to the standard file-backed native picker was rejected because the project requires no app-created face-image files. The trade-off is an initial native build and another build whenever native code or native configuration changes. Most JavaScript screen edits still use Metro without rebuilding.

The underlying architectural proposal remains [the native upload ADR proposal](../reviews/native-upload-decision.md), not a new locked decision.

## 4. The code, line by line

`app/app.json` identifies the Android application:

```json
"android": {
  "package": "com.beautilyze.app"
}
```

This is an excerpt, not the complete Android configuration. Android uses the package ID to distinguish this installation from other apps.

`app/modules/memory-upload/expo-module.config.json` registers the uploader for native discovery. The existing Android implementation lives in `app/modules/memory-upload/android/src/main/java/expo/modules/memoryupload/MemoryUploadModule.kt`. Lesson 28 explains its memory and network boundaries; this task does not change them.

`app/android/gradlew.bat` runs the project's configured Gradle version:

```powershell
.\gradlew.bat :app:assembleDebug --console=plain
```

`:app` selects the Android application, rather than just the uploader library. `assembleDebug` compiles a development installation file. `--console=plain` makes build output readable in a terminal. This command does not install anything on the phone.

`docs/testing/native-upload.md` is the operational checklist for installation, connection, and device verification. Generated Android build files are not a new application architecture.

## 5. How to verify it works

From the repository root, build the APK:

```powershell
Set-Location app/android
.\gradlew.bat :app:assembleDebug --console=plain
```

Expect `BUILD SUCCESSFUL` and `app/android/app/build/outputs/apk/debug/app-debug.apk`. `BUILD FAILED` means no usable new APK is established; read the named failed task before retrying.

Transfer the APK to your Android phone through a trusted local method such as USB. Open it to install. Android may ask you to permit installation from the file manager; allow only that source for this installation, then revoke the permission. Do not disable Play Protect or other device security controls.

In a new terminal at the repository root, start Metro:

```powershell
Set-Location app
npx expo start --dev-client --lan --scheme exp+app
```

Keep the phone and computer on the same trusted Wi-Fi. Open the installed app, currently named `app`, and use its development launcher to connect to the running server. Use the current address printed by Metro, not an old browser link. A LAN address has a colon before its port, for example `:8081`.

An installed app opening its launcher verifies installation. Loading the project verifies Metro connectivity. Neither verifies image upload: follow the device acceptance checks in the native-upload guide with an existing non-sensitive image and the configured HTTPS server.

## 6. What could go wrong

- A browser shows `/_expo/link` with a 404: the server could not provide a development-app redirect, or the link refers to the wrong server. Restart in explicit development-client mode and use the fresh address. Check that the APK is installed.
- The launcher cannot reach Metro: confirm the current port and shared Wi-Fi. Guest Wi-Fi, VPN routing, or firewall rules may prevent phone-to-computer access. Do not disable the firewall globally.
- The app opens but upload fails: Expo Go cannot run the uploader, and a custom build still needs a reachable HTTPS inference server. Check which app is open and the server configuration; do not weaken TLS checks.

## 7. If you remember one thing

Build and install the Android app once, then use Metro for ordinary JavaScript changes; a QR code does not replace installation.

## 8. Questions to ask yourself before the defense

1. Why not Expo Go? Its prebuilt native modules do not include our custom uploader.
2. Does Gradle start the inference server? No. It builds the Android application; inference is a separate service.
3. When is rebuilding required? When native code, native dependencies, or native configuration changes; ordinary JavaScript changes usually reload through Metro.
4. Does a successful APK build prove photo privacy? No. It proves compilation and packaging, not device behavior. The privacy checklist still needs device evidence.
5. Is this a standalone release APK? No. This is a debug development app that uses Metro, not a production release for distribution.
