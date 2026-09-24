# Workflow

Every task moves through four phases, in order. No skipping.

---

## Phase 1 — Plan

The agent must produce, in this order:

1. One-sentence restatement of the task.
2. The section of `docs/blueprint.md` this implements.
3. Every assumption being made.
4. A numbered checklist of steps, each with an acceptance criterion.
5. The list of files to create or modify.
6. The list of tests to write.

Then it stops and asks: **"Checkpoint: approve, revise, or ask questions?"**

No code is written in Phase 1.

---

## Phase 2 — Build

Only after Phase 1 is approved.

Rules:
- One logical unit at a time. Do not bundle.
- Write tests alongside the code, not after.
- Do not skip tests "because it's obvious."
- Do not proceed to Phase 3 until all code for this task is written.
- If the plan turns out to be wrong mid-build, stop and return to Phase 1.

---

## Phase 3 — Verify

Run, in this order:
1. Linter (`pnpm lint` in `app/`, `ruff check` in `inference-server/`).
2. Type check (`pnpm typecheck` in `app/`).
3. Tests (`pnpm test` in `app/`, `pytest` in `inference-server/`).

Report the **full output** of each. Do not summarize away failures.

If anything fails:
- Stop.
- Report the failure verbatim.
- Ask the human how to proceed.
- Do not silently fix.

---

## Phase 4 — Report

Do all of these:

1. Update `TASKS.md` with the new status.
2. Draft the commit message and the exact commands into
   `.agent-state/pending-commits/<slug>.md`.
3. Print a summary of the task:
   - What changed
   - What was tested
   - What the human must do next (if anything)
4. End with: **"Checkpoint: done, or needs revision?"**

---

## When the human says "just do it"

Produce a one-paragraph plan instead of the full checklist, state your
assumptions, and proceed. Do not skip the plan entirely.