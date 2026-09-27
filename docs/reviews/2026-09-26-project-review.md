# Project review and remaining enhancement plan

Reviewed 2026-09-26 against the blueprint and current working tree. This is
not a release sign-off. Existing uncommitted catalog, migration, seed, and
learning changes were preserved; they are not all changes from this pass.

## Fixed in this pass

- Search request ordering: late responses no longer replace current results.
- Search error/empty confusion: failure has a retry action, blank input does not
  claim no matches, and results no longer overlay later page content.
- Recent-check errors and account changes: failures propagate and stale
  account responses are ignored. Home does not repeat the list heading.
- Home: narrow emoji cards replaced by confirmed-profile rows and stacked
  actions; Scan Product corrected to Scan Skin; no verified-count claim.
- History: removed guessed personal values and default Clear labels; missing
  factors no longer produce a fabricated zero score. Refresh failure is visible,
  stale requests are ignored, static rows no longer pretend to be buttons.
- Authentication: same-account refresh no longer reloads over an unsaved draft;
  scheduled work is cancelled on unmount; session rejection is handled.
- Inference response boundary: reject unsupported classes, invalid scores,
  and missing model versions before the scan workflow uses them.

## Open findings, in priority order

### P1: Native scanning is unavailable

`app/src/scan/components/CameraViewport.tsx:45` rejects non-web capture;
`app/src/scan/hooks/useScan.ts:70` similarly rejects native gallery input.
This protects the no-disk commitment but leaves blueprint 4.1 incomplete.

Plan: approve a memory-only native capture design, including whether a custom
development build replaces Expo Go. Verify the actual capture API, temporary
files, upload transport, error cleanup, and image lifetime on both platforms.
Do not remove the guard or weaken the privacy promise to make a demo work.
New dependencies/native boundary changes need an ADR proposal and approval.

### P1: Check-history saving is not wired

`app/src/catalog/api.ts:12` defines `saveCheck`, but a repository-wide reference
search finds no caller. Passing history-read tests does not mean new checks
are saved. Existing records may display while the ordinary flow produces none.

Plan: define one save event per completed user check, bind it to the same
authenticated owner, report failures, and avoid duplicates from rerenders or
retry. Do not silently add a new section to the locked verdict screen. Test
guest behavior, double activation, account switches, retries, and live RLS.

### P1: Deployment and ownership remain unverified

Migrations and atomic profile-save code exist, but this pass did not apply
migrations or use a live database. Pending working-tree migration changes
must be reconciled with deployed history before execution; never assume a
deleted duplicate migration was unapplied on every environment.

Plan: owner-run staging migration review, two-account access tests, failed-save
rollback tests, and account-deletion cascade checks. Do not delete existing
database rows based only on an old task note; establish a backup and exact
affected identities first. Dashboard and secret operations remain manual.

### P1: Model evaluation and image privacy need real evidence

`docs/ai-evaluation.md` still contains PENDING validation results. The passing
server suite uses controlled/mock behavior and does not establish accuracy,
actual checkpoint compatibility, or deployed disk/log retention.

Plan: consented held-out examples, per-class confusion matrices, checkpoint
provenance, low-score/failed-image cases, and deployment log/temp-file inspection.
Published accuracy is not this project's measured accuracy.

### P2: Visual system is not implemented consistently

`docs/design/imagery.md` specifies Lucide and bundled Fraunces/Inter; navigation
uses Ionicons, `app/package.json` lacks Lucide, and the documented
`app/src/assets/fonts/` folder is absent. Raw font names do not bundle fonts.
Other screens still have emoji, inline sizes, and low-contrast text treatments.

Plan: approve the icon dependencies, obtain licensed font files, load fonts with
a fallback, then build/use the documented shared primitives. Audit every screen
at narrow widths and enlarged text. Keep the verdict composition locked.
No claim of visual completion until real screenshots/device testing are reviewed.

### P2: Scan requests lack a timeout/cancellation policy

`app/src/scan/api.ts` validates answers now, but requests can remain pending;
`useScan` still retains the capture URI for retry and duplicates confidence
helpers. Returning JSON is not proof of face detection.

Plan: document timeout and cancellation behavior without inventing thresholds,
cancel requests when leaving the flow, bound image lifetime, retain independent
field acceptance, and test permission rejection, retry, and unmount. Review
real preprocessing before promising no-face detection.

### P2: Guest-to-account navigation and saved-state feedback need completion

AuthGate stores guest mode locally; the guest can enter the app but has no
clear path back to account creation from the profile. Profile edits use explicit
saving, while historical task notes describe debounced saving.

Plan: add a documented sign-in route from guest profile, preserve or explicitly
discard a guest draft with the user's choice, and distinguish local draft,
saving, saved, and failed states. Test both successful and failed transitions.

### P2: Catalog coverage is sparse despite reaching 30 products

Validator output: 30 products, 26 concerns, 27 unmatched-ingredient warnings.
The validator checks structure/evidence fields; it does not independently
verify every external source or annotator agreement. Many products correctly
remain partial, which limits useful verdicts.

Plan: prioritize sourced alias/ingredient coverage and independent annotation
review. Preserve unknown evidence; never force partial_data false or invent
properties just to produce more matches. Regenerate and compare seeds only
after reviewing the CSV source and existing uncommitted changes.

### P2: Tests and documentation overstate completion

Several screen tests replace children with stubs and cannot prove real layout
or integrated navigation. Historical learning files contain claims that are no
longer true (server writes scans, history infers badges, automatic profile sync).
Architecture says no Zustand while the implementation uses Zustand.

Plan: use the new learning reading map and append corrections, add real-boundary
integration tests, remove warning sources without suppressing warnings, and
propose an ADR for the current state-management choice. Historical entries
remain unchanged; a green mock suite is not a completed native demo.

## Acceptance gates

1. Automated: app typecheck/lint/tests, server tests, catalog validation.
2. Data: staging migrations, two-user ownership, real profile saves and history.
3. Privacy/AI: memory-only native scan and measured model evaluation.
4. Visual: fonts/icons resolved, device screenshots, keyboard/large-text checks.
5. Teaching: each finished repair has snippets, verification, and defense questions.

Only gate 1 has local automated evidence in this pass. Warnings and the exact
verification outcome are recorded in the task report; gates 2-4 remain open.
