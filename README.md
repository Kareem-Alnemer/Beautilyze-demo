# BeautiLyze

A "check before you buy" skincare tool. A user sets a profile (manually or
via AI scan), searches a product in a curated catalog, and gets a
deterministic **match / caution / mismatch** verdict with plain-language
explanations of which factors matched and which didn't.

BeautiLyze is a compatibility-checking tool, not a diagnostic or medical
device. It does not replace a dermatologist or professional skincare
advice.

**Status:** Capstone MVP, in development.

## Start Here

- **Run or test the app:** [app/README.md](app/README.md).
- **Understand the code:** [project reading map](docs/learning/26-project-reading-map.md).
- **Find documentation:** [docs/README.md](docs/README.md).
- **See unfinished work:** [TASKS.md](TASKS.md).
- **Native gallery upload:** [build and verification guide](docs/testing/native-upload.md).

The two source projects are `app/` and `inference-server/`. Root-level npm
dependencies serve catalog scripts; they are not a second mobile app.
`app/app/` contains navigation routes, while `app/src/` contains application code.
`app/modules/` contains native extensions compiled into custom builds.
Folders such as `node_modules/`, `.expo/`, `.pytest_cache/`, and `.test-deps/`
are installed or generated tooling, not source to study or edit.

From the repository root, with dependencies already installed:

```powershell
npm run app:typecheck
npm run app:lint
npm run app:test
npm run app:dev
```

`app:dev` starts Metro for a custom development build. It does not build or
install the phone app. Expo Go cannot load the native gallery-upload module.

---

## What's in this repo

| Folder | What it is |
|--------|------------|
| `app/` | React Native + Expo mobile client |
| `inference-server/` | FastAPI inference service (scan path only) |
| `supabase/` | Database schema, migrations, seed data |
| `catalog/` | Hand-annotated product catalog (CSV source of truth) |
| `datasets/` | ML datasets (gitignored, local only) |
| `scripts/` | Repo-level automation (catalog seed, validation) |
| `docs/` | Everything humans read: blueprint, decisions, design, agent rules |
| `.agents/` | Reusable AI agent skills and playbooks |
| `.opencode/` | OpenCode-specific agent configuration |

---

## How to run it (local development)

### Prerequisites

- Node.js 20+
- Python 3.11+
- `uv` (Python package manager)
- A BeautiLyze development build on a phone or emulator (Expo Go cannot run the custom uploader)
- A Supabase project (free tier is fine)

### Setup

1. Clone the repo.
2. Copy `.env.example` to `.env` and fill in the values.
3. Install app dependencies using the committed npm lockfile:
       npm --prefix app ci
4. Install server dependencies:
       cd inference-server
       uv sync
5. Apply Supabase migrations (see `supabase/README.md`).
6. Seed the catalog (see `supabase/README.md`).

### Run

Terminal 1 — inference server:
    cd inference-server
    uv run uvicorn inference_server.main:app --reload

Terminal 2 — mobile app:
    cd app
    npm start -- --dev-client

Open the installed BeautiLyze development build. Expo Go remains useful for
non-native flows, but cannot exercise the custom gallery upload.

---

## Where to start reading

If you're new to the repo:

1. `docs/blueprint.md` — what the product is and what it does
2. `docs/architecture.md` — how it's built
3. `docs/decisions.md` — why it's built that way
4. `AGENTS.md` — how the AI agent behaves in this repo
5. `docs/orchestrator/` — the agent's operating rules

If you're an AI coding agent:

Read `AGENTS.md` first. It's the contract.

---

## Tests

    npm run app:test
    cd inference-server && pytest

---

## License

See `LICENSE`.

---

## Disclaimer

BeautiLyze is a compatibility-checking tool, not a diagnostic or medical
device. It does not replace a dermatologist or professional skincare
advice. Verdicts are based on the product information available in our
catalog and the profile you provide. Allergies are checked against the
ingredient list we have; if we don't have a complete ingredient list,
absence of a detected conflict does not mean a product is safe for you.
If you have a known allergy, always check the physical product label
before use.
