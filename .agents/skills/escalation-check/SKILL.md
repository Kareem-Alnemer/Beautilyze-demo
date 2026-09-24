---
name: escalation-check
description: Run before declaring any task complete. Decides stop-or-continue.
---

# Escalation Check

Run this before telling the human "the task is done."

## The checklist

Answer each of these. If any is "no," the task is not done.

1. Does the code compile / typecheck?
2. Do all linters pass?
3. Do all tests pass?
4. Is `TASKS.md` updated?
5. Is the design doc updated if the design changed?
6. Is a new migration added (not modified) if the schema changed?
7. Is a `MANUAL_TASK` block written if a manual step is needed?
8. Is the proposed commit in `.agent-state/pending-commits/`?
9. Does the change contradict any entry in `docs/decisions.md`?
10. Did the change touch `app/src/verdict/precedence.ts`? If yes, the human
    must explicitly approve before this is done.

## If any answer is "no"

- Do NOT say "done."
- State exactly which check failed.
- Fix it, or write the escalation block for the human.
- Only when all ten are "yes" is the task done.

## Escalation block format

    ESCALATION
    Trigger: <which of the ten failed>
    Context: <one sentence>
    Question: <one direct question>
    Options I see:
      A) ...
      B) ...
    My recommendation: <A or B, with reason>

## Common mistakes

- Saying "done" when tests were not run.
- Saying "done" when the commit draft was not written.
- Saying "done" when a manual step is still needed but not flagged.
- Saying "done" after touching precedence.ts without human approval.