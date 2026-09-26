"""
FastAPI application for BeautiLyze inference server.
Endpoints:
- GET /health: Health check
- POST /predict/skin-type: Predict skin type from image
- POST /predict/acne-severity: Predict acne severity from image
- POST /analyze: Combined analysis with Supabase storage
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status, Request, Response, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from typing import Optional

from inference_server.config import settings
from inference_server.schemas.prediction import PredictResponse, HealthResponse, AnalyzeResponse
from inference_server.preprocessing.image import (
    validate_image_content_type,
    validate_image_size,
    preprocess_image_bytes,
    ImageValidationError,
    ImageSizeError,
    ImageFormatError,
)
from inference_server.models.skin_type import predict_skin_type
from inference_server.models.acne_severity import predict_acne_severity
from inference_server.preprocessing.upload import read_image_upload
from starlette.concurrency import run_in_threadpool
from inference_server.utils.privacy import ImageDataContext


# Configure logging
logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

# Rate limiter setup
def rate_limit_key(request: Request) -> str:
    """
    Rate limit key function that returns different keys based on the endpoint.
    - Prediction endpoints (/predict/*) share a common bucket: "predict:<ip>"
    - Health endpoint (/health) gets a unique key per IP (but will be exempted)
    """
    path = request.url.path
    if (path.startswith("/predict/") or path == "/analyze"):
        return f"predict:{get_remote_address(request)}"
    # For other endpoints (like /health), use IP-based key
    return f"other:{get_remote_address(request)}"


limiter = Limiter(
    key_func=rate_limit_key,
    default_limits=[],
    application_limits=[settings.rate_limit_predict],
    storage_uri=settings.redis_url,
    headers_enabled=True,  # Enable rate limit headers (X-RateLimit-*)
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info(f"Starting inference server in {settings.model_mode} mode")
    logger.info(f"Model version: {settings.model_version}")
    yield
    logger.info("Shutting down inference server")


app = FastAPI(
    title="BeautiLyze Inference Server",
    description="Skin type and acne severity prediction API",
    version="0.1.0",
    lifespan=lifespan,
)

# Add rate limit middleware (adds rate limit headers to responses)
app.add_middleware(SlowAPIMiddleware)

# Attach rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Exempt health endpoint from rate limiting
limiter._exempt_routes.add("inference_server.main.health_check")

# CORS middleware - environment-aware
if settings.environment == "production":
    cors_origins = settings.cors_allow_origins
else:
    # Development: allow all origins for easier local testing
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)


# Privacy headers middleware for prediction endpoints
@app.middleware("http")
async def privacy_headers_middleware(request: Request, call_next):
    """Add privacy headers to prediction endpoint responses."""
    response = await call_next(request)
    if (request.url.path.startswith("/predict/") or request.url.path == "/analyze"):
        response.headers["Cache-Control"] = "no-store, max-age=0, must-revalidate"
        response.headers["Pragma"] = "no-cache"
    return response


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint (not rate limited)."""
    return HealthResponse(
        status="ok",
        model_mode=settings.model_mode,
        model_version=settings.model_version,
    )


async def _process_prediction(request: Request, predict_fn, endpoint_name: str) -> PredictResponse:
    image_bytes = await read_image_upload(request)
    try:
        with ImageDataContext(image_bytes) as img_bytes:
            input_tensor = await run_in_threadpool(preprocess_image_bytes, img_bytes)
            return await run_in_threadpool(predict_fn, input_tensor)
    except ImageValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception:
        logger.error("Inference failed for %s", endpoint_name)
        raise HTTPException(status_code=503, detail="Prediction is unavailable")


@app.post(
    "/predict/skin-type",
    response_model=PredictResponse,
    responses={
        400: {"description": "Invalid image format or content"},
        413: {"description": "File too large"},
        429: {"description": "Rate limit exceeded"},
        500: {"description": "Prediction failed"},
    },
)
async def predict_skin_type_endpoint(request: Request) -> PredictResponse:
    """
    Predict skin type from uploaded image.
    Returns label (dry/normal/oily), confidence (0-1), and model_version.
    Rate limited to 10 requests per minute per IP (shared across prediction endpoints).
    """
    return await _process_prediction(request, predict_skin_type, "skin-type")


@app.post(
    "/predict/acne-severity",
    response_model=PredictResponse,
    responses={
        400: {"description": "Invalid image format or content"},
        413: {"description": "File too large"},
        429: {"description": "Rate limit exceeded"},
        500: {"description": "Prediction failed"},
    },
)
async def predict_acne_severity_endpoint(request: Request) -> PredictResponse:
    """
    Predict acne severity from uploaded image.
    Returns label (mild/moderate/severe), confidence (0-1), and model_version.
    Rate limited to 10 requests per minute per IP (shared across prediction endpoints).
    """
    return await _process_prediction(request, predict_acne_severity, "acne-severity")


# Global exception handler for validation errors
@app.exception_handler(ImageValidationError)
async def validation_exception_handler(request, exc: ImageValidationError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
    )


@app.post(
    "/analyze",
    response_model=AnalyzeResponse,
    responses={
        400: {"description": "Invalid image format or content"},
        413: {"description": "File too large"},
        429: {"description": "Rate limit exceeded"},
        500: {"description": "Analysis failed"},
    },
)
async def analyze_endpoint(request: Request) -> AnalyzeResponse:
    """Compatibility endpoint; persistence belongs to the authenticated app."""
    image_bytes = await read_image_upload(request)
    try:
        with ImageDataContext(image_bytes) as img_bytes:
            tensor = await run_in_threadpool(preprocess_image_bytes, img_bytes)
            skin = await run_in_threadpool(predict_skin_type, tensor)
            acne = await run_in_threadpool(predict_acne_severity, tensor)
        return AnalyzeResponse(status="success", data={
            "skin_type": skin.model_dump(), "acne_severity": acne.model_dump(),
        })
    except ImageValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception:
        logger.error("Combined inference failed")
        raise HTTPException(status_code=503, detail="Prediction is unavailable")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "inference_server.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
    )
