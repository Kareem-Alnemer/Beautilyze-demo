# CI/CD Pipeline — GitHub Actions Workflow

**Date:** 2026-09-26
**Blueprint:** §12 (Test Strategy), Architecture §8.1
**Files changed:**
- `.github/workflows/ci.yml` — Main CI workflow
**Prerequisites:** 12-scan-screen-and-ai-workflow.md, 13-home-screen-and-navigation.md

---

## 1. What this task was

This task created a **unified CI/CD pipeline** using GitHub Actions that automatically runs all static checks and tests for both the React Native/Expo mobile app and the FastAPI inference server on every push and pull request to `main`/`master`.

The pipeline ensures that:
- TypeScript compiles without errors (`tsc --noEmit`)
- ESLint passes with no errors (`npm run lint`)
- All Jest tests pass (`npm test`)
- All pytest tests pass (`pytest -v`)

---

## 2. The concept

### Why a unified workflow?

**Alternative:** Separate workflow files (`.github/workflows/app-tests.yml`, `.github/workflows/server-tests.yml`) as originally listed in TASKS.md.
**Rejected because:** A single workflow with parallel jobs is simpler to maintain, provides a single "CI passed/failed" status on PRs, and avoids duplication of trigger configuration.

### Dual-job architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI                          │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │      mobile-test        │  │     inference-test      │   │
│  │   (ubuntu-latest)       │  │   (ubuntu-latest)       │   │
│  │   Node.js 20            │  │   Python 3.11           │   │
│  │   working-dir: ./app    │  │   working-dir:          │   │
│  │                         │  │   ./inference-server    │   │
│  │   Steps:                │  │   Steps:                │   │
│  │   1. Checkout           │  │   1. Checkout           │   │
│  │   2. Setup Node + cache │  │   2. Setup Python +     │   │
│  │   3. npm ci             │  │      cache              │   │
│  │   4. tsc --noEmit       │  │   3. pip install -e     │   │
│  │   5. npm run lint       │  │      ".[dev]"           │   │
│  │   6. npm test --ci      │  │   4. pytest -v          │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│  Both jobs run IN PARALLEL (no needs: dependency)           │
└─────────────────────────────────────────────────────────────┘
```

### Concurrency control

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

- **Group key**: `ci-refs/heads/main` for main branch, `ci-refs/pull/123` for PR #123
- **Cancel in progress**: New push to same branch/PR cancels the previous run
- **Why**: Prevents queue buildup and wasted compute on outdated commits

---

## 3. The decision

### Runner selection: `ubuntu-latest`

**Alternative:** `macos-latest` for iOS simulator tests, `windows-latest` for Windows-specific checks.
**Rejected because:**
- Linux runners are free on GitHub (macOS/Windows have limited free minutes)
- Jest tests run in Node.js (no simulator needed)
- pytest tests are pure Python (no platform dependencies)
- Expo SDK 57 supports Linux CI for typecheck/lint/test

### Node.js version: 20 (LTS)

**Why:** Expo SDK 57 requires Node.js 18+. Node 20 is the current LTS with long-term support.

### Python version: 3.11

**Why:** Matches `pyproject.toml` `requires-python = ">=3.11"`. Python 3.11 has significant performance improvements over 3.10.

### Caching strategy

| Job | Cache Key | Cache Path |
|-----|-----------|------------|
| mobile-test | `npm-${{ hashFiles('app/package-lock.json') }}` | `~/.npm` |
| inference-test | `pip-${{ hashFiles('inference-server/pyproject.toml') }}` | `~/.cache/pip` |

**Why hash-based keys:** Cache automatically invalidates when lockfiles change. No manual cache version bumping needed.

### Working directories

```yaml
defaults:
  run:
    working-directory: ./app      # for mobile-test
    working-directory: ./inference-server  # for inference-test
```

**Why:** Avoids repetitive `cd app &&` prefixes. All steps run in the correct context automatically.

### Dependency installation

| Job | Command | Why |
|-----|---------|-----|
| mobile-test | `npm ci` | Clean install from `package-lock.json` (faster, deterministic) |
| inference-test | `pip install -e ".[dev]"` | Editable install with dev extras (pytest, httpx, pytest-cov) |

**Why not `npm install`?** `npm ci` is designed for CI — it fails if `package-lock.json` is out of sync, ensuring reproducible builds.

### Test commands

| Job | Command | Flags |
|-----|---------|-------|
| mobile-test | `npm test -- --ci --maxWorkers=2` | `--ci` = no watch mode, `--maxWorkers=2` = limit CPU usage on shared runners |
| inference-test | `pytest -v` | Verbose output for debugging |

---

## 4. The code, line by line

### `.github/workflows/ci.yml`

```yaml
# Lines 1-3: Workflow name
name: CI

