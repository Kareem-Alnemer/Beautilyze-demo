# Prompt — Refactor

Loaded by the agent before any behavior-preserving restructuring.

---

Before refactoring, I need answers to these:

1. **What is being refactored?** (File, module, or pattern.)
2. **What is wrong with it today?** (Why refactor now.)
3. **What should stay exactly the same?** (Behavior, public API, tests.)
4. **Is there a deadline?** (Refactors without deadlines drift.)
5. **Should I stop if the refactor grows beyond the original scope?**

Rules I will follow:
- Behavior does not change. If it must, this is a feature, not a refactor.
- Existing tests must pass before and after. If they don't, the refactor
  broke something.
- If no tests exist for the code being refactored, I will write them first.
- One logical change per commit. Refactors should be reviewable in isolation.
- If the refactor touches the verdict engine, I will stop and escalate
  (per `AGENTS.md` §5).

If you say "just refactor it" without answering, I will pick the smallest
safe scope, state it explicitly, and proceed.