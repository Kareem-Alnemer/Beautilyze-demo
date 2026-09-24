# AGENTS.md — Operating Contract

This file is the contract between the human owner and any AI coding agent
working in this repository. Read it fully before doing anything. If any
instruction here conflicts with a skill, a playbook, or a prompt, THIS FILE
WINS.

---

## 0. Read order before starting any task

1. README.md
2. docs/blueprint.md              (canonical spec — source of truth)
3. docs/decisions.md              (locked decisions — do not contradict)
4. docs/architecture.md
5. TASKS.md                       (what is in flight)
6. AGENTS.md                      (this file)
7. The relevant skill in .agents/skills/ for the task type
8. The relevant playbook in .agents/playbooks/ if one exists

If any of the first five files are empty or missing, STOP and tell the human.

---

## 0.5. Resource Ingestion Protocol

When the human pastes or attaches a resource (document, image, CSV, code
file, URL, spec, screenshot), do this BEFORE planning or coding:

1. Summarize in 2–3 sentences what you received.
2. Extract: goals, constraints, tech preferences, non-negotiables, unknowns.
3. List any contradictions or gaps you detect — especially contradictions
   with docs/blueprint.md or docs/decisions.md.
4. Ask up to 5 targeted clarifying questions.
5. Wait for answers.
6. Only then produce or update a plan.

If a resource is ambiguous, unreadable, or inaccessible, say so explicitly.
Never invent details about a resource that was not provided.

---

## 1. What this project is

BeautiLyze is a "check before you buy" skincare tool. A user sets a profile
(manually or via AI scan), searches a product in a curated catalog, and gets
a deterministic match / caution / mismatch verdict with per-factor
explanations.

Two deployables:
- app/                — React Native + Expo client
- inference-server/   — FastAPI inference service (scan path only)

One shared backend: Supabase (Postgres, Auth, Storage, RLS).

The verdict engine is a self-contained deterministic TypeScript module at
app/src/verdict/. It is NOT an ML model. It must remain pure (no I/O, no
network, no database, no React imports).

---

## 2. Autonomy zones

The agent operates under a three-zone model. Full details in
docs/orchestrator/terminal-policy.md. Summary:

### Zone A — act freely
- Create and edit files inside: app/, inference-server/, supabase/migrations/,
  supabase/seed/, scripts/, catalog/, docs/ (except docs/decisions.md and
  docs/blueprint.md), .github/workflows/.
- Run read-only commands: ls, cat, grep, git status, git diff, git log.
- Run tests: pnpm test, npx jest, pytest.
- Run linters and type checks.

### Zone B — print the command, wait for human "yes", then run once
- git add, git commit, git push, git branch, git checkout
- npm install, pnpm add, uv add, pip install
- Any command that hits the network
- Any Supabase CLI command
- Any command that modifies files outside the repo root

### Zone C — do not attempt; write a MANUAL_TASK block instead
- Supabase dashboard operations
- GitHub repo settings, branch protection, secrets
- HuggingFace license acceptance or model download consent
- Anything requiring a credit card
- Anything requiring sudo or admin rights

---

## 3. Before writing ANY code — the clarification gate

For every new task, in this order:

1. Restate the task in one sentence.
2. Identify which section of docs/blueprint.md it implements.
3. List every assumption you are making.
4. Ask the human the questions from the matching prompt template in
   docs/orchestrator/prompts/ (feature.md, bugfix.md, test.md, refactor.md).
5. Wait for answers.
6. Produce a plan: files to create/modify, tests to write.
7. Wait for plan approval.
8. Only then write code.

If the human says "just do it" without answering, pick sensible defaults,
STATE THEM EXPLICITLY in your response, and proceed. Do not stall forever.

---

## 3.5. Phase-Gated Workflow

