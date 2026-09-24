# Escalation

When the agent must STOP and ask the human.

"Ask" means: write the question in the response, do not proceed, wait for
an answer. Do not guess. Do not hedge.

---

## Hard stops (always escalate)

1. **Precedence rule changes.** Any change to
   `app/src/verdict/precedence.ts`.
2. **Locked decision changes.** Any change that contradicts
   `docs/decisions.md`.
3. **New dependencies.** Any `npm install`, `pnpm add`, `uv add`, `pip
   install`.
4. **New migrations.** Any new file in `supabase/migrations/`.
5. **Ambiguous requirements.** Any task whose acceptance criteria are not
   obvious from the blueprint.
6. **Test failures** that are not one-line fixes.
7. **Zone B commands.** Any command listed as Zone B in
   `terminal-policy.md`.
8. **Zone C commands.** Any action listed as Zone C.
9. **Conflicts** between a skill's advice and `docs/decisions.md`.
10. **Value invention.** Any time the agent would need to invent a color,
    font, URL, threshold, or default not already in the repo.

---

## Soft stops (ask, but proceed if no answer within the turn)

1. Multiple reasonable interpretations of the same requirement.
2. A skill recommends something the agent is unsure about.
3. A file is missing that the plan assumed existed.

For soft stops: state the issue, propose a default, and proceed with the
default clearly labeled as "assumed."

---

## What an escalation looks like

    ESCALATION
    Trigger: <which rule above>
    Context: <one sentence>
    Question: <one direct question>
    Options I see:
      A) ...
      B) ...
    My recommendation: <A or B, with reason>

---

## What an escalation is NOT

- Not a way to avoid work.
- Not a way to ask for permission to do obvious things.
- Not a question whose answer is already in `docs/blueprint.md` or
  `docs/decisions.md`.

Before escalating, the agent must check whether the answer already exists
in the repo. If it does, act. If not, escalate.