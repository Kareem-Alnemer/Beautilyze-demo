# Native Gallery Upload Decision (Proposed ADR)

Status: implementation authorized by the owner; native builds and device privacy
verification pending. The human owns adoption into docs/decisions.md.

## Context

Blueprint 8.4 forbids app-created face-image files. The installed Expo image
picker creates cache files on Android and iOS, so its native path was disabled.
The owner approved a custom native build on 2026-09-27.

## Decision

Use a local Expo module for gallery selection and upload. Android reads a
user-selected content URI through ContentResolver; iOS reads an NSItemProvider
data representation. Send a memory-backed multipart body to the existing
HTTPS /analyze endpoint. Return response JSON, not image bytes or image paths,
to JavaScript. Do not use a disk cache, background upload, logs, or redirects.
Use the server's existing 5 MiB upload limit and JPEG/PNG types.

## Alternatives Considered

- Re-enable expo-image-picker: rejected because it creates app cache files.
- Delete a temporary file afterward: rejected because deletion is not never-writing.
- Base64 across the JavaScript bridge: rejected to avoid another retained image copy.
- Browser-only workaround: does not repair the requested native workflow.

## Consequences

Expo Go cannot contain this module; rebuild the native app. Native camera
capture remains disabled and is not part of this gallery-upload repair.
Retry requires selecting a photo again; the app does not retain image bytes.
Operating-system/photo-provider storage is outside the app's control. The
original gallery photo already exists; the guarantee concerns new files made
by BeautiLyze, not deletion of the user's original or provider caches.
Native compilation and on-device file inspection are mandatory before release.

API references: [Android ContentResolver](https://developer.android.com/reference/android/content/ContentResolver),
[Apple PHPickerViewController](https://developer.apple.com/documentation/PhotosUI/PHPickerViewController),
[Apple NSItemProvider](https://developer.apple.com/documentation/foundation/nsitemprovider).
