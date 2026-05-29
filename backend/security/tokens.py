"""Opaque-token generation and hashing.

Two hashing schemes, matching the handoff brief §6 token-storage table:

* **Peppered SHA-256** (:func:`hash_token`) — for high-entropy opaque tokens
  (client session, magic link, staff invite, gallery access). The raw token is
  random and long, so a fast keyed hash is appropriate *and* queryable: the
  stored hash is deterministic, so a lookup is ``find_one({"token_hash": h})``.
  An HMAC pepper (``CLIENT_SESSION_SECRET``) means a database-only leak cannot be
  brute-forced or rainbow-tabled without also stealing the application secret.

* **bcrypt** (:func:`hash_refresh_secret`) — mandated by the brief for JWT refresh
  tokens. bcrypt hashes are *not* queryable by value, so a refresh token is
  issued as ``"{token_id}.{secret}"``: ``token_id`` is the indexed lookup key and
  only ``bcrypt(secret)`` is stored. Verification re-hashes the presented secret.

Raw tokens are never persisted — only their hashes.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import uuid

import bcrypt

# ---------------------------------------------------------------------------
# Raw token generation
# ---------------------------------------------------------------------------


def generate_raw_token(nbytes: int = 32) -> str:
    """Return a URL-safe, cryptographically random token (~43 chars for 32 bytes)."""
    return secrets.token_urlsafe(nbytes)


# ---------------------------------------------------------------------------
# Peppered SHA-256 (queryable) — opaque session/link tokens
# ---------------------------------------------------------------------------


def _pepper() -> bytes:
    secret = os.environ.get("CLIENT_SESSION_SECRET")
    if not secret:
        raise RuntimeError(
            "Required environment variable 'CLIENT_SESSION_SECRET' is not set. "
            "It peppers the at-rest hash of session/magic-link/invite/gallery tokens. "
            "Generate one with: python3 -c \"import secrets;print(secrets.token_hex(32))\""
        )
    return secret.encode("utf-8")


def hash_token(raw: str) -> str:
    """Return the peppered SHA-256 hex digest of ``raw`` (deterministic, queryable)."""
    return hmac.new(_pepper(), raw.encode("utf-8"), hashlib.sha256).hexdigest()


def verify_token(raw: str, stored_hash: str) -> bool:
    """Constant-time comparison of ``hash_token(raw)`` against a stored hash."""
    return hmac.compare_digest(hash_token(raw), stored_hash)


# ---------------------------------------------------------------------------
# bcrypt (non-queryable) — JWT refresh tokens
# ---------------------------------------------------------------------------


def new_refresh_material() -> tuple[str, str, str]:
    """Mint a refresh token.

    Returns ``(token_id, secret, raw)`` where ``raw = "{token_id}.{secret}"`` is
    what the client receives and ``token_id`` is the indexed DB lookup key. Only
    ``bcrypt(secret)`` is ever stored.
    """
    token_id = uuid.uuid4().hex
    secret = secrets.token_urlsafe(32)
    return token_id, secret, f"{token_id}.{secret}"


def split_refresh_raw(raw: str) -> tuple[str, str] | None:
    """Split a raw refresh token into ``(token_id, secret)`` or ``None`` if malformed."""
    if not raw or "." not in raw:
        return None
    token_id, _, secret = raw.partition(".")
    if not token_id or not secret:
        return None
    return token_id, secret


def hash_refresh_secret(secret: str) -> str:
    return bcrypt.hashpw(secret.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_refresh_secret(secret: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(secret.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False
