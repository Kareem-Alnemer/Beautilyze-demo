# Git Workflow

Conventions for branches, commits, and PRs. The agent follows these when
drafting work for the human.

---

## Branch naming

    <type>/<short-slug>

Types:
- `feat/`     — new feature
- `fix/`      — bug fix
- `docs/`     — documentation only
- `chore/`    — tooling, config, dependencies
- `test/`     — tests only
- `refactor/` — behavior-preserving change

Examples:
- `feat/verdict-engine-scaffold`
- `fix/acne-severity-degrade`
- `docs/design-principles`

---

## Commit messages

Conventional Commits:

    <type>(<scope>): <subject>

    <body explaining WHY, not WHAT>

    <footer if needed>

Rules:
- Subject ≤ 72 characters.
- Subject in imperative mood ("add", not "added" or "adds").
- Body explains the reason for the change. The diff shows the what.
- One logical change per commit. Do not bundle unrelated work.
- No "wip" or "fixes" as the subject.

Examples:

    feat(verdict): add allergen conflict factor

    Implements blueprint §6.3 factor evaluation. Returns pass / fail /
    insufficient_data. No verdict precedence yet — that comes in the next
    commit so precedence.ts stays the single decision point.

    test(verdict): cover severe-acne degrade path

    Blueprint §6.4 says severe acne degrades to moderate when strong
    actives are absent. This test pins that behavior so future edits
    cannot silently change it.

---

## What the agent does vs. what the human does

The agent:
1. Runs `git status` and `git diff` (Zone A, read-only).
2. Writes the proposed commit message to
   `.agent-state/pending-commits/<slug>.md`.
3. Prints the exact commands for the human to run.

The human:
1. Reviews the diff.
2. Runs the printed `git add`, `git commit`, `git push` commands.
3. Opens the PR in the GitHub web UI.

The agent NEVER runs `git commit`, `git push`, or `git branch` itself. These
are Zone B — human-approved only.

---

## Pull requests

- One PR per task.
- PR description uses `.github/PULL_REQUEST_TEMPLATE.md`.
- Title = the commit subject of the main commit.
- Description includes:
  - Blueprint section implemented
  - What changed and why
  - How it was tested
  - What the reviewer should look at
  - Any manual tasks the human still needs to do

---

## What never happens

- Force-pushing a branch with an open PR.
- Committing directly to `main`.
- Merging without CI passing.
- Editing a merged migration file.