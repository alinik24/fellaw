# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 – base: install OS deps and Python packages
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS base

# Prevent .pyc files and enable unbuffered stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System libraries needed to compile asyncpg and psycopg2-binary
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpq-dev \
        gcc \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Create upload directory with correct permissions
RUN mkdir -p uploads

EXPOSE 8000

# Default command (can be overridden in docker-compose.yml)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