Every task moves through four phases, in order. Do not skip phases.

  Phase 1 — Plan
    - Restate the task
    - Cite the blueprint section it implements
    - List assumptions
    - List files to create/modify
    - List tests to write
    - Output: numbered checklist with acceptance criteria
    - End with: "Checkpoint: approve, revise, or ask questions?"

  Phase 2 — Build
    - Only after Phase 1 approval
    - Write code, one logical unit at a time
    - Do not proceed to Phase 3 until all code is written

  Phase 3 — Verify
    - Run linter, type check, tests
    - Report full output (do not summarize away failures)
    - If anything fails, stop and report; do not silently fix

  Phase 4 — Report
    - Update TASKS.md
    - Draft the commit message and commands into
      .agent-state/pending-commits/<slug>.md
    - Print a summary: what changed, what was tested, what the human
      must do next
    - End with: "Checkpoint: done, or needs revision?"

If the human says "just do it" and skips Phase 1, still produce the plan —
one paragraph, not a full checklist — and proceed. Do not skip the plan
entirely.

---

## 4. Testing requirements

- Every new verdict factor → unit test in app/src/verdict/__tests__/
- Every new endpoint → pytest in inference-server/tests/
- Every new screen → at minimum a render smoke test
- Every bug fix → a test that would have caught it
- Never mark a task done if tests fail
- Never delete a failing test to make CI pass
- If a test is genuinely wrong, explain why in the response before changing it

---

## 5. Escalation triggers — STOP and ask the human

Full details in docs/orchestrator/escalation.md. At minimum:

- Any change to the precedence rule in app/src/verdict/precedence.ts
- Any change to a locked decision in docs/decisions.md
- Any new dependency
- Any new database migration
- Any ambiguous requirement
- Any test failure that is not a one-line fix
- Any action in Zone B or Zone C
- Any conflict between a skill's advice and docs/decisions.md
- Any time you would otherwise invent a value (color, font, URL, threshold)
  that is not already defined somewhere in the repo

When in doubt, ask. Silence is not consent.

---

## 6. Forbidden actions

Never, under any circumstance:
- Run: sudo, rm -rf, git reset --hard, git push --force, git clean -fdx
- Commit or push to the main branch directly
- Modify: AGENTS.md, docs/decisions.md, docs/blueprint.md, .github/workflows/
  (these are human-owned; propose changes via PR description instead)
- Add a dependency without asking
- Place a secret, token, or key anywhere in the repo
- Write a face image to disk
- Log any image data
- Add ML to the verdict layer (see blueprint §5.6)

---

## 6.5. Planned repo cleanup (do not perform early)

At the end of the build, a "Repo polish" task will move `AGENTS.md`,
`docs/orchestrator/`, and `.agents/` into `docs/development-process/`, and
delete `.opencode/` and `.agent-state/`.

Do NOT perform this cleanup before the human explicitly asks for it. The
contract and skills must be in their current locations for the entire
build.

Full plan: `docs/development-process/cleanup-plan.md`.

---

## 7. Design rules

- Every visual value (color, font, spacing, radius) MUST come from
  app/src/theme/. Never write a hex code, font size, or pixel value inline.
- Every new token added to theme/ MUST be documented in
  docs/design/tokens.md in the same change.
- Generic UI primitives go in app/src/components/ui/. Domain components go
  in app/src/components/.
- Before writing a new component, check docs/design/components.md — it may
  already exist.
- Terminology discipline (blueprint §10.2) applies to ALL UI copy: never
  write "safe", "treatment", "73% confident". See docs/design/copy-voice.md.
- Accessibility: text contrast >= WCAG AA. Tap targets >= 44px.

---

## 8. Visual rules

- Before designing any screen, read docs/design/screens/<screen>.md. If it
  does not exist, STOP and ask the human to define it.
- Imagery: only from sources listed in docs/design/imagery.md. Never invent
  an image URL. Never hotlink. If a product image is missing, use the
  placeholder from components/ui/EmptyState.tsx.
- Icons: only from the icon set declared in docs/design/imagery.md.
  Never mix icon families. Never use emoji as an icon.
- Motion: only where docs/design/motion.md says. No decorative animation.
- Every screen MUST have loading, empty, error, and success states. A screen
  without an empty state is not done.
- The verdict screen (app/src/screens/VerdictScreen.tsx) has a locked
  composition in docs/design/screens/verdict.md. Do not redesign it without
  explicit human approval.

---

## 9. Skills — when to invoke

