"""
Tests for image preprocessing pipeline.
"""
import pytest
import io
from PIL import Image

from inference_server.preprocessing.image import (
    validate_image_content_type,
    validate_image_size,
    load_image_from_bytes,
    preprocess_image,
    preprocess_image_bytes,
    ImageValidationError,
    ImageSizeError,
    ImageFormatError,
)
from inference_server.config import settings


class TestValidateContentType:
    """Tests for content type validation."""

    def test_valid_jpeg(self):
        validate_image_content_type("image/jpeg")

    def test_valid_png(self):
        validate_image_content_type("image/png")

    def test_invalid_gif(self):
        with pytest.raises(ImageFormatError):
            validate_image_content_type("image/gif")

    def test_invalid_pdf(self):
        with pytest.raises(ImageFormatError):
            validate_image_content_type("application/pdf")

    def test_empty_string(self):
        with pytest.raises(ImageFormatError):
            validate_image_content_type("")


class TestValidateImageSize:
    """Tests for image size validation."""

    def test_valid_size(self):
        validate_image_size(1024 * 1024)  # 1 MB

    def test_max_size_boundary(self):
        max_bytes = settings.max_file_size_mb * 1024 * 1024
        validate_image_size(max_bytes)

    def test_oversized(self):
        max_bytes = settings.max_file_size_mb * 1024 * 1024
        with pytest.raises(ImageSizeError):
            validate_image_size(max_bytes + 1)


class TestLoadImageFromBytes:
    """Tests for loading images from bytes."""

    def test_valid_jpeg(self, valid_jpeg_bytes):
        img = load_image_from_bytes(valid_jpeg_bytes)
        assert isinstance(img, Image.Image)
        assert img.mode == "RGB"

    def test_valid_png(self, valid_png_bytes):
        img = load_image_from_bytes(valid_png_bytes)
        assert isinstance(img, Image.Image)
        assert img.mode == "RGB"

    def test_invalid_bytes(self, invalid_file_bytes):
        with pytest.raises(ImageFormatError):
            load_image_from_bytes(invalid_file_bytes)

    def test_converts_rgba_to_rgb(self):
        img = Image.new("RGBA", (100, 100), (255, 0, 0, 128))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        loaded = load_image_from_bytes(buf.getvalue())
        assert loaded.mode == "RGB"

    def test_converts_grayscale_to_rgb(self):
        img = Image.new("L", (100, 100), 128)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        loaded = load_image_from_bytes(buf.getvalue())
        assert loaded.mode == "RGB"


class TestPreprocessImage:
    """Tests for image preprocessing."""

    def test_preprocess_jpeg(self, valid_jpeg_bytes):
        img = load_image_from_bytes(valid_jpeg_bytes)
        tensor = preprocess_image(img)
        assert tensor.shape == (1, 3, settings.image_input_size, settings.image_input_size)
        assert tensor.dtype == "float32"

    def test_preprocess_png(self, valid_png_bytes):
        img = load_image_from_bytes(valid_png_bytes)
        tensor = preprocess_image(img)
        assert tensor.shape == (1, 3, settings.image_input_size, settings.image_input_size)

    def test_preprocess_resizes(self):
        img = Image.new("RGB", (500, 500), color="red")
        tensor = preprocess_image(img)
        assert tensor.shape == (1, 3, settings.image_input_size, settings.image_input_size)

    def test_normalization_range(self, valid_jpeg_bytes):
        img = load_image_from_bytes(valid_jpeg_bytes)
        tensor = preprocess_image(img)
        # After ImageNet normalization, values should be roughly in [-2, 2]
        assert tensor.min() >= -3
        assert tensor.max() <= 3


class TestPreprocessImageBytes:
    """Tests for complete preprocessing pipeline."""

    def test_complete_pipeline_jpeg(self, valid_jpeg_bytes):
        tensor = preprocess_image_bytes(valid_jpeg_bytes)
        assert tensor.shape == (1, 3, settings.image_input_size, settings.image_input_size)

    def test_complete_pipeline_png(self, valid_png_bytes):
        tensor = preprocess_image_bytes(valid_png_bytes)
        assert tensor.shape == (1, 3, settings.image_input_size, settings.image_input_size)