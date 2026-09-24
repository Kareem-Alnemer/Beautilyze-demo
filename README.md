# BeautiLyze

A "check before you buy" skincare tool. A user sets a profile (manually or
via AI scan), searches a product in a curated catalog, and gets a
deterministic **match / caution / mismatch** verdict with plain-language
explanations of which factors matched and which didn't.

BeautiLyze is a compatibility-checking tool, not a diagnostic or medical
device. It does not replace a dermatologist or professional skincare
advice.

**Status:** Capstone MVP, in development.

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
- An Expo Go app on a phone, or an emulator
- A Supabase project (free tier is fine)

### Setup

1. Clone the repo.
2. Copy `.env.example` to `.env` and fill in the values.
3. Install app dependencies:
       cd app
       pnpm install
4. Install server dependencies:
       cd inference-server
       uv sync
5. Apply Supabase migrations (see `supabase/README.md`).
6. Seed the catalog (see `supabase/README.md`).

### Run

Terminal 1 — inference server:
    cd inference-server
    uv run uvicorn main:app --reload

Terminal 2 — mobile app:
    cd app
    pnpm start

Scan the QR code with Expo Go.

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

    cd app && pnpm test
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