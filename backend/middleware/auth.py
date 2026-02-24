"""
SENTINEL-DISK Pro — Firebase JWT Authentication Middleware
=========================================================
Verifies Firebase RS256 JWTs on every request.

Enabled only when FIREBASE_PROJECT_ID is set.
Public routes (health, docs, openapi) are always allowed.

Usage:
    FIREBASE_PROJECT_ID=your-project-id uvicorn main:app ...
"""

import os
import time
import logging
from typing import Optional, Dict, Any

import httpx
from jose import JWTError, jwt
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("sentinel")

# Google's public key endpoint for Firebase tokens
_FIREBASE_KEYS_URL = (
    "https://www.googleapis.com/robot/v1/metadata/x509/"
    "securetoken@system.gserviceaccount.com"
)

# Routes that never require auth
_PUBLIC_PATHS = {
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/favicon.ico",
}

# Cache: {kid: {"cert": "...", "expires": unix_ts}}
_key_cache: Dict[str, Any] = {}
_cache_expiry: float = 0.0


async def _get_firebase_public_keys() -> Dict[str, str]:
    """Fetch and cache Firebase public certs (respects Cache-Control max-age)."""
    global _key_cache, _cache_expiry

    now = time.time()
    if _key_cache and now < _cache_expiry:
        return _key_cache

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(_FIREBASE_KEYS_URL)
            resp.raise_for_status()

            # Parse Cache-Control: max-age=N
            cc = resp.headers.get("cache-control", "")
            max_age = 3600  # default 1h
            for part in cc.split(","):
                part = part.strip()
                if part.startswith("max-age="):
                    try:
                        max_age = int(part.split("=")[1])
                    except ValueError:
                        pass

            _key_cache = resp.json()
            _cache_expiry = now + max_age
            return _key_cache
    except Exception as e:
        logger.warning(f"[Auth] Failed to fetch Firebase keys: {e}")
        return _key_cache or {}


def _is_public(path: str) -> bool:
    """Return True if this path is exempt from auth."""
    if path in _PUBLIC_PATHS:
        return True
    # Allow Swagger static assets
    if path.startswith("/docs") or path.startswith("/redoc"):
        return True
    return False


class FirebaseAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware that validates Firebase ID tokens on protected routes.

    Expects header:  Authorization: Bearer <firebase_id_token>

    To disable (dev/simulated), simply don't set FIREBASE_PROJECT_ID.
    """

    def __init__(self, app, project_id: str):
        super().__init__(app)
        self.project_id = project_id
        self.issuer    = f"https://securetoken.google.com/{project_id}"
        self.audience  = project_id
        logger.info(f"[Auth] Firebase auth middleware enabled for project: {project_id}")

    async def dispatch(self, request: Request, call_next):
        if _is_public(request.url.path):
            return await call_next(request)

        auth_header: Optional[str] = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid Authorization header. Expected: Bearer <token>"},
            )

        token = auth_header.split(" ", 1)[1].strip()

        try:
            certs = await _get_firebase_public_keys()
            if not certs:
                raise HTTPException(status_code=503, detail="Auth service temporarily unavailable")

            # Decode header to find the right key
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            cert_pem = certs.get(kid)

            if not cert_pem:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Unknown token signing key. Token may be expired — refresh and retry."},
                )

            payload = jwt.decode(
                token,
                cert_pem,
                algorithms=["RS256"],
                audience=self.audience,
                issuer=self.issuer,
                options={"verify_exp": True},
            )

            # Attach user info to request state for use in endpoints
            request.state.user = {
                "uid":   payload.get("sub"),
                "email": payload.get("email"),
                "name":  payload.get("name"),
            }

        except JWTError as e:
            logger.warning(f"[Auth] JWT validation failed: {e}")
            return JSONResponse(
                status_code=401,
                content={"detail": f"Invalid or expired token: {str(e)}"},
            )
        except Exception as e:
            logger.error(f"[Auth] Unexpected auth error: {e}")
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal auth error"},
            )

        return await call_next(request)
