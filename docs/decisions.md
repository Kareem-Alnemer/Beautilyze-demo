# Decisions

Append-only log of locked architectural and product decisions.

Format: one ADR-style entry per decision. Never edit a past entry — add a
new one that supersedes it.

---

## ADR-001 — Verdict Engine Remains an Internal Domain Module

**Date:** 2026-09-24

**Context:**
The verdict engine is the deterministic, inspectable core of BeautiLyze
(blueprint §6). It must be independent of the ML layer (§5.6). One
proposal was to extract it into `packages/verdict-engine/` as a workspace
package.

**Decision:**
The engine stays at `app/src/verdict/` for the MVP. It is a self-contained
module with its own README, public `index.ts`, types, and colocated tests.
It is not published as a workspace package.

**Alternatives considered:**
1. `app/src/lib/verdict/` — rejected; buries the domain module under
   utility code and undersells its boundary.
2. `packages/verdict-engine/` with workspace tooling — deferred; the MVP
   has one consumer (the app), and workspace tooling adds configuration
   and failure modes without providing functionality the MVP needs.
3. Dual implementation (TS in app + Python in server) — rejected; there
   is no server-side consumer.

**Consequences:**
- The engine is structurally isolated (own folder, own tests, own README).
- No workspace tooling, no `pnpm-workspace.yaml`, no Turborepo/Nx.
- The engine is consumed via a public API (`evaluate(profile, product)`).
- Extraction trigger: a second consumer appears (web client, CLI, separate
  backend, independent test package). Until then, no change.

---

## ADR-002 — Verdict Engine Is App-Side, Not Server-Side

**Date:** 2026-09-24

**Context:**
The engine could run in the FastAPI server or in the Expo app. The
blueprint (§8.1) chose React Native + Expo for speed. §3.2 says the scan
path is optional.

**Decision:**
The verdict engine runs in the app, in TypeScript. It is pure. It takes a
`Profile` and a `Product` and returns a `Verdict`.

**Alternatives considered:**
1. Server-side (Python) — rejected; adds a network hop to the core product
   action (the check), contradicts the speed goal, and requires FastAPI for
   a flow the blueprint says is optional.
2. Shared spec with dual implementation — rejected; overkill for a 2-person
   capstone.

**Consequences:**
- The check flow works without the inference server running.
- The engine's tests run in Jest, fast, in CI, no Python needed.
- Catalog data still lives in Supabase; the app fetches products and runs
  the engine locally.

---

## ADR-003 — Catalog Seed Is CSV → Script → SQL

**Date:** 2026-09-24

**Context:**
The catalog (§7) is 30–50 hand-annotated products. It must be reviewable
in PRs and reproducible.

**Decision:**
- `catalog/*.csv` is the source of truth. Human-edited.
- `scripts/seed-catalog.ts` validates and generates SQL.
- `supabase/seed/*.sql` is the generated artifact. Committed.

**Alternatives considered:**
1. Hand-edit SQL directly — rejected; not reviewable, error-prone.
2. Insert via a script at runtime — rejected; not reproducible, not
   reviewable in PRs.
3. Supabase Studio import — rejected; not in version control.

**Consequences:**
- Editing the catalog means editing CSV, not SQL.
- Regenerating seed is a one-command step.
- CI validates the catalog on PRs that touch `catalog/`.

---

## ADR-004 — No MCP Servers for the MVP

**Date:** 2026-09-24

**Context:**
`chrome-devtools-mcp` was proposed for testing. It drives Chrome.

**Decision:**
No MCP servers are configured for the MVP. `chrome-devtools` is disabled.
The `mcp/` folder is not maintained.

**Alternatives considered:**
1. `chrome-devtools-mcp` — rejected; app is React Native (not web) and
   server is Python. It has no use here.
2. Filesystem MCP scoped to repo root — rejected; the agent's built-in
   file tools are sufficient.
3. GitHub MCP — deferred; git commands are Zone B (human-run) for now.

**Consequences:**
- Agent uses built-in file tools and terminal (with approval) only.
- No MCP-related configuration in `opencode.json`.
- Revisit only if a web client is added.

---

## ADR-005 — `.opencode/` vs `.agents/` Split

**Date:** 2026-09-24

**Context:**
Two folders hold agent configuration. The boundary must be written down or
they drift.

**Decision:**
- `.opencode/` — OpenCode-specific configuration (agent definitions,
  MCP setup if any).
- `.agents/` — reusable skills and playbooks (cross-tool, ADK-compatible).
- When unsure: put it in `.agents/`.

**Consequences:**
- Skills for catalog, verdict engine, screens, endpoints, tests, git, UI,
  all live in `.agents/skills/`.
- The one OpenCode agent definition lives in `.opencode/agents/`.
- A future migration to another agent host only requires rewriting
  `.opencode/`, not `.agents/`.

---

## How to add a new ADR

1. Copy the format above.
2. Number sequentially (`ADR-006`, `ADR-007`, ...).
3. Never edit a past entry. If a decision changes, write a new ADR that
   supersedes it and note the supersession in the new entry.
4. The human owns this file. The agent drafts; the human commits.