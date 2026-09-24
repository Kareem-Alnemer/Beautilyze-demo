# Design

The visual and interaction design system for BeautiLyze.

## Files in this folder

| File | Purpose |
|------|---------|
| `README.md` | This file. Index and read order. |
| `principles.md` | The visual direction: three adjectives, references, anti-reference |
| `tokens.md` | Colors, typography, spacing, radii — the values |
| `components.md` | When to use each UI primitive; states; do/don't |
| `patterns.md` | Screen-level conventions (layout, spacing rhythm, tone) |
| `accessibility.md` | Contrast, tap targets, motion, screen reader rules |
| `copy-voice.md` | Tone of voice; terminology discipline (blueprint §10.2) |
| `imagery.md` | Icons, images, fonts — what's allowed and what's forbidden |
| `screens/` | Per-screen locked compositions |

## Read order

1. `principles.md` — the direction
2. `tokens.md` — the values
3. `components.md` — the primitives
4. `patterns.md` — the conventions
5. `accessibility.md` and `copy-voice.md` — the rules
6. `screens/<screen>.md` — the specific screen being worked on

## Authority

- `principles.md` is the direction. If a design choice contradicts it, the
  choice is wrong.
- `tokens.md` mirrors `app/src/theme/`. Code is the source of truth for
  values; this doc explains the *why*.
- If a doc here and `docs/blueprint.md` disagree about product scope, the
  blueprint wins.
- If a doc here and `AGENTS.md` disagree about agent behavior, `AGENTS.md`
  wins.

## Editing rule

These are human-owned. The agent may propose changes via the PR
description, but may not edit them directly.

## Status

- `principles.md` — done
- `imagery.md` — done
- `screens/verdict.md` — done (locked)
- `tokens.md` — this batch
- `components.md` — this batch
- `patterns.md` — this batch
- `accessibility.md` — this batch
- `copy-voice.md` — this batch