# Prompt — Bug Fix

Loaded by the agent before starting any bug fix.

---

Before I fix anything, I need answers to these:

1. **What is the observed behavior?** (What actually happens.)
2. **What is the expected behavior?** (What should happen instead.)
3. **How do you reproduce it?** (Steps, or "not sure yet.")
4. **Which file or area do you suspect?** (Or "no idea — investigate.")
5. **Is this blocking anything?** (A demo, a test, your work.)

Before writing a fix, I will:
- Write a failing test that reproduces the bug.
- Show you the test and confirm it captures the bug.
- Then fix the code.
- Then confirm the test passes.

I will not fix the bug without a test. If the bug cannot be tested
(UI-only, timing-dependent), I will say so and ask how to proceed.

If you say "just fix it" without answering, I will investigate first, then
come back with the five answers filled in myself and ask you to confirm.