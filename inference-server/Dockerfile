# Multi-stage Dockerfile for BeautiLyze Inference Server
# Stage 1: Builder - install dependencies
FROM python:3.11-slim AS builder

# Install system dependencies for building wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY pyproject.toml ./
COPY README.md ./
COPY inference_server ./inference_server
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir ".[pytorch]"

# Stage 2: Runtime - minimal image with non-root user
FROM python:3.11-slim AS runtime

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser -u 1000 appuser

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY inference_server ./inference_server

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Healthcheck using the /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Production uvicorn command with multiple workers
CMD ["uvicorn", "inference_server.main:app", "--host", "0.0.0.0", "--port", "8000"]
