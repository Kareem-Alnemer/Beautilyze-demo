"""
FastAPI application for BeautiLyze inference server.
Endpoints:
- GET /health: Health check
- POST /predict/skin-type: Predict skin type from image
- POST /predict/acne-severity: Predict acne severity from image
"""
import logging
import numpy as np
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from inference_server.config import settings
from inference_server.schemas.prediction import PredictResponse, HealthResponse
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
from inference_server.utils.privacy import ImageDataContext

# Configure logging
logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)


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

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        model_mode=settings.model_mode,
        model_version=settings.model_version,
    )


async def _process_prediction(
    file: UploadFile,
    predict_fn,
    endpoint_name: str,
) -> PredictResponse:
    """
    Shared prediction logic for both endpoints.
    Validates, preprocesses, predicts, and ensures privacy.
    """
    # Validate content type
    try:
        validate_image_content_type(file.content_type or "")
    except ImageValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Read file bytes
    image_bytes = await file.read()
    
    # Validate file size
    try:
        validate_image_size(len(image_bytes))
    except ImageValidationError as e:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(e))

    # Process with privacy context (ensures memory cleanup)
    with ImageDataContext(image_bytes) as img_bytes:
        try:
            # Preprocess
            input_tensor = preprocess_image_bytes(img_bytes)
        except ImageValidationError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except Exception as e:
            logger.error(f"Preprocessing failed: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Image preprocessing failed")

        # Predict
        try:
            result = predict_fn(input_tensor)
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Prediction failed")

    logger.info(f"{endpoint_name} prediction: {result.label} (confidence: {result.confidence})")
    return result


@app.post(
    "/predict/skin-type",
    response_model=PredictResponse,
    responses={
        400: {"description": "Invalid image format or content"},
        413: {"description": "File too large"},
        500: {"description": "Prediction failed"},
    },
)
async def predict_skin_type_endpoint(file: UploadFile = File(...)) -> PredictResponse:
    """
    Predict skin type from uploaded image.
    Returns label (dry/normal/oily), confidence (0-1), and model_version.
    """
    return await _process_prediction(file, predict_skin_type, "skin-type")


@app.post(
    "/predict/acne-severity",
    response_model=PredictResponse,
    responses={
        400: {"description": "Invalid image format or content"},
        413: {"description": "File too large"},
        500: {"description": "Prediction failed"},
    },
)
async def predict_acne_severity_endpoint(file: UploadFile = File(...)) -> PredictResponse:
    """
    Predict acne severity from uploaded image.
    Returns label (mild/moderate/severe), confidence (0-1), and model_version.
    """
    return await _process_prediction(file, predict_acne_severity, "acne-severity")


# Global exception handler for validation errors
@app.exception_handler(ImageValidationError)
async def validation_exception_handler(request, exc: ImageValidationError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "inference_server.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
    )