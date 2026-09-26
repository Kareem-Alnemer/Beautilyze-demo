# Security & Privacy Hardening for FastAPI Inference Server

**Date:** 2026-09-26
**Blueprint:** §8.1, §8.4
**Files changed:**
- `inference-server/pyproject.toml` (added slowapi dependency)
- `inference-server/inference_server/config.py` (added environment, rate_limit_predict, redis_url settings)
- `inference-server/inference_server/main.py` (rate limiter, privacy headers middleware, CORS lockdown, shared rate limit)
- `inference-server/tests/test_privacy.py` (15 new tests)
- `inference-server/tests/conftest.py` (fixtures for test client and mock image)
**Prerequisites:** 11-inference-server.md (FastAPI inference server basics)

## 1. What this task was

This task implements production-grade security and privacy hardening for the FastAPI inference server per Blueprint §8.1 (production security with rate limiting) and §8.4 (privacy headers, zero disk writes, no response caching on prediction endpoints). The inference server handles user face photos for skin type and acne severity prediction, so it must:
- Never write images to disk (in-memory only)
- Never cache prediction responses (privacy headers: `Cache-Control: no-store, max-age=0, must-revalidate` + `Pragma: no-cache`)
- Rate limit prediction endpoints to 10 requests/minute per IP (shared across both endpoints) to mitigate DoS
- Exempt the health endpoint from rate limiting
- Lock down CORS in production mode (explicit origins only)

## 2. The concept

**Rate limiting** is a technique to control how many requests a client can make in a given time window. It prevents abuse (DoS attacks, scraping) by returning HTTP 429 (Too Many Requests) when the limit is exceeded. The standard headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` tell the client their quota status.

**Shared rate limit** means multiple endpoints draw from the same quota bucket. Here, `/predict/skin-type` and `/predict/acne-severity` share a 10 req/min bucket per IP. A client making 5 skin-type requests + 5 acne-severity requests has exhausted their quota.

**Privacy headers** (`Cache-Control: no-store, max-age=0, must-revalidate` and `Pragma: no-cache`) instruct browsers and proxies not to cache the response. This is critical for endpoints returning biometric analysis results — we don't want face-derived data sitting in browser cache or CDN logs.

**CORS lockdown** restricts which origins can call the API. In development we allow `*` for ease of testing; in production we only allow the known frontend origin (e.g., `https://app.beautilyze.com`).

**In-memory processing** means image bytes never touch disk. The `ImageDataContext` context manager (from `utils/privacy.py`) ensures byte arrays are zeroed after use.

## 3. The decision

### Rate limiting approach
**Options considered:**
1. **Decorator per endpoint** (`@limiter.limit()` on each route) — Simple but creates separate buckets per endpoint. Sharing requires `shared_limit()` with a common scope.
2. **Middleware with `default_limits`** — Applies to all routes, but uses endpoint name as scope → separate buckets.
3. **Middleware with `application_limits`** — Global limits with scope="global", checked by middleware for all routes. Combined with a key function that returns the same key for prediction endpoints → shared bucket. Health endpoint exempted via `_exempt_routes`.

**Chosen:** Option 3 (application_limits + custom key function + exempt health). This is the cleanest because:
- The middleware handles rate limit checks and header injection in one place
- No decorator wrapper trying to inject headers into Pydantic models (which caused crashes)
- Single source of truth for the rate limit configuration
- Easy to exempt health endpoint

**Rejected:** Option 1 (decorators) because the decorator wrapper receives the Pydantic model return value, not a Starlette Response, causing `Exception: parameter 'response' must be an instance of starlette.responses.Response` when it tries to inject headers. Option 2 (default_limits) because the scope defaults to endpoint name, creating separate buckets.

### Privacy headers
**Decision:** Add via a custom middleware that runs after the route handler, checks `request.url.path.startswith("/predict/")`, and adds headers to the response. This ensures headers are present on ALL responses from prediction endpoints — success, 400, 413, 429, 500.

### CORS
**Decision:** Environment-aware CORS. `settings.environment == "production"` → use `settings.cors_allow_origins` (comma-separated from env). Otherwise → `["*"]`. This is configured in `config.py` and applied in `main.py`.

