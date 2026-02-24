"""
Gunicorn configuration for SENTINEL-DISK Pro production deployment.
Run: gunicorn main:app -c gunicorn.conf.py
"""
import multiprocessing
import os

# ── Worker Settings ───────────────────────────────────────────────────────────
# Use uvicorn workers for ASGI/FastAPI compatibility
worker_class = "uvicorn.workers.UvicornWorker"

# 2-4 workers per CPU core is a common heuristic
workers = int(os.getenv("GUNICORN_WORKERS", min(4, (multiprocessing.cpu_count() * 2) + 1)))

# Number of threads per worker (uvicorn workers are single-threaded)
threads = 1

# ── Binding ───────────────────────────────────────────────────────────────────
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"

# ── Timeouts ─────────────────────────────────────────────────────────────────
# PDF generation and SMART reads can take a few seconds
timeout         = 60   # Worker silent for > 60s is killed
graceful_timeout = 30  # How long workers get to finish on SIGTERM
keepalive       = 5    # Keep-alive connections

# ── Logging ──────────────────────────────────────────────────────────────────
accesslog = "-"   # stdout
errorlog  = "-"   # stderr
loglevel  = os.getenv("LOG_LEVEL", "info")

# Log format: timestamp | method | path | status | response-time
access_log_format = '%(t)s | %(m)s %(U)s%(q)s | %(s)s | %(L)ss | %(h)s'

# ── Process naming ───────────────────────────────────────────────────────────
proc_name = "sentinel-disk-pro"

# ── Reload (dev only) ────────────────────────────────────────────────────────
# Set GUNICORN_RELOAD=1 for hot-reload in development
reload = os.getenv("GUNICORN_RELOAD", "0") == "1"
