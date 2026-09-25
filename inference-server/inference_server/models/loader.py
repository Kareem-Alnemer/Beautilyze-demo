"""
Model loader factory.
Supports mock, PyTorch, and ONNX model modes.
"""
import numpy as np
from typing import Protocol, Optional
from inference_server.config import settings


class ModelProtocol(Protocol):
    """Protocol for model prediction interface."""
    def predict(self, input_tensor: "np.ndarray") -> tuple[str, float]:
        """Return (label, confidence)."""
        ...


class MockModel:
    """Deterministic mock model for development/testing."""
    
    def __init__(self, labels: list[str], seed: int = 42):
        self.labels = labels
        self._rng = np.random.RandomState(seed)
    
    def predict(self, input_tensor: "np.ndarray") -> tuple[str, float]:
        # Deterministic prediction based on input tensor hash
        # Use first few values to create pseudo-deterministic output
        tensor_bytes = input_tensor.tobytes()[:100]
        hash_val = hash(tensor_bytes) % len(self.labels)
        label = self.labels[hash_val]
        # Deterministic confidence based on tensor content
        # Use a hash of the tensor to generate consistent confidence
        confidence_seed = hash(tensor_bytes) % 10000
        confidence_rng = np.random.RandomState(confidence_seed)
        confidence = 0.55 + (confidence_rng.random() * 0.4)
        return label, round(confidence, 2)


class PyTorchModel:
    """PyTorch model wrapper."""
    
    def __init__(self, model_path: str, labels: list[str], device: str = "cpu"):
        import torch
        self.device = torch.device(device)
        self.labels = labels
        self.model = torch.jit.load(model_path, map_location=self.device)
        self.model.eval()
    
    def predict(self, input_tensor: "np.ndarray") -> tuple[str, float]:
        import torch
        with torch.no_grad():
            tensor = torch.from_numpy(input_tensor).to(self.device)
            logits = self.model(tensor)
            probs = torch.softmax(logits, dim=1)
            confidence, idx = torch.max(probs, dim=1)
            return self.labels[idx.item()], round(confidence.item(), 4)


class ONNXModel:
    """ONNX Runtime model wrapper."""
    
    def __init__(self, model_path: str, labels: list[str]):
        import onnxruntime as ort
        self.session = ort.InferenceSession(model_path)
        self.labels = labels
        self.input_name = self.session.get_inputs()[0].name
    
    def predict(self, input_tensor: "np.ndarray") -> tuple[str, float]:
        outputs = self.session.run(None, {self.input_name: input_tensor})
        logits = outputs[0]
        # Softmax
        exp_logits = np.exp(logits - np.max(logits, axis=1, keepdims=True))
        probs = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)
        idx = np.argmax(probs, axis=1)[0]
        confidence = probs[0, idx]
        return self.labels[idx], round(float(confidence), 4)


def load_skin_type_model() -> ModelProtocol:
    """Load skin type model based on MODEL_MODE."""
    labels = ["dry", "normal", "oily"]
    
    if settings.model_mode == "mock":
        return MockModel(labels, seed=42)
    elif settings.model_mode == "pytorch":
        if not settings.skin_type_model_path:
            raise ValueError("SKIN_TYPE_MODEL_PATH required for pytorch mode")
        return PyTorchModel(settings.skin_type_model_path, labels)
    elif settings.model_mode == "onnx":
        if not settings.skin_type_model_path:
            raise ValueError("SKIN_TYPE_MODEL_PATH required for onnx mode")
        return ONNXModel(settings.skin_type_model_path, labels)
    else:
        raise ValueError(f"Unknown MODEL_MODE: {settings.model_mode}")


def load_acne_severity_model() -> ModelProtocol:
    """Load acne severity model based on MODEL_MODE."""
    labels = ["mild", "moderate", "severe"]
    
    if settings.model_mode == "mock":
        return MockModel(labels, seed=123)
    elif settings.model_mode == "pytorch":
        if not settings.acne_severity_model_path:
            raise ValueError("ACNE_SEVERITY_MODEL_PATH required for pytorch mode")
        return PyTorchModel(settings.acne_severity_model_path, labels)
    elif settings.model_mode == "onnx":
        if not settings.acne_severity_model_path:
            raise ValueError("ACNE_SEVERITY_MODEL_PATH required for onnx mode")
        return ONNXModel(settings.acne_severity_model_path, labels)
    else:
        raise ValueError(f"Unknown MODEL_MODE: {settings.model_mode}")