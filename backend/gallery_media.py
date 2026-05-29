"""Gallery media token — the short-lived signed token the Cloudflare Worker
validates before serving a derivative from the private R2 bucket (handoff brief §4).

This is **separate** from the main client session. It is an HMAC-SHA256 token over
a base64url-encoded payload, signed with ``CLOUDFLARE_WORKER_SHARED_SECRET`` (the
secret the backend shares with the Worker). The wire format is exactly the one the
Worker expects::

    {base64url(payload)}.{hex hmac_sha256(secret, base64url(payload))}

The backend issues it on gallery page load and sets it as an HttpOnly, Secure,
SameSite=Strict ``gallery_token`` cookie. :func:`verify_gallery_media_token`
mirrors the Worker's checks so the same logic is testable here.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Optional

from fastapi import Response

#: Cookie name the Worker reads (frontend domain).
GALLERY_TOKEN_COOKIE = "gallery_token"
#: 4-hour TTL per brief §6.
GALLERY_MEDIA_TTL_SECONDS = 14400


def _secret() -> str:
    secret = os.environ.get("CLOUDFLARE_WORKER_SHARED_SECRET")
    if not secret:
        raise RuntimeError(
            "Required environment variable 'CLOUDFLARE_WORKER_SHARED_SECRET' is not set. "
            "It signs the gallery media token shared with the Cloudflare Worker (brief §4)."
        )
    return secret


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _sign(encoded: str) -> str:
    return hmac.new(_secret().encode(), encoded.encode(), hashlib.sha256).hexdigest()


def generate_gallery_media_token(
    gallery_ids: list[str], client_id: str, ttl_seconds: int = GALLERY_MEDIA_TTL_SECONDS
) -> str:
    """Build a signed media token authorising ``client_id`` for ``gallery_ids``."""
    now = int(time.time())
    payload = {
        "gallery_ids": list(gallery_ids),
        "client_id": client_id,
        "iat": now,
        "exp": now + ttl_seconds,
    }
    encoded = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode())
    return f"{encoded}.{_sign(encoded)}"


def verify_gallery_media_token(token: str, gallery_id: Optional[str] = None) -> Optional[dict]:
    """Validate signature + expiry (and optional gallery membership).

    Returns the decoded payload when valid, else ``None``. This is the exact check
    the Cloudflare Worker performs per request."""
    if not token or "." not in token:
        return None
    encoded, _, sig = token.rpartition(".")
    if not encoded or not sig:
        return None
    if not hmac.compare_digest(_sign(encoded), sig):
        return None
    try:
        payload = json.loads(_b64url_decode(encoded))
    except (ValueError, json.JSONDecodeError):
        return None
    if int(payload.get("exp", 0)) <= int(time.time()):
        return None
    if gallery_id is not None and gallery_id not in payload.get("gallery_ids", []):
        return None
    return payload


def set_gallery_media_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        GALLERY_TOKEN_COOKIE,
        token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=GALLERY_MEDIA_TTL_SECONDS,
        path="/",
    )


def clear_gallery_media_cookie(response: Response) -> None:
    response.delete_cookie(GALLERY_TOKEN_COOKIE, path="/")
