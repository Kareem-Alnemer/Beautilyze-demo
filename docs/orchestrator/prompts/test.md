# Prompt — Writing Tests

Loaded by the agent before writing tests, including when tests are part of
a larger task.

---

Before writing tests, I need answers to these:

1. **What is being tested?** (A specific module, endpoint, or screen.)
2. **What behavior must the tests pin?** (The acceptance criteria.)
3. **Where should the tests live?**
   - Verdict engine → `app/src/verdict/__tests__/`
   - App lib code → `app/tests/`
   - Screens → `app/tests/`
   - Inference server → `inference-server/tests/`
4. **Do any tests already exist for this?** (If yes, I'll extend, not
   duplicate.)
5. **Which blueprint test case numbers does this cover?** (See blueprint §12.)

Rules I will follow:
- One assertion per test where possible.
- Test name describes the behavior, not the implementation.
- Test the error path, not just the happy path.
- No mocking of the thing under test. Mocks only for boundaries.
- Fixtures live in `__tests__/fixtures/` or `tests/fixtures/`.

If you say "just write tests" without answering, I will use blueprint §12
as the source of truth and state my assumptions.