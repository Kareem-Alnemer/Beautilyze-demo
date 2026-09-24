---
name: add-verdict-factor
description: Step-by-step for adding a new factor to the verdict engine
---

# Playbook — Add a Verdict Factor

Use this only when the blueprint explicitly calls for a new factor. Adding
factors changes verdict behavior — this is a locked area.

## Preconditions

- The new factor is described in `docs/blueprint.md` §6.
- The human has explicitly approved adding it.
- The precedence rule in §6.5 has been reviewed for how the new factor
  interacts with it.

## Steps

### 1. Escalate first
Before writing any code, write an escalation block:

    ESCALATION
    Trigger: New verdict factor requested
    Context: <which factor, from which blueprint section>
    Question: Confirm I should add this factor, and confirm how it
              interacts with precedence.ts
    Options I see:
      A) Add as a compatibility factor (counts in score)
      B) Add as a hard constraint (overrides or caps verdict)
    My recommendation: <A or B>

Wait for the human's answer.

### 2. Update the blueprint
If the factor is not already in §6.3 and §6.4, the human updates
`docs/blueprint.md` FIRST. The blueprint is the source of truth.

### 3. Define the factor's states
Write down, in the response, the pass / caution / fail / insufficient
conditions for the new factor. Get the human to confirm.

### 4. Write the test first
Create the test file in `app/src/verdict/__tests__/` for the new factor.
Cover all four states. Confirm the tests fail (there's no code yet).

### 5. Write the factor
Create `app/src/verdict/factors/<factorName>.ts`. It exports one function
that takes the profile and the product and returns one of the four states.

### 6. Wire it into the engine
- Update `types.ts` if needed.
- Update `index.ts` to include the factor.
- Update `precedence.ts` ONLY if the human approved the change there.

### 7. Update the score
If it's a compatibility factor, update `score.ts` to include it in the
denominator. If it's a hard constraint, it does NOT count in the score
(blueprint §6.6).

### 8. Run all tests
All existing tests must still pass. All new tests must pass.

### 9. Update docs
- Update `docs/design/screens/verdict.md` if the factor appears on the
  verdict screen in a new way.
- Update `docs/blueprint.md` if not already done.

### 10. Escalate for final review
Do not propose a commit until the human has reviewed the change. This is
a verdict-engine change — highest-risk category.

## What NOT to do

- Do not add a factor without the human's explicit approval.
- Do not change `precedence.ts` without explicit approval.
- Do not change the score denominator silently.
- Do not skip tests.