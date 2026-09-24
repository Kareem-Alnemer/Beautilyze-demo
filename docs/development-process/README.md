# Development Process

How this repository was organized during the build. Kept in the repo so
the process is documented and defensible, not hidden.

This folder is the **planned destination** for agent-related artifacts at
the end of the build. See `cleanup-plan.md`.

## Why this folder exists

The repository was built with an AI coding agent working inside a written
contract (`AGENTS.md`). That contract, the skills, and the playbooks are
part of how the project was produced. They are not part of the product
itself.

Rather than delete them at the end (losing the process record) or leave
them in the repo root (cluttering the product view), they are archived
here.

## What will move here at the end of the build

- `AGENTS.md` (reframed as "Development conventions")
- `docs/orchestrator/` (kept as-is; already neutral)
- `.agents/skills/` (renamed to "workflows")
- `.agents/playbooks/` (kept as-is)

## What will be deleted at the end of the build

- `.opencode/` — OpenCode-specific configuration. Infrastructure, not
  process.
- `.agent-state/` — transient. Already gitignored.

## What stays where it is

Everything under `docs/` except `docs/orchestrator/`. The blueprint,
decisions, architecture, design, testing, and learning docs are the
spine of the project. They belong in the product repository.