# Enhancement Acceptance Record

## Evidence Boundaries

2026-09-28: owner reports the Android APK working. This confirms a human-reported
installation/launch outcome, not a new APK built by this pass, a privacy audit,
database isolation, or model accuracy. New SVG support requires rebuilding the
development APK after this pass. Existing application/signing configuration is
preserved. Do not distribute a debug APK as a production release.

The supplied staging domains and anon-key value were placeholders. No request
was sent to them and no password was stored. The supplied dataset directory was
absent. The configured inference variable is `EXPO_PUBLIC_INFERENCE_SERVER_URL`.

## Android Visual Check

Use a narrow Android phone (or emulator at 320 and 360 logical-pixel widths),
normal and largest supported system text, portrait, TalkBack on/off, keyboard
open/closed. Record device, Android version, APK commit, dimensions and text scale.
Use synthetic profile data and never include a face photo in screenshots.

| Area | Required observation |
| --- | --- |
| Navigation | Five tab labels readable; bottom system navigation does not cover controls; icons remain consistent outlines |
| Fonts | Inter body and Fraunces headings load offline; medium/semibold distinct; system fallback remains readable on simulated font failure |
| Onboarding | All fields and submit reachable with keyboard open; submit disabled without skin type; save error stays visible with Retry and Continue without saving |
| Search | Filters wrap; checked state spoken; Clear filters preserves text; ingredient text wraps and is spoken; no result/action clipping |
| Verdict | Full expanded reasons readable, Show/Hide state announced, existing section order and disclaimer preserved |
| Scan | Native entry offers gallery/manual without requesting camera permission; failed upload offers reselect/manual; no preview or dead native Retake action |

Automated style/prop tests do not establish pixel correctness. This table remains
unverified until screenshots and TalkBack observations are recorded by the team.

## Offline Journeys

1. Open a signed-in profile, disconnect the network, edit one field and save.
   The draft must remain visible; success must not be claimed. Reconnect and retry.
2. Fail onboarding account save. It must not navigate or mark completion until
   retry succeeds or the user chooses Continue without saving.
3. Start a catalog search and disconnect. Error and Retry must replace loading;
   do not show a false empty catalog. Reconnect, retry, then change filters while
   a previous request is pending: the earlier result must not replace the latest.
4. Load history offline. Error must differ from empty history. Switch test users;
   a late first-user response must not become the second user's history.
5. Interrupt gallery upload. There must be no success state or retained image;
   reselect with connectivity restored. Follow the native privacy checklist.

This app does not promise an offline catalog or a durable offline-save queue.
An in-memory draft does not survive every process restart. Verify those limits
in UI copy rather than claiming persistence that does not exist.

## Real Account Isolation

Use an explicitly approved disposable Supabase project and two team-controlled
accounts A/B, plus a signed-out client. Never use a service-role key: it bypasses
the row-level security (RLS) being tested. RLS is the database rule restricting
rows to their owning user. Run through authenticated client calls, not dashboard
access. Dashboard/migration operations remain human-owned.

For profiles, allergies, sensitivities, checks, and any deployed scans table:

1. Create distinguishable synthetic A and B fixtures through each account's own
   client. Verify they can each read their own fixture. An empty table is not proof
   that isolation works.
2. With A's session, request B's known fixture ID. Expect no B row. Repeat B to A
   and signed-out reads of both fixtures.
3. Attempt insert/update/delete with the other account's user ID in this disposable
   environment. Expect rejection or zero affected rows as applicable. Re-read the
   fixture using its owner to prove it was not altered. Record results per action.
4. Exercise `save_profile` as both accounts. Ensure A cannot assign ownership to B,
   and that profile/list writes remain atomic when one value is rejected.
5. Confirm unauthenticated catalog reads work as intended while private rows do not.
6. Remove only the test fixtures created for this run using the owner's account,
   with team approval. Never delete unrelated rows to make the test pass.

Record applied migration versions, fixture IDs locally, timestamp, action, result,
and owner-side before/after confirmation. Do not record passwords, tokens, or health
data in committed evidence. No live security result is claimed by unit mocks.

## Complete Journeys Still Gated

Saving a product check and preserving a guest draft through account creation are
still unfinished implementation items in TASKS.md. A complete manual-profile to
saved-history journey cannot be certified until those are implemented. Native
memory-only camera capture also remains unfinished; gallery upload is not a
substitute for claiming camera completion. See model-evaluation.md for accuracy.