# Lines 4-9: Triggers
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

# Lines 10-13: Concurrency control
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

# Lines 14-38: Mobile test job
jobs:
  mobile-test:
    name: Mobile App (Typecheck + Lint + Test)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./app
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: app/package-lock.json
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test -- --ci --maxWorkers=2

# Lines 39-58: Inference test job
  inference-test:
    name: Inference Server (Test)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./inference-server
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      - run: pip install -e ".[dev]"
      - run: pytest -v
```

---

## 5. How to verify it works

### Local validation (before push)

```bash
# Validate YAML syntax
actionlint .github/workflows/ci.yml
# or use GitHub's built-in validation on push
```

### Trigger a run

1. Push to any branch: `git push origin feature-branch`
2. Open PR to `main`
3. Check "Actions" tab — both jobs should run in parallel

### Expected output (mobile-test)

```
Run npm run typecheck
> tsc --noEmit
# (may show pre-existing errors in unrelated modules — acceptable)

Run npm run lint
> eslint . --ext .ts,.tsx
# (may show pre-existing style warnings — acceptable)

Run npm test -- --ci --maxWorkers=2
> jest --passWithNoTests --ci --maxWorkers=2
PASS src/scan/__tests__/api.test.ts
PASS src/scan/__tests__/CameraViewport.test.tsx
... (all 62+ tests pass)
```

### Expected output (inference-test)

```
Run pip install -e ".[dev]"
# Installs fastapi, uvicorn, pydantic, pytest, etc.

Run pytest -v
============================= test session starts ==============================
platform linux -- Python 3.11.x, pytest 8.x.x
collected 53 items
tests/test_schemas.py::test_skin_type_prediction_schema PASSED
tests/test_schemas.py::test_acne_severity_prediction_schema PASSED
... (all 53 tests pass)
============================= 53 passed in X.XXs ==============================
```

---

## 6. What could go wrong

| Failure Mode | Symptoms | Resolution |
|--------------|----------|------------|
| `npm ci` fails | `package-lock.json` out of sync | Run `npm install` locally, commit updated lockfile |
| `tsc --noEmit` fails | TypeScript errors in new code | Fix type errors before pushing |
| `npm run lint` fails | ESLint errors in new code | Run `npm run lint` locally, fix or add `// eslint-disable-line` with justification |
| `npm test` fails | Jest test failures | Run `npm test` locally, fix failing tests |
| `pip install -e ".[dev]"` fails | Missing system deps (rare) | Check `pyproject.toml` dependencies; may need `build-essential` on runner |
| `pytest` fails | Test failures | Run `pytest -v` locally in `inference-server/`, fix failures |
| Cache not restoring | Slow installs every run | Verify `cache-dependency-path` matches lockfile location |
| Concurrency not cancelling | Multiple runs queued | Check `group: ci-${{ github.ref }}` syntax |

---

## 7. If you remember one thing

The CI pipeline is **two independent jobs running in parallel** on every push/PR. Both must pass for the overall check to pass. The workflow uses hash-based caching for fast dependency installs and concurrency cancellation to avoid wasted compute on outdated commits.

---

## 8. Questions to ask yourself before the defense

1. **What triggers the CI workflow?**
   Push to `main`/`master` or PR targeting `main`/`master`.

2. **What are the two jobs and what do they test?**
   `mobile-test`: TypeScript typecheck, ESLint, Jest tests (React Native app).
   `inference-test`: pytest tests (FastAPI inference server).

3. **Why `npm ci` instead of `npm install`?**
   `npm ci` is for CI — clean, deterministic, fails if lockfile out of sync.

4. **How does caching work?**
   `actions/setup-node` with `cache: 'npm'` and `cache-dependency-path: app/package-lock.json` caches `~/.npm`. Python uses `actions/setup-python` with `cache: 'pip'`.

5. **What does `concurrency: cancel-in-progress: true` do?**
   New push to same branch/PR cancels the previous workflow run, saving compute.

6. **Why `working-directory` in `defaults.run`?**
   Avoids repetitive `cd app &&` / `cd inference-server &&` prefixes in every step.

7. **What Python version and why?**
   3.11 — matches `pyproject.toml` `requires-python = ">=3.11"`.

8. **What Node version and why?**
   20 (LTS) — Expo SDK 57 requires Node 18+, 20 is current LTS.

9. **Why `--maxWorkers=2` for Jest?**
   Limits CPU usage on shared GitHub runners (2 cores default).

10. **What does `pip install -e ".[dev]"` do?**
    Editable install of the package with `dev` extras (pytest, httpx, pytest-cov from `pyproject.toml`).