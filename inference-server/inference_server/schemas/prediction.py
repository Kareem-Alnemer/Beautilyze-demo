"""
Pydantic schemas for prediction API requests and responses.
Per blueprint §5.2 AI Output Contract.
"""
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict
from fastapi import UploadFile


# Skin type and acne severity enums per blueprint §5.1
SkinTypeLabel = Literal["dry", "normal", "oily"]
AcneSeverityLabel = Literal["mild", "moderate", "severe"]


class PredictResponse(BaseModel):
    """
    AI Output Contract per blueprint §5.2.
    Every prediction returns label, confidence, and model_version.
    Confidence is raw softmax output (not calibrated probability).
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "label": "oily",
                "confidence": 0.73,
                "model_version": "dima806/skin_types_image_detection"
            }
        }
    )

    label: SkinTypeLabel | AcneSeverityLabel = Field(
        description="Predicted class label"
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Model's raw softmax output (not calibrated probability)"
    )
    model_version: str = Field(
        description="Model identifier for traceability"
    )


class HealthResponse(BaseModel):
    """Health check response."""
    model_config = ConfigDict(
        json_schema_extra={"example": {"status": "ok", "model_mode": "mock"}}
    )

    status: Literal["ok"] = "ok"
    model_mode: str
    model_version: str


class AnalyzeResponse(BaseModel):
    """Combined analysis response with database status."""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "success",
                "data": {
                    "skin_type": {"label": "oily", "confidence": 0.73},
                    "acne_severity": {"label": "mild", "confidence": 0.85}
                },
                "db_record": {"id": "uuid", "created_at": "2024-01-01T00:00:00Z"}
            }
        }
    )

    status: Literal["success", "partial"] = "success"
    data: dict
    db_record: Optional[dict] = None


# Request validation is handled by FastAPI's UploadFile
# No separate request schema needed for multipart/form-data