# Terminal Policy

The agent's rules for running shell commands. Referenced by AGENTS.md §2.

---

## Zone A — Act freely

No approval needed. Any failure here is safe to retry or ignore.

Allowed:
- Read-only inspection: ls, dir, cat, type, grep, findstr, git status,
  git diff, git log, git branch --list
- Test execution: pnpm test, npx jest, pytest, npm test
- Lint and typecheck: pnpm lint, npx tsc --noEmit, ruff check
- File creation inside allowed folders (see AGENTS.md §2)
- File reading anywhere inside the repo

---

## Zone B — Print, wait for "yes", run once

The agent MUST:
1. Print the exact command, on its own line, in a code block.
2. State in one sentence what the command will do and why.
3. Wait for the human to type "yes".
4. Run exactly that command, once.
5. Report the full output (do not summarize away errors).

If the human says anything other than "yes" (including "ok", "sure", "go"),
treat it as "no" and ask again.

Examples:
- git add <paths>
- git commit -m "..."
- git push
- npm install <pkg>, pnpm add <pkg>, uv add <pkg>
- supabase db push
- Any curl / wget / Invoke-WebRequest

Forbidden in Zone B: chaining with &&, ;, or |. One command, one approval.

---

## Zone C — Do not attempt

The agent does not run these, even with approval. It writes a MANUAL_TASK
block instead.

- Supabase dashboard (project creation, billing, RLS toggling via UI)
- GitHub repo settings, branch protection, secrets
- HuggingFace license acceptance
- Account creation anywhere
- Anything with a credit card
- sudo / admin / UAC elevation
- Installation of system-level tools (Docker Desktop, WSL, Python, Node)

MANUAL_TASK block format:

    MANUAL_TASK
    What: <one sentence>
    Why:  <why the agent cannot do this>
    Steps:
      1. ...
      2. ...
    Verify: <how the agent will know it is done>

---

## Forbidden commands (never, even with approval)

- sudo
- rm -rf (any form)
- git reset --hard
- git push --force / -f
- git clean -fdx
- Any command touching paths outside the repo root
- Any command that pipes to /bin/sh or bash -c
- Any command that downloads and executes a script in one step

If the agent believes one of these is genuinely required, that is an
escalation. Stop and ask the human.

---

## Failure handling

When a Zone B command fails:
- Report the full error output verbatim.
- Do NOT retry with variations.
- Do NOT try a different command to "work around" it.
- Ask the human how to proceed.

When a Zone A command fails:
- Report the error.
- It is safe to retry once with a corrected path or flag.
- If it fails twice, escalate.

---

## Windows specifics

This project runs on Windows with PowerShell. Notes:
- `&&` does not work in older PowerShell; use `;` only if the agent
  explicitly asks and the human approves.
- Path separator is `\`, but most tools accept `/`. Prefer `/`.
- `touch` does not exist. Use `New-Item -ItemType File`.
- `mkdir -p` does not exist. Use `New-Item -ItemType Directory -Force`.

The agent should default to commands that work in both PowerShell and POSIX
where possible. When it must pick, pick PowerShell.