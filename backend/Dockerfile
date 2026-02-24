FROM python:3.12-slim

# System packages required for SMART data access
RUN apt-get update && apt-get install -y --no-install-recommends \
    smartmontools \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (layer-cached)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security (runs as sentinel:sentinel)
RUN groupadd -r sentinel && useradd -r -g sentinel sentinel \
    && mkdir -p /app/data /app/ml/saved_models \
    && chown -R sentinel:sentinel /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

EXPOSE 8000

# Production: gunicorn with uvicorn workers
# For dev: override CMD with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
CMD ["gunicorn", "main:app", "-c", "gunicorn.conf.py"]
