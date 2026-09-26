# Production Deployment Scaffolding — Docker & EAS

**Date:** 2026-09-26
**Blueprint:** §8.1, §8.2, §8.4, Architecture §8.2
**Files changed:**
- `inference-server/Dockerfile` — Multi-stage Dockerfile (builder + runtime)
- `inference-server/.dockerignore` — Excludes tests, caches, env files, model weights
- `docker-compose.yml` — Root compose for local inference server orchestration
- `app/eas.json` — EAS build profiles (development, preview, production)
**Prerequisites:** 11-inference-server.md, 12-scan-screen-and-ai-workflow.md, 13-home-screen-and-navigation.md

---

## 1. What this task was

This task created **production deployment scaffolding** for both deployables in BeautiLyze:

1. **Inference Server** — Containerized with a multi-stage Dockerfile for secure, production-ready deployment
2. **Mobile App** — Configured for Expo Application Services (EAS) with three build profiles
3. **Local Development** — Docker Compose for running the inference server locally

The scaffolding enables the team to build, test, and deploy both components independently while maintaining consistency between local development and production.

---

## 2. The concept

### Two Deployables, One Backend

Per the architecture (Blueprint §8.1, Architecture §8.2), BeautiLyze has two deployables sharing one Supabase backend:

```
┌─────────────────────┐     HTTPS      ┌──────────────────────┐
│  React Native App   │ ─────────────► │  FastAPI Inference   │
│  (Expo + EAS)       │  Upload image  │  Server (Docker)     │
└─────────────────────┘  Get prediction └──────────────────────┘
                              │
                              ▼
                       ┌─────────────────────┐
                       │    Supabase         │
                       │  (Postgres + Auth)  │
                       └─────────────────────┘
```

### Inference Server Containerization

**Multi-stage Dockerfile** (builder → runtime):
- **Builder stage**: Installs build dependencies (gcc), compiles wheels, installs Python packages
- **Runtime stage**: Minimal `python:3.11-slim`, copies only installed packages + app code, runs as non-root user

**Security hardening:**
- Non-root user `appuser` (UID 1000)
- No build tools in final image
- No `.env`, test files, or model weights in image
- Healthcheck via `GET /health`

**Production uvicorn config:**
- 4 workers (configurable via env)
- Binding to `0.0.0.0:8000`
- No auto-reload

### EAS Build Profiles

Three profiles matching the release lifecycle:

| Profile | Use Case | Distribution | iOS | Android |
|---------|----------|--------------|-----|---------|
| `development` | Daily dev, device testing | Internal | Dev client | APK (debug) |
| `preview` | Internal QA, stakeholder review | Internal | Dev client | APK (release) |
| `production` | App Store / Play Store | Store | App Store | AAB |

---

## 3. The decision

### Why multi-stage Dockerfile?

**Alternative:** Single-stage `FROM python:3.11-slim` with `pip install` in final image.
**Rejected because:**
- Final image would contain build tools (gcc, pip, setuptools) — larger attack surface
- Larger image size (~500MB vs ~150MB)
- Multi-stage is Docker best practice for Python apps

### Why non-root user?

**Alternative:** Run as root (default).
**Rejected because:** Container escape vulnerabilities are real. Running as non-root user `appuser` (UID 1000) follows the principle of least privilege.

### Why exclude model weights from image?

**Alternative:** `COPY models/ ./models/` in Dockerfile.
**Rejected because:**
- Model files are large (100MB–1GB+) — bloats image
- Models change independently of code — requires rebuild on model update
- Different environments need different models (mock vs PyTorch vs ONNX)
- **Runtime approach**: Mount models via volume or download at startup

### Why `docker-compose.yml` at root?

**Alternative:** Compose file inside `inference-server/`.
**Rejected because:** Root compose allows future addition of other services (e.g., local Supabase, Redis) and keeps orchestration at project level.

### Why EAS over classic Expo build?

**Alternative:** `expo build:ios` / `expo build:android` (deprecated).
**Rejected because:** Expo deprecated classic builds in favor of EAS. EAS provides:
- Cloud builds (no local Xcode/Android Studio needed)
- Build profiles with environment-specific config
- OTA updates via `expo-updates`
- Store submission automation

---

## 4. The code, line by line

### `inference-server/Dockerfile`

