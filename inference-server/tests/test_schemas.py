"""
Tests for Pydantic schemas.
Per blueprint §5.2 AI Output Contract.
"""
import pytest
from pydantic import ValidationError

from inference_server.schemas.prediction import PredictResponse, HealthResponse


class TestPredictResponse:
    """Tests for PredictResponse schema."""

    def test_valid_skin_type_response(self):
        """Valid skin type response matches contract."""
        response = PredictResponse(
            label="oily",
            confidence=0.73,
            model_version="dima806/skin_types_image_detection"
        )
        assert response.label == "oily"
        assert response.confidence == 0.73
        assert response.model_version == "dima806/skin_types_image_detection"

    def test_valid_acne_severity_response(self):
        """Valid acne severity response matches contract."""
        response = PredictResponse(
            label="moderate",
            confidence=0.85,
            model_version="acne-severity-v1"
        )
        assert response.label == "moderate"
        assert response.confidence == 0.85

    def test_confidence_range_valid(self):
        """Confidence must be in [0.0, 1.0]."""
        # Valid boundaries
        PredictResponse(label="oily", confidence=0.0, model_version="v1")
        PredictResponse(label="oily", confidence=1.0, model_version="v1")
        PredictResponse(label="oily", confidence=0.5, model_version="v1")

    def test_confidence_below_zero_invalid(self):
        """Confidence below 0.0 is invalid."""
        with pytest.raises(ValidationError):
            PredictResponse(label="oily", confidence=-0.01, model_version="v1")

    def test_confidence_above_one_invalid(self):
        """Confidence above 1.0 is invalid."""
        with pytest.raises(ValidationError):
            PredictResponse(label="oily", confidence=1.01, model_version="v1")

    def test_skin_type_label_enum(self):
        """Label must be valid skin type."""
        for label in ["dry", "normal", "oily"]:
            PredictResponse(label=label, confidence=0.5, model_version="v1")

    def test_acne_severity_label_enum(self):
        """Label must be valid acne severity."""
        for label in ["mild", "moderate", "severe"]:
            PredictResponse(label=label, confidence=0.5, model_version="v1")

    def test_invalid_label_rejected(self):
        """Invalid label is rejected."""
        with pytest.raises(ValidationError):
            PredictResponse(label="combination", confidence=0.5, model_version="v1")
        with pytest.raises(ValidationError):
            PredictResponse(label="very_severe", confidence=0.5, model_version="v1")

    def test_model_version_required(self):
        """model_version is required."""
        with pytest.raises(ValidationError):
            PredictResponse(label="oily", confidence=0.5)


class TestHealthResponse:
    """Tests for HealthResponse schema."""

    def test_valid_health_response(self):
        """Valid health response."""
        response = HealthResponse(
            status="ok",
            model_mode="mock",
            model_version="mock-v1"
        )
        assert response.status == "ok"
        assert response.model_mode == "mock"
        assert response.model_version == "mock-v1"

    def test_status_must_be_ok(self):
        """Status must be 'ok'."""
        with pytest.raises(ValidationError):
            HealthResponse(status="error", model_mode="mock", model_version="v1")