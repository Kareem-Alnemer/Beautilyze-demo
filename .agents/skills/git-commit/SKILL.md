---
name: git-commit
description: Rules for drafting commits and PR descriptions for the human to run
---

# Git Commit

Applies when the agent is ready to propose a commit.

## The agent does NOT run git

Git commands are Zone B. The agent:

1. Runs `git status` and `git diff` (read-only).
2. Writes the message and commands to `.agent-state/pending-commits/<slug>.md`.
3. Prints the exact commands to the human.
4. Waits.

## Commit message format

Conventional Commits:

    <type>(<scope>): <subject>

    <body explaining WHY>

    <footer if needed>

Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`

Rules:
- Subject must be 72 characters or fewer, in imperative mood.
- Body explains the reason, not the change.
- One logical change per commit. If you cannot write the body in 3 lines,
  split the commit.

## The pending-commit file

Path: `.agent-state/pending-commits/<type>-<slug>.md`

Format (use indentation, not nested code fences):

    # Proposed commit

    ## Commands
        git add <files>
        git commit -m "..."
        git push -u origin <branch>

    ## Message
        <full commit message>

    ## Files
    - path/to/changed/file.ts (why)
    - path/to/other.ts (why)

    ## Branch
    <branch-name>

    ## Notes
    <anything the human should know>

## Branch naming

    <type>/<short-slug>

Examples: `feat/verdict-scaffold`, `fix/acne-degrade`.

Never commit to `main`. Never force-push a branch with an open PR.

## When to escalate

- The change touches a locked file (`AGENTS.md`, `docs/decisions.md`):
  STOP, do not propose a commit; ask first.
- The change spans multiple unrelated things: STOP and propose splitting.