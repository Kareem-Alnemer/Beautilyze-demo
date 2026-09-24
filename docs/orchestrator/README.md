# Orchestrator

This folder defines how the AI coding agent ("the orchestrator") behaves in
this repository.

The orchestrator is a **player-coach**: it plans, builds, tests, and reports
on its own. It does not manage other agents. It does not delegate.

## Files

| File | Purpose |
|------|---------|
| `README.md` | This file — index and overview |
| `workflow.md` | The 4-phase task loop (Plan → Build → Verify → Report) |
| `escalation.md` | When and how the agent must stop and ask the human |
| `manual-tasks.md` | Things only a human can do |
| `terminal-policy.md` | Zone A / B / C rules for shell commands |
| `git-workflow.md` | Branch, commit, and PR conventions |
| `prompts/` | Prompt templates loaded before specific task types |

## Read order

The orchestrator reads `AGENTS.md` first, then this folder's `workflow.md`,
then the task-specific prompt from `prompts/`.

## Authority

If this folder conflicts with `AGENTS.md`, `AGENTS.md` wins.
If `AGENTS.md` conflicts with `docs/blueprint.md`, the blueprint wins for
product truth, but `AGENTS.md` wins for agent behavior.

## Editing rule

These files are human-owned. The agent may propose changes via the PR
description. It may not edit them directly.