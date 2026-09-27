# Learning

Study material for the BeautiLyze capstone. One file per task, written
by the agent as the code is built, in the order it was built.

This is not documentation for users. It is teaching material for the
team — so that every line of code can be explained and defended.

## How to read this

- Start at file 001 and read forward. Each file lists its prerequisites.
- 15 minutes a day is enough. Do not try to read all of them at once.
- After each file, close the tab and try to explain it aloud to yourself
  or a teammate. If you can't, re-read §2 and §4.
- Before the demo, ask the agent to run "quiz mode."

## Index

| # | File | Topic | Date |
|---|------|-------|------|
| 1 | [01-verdict-engine-types.md](01-verdict-engine-types.md) | Verdict engine type definitions | 2026-09-25 |
| 2 | [02-allergen-factor.md](02-allergen-factor.md) | Allergen factor implementation & exact matching | 2026-09-25 |
| 3 | [03-sensitivity-factor.md](03-sensitivity-factor.md) | Sensitivity factor implementation & alias resolution | 2026-09-25 |
| 4 | [04-skin-type-fit.md](04-skin-type-fit.md) | Skin-type fit compatibility factor | 2026-09-25 |
| 5 | [05-acne-fit.md](05-acne-fit.md) | Acne-concern fit factor with severity tiers | 2026-09-25 |
| 6 | [06-age-fit.md](06-age-fit.md) | Age fit factor with free-text parsing | 2026-09-25 |
| 7 | [07-verdict-engine-aggregation.md](07-verdict-engine-aggregation.md) | Verdict engine aggregation (precedence, score, index) | 2026-09-25 |
| 8 | [08-catalog-pipeline.md](08-catalog-pipeline.md) | Catalog & ingredient database pipeline | 2026-09-25 |
| 9 | [09-profile-store-and-screen-tests.md](09-profile-store-and-screen-tests.md) | Profile store, Supabase sync & ProfileScreen tests | 2026-09-25 |
| 10 | [10-search-and-verdict-screens.md](10-search-and-verdict-screens.md) | Search & Verdict UI screens with locked composition | 2026-09-25 |
| 11 | [11-inference-server.md](11-inference-server.md) | FastAPI inference server with mock/PyTorch/ONNX models | 2026-09-25 |
| 12 | [12-scan-screen-and-ai-workflow.md](12-scan-screen-and-ai-workflow.md) | Scan screen state machine & AI workflow integration | 2026-09-26 |
| 13 | [13-home-screen-and-navigation.md](13-home-screen-and-navigation.md) | Home screen dashboard & root tab navigation | 2026-09-26 |
| 14 | [14-ci-cd-pipeline.md](14-ci-cd-pipeline.md) | GitHub Actions CI/CD pipeline with parallel jobs | 2026-09-26 |
| 15 | [15-production-deployment-scaffolding.md](15-production-deployment-scaffolding.md) | Docker multi-stage build & EAS build profiles | 2026-09-26 |
| 16 | [16-security-and-privacy-hardening.md](16-security-and-privacy-hardening.md) | Rate limiting, privacy headers, CORS lockdown | 2026-09-26 |
| 17 | [17-fastapi-analyze-endpoint.md](17-fastapi-analyze-endpoint.md) | FastAPI /analyze endpoint & Supabase integration | 2026-09-26 |
| 18 | [18-scan-history-screen.md](18-scan-history-screen.md) | Scan history screen with badges, pull-to-refresh | 2026-09-26 |
| 19 | [19-stabilization-review.md](19-stabilization-review.md) | Stabilization review: typecheck, lint, tests, boundaries | 2026-09-26 |
| 20 | [20-catalog-expansion-30-products.md](20-catalog-expansion-30-products.md) | Catalog expansion to 30 products | 2026-09-26 |
| 21 | [21-onboarding-screen.md](21-onboarding-screen.md) | Onboarding screen (first-run baseline form) | 2026-09-26 |
| 22 | [22-ai-accuracy-documentation.md](22-ai-accuracy-documentation.md) | Migration 006 + AI evaluation documentation | 2026-09-26 |
| 23 | [23-ui-stability-audit.md](23-ui-stability-audit.md) | Audit-first UI stability + token polish | 2026-09-26 |

| 24 | [24-ui-and-request-lifecycle.md](24-ui-and-request-lifecycle.md) | UI clarity, late requests, failure vs empty | 2026-09-26 |
| 25 | [25-profile-and-prediction-boundaries.md](25-profile-and-prediction-boundaries.md) | Auth drafts, prediction validation, truthful history | 2026-09-26 |
| 26 | [26-project-reading-map.md](26-project-reading-map.md) | Current code paths and unfinished boundaries | 2026-09-26 |
| 27 | [27-profile-form-polish.md](27-profile-form-polish.md) | Readable forms, honest save states, and derived-data render loops | 2026-09-27 |
| 28 | [28-native-gallery-upload.md](28-native-gallery-upload.md) | Native in-memory gallery upload and custom-build boundaries | 2026-09-27 |
| 29 | [29-repository-navigation.md](29-repository-navigation.md) | Repository maps, root commands, source versus generated files | 2026-09-27 |

## Start Here For The Current Code

Read [26: the project reading map](26-project-reading-map.md) with the code open.
Then use a focused route through the chronological lessons:

- Verdict defense: 01 through 07, then 19 and 26. Explain precedence before score.
- Data/evidence: 08, 20, then 26. Validator success is not independent source verification.
- Profile and identity: 09, 21, then 25 and 27. Current saving is explicit and atomic, not the historical debounced multi-write implementation.
- AI and privacy: 11, 12, 16, 17, 22, then 25 and 26. Lesson 17's server database writes are historical; current server only predicts.
- Interface and asynchronous behavior: 10, 13, 18, 23, then 24 and 25. Old emoji mockups and inferred history badges are superseded.
- Release evidence: 14 and 15, then the [current review](../reviews/2026-09-26-project-review.md). Mock tests do not certify device capture, deployed RLS, model quality, or pixel layout.

## Study Method

For each chapter, answer what it does, why that approach was chosen, and where
the function lives. Open the referenced file and trace one concrete example.
Run its verification command; distinguish an assertion failure from an
environment/setup problem. Take turns answering the defense questions aloud.

Old entries are historical records, not release certifications. Corrections go
in a new chapter; do not edit old lessons to hide a changed decision. Test counts
are dated observations, not numbers future contributors should hardcode.
