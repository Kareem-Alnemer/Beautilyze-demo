# Mobile App

## Folder Map

| Folder | Responsibility |
| --- | --- |
| `app/` | Expo Router route files; connect URLs/tabs to screens |
| `src/auth/` | Sign-in and profile-loading gate |
| `src/profile/` | Editable profile, shared form controls, account persistence |
| `src/catalog/` | Product queries and the hook that calls the verdict engine |
| `src/verdict/` | Pure deterministic rules; no network or React |
| `src/scan/` | Photo-analysis UI, requests, and result acceptance |
| `src/home/` | Home screen and its sections |
| `src/screens/` | Search, Verdict, History, and onboarding screens |
| `src/components/ui/` | Generic reusable controls |
| `src/components/` | Product/verdict display components |
| `src/theme/` | Shared visual values |
| `modules/` | Local Android/iOS extensions requiring a custom build |
| `assets/` | App icon and launch assets |

Tests sit next to their owning feature or in `src/__tests__/`. Do not move
them just to make the tree symmetrical: imports, Jest configuration, and
learning references depend on the current paths.

## Commands

From the repository root: `npm run app:typecheck`, `npm run app:lint`,
`npm run app:test`, and `npm run app:dev`.

From this folder: `npm run typecheck`, `npm run lint`,
`npm test -- --runInBand`, and `npm start -- --dev-client`.

The root and app have different package.json files. The app lockfile controls
mobile dependencies. Use the SDK-compatible Expo installer for native packages;
do not resolve peer conflicts with `--force`.

See [native upload verification](../docs/testing/native-upload.md) before
expecting gallery upload to work on a phone. Native source changes require a
new build; reloading JavaScript is not enough.