- Adding or editing a product in the catalog → .agents/skills/catalog-annotator
- Touching anything in app/src/verdict/ → .agents/skills/verdict-engine
- Touching Supabase schema or policies → .agents/skills/supabase-schema
- Adding or editing a screen → .agents/skills/react-native-screen
- Adding or editing an endpoint → .agents/skills/fastapi-endpoint
- Writing any test → .agents/skills/test-writer
- Before proposing a commit → .agents/skills/git-commit
- Before declaring a task done → .agents/skills/escalation-check
- Touching theme/ or any color/type/spacing → .agents/skills/ui-theme
- Touching imagery, motion, or screen composition → .agents/skills/ui-visual

Skills are procedures, not automatic. You must load the right one before
the work, not after.

---

## 10. Git workflow

Full details in docs/orchestrator/git-workflow.md. Summary:

- Branch naming: <type>/<short-slug>
  types: feat, fix, docs, chore, test, refactor
- Commit message: Conventional Commits, <= 72 char subject.
  Body explains WHY, not WHAT (the diff shows what).
- One logical change per commit. Do not bundle unrelated changes.
- The agent does NOT run git commit or git push itself. It writes the exact
  commands and the message into .agent-state/pending-commits/<slug>.md, and
  prints them for the human to copy-paste.
- Never force-push a branch with an open PR.

---

## 11. Folder-scope rule

- .opencode/  → OpenCode-specific agent configuration
- .agents/    → reusable skills and playbooks (cross-tool)
- If unsure, put it in .agents/

---

## 12. Definition of "done"

A task is done only when ALL of the following are true:

- Code written and saved
- Linter passes
- Type check passes (app/) or import check passes (inference-server/)
- All tests pass
- If schema changed: migration file added, not modified in place
- If design changed: docs/design/ updated in the same change
- TASKS.md updated with the new status
- If a manual step is required from the human, it is written as a MANUAL_TASK
  block in the response AND in TASKS.md

If any of these is false, the task is not done. Say so.

---

## 13. When unsure

Ask. Always ask. The cost of one clarifying question is seconds. The cost of
guessing wrong is hours of rework and a confused human.

If you cannot ask (mid-task), stop, write the question into your response,
and do not proceed.

---

## 14. Communication style

### Architecture decisions → ADR
Any non-trivial architectural decision (new module, new dependency, new
data flow, boundary change) must be proposed as an ADR entry for
docs/decisions.md. Format:
  Context | Decision | Alternatives considered | Consequences

The agent drafts the ADR; the human commits it.

### Flag uncertainty explicitly
If you are not certain about an API, a library version, a behavior, or a
convention, SAY SO. Write: "I am not certain about X; verify with Y."
Never fabricate an API, a library, a version number, or a citation.
Hallucinated specifics cost more time than honest uncertainty.

### Calibrate to skill level
This human is a student with low terminal familiarity and no prior
monorepo or agentic-tooling experience. When explaining:
- Prefer plain language over jargon.
- Define a term the first time you use it.
- Explain WHY before HOW.
- When giving commands, give the exact command and what it will do.
- Never assume familiarity with git internals, shell piping, or build tools.

## 15. Teaching mode (always on)

This is a student capstone. The humans building it must be able to
defend every line of code they submit. Teaching is not optional — it is
part of "done."

### Core principle

Every explanation must answer three questions, in this order:

1. **What does this do?** (plain language, no jargon)
2. **Why is it done this way?** (the trade-off that was chosen, and what
   was rejected)
3. **How would a reader find it again?** (which file, which function,
   which blueprint section)

If any of the three is missing, the explanation is incomplete.

### When explanations are written

- After every task, before proposing the commit.
- After every bug fix, alongside the fix.
- After every refactor, explaining what was preserved and why.
- Before any task that touches `app/src/verdict/` — explain the plan
  first, then the implementation. The verdict engine is the module they
  will be asked about most.

### Where they live

    docs/learning/
    ├── README.md              (index, in chronological order)
    ├── 001-<task-slug>.md
    ├── 002-<task-slug>.md
    └── ...

One file per task. Numbered sequentially. Never edited after the fact —
corrections go in a new file that references the old one.

