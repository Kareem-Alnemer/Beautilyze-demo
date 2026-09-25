"""
Tests for mock model behavior.
"""
import pytest
import numpy as np

from inference_server.models.loader import MockModel
from inference_server.models.skin_type import predict_skin_type
from inference_server.models.acne_severity import predict_acne_severity
from inference_server.config import settings


class TestMockModel:
    """Tests for MockModel class."""

    def test_deterministic_same_input(self):
        """Same input tensor produces same output."""
        model = MockModel(["a", "b", "c"], seed=42)
        tensor = np.random.rand(1, 3, 224, 224).astype(np.float32)
        
        label1, conf1 = model.predict(tensor)
        label2, conf2 = model.predict(tensor)
        
        assert label1 == label2
        assert conf1 == conf2

    def test_different_inputs_different_outputs(self):
        """Different inputs can produce different outputs."""
        model = MockModel(["a", "b", "c"], seed=42)
        tensor1 = np.ones((1, 3, 224, 224), dtype=np.float32)
        tensor2 = np.zeros((1, 3, 224, 224), dtype=np.float32)
        
        label1, _ = model.predict(tensor1)
        label2, _ = model.predict(tensor2)
        # May or may not be different, but should not crash

    def test_confidence_range(self):
        """Confidence always in [0.55, 0.95] for mock."""
        model = MockModel(["a", "b", "c"], seed=42)
        for _ in range(100):
            tensor = np.random.rand(1, 3, 224, 224).astype(np.float32)
            _, conf = model.predict(tensor)
            assert 0.55 <= conf <= 0.95

    def test_label_in_provided_list(self):
        """Returned label is always from provided labels."""
        labels = ["x", "y", "z"]
        model = MockModel(labels, seed=42)
        for _ in range(50):
            tensor = np.random.rand(1, 3, 224, 224).astype(np.float32)
            label, _ = model.predict(tensor)
            assert label in labels


class TestSkinTypeMock:
    """Tests for skin type mock predictions."""

    def test_returns_valid_skin_type(self):
        """Returns only dry/normal/oily."""
        tensor = np.random.rand(1, 3, 224, 224).astype(np.float32)
        result = predict_skin_type(tensor)
        assert result.label in ["dry", "normal", "oily"]

    def test_confidence_in_range(self):
        """Confidence in [0, 1]."""
        tensor = np.random.rand(1, 3, 224, 224).astype(np.float32)
        result = predict_skin_type(tensor)
        assert 0.0 <= result.confidence <= 1.0

    def test_model_version_included(self):
        """Model version included in response."""
        tensor = np.random.rand(1, 3, 224, 224).astype(np.float32)
        result = predict_skin_type(tensor)
        assert result.model_version == settings.model_version

    def test_deterministic(self):
        """Same input gives same output."""
        tensor = np.ones((1, 3, 224, 224), dtype=np.float32)
        r1 = predict_skin_type(tensor)
        r2 = predict_skin_type(tensor)
        assert r1.label == r2.label
        assert r1.confidence == r2.confidence


class TestAcneSeverityMock:
    """Tests for acne severity mock predictions."""

    def test_returns_valid_severity(self):
        """Returns only mild/moderate/severe."""
        tensor = np.random.rand(1, 3, 224, 224).astype(np.float32)
        result = predict_acne_severity(tensor)
        assert result.label in ["mild", "moderate", "severe"]

    def test_confidence_in_range(self):
        """Confidence in [0, 1]."""
        tensor = np.random.rand(1, 3, 224, 224).astype(np.float32)
        result = predict_acne_severity(tensor)
        assert 0.0 <= result.confidence <= 1.0

    def test_model_version_included(self):
        """Model version included in response."""
        tensor = np.random.rand(1, 3, 224, 224).astype(np.float32)
        result = predict_acne_severity(tensor)
        assert result.model_version == settings.model_version

    def test_deterministic(self):
        """Same input gives same output."""
        tensor = np.ones((1, 3, 224, 224), dtype=np.float32)
        r1 = predict_acne_severity(tensor)
        r2 = predict_acne_severity(tensor)
        assert r1.label == r2.label
        assert r1.confidence == r2.confidence

    def test_different_from_skin_type(self):
        """Acne and skin type models produce different outputs for same input."""
        tensor = np.ones((1, 3, 224, 224), dtype=np.float32)
        skin_result = predict_skin_type(tensor)
        acne_result = predict_acne_severity(tensor)
        # They use different seeds, so labels should be from different sets
        assert skin_result.label in ["dry", "normal", "oily"]
        assert acne_result.label in ["mild", "moderate", "severe"]