# Finding Your Way Around The Repository

**Date:** 2026-09-27
**Blueprint:** [8.1 and 15](../blueprint.md)
**Files changed:** `README.md`, `app/README.md`, `docs/README.md`, root `package.json` and `package-lock.json`, learning index, TASKS.
**Prerequisites:** [26](26-project-reading-map.md), [28](28-native-gallery-upload.md).

## 1. What this task was

The repository mixes application code, documentation, installed tools, model
files, and build artifacts. This pass gives learners clear starting points and
root-level commands without moving working code during a native-build change.
It improves navigation rather than claiming a complete structural migration.

## 2. The concept

An **entry point** is the place you start a task. A good repository gives you
one entry point for running commands, one for finding documentation, and a map
for locating code. A **generated artifact** is something a tool creates from
source, such as the Android build project. Editing that output directly can
lose your changes when the tool generates it again.

There are two package.json files because there are two sets of JavaScript
tools: catalog scripts at the root and the mobile app in `app/`. A root command
can delegate to the app folder, so the learner need not remember this boundary
for every test run. Delegation does not merge the two dependency installations.

## 3. The decision

We added maps and command entry points before considering file moves. Moving
every screen into a new folder was rejected for this pass because it would
change imports and historical learning references while upload work is underway.
Deleting agent infrastructure was also rejected: the
[final cleanup plan](../development-process/cleanup-plan.md) applies after the
demo works end to end. No new architecture or dependency was needed.

## 4. The code, line by line

### Root `package.json` and `package-lock.json`

These files name the root tooling package and provide convenient command aliases.

```json
"app:typecheck": "npm --prefix app run typecheck",
"app:lint": "npm --prefix app run lint",
"app:test": "npm --prefix app test -- --runInBand"
```

`--prefix app` selects the mobile package. `run` selects its existing script.
For tests, `--` passes the remaining option to Jest; `--runInBand` runs test
suites in one process. No test selection or assertion was weakened. The package
is marked private to prevent accidental publication; lockfile name metadata
matches it without changing catalog dependencies.

### Root `README.md`

This file now directs readers to code, tasks, learning, and native-build instructions.

The Start Here links come first. The folder explanation distinguishes routes
from features and generated tooling from source. Updated examples use the npm
lockfile and the actual Python module path, and no longer suggest that Expo Go
can load the native uploader. The product disclaimer remains intact.

### `app/README.md`

This file maps each mobile folder to its responsibility.

Read routes under `app/app/` first when tracing navigation; follow them into
`src/` for behavior. Read `modules/` for native extensions, not UI rules.
The command section gives both root and app-folder forms so readers can
recognize where a command runs.

### `docs/README.md`

This file organizes links by product truth, learning, verification, and development process.

Canonical specifications are separated from chronological lessons. Current
review notes and task status are linked separately so an old successful test
count is not mistaken for today's release status. The learning index adds
this chapter; TASKS records what was organized and what was not moved.

## 5. How to verify it works

From the repository root:

```powershell
npm run app:typecheck
npm run app:lint
npm run app:test
```

These commands were run: typecheck passes, lint reports 0 errors and 38
warnings, and 418 tests pass. An unknown script or wrong folder would fail
before the underlying tool starts. Broken imports would fail typechecking
or tests. Read the first log lines to see which package's script ran.

## 6. What could go wrong

1. Running an install in the wrong folder changes the wrong lockfile. Check
   which package owns the dependency before installing.
2. Editing ignored Android output loses changes on regeneration. Put custom
   native code in `app/modules/` and configuration in `app/app.json`.
3. Historical docs disagree with current code. Use the latest task/reading
   map, then inspect the referenced code; append a correction rather than
   rewriting past learning chapters.

## 7. If you remember one thing

Start commands at the repository root, use the maps to find source, and do not confuse generated folders with code you own.

## 8. Questions to ask yourself before the defense

1. **Why two package files?** Root catalog tooling and mobile dependencies
   have different owners and installations.
2. **Why two folders named app?** The outer is the mobile project; the inner
   is Expo Router's route directory.
3. **Why not move all files immediately?** Preserving imports and working
   behavior matters more than symmetry during a functional repair.
4. **Where is the native upload source?** `app/modules/memory-upload/`, not
   the ignored generated Android directory.