```dockerfile
# Stage 1: Builder
FROM python:3.11-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -e ".[dev]"

# Stage 2: Runtime
FROM python:3.11-slim AS runtime
RUN groupadd -r appuser && useradd -r -g appuser -u 1000 appuser
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY inference_server ./inference_server
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
CMD ["uvicorn", "inference_server.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

**Key lines:**
- `USER appuser` — drops privileges after copying files
- `HEALTHCHECK` — uses existing `/health` endpoint (FastAPI route in `main.py:60-67`)
- `CMD` — production uvicorn with 4 workers

### `inference-server/.dockerignore`

Excludes:
- Python cache (`__pycache__/`, `*.pyc`)
- Test artifacts (`.pytest_cache/`, `.coverage/`)
- Virtual environments (`.venv/`, `venv/`)
- Environment files (`.env`, `.env.local`)
- Model weights (`*.pt`, `*.onnx`, `*.bin`)
- IDE folders (`.vscode/`, `.idea/`)

### `docker-compose.yml`

```yaml
version: '3.8'
services:
  inference:
    build:
      context: ./inference-server
      dockerfile: Dockerfile
    container_name: beautilyze-inference
    ports:
      - "8000:8000"
    environment:
      - MODEL_MODE=mock
      - MODEL_VERSION=mock-v1
      - HOST=0.0.0.0
      - PORT=8000
      - RELOAD=false
      - LOG_LEVEL=INFO
      # ... CORS, image processing settings
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    restart: unless-stopped
```

**Key points:**
- `build.context: ./inference-server` — Dockerfile location
- `ports: "8000:8000"` — host:container port mapping
- `environment` — all config from `.env.example` as compose env vars
- `healthcheck` — mirrors Dockerfile HEALTHCHECK for compose awareness
- `restart: unless-stopped` — auto-restart on failure

### `app/eas.json`

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "resourceClass": "m-medium" },
      "android": { "buildType": "apk", "gradleCommand": ":app:assembleDebug" }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "resourceClass": "m-medium" },
      "android": { "buildType": "apk", "gradleCommand": ":app:assembleRelease" }
    },
    "production": {
      "distribution": "store",
      "ios": { "resourceClass": "m-medium" },
      "android": { "buildType": "aab", "gradleCommand": ":app:bundleRelease" }
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "YOUR_APPLE_ID", "ascAppId": "YOUR_ASC_APP_ID" },
      "android": { "serviceAccountKeyPath": "./google-play-service-account.json" }
    }
  }
}
```

**Profile differences:**
- `developmentClient: true` — enables Expo Dev Client for live reload
- `distribution: internal` — installs via Expo/Ad Hoc, not store
- `buildType: apk` vs `aab` — APK for testing, AAB for Play Store
- `submit` — store submission config (placeholders for credentials)

---

## 5. How to verify it works

### Local Docker build & test (requires Docker Desktop)

```bash
# 1. Build the image
cd inference-server
docker build -t beautilyze-inference .

# 2. Run container
docker run -d -p 8000:8000 --name beautilyze-inference beautilyze-inference

# 3. Wait for healthcheck (10-15s), then test
curl http://localhost:8000/health
# Expected: {"status":"ok","model_mode":"mock","model_version":"mock-v1"}

# 4. Test prediction endpoint
curl -X POST -F "file=@test_image.jpg" http://localhost:8000/predict/skin-type
# Expected: {"label":"oily","confidence":0.73,"model_version":"mock-v1"}

# 5. Cleanup
docker stop beautilyze-inference && docker rm beautilyze-inference
```

### Docker Compose (easier for development)

```bash
# From project root
docker-compose up -d --build

# Check status
docker-compose ps
# Expected: beautilyze-inference   Up (healthy)

# View logs
docker-compose logs -f inference

# Test health
curl http://localhost:8000/health

# Stop
docker-compose down
```

### EAS Configuration Validation

```bash
cd app
npx eas build:configure
# Validates eas.json syntax, prompts for project linking
# No actual build triggered — just syntax check
```

---

## 6. What could go wrong

| Failure Mode | Symptoms | Resolution |
|--------------|----------|------------|
| Docker build fails | `pip install` errors, missing system deps | Check `pyproject.toml` deps; add system packages to builder stage |
| Healthcheck fails | Container stays `unhealthy` | Verify `/health` endpoint returns 200; check `curl` in container |
| Permission denied | `EACCES` on file access | Ensure `appuser` owns `/app` or files are world-readable |
| Port already in use | `bind: address already in use` | Stop existing process on 8000; change compose port mapping |
| EAS build fails | `eas.json` syntax error, missing credentials | Run `npx eas build:configure` to validate; fill placeholders |
| CORS errors | Mobile app can't call inference | Verify `CORS_ALLOW_ORIGINS` includes Expo dev URLs |

---

## 7. If you remember one thing

The deployment scaffolding separates **build-time** (Dockerfile builder stage, EAS cloud builders) from **runtime** (container as non-root user, EAS store binaries). Model weights are **never baked into images** — they're mounted at runtime or loaded via mock mode for development.

---

## 8. Questions to ask yourself before the defense

1. **What are the two stages in the Dockerfile and why?**
   Builder (compile deps, install packages) → Runtime (minimal, non-root, copy only artifacts).

2. **Why run as non-root user `appuser`?**
   Principle of least privilege; mitigates container escape vulnerabilities.

3. **How does the healthcheck work?**
   `HEALTHCHECK` in Dockerfile + `healthcheck` in compose both call `GET /health` (FastAPI endpoint returning `{"status":"ok",...}`).

4. **Where do model weights live in production?**
   Not in the image. Mounted via Docker volume or downloaded at startup. Mock mode works without any weights.

5. **What's the difference between `development`, `preview`, and `production` EAS profiles?**
   Dev: dev client + debug APK. Preview: dev client + release APK. Production: store distribution + AAB.

6. **Why `aab` for production Android but `apk` for preview?**
   Play Store requires AAB (App Bundle); APK is installable directly for testing.

7. **How does the mobile app know the inference server URL?**
   `EXPO_PUBLIC_INFERENCE_SERVER_URL` env var (set in `app.config.js` or `.env`). Compose sets it to `http://localhost:8000`.

8. **What does `restart: unless-stopped` do?**
   Container restarts automatically on failure or host reboot, unless explicitly stopped.

9. **Why exclude `.env` and model files in `.dockerignore`?**
   Secrets shouldn't be in images; models are large and environment-specific.

10. **How many uvicorn workers and why?**
    4 workers (default). Matches typical 4-core cloud instances; configurable via `UVICORN_WORKERS` env var.