"""
Models package for inference server.
"""
from inference_server.models.loader import load_skin_type_model, load_acne_severity_model
from inference_server.models.skin_type import predict_skin_type
from inference_server.models.acne_severity import predict_acne_severity

__all__ = [
    "load_skin_type_model",
    "load_acne_severity_model",
    "predict_skin_type",
    "predict_acne_severity",
]