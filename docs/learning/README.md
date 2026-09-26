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
| 1 | 01-verdict-engine-types.md | Verdict engine type definitions | 2026-09-25 |
| 2 | 02-allergen-factor.md | Allergen factor implementation & exact matching | 2026-09-25 |
| 3 | 03-sensitivity-factor.md | Sensitivity factor implementation & alias resolution | 2026-09-25 |
| 4 | 04-skin-type-fit.md | Skin-type fit compatibility factor | 2026-09-25 |
| 5 | 05-acne-fit.md | Acne-concern fit factor with severity tiers | 2026-09-25 |
| 6 | 06-age-fit.md | Age fit factor with free-text parsing | 2026-09-25 |
| 7 | 07-verdict-engine-aggregation.md | Verdict engine aggregation (precedence, score, index) | 2026-09-25 |
| 8 | 08-catalog-pipeline.md | Catalog & ingredient database pipeline | 2026-09-25 |
| 9 | 09-profile-store-and-screen-tests.md | Profile store, Supabase sync & ProfileScreen tests | 2026-09-25 |
| 10 | 10-search-and-verdict-screens.md | Search & Verdict UI screens with locked composition | 2026-09-25 |
| 11 | 11-inference-server.md | FastAPI inference server with mock/PyTorch/ONNX models | 2026-09-25 |
| 12 | 12-scan-screen-and-ai-workflow.md | Scan screen state machine & AI workflow integration | 2026-09-26 |
| 13 | 13-home-screen-and-navigation.md | Home screen dashboard & root tab navigation | 2026-09-26 |
| 14 | 14-ci-cd-pipeline.md | GitHub Actions CI/CD pipeline with parallel jobs | 2026-09-26 |
| 15 | 15-production-deployment-scaffolding.md | Docker multi-stage build & EAS build profiles | 2026-09-26 |

The agent adds one row per task.