"""
Skin type model wrapper.
Provides a clean interface for skin type prediction.
"""
import numpy as np
from inference_server.config import settings
from inference_server.models.loader import load_skin_type_model
from inference_server.schemas.prediction import PredictResponse


# Global model instance (loaded on first use)
_skin_type_model = None


def get_skin_type_model():
    """Get or create the skin type model instance."""
    global _skin_type_model
    if _skin_type_model is None:
        _skin_type_model = load_skin_type_model()
    return _skin_type_model


def predict_skin_type(input_tensor: np.ndarray) -> PredictResponse:
    """
    Predict skin type from preprocessed tensor.
    Returns PredictResponse with label, confidence, model_version.
    """
    model = get_skin_type_model()
    label, confidence = model.predict(input_tensor)
    return PredictResponse(
        label=label,
        confidence=confidence,
        model_version=settings.model_version
    )