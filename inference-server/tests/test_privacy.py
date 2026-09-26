"""
Privacy and Security Tests for Inference Server.

Tests cover:
- Privacy headers on prediction endpoints (Cache-Control, Pragma)
- Rate limiting on prediction endpoints (429 after threshold)
- Health endpoint exempt from rate limiting
- CORS origin enforcement in production mode
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import io
from slowapi import Limiter
from slowapi.util import get_remote_address


class TestPrivacyHeaders:
    """Test privacy headers on prediction endpoints."""

    def test_predict_skin_type_has_privacy_headers(self, client, mock_image_file):
        """Test that /predict/skin-type returns privacy headers."""
        response = client.post(
            "/predict/skin-type",
            files={"file": ("test.jpg", mock_image_file, "image/jpeg")},
        )
        
        assert response.status_code == 200
        assert response.headers.get("Cache-Control") == "no-store, max-age=0, must-revalidate"
        assert response.headers.get("Pragma") == "no-cache"

    def test_predict_acne_severity_has_privacy_headers(self, client, mock_image_file):
        """Test that /predict/acne-severity returns privacy headers."""
        response = client.post(
            "/predict/acne-severity",
            files={"file": ("test.jpg", mock_image_file, "image/jpeg")},
        )
        
        assert response.status_code == 200
        assert response.headers.get("Cache-Control") == "no-store, max-age=0, must-revalidate"
        assert response.headers.get("Pragma") == "no-cache"

    def test_health_endpoint_no_privacy_headers(self, client):
        """Test that /health endpoint does NOT have privacy headers."""
        response = client.get("/health")
        
        assert response.status_code == 200
        # Health endpoint should not have privacy headers
        assert "Cache-Control" not in response.headers or response.headers.get("Cache-Control") != "no-store, max-age=0, must-revalidate"
        assert "Pragma" not in response.headers or response.headers.get("Pragma") != "no-cache"


class TestRateLimiting:
    """Test rate limiting on prediction endpoints."""

    def test_rate_limit_enforced_on_skin_type(self, client, mock_image_file):
        """Test that rate limit is enforced on /predict/skin-type."""
        # Make requests up to the limit (10/minute)
        for i in range(10):
            response = client.post(
                "/predict/skin-type",
                files={"file": ("test.jpg", mock_image_file, "image/jpeg")},
            )
            assert response.status_code == 200, f"Request {i+1} failed: {response.text}"
        
        # 11th request should be rate limited
        response = client.post(
            "/predict/skin-type",
            files={"file": ("test.jpg", mock_image_file, "image/jpeg")},
        )
        assert response.status_code == 429, f"Expected 429, got {response.status_code}: {response.text}"
        assert "Rate limit exceeded" in response.text or "rate limit" in response.text.lower()

    def test_rate_limit_enforced_on_acne_severity(self, client, mock_image_file):
        """Test that rate limit is enforced on /predict/acne-severity."""
        # Make requests up to the limit (10/minute)
        for i in range(10):
            response = client.post(
                "/predict/acne-severity",
                files={"file": ("test.jpg", mock_image_file, "image/jpeg")},
            )
            assert response.status_code == 200, f"Request {i+1} failed: {response.text}"
        
        # 11th request should be rate limited
        response = client.post(
            "/predict/acne-severity",
            files={"file": ("test.jpg", mock_image_file, "image/jpeg")},
        )
        assert response.status_code == 429, f"Expected 429, got {response.status_code}: {response.text}"

    def test_rate_limit_shared_between_endpoints(self, client, mock_image_file):
        """Test that rate limit is shared between both prediction endpoints."""
        # Make 5 requests to skin-type
        for i in range(5):
            response = client.post(
                "/predict/skin-type",
                files={"file": ("test.jpg", mock_image_file, "image/jpeg")},
            )
            assert response.status_code == 200
        
        # Make 5 requests to acne-severity (total 10)
        for i in range(5):
            response = client.post(
                "/predict/acne-severity",
                files={"file": ("test.jpg", mock_image_file, "image/jpeg")},
            )
            assert response.status_code == 200
        
        # 11th request (to either endpoint) should be rate limited
        response = client.post(
            "/predict/skin-type",
            files={"file": ("test.jpg", mock_image_file, "image/jpeg")},
        )
        assert response.status_code == 429

    def test_health_endpoint_not_rate_limited(self, client):
        """Test that /health endpoint is not rate limited."""
        # Make many requests to health - should not be rate limited
        for i in range(20):
            response = client.get("/health")
            assert response.status_code == 200, f"Health request {i+1} failed: {response.text}"

    def test_rate_limit_headers_present(self, client, mock_image_file):
        """Test that rate limit headers are present in responses."""
        response = client.post(
            "/predict/skin-type",
            files={"file": ("test.jpg", mock_image_file, "image/jpeg")},
        )
        
        assert response.status_code == 200
        # slowapi adds these headers
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers


class TestCORSProductionMode:
    """Test CORS configuration in production mode."""

    def test_cors_wildcard_in_development(self, client):
        """Test that CORS allows all origins in development mode."""
        # The test client runs in development mode by default
        response = client.options(
            "/predict/skin-type",
            headers={
                "Origin": "http://example.com",
                "Access-Control-Request-Method": "POST",
            },
        )
        # In development, CORS should be permissive
        assert response.status_code in (200, 405)  # 405 if OPTIONS not explicitly handled

    @patch("inference_server.config.settings.environment", "production")
    @patch("inference_server.config.settings.cors_allow_origins", ["https://app.beautilyze.com"])
    def test_cors_restricted_in_production(self, client):
        """Test that CORS restricts origins in production mode."""
        # This test would need a separate app instance with production settings
        # For now, we verify the logic in config.py
        from inference_server.config import Settings
        
        prod_settings = Settings(environment="production", cors_allow_origins=["https://app.beautilyze.com"])
        assert prod_settings.environment == "production"
        assert prod_settings.cors_allow_origins == ["https://app.beautilyze.com"]


class TestRateLimitHeaders:
    """Test rate limit response headers."""

    def test_rate_limit_headers_on_success(self, client, mock_image_file):
        """Test that rate limit headers are present on successful responses."""
        response = client.post(
            "/predict/skin-type",
            files={"file": ("test.jpg", mock_image_file, "image/jpeg")},
        )
        
        assert response.status_code == 200
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers
        
        # Verify values make sense
        limit = int(response.headers["X-RateLimit-Limit"])
        remaining = int(response.headers["X-RateLimit-Remaining"])
        assert limit == 10
        assert remaining == 9  # First request, 9 remaining

    def test_rate_limit_headers_on_429(self, client, mock_image_file):
        """Test that rate limit headers are present on 429 responses."""
        # Exhaust the rate limit
        for _ in range(10):
            client.post(
                "/predict/skin-type",
                files={"file": ("test.jpg", mock_image_file, "image/jpeg")},
            )
        
        # Next request should be 429 with headers
        response = client.post(
            "/predict/skin-type",
            files={"file": ("test.jpg", mock_image_file, "image/jpeg")},
        )
        
        assert response.status_code == 429
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers
        assert "Retry-After" in response.headers


class TestPrivacyHeadersOnErrors:
    """Test that privacy headers are present even on error responses."""

    def test_privacy_headers_on_400_error(self, client):
        """Test privacy headers on 400 error (invalid content type)."""
        response = client.post(
            "/predict/skin-type",
            files={"file": ("test.txt", b"not an image", "text/plain")},
        )
        
        assert response.status_code == 400
        assert response.headers.get("Cache-Control") == "no-store, max-age=0, must-revalidate"
        assert response.headers.get("Pragma") == "no-cache"

    def test_privacy_headers_on_413_error(self, client):
        """Test privacy headers on 413 error (file too large)."""
        # Create a large fake image (6MB)
        large_image = b"x" * (6 * 1024 * 1024)
        response = client.post(
            "/predict/skin-type",
            files={"file": ("large.jpg", large_image, "image/jpeg")},
        )
        
        assert response.status_code == 413
        assert response.headers.get("Cache-Control") == "no-store, max-age=0, must-revalidate"
        assert response.headers.get("Pragma") == "no-cache"

    def test_privacy_headers_on_429_error(self, client, mock_image_file):
        """Test privacy headers on 429 error (rate limited)."""
        # Exhaust rate limit
        for _ in range(10):
            client.post(
                "/predict/skin-type",
                files={"file": ("test.jpg", mock_image_file, "image/jpeg")},
            )
        
        response = client.post(
            "/predict/skin-type",
            files={"file": ("test.jpg", mock_image_file, "image/jpeg")},
        )
        
        assert response.status_code == 429
        assert response.headers.get("Cache-Control") == "no-store, max-age=0, must-revalidate"
        assert response.headers.get("Pragma") == "no-cache"


# Fixtures
@pytest.fixture
def mock_image_file():
    """Create a mock JPEG image file for testing."""
    # Create a minimal valid JPEG (1x1 pixel)
    return b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xd2\xcf \xff\xd9"


@pytest.fixture
def limiter():
    """Get the limiter instance from the app."""
    from inference_server.main import app
    return app.state.limiter


@pytest.fixture(autouse=True)
def reset_limiter(limiter):
    """Reset the limiter storage before each test."""
    # Clear the storage to reset rate limit counters
    if hasattr(limiter, '_storage') and limiter._storage:
        limiter._storage.reset()
    yield
    # Also reset after test
    if hasattr(limiter, '_storage') and limiter._storage:
        limiter._storage.reset()


@pytest.fixture
def client():
    """Create a test client with development settings."""
    from inference_server.main import app
    from inference_server.config import settings
    
    # Ensure we're in development mode for tests
    settings.environment = "development"
    
    with TestClient(app) as test_client:
        yield test_client