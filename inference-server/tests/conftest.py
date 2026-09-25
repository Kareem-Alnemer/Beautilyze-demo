"""
Pytest configuration and fixtures.
"""
import pytest
import io
from PIL import Image
from fastapi.testclient import TestClient

from inference_server.main import app
from inference_server.config import settings


@pytest.fixture
def client() -> TestClient:
    """FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def valid_jpeg_bytes() -> bytes:
    """Generate a valid JPEG test image."""
    img = Image.new("RGB", (224, 224), color="red")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
def valid_png_bytes() -> bytes:
    """Generate a valid PNG test image."""
    img = Image.new("RGB", (224, 224), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def oversized_bytes() -> bytes:
    """Generate an oversized image (>5MB)."""
    # Create a large image that will exceed 5MB when saved as JPEG
    img = Image.new("RGB", (3000, 3000), color="green")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    data = buf.getvalue()
    # Ensure it's actually over 5MB
    assert len(data) > 5 * 1024 * 1024
    return data


@pytest.fixture
def invalid_file_bytes() -> bytes:
    """Invalid file content (not an image)."""
    return b"This is not an image file"


@pytest.fixture(autouse=True)
def reset_settings():
    """Reset settings to defaults before each test."""
    # Force reload of settings
    from inference_server.config import Settings
    Settings._settings = None
    yield
    Settings._settings = None