### Dependencies
**Decision:** Add `slowapi>=0.1.9` to `pyproject.toml`. It's the standard rate limiting library for FastAPI/Starlette, well-maintained, and supports Redis-backed storage for multi-instance deployments.

## 4. The code, line by line

### `inference-server/pyproject.toml`
Added `slowapi>=0.1.9` to dependencies. This provides the `Limiter`, `SlowAPIMiddleware`, and rate limit exceeded handler.

### `inference-server/inference_server/config.py`
Added three new settings:
- `environment: str = "development"` — Controls CORS behavior and other prod-only features
- `rate_limit_predict: str = "10/minute"` — Rate limit string for prediction endpoints (parseable by slowapi)
- `redis_url: Optional[str] = None` — Optional Redis URL for distributed rate limiting (falls back to in-memory)

### `inference-server/inference_server/main.py`

**Lines 36-48: Rate limiter setup**
```python
def rate_limit_key(request: Request) -> str:
    path = request.url.path
    if path.startswith("/predict/"):
        return f"predict:{get_remote_address(request)}"
    return f"other:{get_remote_address(request)}"

limiter = Limiter(
    key_func=rate_limit_key,
    default_limits=[],
    application_limits=[settings.rate_limit_predict],
    storage_uri=settings.redis_url,
    headers_enabled=True,
)
```
- `rate_limit_key`: Returns `"predict:<ip>"` for prediction endpoints, `"other:<ip>"` for others. This makes all prediction endpoints share the same bucket key.
- `application_limits=[settings.rate_limit_predict]`: Applies the 10/minute limit globally with scope="global". The middleware checks this for every request.
- `headers_enabled=True`: Enables `X-RateLimit-*` and `Retry-After` headers on responses.

**Line 71: Exempt health endpoint**
```python
limiter._exempt_routes.add("inference_server.main.health_check")
```
Adds the health check function name to the exempt set. The middleware skips rate limiting for exempted routes.

**Line 74: Add SlowAPIMiddleware**
```python
app.add_middleware(SlowAPIMiddleware)
```
This middleware runs on every request, checks `application_limits` (and `default_limits` if any), injects rate limit headers into the response, and returns 429 if exceeded.

**Lines 90-98: Privacy headers middleware**
```python
@app.middleware("http")
async def privacy_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/predict/"):
        response.headers["Cache-Control"] = "no-store, max-age=0, must-revalidate"
        response.headers["Pragma"] = "no-cache"
    return response
```
Runs after the route handler. Adds privacy headers to all `/predict/*` responses regardless of status code.

**Lines 100-108: CORS configuration**
```python
if settings.environment == "production":
    cors_origins = settings.cors_allow_origins
else:
    cors_origins = ["*"]
app.add_middleware(CORSMiddleware, allow_origins=cors_origins, ...)
```
Production: explicit origins from env. Development: wildcard.

**Lines 157-194: Prediction endpoints (no decorators)**
The endpoints are plain async functions. Rate limiting is handled entirely by the middleware via `application_limits`.

### `inference-server/tests/test_privacy.py`
15 tests covering:
- Privacy headers on success (200) and error (400, 413, 429) responses
- Rate limit enforcement on each endpoint individually
- Shared rate limit across both endpoints (5+5=10 → 11th is 429)
- Health endpoint exempt from rate limiting
- Rate limit headers present on success and 429 responses
- CORS behavior in development vs production
- Privacy headers on error responses

### `inference-server/tests/conftest.py`
Fixtures:
- `mock_image_file`: Minimal valid JPEG bytes (1x1 pixel)
- `client`: TestClient with development settings
- `limiter`: Access to app.state.limiter
- `reset_limiter`: Autouse fixture that clears storage before/after each test

## 5. How to verify it works

```bash
cd inference-server
python -m pytest tests/test_privacy.py -v
# All 15 tests should pass

python -m pytest -v
# All 68 tests should pass (2 errors are pre-existing fixture issues in oversized_bytes)
```

