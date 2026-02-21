# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM python:3.12-slim AS base

# Install system tools for smartmontools (optional - for real disk access)
# NOTE: smartctl must be run with --privileged in docker-compose for full access
RUN apt-get update && apt-get install -y --no-install-recommends \
    smartmontools \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ─── Stage 2: Copy source ─────────────────────────────────────────────────────
COPY . .

# Create data directory for settings persistence
RUN mkdir -p data

EXPOSE 8000

# Use 2 workers for production stability
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
