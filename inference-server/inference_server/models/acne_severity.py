"""
Acne severity model wrapper.
Provides a clean interface for acne severity prediction.
"""
import numpy as np
from inference_server.config import settings
from inference_server.models.loader import load_acne_severity_model
from inference_server.schemas.prediction import PredictResponse


# Global model instance (loaded on first use)
_acne_severity_model = None


def get_acne_severity_model():
    """Get or create the acne severity model instance."""
    global _acne_severity_model
    if _acne_severity_model is None:
        _acne_severity_model = load_acne_severity_model()
    return _acne_severity_model


def predict_acne_severity(input_tensor: np.ndarray) -> PredictResponse:
    """
    Predict acne severity from preprocessed tensor.
    Returns PredictResponse with label, confidence, model_version.
    """
    model = get_acne_severity_model()
    label, confidence = model.predict(input_tensor)
    return PredictResponse(
        label=label,
        confidence=confidence,
        model_version=settings.model_version
    )