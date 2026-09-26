# Onboarding screen (first-run baseline form)

**Date:** 2026-09-26
**Blueprint:** §4.2 (should-have onboarding), §4.1, §5.3, §6.1, §10.2
**Files changed:** app/src/screens/OnboardingScreen.tsx, app/src/screens/__tests__/OnboardingScreen.test.tsx, app/app/onboarding.tsx, app/src/auth/OnboardingGate.tsx, app/app/_layout.tsx, app/src/profile/store.ts, app/src/profile/onboardingStorage.ts, app/package.json, docs/design/screens/onboarding.md
**Prerequisites:** 09-profile-store-and-screen-tests.md, 19-stabilization-review.md

## 1. What this task was

New users landed straight in the tab flow with an empty profile, so their first verdict had no data. This task adds a first-run form (skin type required; acne severity, age, sensitivities, allergies optional) that writes into the existing profile store, marks the device as onboarded, and routes into the tabs. Returning users never see it.

## 2. The concept

Onboarding is a gate, not a profile editor. Think of it as a front door: it asks the one question the verdict cannot do without (skin type), accepts anything else the user offers, stamps the device as "entered," and gets out of the way. The store stays the single draft — the screen holds no form state — so Profile and Onboarding can never disagree.

## 3. The decision

What were the options? Why was this one chosen? What was rejected and why?

- Completion flag in AsyncStorage, not Supabase. Rejected a profiles column because it needs migration 006 for purely local knowledge; the server never needs to know whether this device onboarded.
- Reused the five existing profile primitives instead of new inputs. Rejected bespoke pickers because new inputs mean new matching semantics to defend; the managers already carry the honest helper-copy contract.
- Best-effort sync: guests finish locally, signed-in users attempt the atomic save, failures show an inline notice but still navigate. Rejected blocking on sync failure because the local store (not Supabase) is the verdict's source of truth.
- Submit stays pressable while invalid (dimmed) so the validation notice can fire. Rejected a hard-disabled button because on a real device a disabled button cannot be pressed, which would make the "choose skin type" notice unreachable dead code.
- Preset chips limited to fragrance and essential oils (the only sensitivity-flagged lookup entries). Rejected the spec's wider examples (sulfates, nuts, soy, latex) because they match nothing and would silently do nothing.

## 4. The code, line by line

- app/src/profile/onboardingStorage.ts: AsyncStorage behind a lazy require with in-memory fallback. If the native module is missing (Jest) or throws, reads return false and writes keep a session value — onboarding at worst repeats once, never crashes.
- app/src/profile/store.ts: new `hasCompletedOnboarding` boolean plus `setHasCompletedOnboarding` (sets state, persists) and `loadOnboardingStatus` (rehydrates on launch). `setUserId` and `resetProfile` deliberately preserve the flag: completion is device-level, so signing in after guest onboarding must not bounce the user back.
- app/src/screens/OnboardingScreen.tsx: five sections in profile.md order with helper copy (including the word-for-word matching disclosure). `handleSubmit` reads the store directly (never stale closures), requires skin type, sets the flag, syncs only when `user_id` exists, then `router.replace('/')`.
- app/src/auth/OnboardingGate.tsx: null-rendering gate inside AuthGate. Waits for the persisted flag to load before redirecting, so first paint never flashes the wrong screen; redirects to `/onboarding` when incomplete and back to `/` when done.
- app/app/onboarding.tsx: one-line route re-export, matching the repo's route style.
- app/package.json: `@react-native-async-storage/async-storage` moved from devDependencies to dependencies (it ships in the app bundle; no install was needed).

## 5. How to verify it works

Copy-pasteable. Failure looks like a non-zero exit or FAILED lines.

```
cd app
npx tsc --noEmit
npx eslint src --ext .ts,.tsx --quiet
npx jest src/screens/__tests__/OnboardingScreen.test.tsx
npx jest
```

Expect: typecheck clean, lint clean, 7 onboarding tests pass, full suite 33 suites / 364 tests pass. Device check (human): fresh install → onboarding shows; complete → tabs; relaunch → tabs directly.

## 6. What could go wrong

- If AsyncStorage writes fail on a real device, onboarding repeats next launch. Data is not lost (store sync is separate); the flag just didn't stick.
- If the gate redirected before the flag loads, users would flash through onboarding every launch. The `ready` state exists specifically to prevent this — do not remove it.
- If a future test imports the store without mocking AsyncStorage, the lazy require plus fallback keeps it green; a top-level import would not.

## 7. If you remember one thing

Onboarding completion is device knowledge, not profile data: it lives in AsyncStorage, survives sign-in changes, and never blocks entry on a failed network save.

## 8. Questions to ask yourself before the defense

- Why is the flag local instead of a Supabase column? Because no server or verdict logic consumes it; a migration would add process without function.
- Why preserve the flag across setUserId? Because guest-then-sign-in is the normal path, and resetting would trap users in an onboarding loop.
- Why is submit pressable before skin type is chosen? Because a hard-disabled button makes the validation notice unreachable on a real device.
- Why only two preset chips? Because they are the only sensitivity suggestions that resolve to flagged lookup entries; the rest would be decoration.
- Why does a failed Supabase save still navigate? Because the local store feeds the verdict engine; blocking entry on network state would break offline-first use.