Manual verification:
```bash
# Start server
uvicorn inference_server.main:app --reload

# Test rate limit headers
curl -i -X POST http://localhost:8000/predict/skin-type \
  -F "file=@test.jpg"
# Should see: X-RateLimit-Limit: 10, X-RateLimit-Remaining: 9, X-RateLimit-Reset: <timestamp>, Retry-After: <date>

# Test privacy headers
curl -i -X POST http://localhost:8000/predict/skin-type \
  -F "file=@test.jpg"
# Should see: Cache-Control: no-store, max-age=0, must-revalidate
#             Pragma: no-cache

# Test health endpoint (no rate limit, no privacy headers)
curl -i http://localhost:8000/health
# Should NOT have Cache-Control: no-store or X-RateLimit-* headers

# Exhaust rate limit (11 requests)
for i in {1..11}; do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8000/predict/skin-type -F "file=@test.jpg"; done
# First 10: 200, 11th: 429
```

## 6. What could go wrong

1. **Rate limit not shared across endpoints** — If the key function returns different keys for each endpoint, they won't share the bucket. Verify `rate_limit_key` returns `"predict:<ip>"` for both `/predict/skin-type` and `/predict/acne-severity`.

2. **Headers missing on 429 responses** — The middleware injects headers after `call_next`, but if an exception is raised before `call_next` returns, headers might not be added. The `SlowAPIMiddleware` handles this by injecting headers on the error response too (via `_rate_limit_exceeded_handler`).

3. **CORS misconfiguration in production** — If `CORS_ALLOW_ORIGINS` env var is not set or malformed, production CORS will fail. The config parses it as a comma-separated list; ensure no trailing spaces.

4. **Redis connection failure** — If `REDIS_URL` is set but Redis is unreachable, slowapi falls back to in-memory storage (with a warning). This is acceptable for single-instance but breaks rate limiting across multiple instances.

5. **Test fixture `oversized_bytes` too small** — The fixture creates a ~142KB JPEG, not >5MB. This causes 2 test errors (not failures) in `test_endpoints.py`. Fix by generating a larger test image or adjusting the fixture.

## 7. If you remember one thing

**Rate limiting is handled by `SlowAPIMiddleware` with `application_limits` (global scope) + a custom key function that returns the same key for all prediction endpoints. The health endpoint is exempted via `_exempt_routes`. Privacy headers are added by a separate middleware that runs after the route handler. No decorators on endpoints — they caused header injection crashes because decorators receive Pydantic models, not Response objects.**

## 8. Questions to ask yourself before the defense

1. **Why use `application_limits` instead of `default_limits`?** Because `default_limits` use the endpoint name as scope, creating separate buckets per endpoint. `application_limits` use scope="global", so combined with a shared key function, all prediction endpoints share one bucket.

2. **Why not use `@limiter.limit()` decorators?** The decorator wrapper tries to inject headers into the return value. FastAPI endpoints return Pydantic models, not Response objects. The decorator crashes with `Exception: parameter 'response' must be an instance of starlette.responses.Response`.

3. **How does the middleware know to skip rate limiting for /health?** `limiter._exempt_routes.add("inference_server.main.health_check")` adds the endpoint function name to the exempt set. The middleware checks this set before applying limits.

4. **What headers does slowapi add?** `X-RateLimit-Limit` (max requests), `X-RateLimit-Remaining` (requests left in window), `X-RateLimit-Reset` (Unix timestamp when window resets), `Retry-After` (HTTP date or seconds until retry).

5. **Why are privacy headers added in a separate middleware, not in the route handler?** To ensure they're present on ALL responses — success, validation errors (400), size errors (413), rate limited (429), and server errors (500). A middleware runs after the entire request chain.

6. **What happens if Redis is configured but unavailable?** Slowapi logs a warning and falls back to in-memory storage. Rate limiting still works but only per-instance (not shared across multiple server instances).

7. **How does the key function access the request path?** The key function receives the `Request` object (slowapi calls it with `request` parameter). It checks `request.url.path.startswith("/predict/")` to determine which key prefix to use.