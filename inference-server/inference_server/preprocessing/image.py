"""
Image validation and preprocessing pipeline.
Per blueprint §8.4: images held in memory only, not written to disk.
"""
import io
from typing import Tuple
from PIL import Image
import numpy as np

from inference_server.config import settings


class ImageValidationError(ValueError):
    """Raised when image validation fails."""
    pass


class ImageSizeError(ImageValidationError):
    """Raised when image exceeds max file size."""
    pass


class ImageFormatError(ImageValidationError):
    """Raised when image format is not supported."""
    pass


def validate_image_content_type(content_type: str) -> None:
    """Validate that the content type is allowed."""
    if content_type not in settings.allowed_content_types:
        raise ImageFormatError(
            f"Unsupported content type: {content_type}. "
            f"Allowed: {', '.join(settings.allowed_content_types)}"
        )


def validate_image_size(file_size: int) -> None:
    """Validate that the image size is within limits."""
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if file_size > max_bytes:
        raise ImageSizeError(
            f"File size {file_size} bytes exceeds maximum of {max_bytes} bytes "
            f"({settings.max_file_size_mb} MB)"
        )


def load_image_from_bytes(image_bytes: bytes) -> Image.Image:
    """
    Load and validate image from bytes.
    Returns PIL Image in RGB mode.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Force load to validate integrity
        image.load()
    except Exception as e:
        raise ImageFormatError(f"Invalid image data: {e}")

    # Convert to RGB if needed (handles RGBA, L, P modes)
    if image.mode != "RGB":
        image = image.convert("RGB")

    return image


def preprocess_image(image: Image.Image) -> np.ndarray:
    """
    Preprocess PIL image for model inference.
    Returns normalized float32 array of shape (1, 3, H, W) or (1, H, W, 3).
    """
    # Resize to model input size
    target_size = (settings.image_input_size, settings.image_input_size)
    image = image.resize(target_size, Image.Resampling.LANCZOS)

    # Convert to numpy array and normalize to [0, 1]
    img_array = np.array(image, dtype=np.float32) / 255.0

    # ImageNet normalization (common for pretrained models)
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img_array = (img_array - mean) / std

    # Convert to CHW format (channels first) and add batch dimension
    # Shape: (1, 3, H, W)
    img_array = np.transpose(img_array, (2, 0, 1))
    img_array = np.expand_dims(img_array, axis=0)

    return img_array.astype(np.float32)


def preprocess_image_bytes(image_bytes: bytes) -> np.ndarray:
    """
    Complete pipeline: validate, load, preprocess.
    Returns model-ready tensor.
    """
    # Note: file size validation should happen before calling this
    # (at the endpoint level where we have the UploadFile)
    image = load_image_from_bytes(image_bytes)
    return preprocess_image(image)


def get_image_info(image_bytes: bytes) -> Tuple[int, int, str]:
    """
    Extract basic info from image bytes without full preprocessing.
    Returns (width, height, format).
    """
    image = load_image_from_bytes(image_bytes)
    return image.width, image.height, image.format or "UNKNOWN"