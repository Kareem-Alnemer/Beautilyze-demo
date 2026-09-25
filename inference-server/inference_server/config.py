"""
Configuration settings for the inference server.
Loaded from environment variables with sensible defaults.
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True

    # Model Configuration
    model_mode: str = Field(default="mock", description="mock | pytorch | onnx")
    skin_type_model_path: str = Field(default="", description="Path to skin type model file")
    acne_severity_model_path: str = Field(default="", description="Path to acne severity model file")
    model_version: str = Field(default="mock-v1", description="Model version string returned in predictions")

    # Image Processing
    max_file_size_mb: int = Field(default=5, description="Maximum upload size in MB")
    allowed_content_types: List[str] = Field(
        default=["image/jpeg", "image/png"],
        description="Allowed MIME types for upload"
    )
    image_input_size: int = Field(default=224, description="Model input image size (square)")

    # CORS
    cors_allow_origins: List[str] = Field(
        default=["http://localhost:8081", "http://127.0.0.1:8081", "exp://127.0.0.1:8081"],
        description="Allowed CORS origins"
    )
    cors_allow_credentials: bool = False
    cors_allow_methods: List[str] = Field(default=["*"])
    cors_allow_headers: List[str] = Field(default=["*"])

    # Logging
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()