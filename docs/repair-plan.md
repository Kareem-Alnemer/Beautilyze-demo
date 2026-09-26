# Approved stabilization plan

Approved by the owner on 2026-09-26. Blueprint v2.3 remains authoritative.

## Acceptance checklist

- [ ] Foundation: one application root, working routes, typecheck and lint.
- [ ] Identity: real authentication, isolated user state, atomic profile saves.
- [ ] Manual flow: catalog search, full ingredient lookup, explained verdict.
- [ ] Scanning: one inference contract, independent confirmation, bounded images.
- [ ] Catalog/history: validated evidence, repeatable seeds, persisted checks.
- [ ] Release: documented setup, verified tests, device and database checks.
- [ ] Learning: append corrections, code walkthroughs, verification and defense questions.

## Implementation decisions

The app owns profile persistence, as described in architecture.md. The server
does not need database credentials. Keep the existing verdict precedence
function; detect a known declared-allergen conflict before declaring the
remaining ingredient data insufficient (blueprint 6.5 steps 1 and 2).
Do not fabricate catalog evidence or model validation results. External
verification and live database/device checks remain explicit release gates.

## Teaching approach

Past learning files are historical records, not proof of current behavior.
Append numbered corrections and link them from the index. Each new lesson
uses the eight sections in AGENTS.md section 15, explains the rejected
alternative, includes important code, and distinguishes automated evidence
from checks still requiring a device or database.

Priority study topics: module boundaries; user-confirmed versus AI fields;
factor states versus final verdict; missing evidence versus negative evidence;
authentication versus database ownership; atomic writes; asynchronous request
ordering; model score versus measured accuracy; image lifetime; tests and mocks.