### The format of one learning file

Every file follows this structure. No exceptions. This is deliberate:
consistency is what makes the material usable for study and defense.

    # <Task title>

    **Date:** YYYY-MM-DD
    **Blueprint:** §<section>
    **Files changed:** <list>
    **Prerequisites:** <001-..., 002-...> (which earlier files to read first)

    ## 1. What this task was
    One paragraph. What problem it solves. Why it matters to the product.

    ## 2. The concept
    The one new idea this task introduces, explained as if the reader has
    never seen it. Define every term the first time it appears. One
    analogy if it helps. No more than 200 words.

    ## 3. The decision
    What were the options? Why was this one chosen? What was rejected and
    why? This is the part a defense committee will ask about.

    ## 4. The code, line by line
    For each non-trivial file:
    - The file path.
    - What it does in one sentence.
    - A walkthrough of the important parts, in the order they execute.
    - Skip boilerplate. Focus on the parts a reader would not understand
      from the file alone.

    ## 5. How to verify it works
    The exact commands to run, what to expect, what failure looks like.
    Copy-pasteable. No paraphrasing.

    ## 6. What could go wrong
    Two or three realistic failure modes. What they look like. What to do.

    ## 7. If you remember one thing
    One sentence. The essential takeaway. If this is all someone reads,
    they should understand the shape of the task.

    ## 8. Questions to ask yourself before the defense
    Three to five questions a committee member could ask about this
    task, with brief answers. This is the study guide for that task.

### The rules of writing

- **Plain language.** If a 15-year-old cannot follow §2, rewrite it.
- **Define every term the first time it is used.** No exceptions.
- **Never write "obviously" or "simply."** Nothing is obvious to someone
  seeing it for the first time.
- **Show, don't summarize.** Paste the important code inline. Do not say
  "the file handles X" without showing how.
- **One idea per paragraph.** No wall-of-text sections.
- **Link to the blueprint section** when the code implements a spec.
- **Link to the ADR** when a decision was made there.

### The self-check before proposing a commit

Before proposing any commit, the agent verifies:

- [ ] A learning file was written for this task.
- [ ] Every file in §4 has a one-sentence summary followed by a walkthrough.
- [ ] §3 names the rejected alternative, not just the chosen one.
- [ ] §5 commands actually work when copy-pasted.
- [ ] §8 has at least three questions.
- [ ] No jargon appears in §2 without a definition.
- [ ] The file is added to the index in `docs/learning/README.md`.

If any box is unchecked, the task is not done.

### Team study protocol

This repo supports more than one learner. Therefore:

- The index in `docs/learning/README.md` is ordered by task, not by
  person. Anyone can read from the start.
- Each file lists its prerequisites, so a reader can follow the chain.
- A weekly review (15 minutes, whole team) picks one recent file and
  walks through it together.
- Disagreements about what a file says are resolved by re-reading the
  code, not by asking the agent again.
- Before the demo, the agent runs "quiz mode": it asks 20 questions
  drawn from §8 of the learning files, the team answers aloud, and the
  agent corrects. This is the reverse-engineering practice the team
  needs before the defense.

### When the agent cannot explain something plainly

If the agent cannot write §2 or §4 without jargon, that is a signal the
code is too clever or the abstraction is wrong. Stop. Simplify the code,
then explain it. Do not paper over confusion with more words.

### What this section is NOT for

- Generating marketing copy for the report.
- Rewriting code just to make it easier to explain. The code serves the
  product; explanations serve the humans.
- Replacing the team's own reading. The learning files are the map. The
  terrain is the code. The team must still walk it.

### Quiz mode (used before the defense)

When the human says "quiz me" or "quiz mode", the agent:

1. Reads `docs/learning/README.md` for the file list.
2. Picks 20 questions across the files, weighted toward the verdict
   engine, the AI integration, and the privacy story.
3. Asks them one at a time, in plain language.
4. Waits for the human's answer.
5. Corrects if wrong, confirms if right, and never moves on without a
   response.
6. At the end, reports which areas need more review.

This is not optional before the demo. It is the final step of the
project.