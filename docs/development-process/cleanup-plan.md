# Cleanup Plan

The final repo-polish task. To be executed in the last week of the build,
after the demo works end to end.

## Trigger

The human creates a task in `TASKS.md`:

    [ ] Repo polish: archive development process artifacts

The agent does not start this task until the human explicitly asks for it.

## Steps

### 1. Move `AGENTS.md`
- Move `AGENTS.md` to `docs/development-process/AGENTS.md`.
- Rewrite the title: "# Development Conventions".
- Rewrite the opening paragraph to remove agent-framing:
  "This document describes the development conventions for this
  repository."
- Keep all rules intact. They describe how the work was done.

### 2. Move `docs/orchestrator/`
- Move `docs/orchestrator/` to `docs/development-process/orchestrator/`.
- No content changes. It is already neutral.

### 3. Move `.agents/`
- Move `.agents/skills/` to `docs/development-process/workflows/`.
- Move `.agents/playbooks/` to `docs/development-process/playbooks/`.
- Delete the now-empty `.agents/` folder.

### 4. Delete `.opencode/`
- Delete the entire folder. It is OpenCode-specific infrastructure.

### 5. Delete `.agent-state/`
- Already gitignored. Ensure it is not tracked. Delete from disk.

### 6. Rewrite the root `README.md`
- Reframe for the finished product, not the build process.
- Remove any mention of the agent or the development contract.
- Keep the "What's in this repo" section, updated.
- Keep the disclaimer.

### 7. Update cross-references
- Find every reference to `AGENTS.md`, `.agents/`, `.opencode/`,
  `docs/orchestrator/`.
- Update them to the new paths under `docs/development-process/`.
- Common places: `README.md`, `docs/architecture.md`,
  `docs/decisions.md` (ADR-005 references `.opencode/` and `.agents/`),
  `.github/CODEOWNERS` if it references paths.

### 8. Update `TASKS.md`
- Mark this task done.
- Remove any backlog items that are now obsolete.

### 9. Verification before commit
- [ ] `AGENTS.md` no longer exists at repo root.
- [ ] `.opencode/` no longer exists.
- [ ] `.agents/` no longer exists.
- [ ] `docs/development-process/` contains the moved content.
- [ ] Root `README.md` describes the product, not the process.
- [ ] All cross-references resolve.
- [ ] The app still runs (`pnpm start` in `app/`).
- [ ] All tests still pass.
- [ ] `git status` shows only the intended changes.

### 10. Propose the commit

    chore: archive development process artifacts

    Moves AGENTS.md, orchestrator docs, skills, and playbooks into
    docs/development-process/. Removes .opencode/ and .agent-state/.
    Rewrites root README.md for the finished product.

## What NOT to do

- Do not delete `docs/learning/`. It stays — it is study material for
  the defense.
- Do not delete `docs/blueprint.md`, `decisions.md`, `architecture.md`,
  `design/`, `testing/`, `annotation-methodology.md`, `glossary.md`,
  `privacy.md`. All of these describe the product and belong in the
  repo.
- Do not delete the skills' content. Move it, do not remove it.
- Do not rewrite history. This is a forward commit, not a
  `git filter-branch`.

## Why this approach

- The process is documented, not hidden.
- The product repo reads cleanly for a reviewer.
- Nothing is lost if someone asks "how was this built?"
- No git history rewriting (which would break the audit trail).