"""Auth helpers: password hashing, JWT access tokens, cookies, and the
``get_current_user`` / role-assertion FastAPI dependencies.

Two authentication mechanisms feed ``get_current_user``:

* **JWT access token** (admin/staff and password-login clients) — 8h, HS256,
  presented via the ``access_token`` cookie or ``Authorization: Bearer``. The
  *role* is always re-read from the database, never trusted from the token claim.
* **Client session token** (magic-link / gallery-claim clients) — 30-day rolling,
  opaque, validated against the hashed ``client_sessions`` store.

Refresh tokens are server-side, hashed, and rotated — see ``token_store`` and the
``/api/auth/refresh`` route; this module no longer mints stateless refresh JWTs.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Cookie, Depends, HTTPException, Request, Response

from db import db
from roles import ADMIN_CAPABLE_ROLES, OWNER_ROLES, STAFF_ROLES
from token_store import CLIENT_SESSION_TTL, REFRESH_TTL, validate_client_session

JWT_ALGORITHM = "HS256"
ACCESS_TTL = timedelta(hours=8)  # brief §6: admin/staff access token = 8 hours

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"
CLIENT_SESSION_COOKIE = "client_session"


def _secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + ACCESS_TTL,
        "type": "access",
    }
    return jwt.encode(payload, _secret(), algorithm=JWT_ALGORITHM)


# --- Cookies ---------------------------------------------------------------
# access_token / refresh_token / client_session use SameSite=None because the
# SPA is served from a different origin than the API (a credentialed cross-site
# request requires SameSite=None; Strict/Lax would silently drop the cookie and
# break login). The gallery media cookie is SameSite=Strict — it lives on the
# same registrable domain as the media Worker (see gallery_media.py).
# CSRF hardening (audit M3) is tracked separately; it is not in the Priority 2
# scope and would require a token-based defence layered on top of these cookies.


def set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    response.set_cookie(
        ACCESS_COOKIE, access, httponly=True, secure=True,
        samesite="none", max_age=int(ACCESS_TTL.total_seconds()), path="/",
    )
    response.set_cookie(
        REFRESH_COOKIE, refresh, httponly=True, secure=True,
        samesite="none", max_age=int(REFRESH_TTL.total_seconds()), path="/",
    )


def set_client_session_cookie(response: Response, session_token: str) -> None:
    response.set_cookie(
        CLIENT_SESSION_COOKIE, session_token, httponly=True, secure=True,
        samesite="none", max_age=int(CLIENT_SESSION_TTL.total_seconds()), path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(REFRESH_COOKIE, path="/")
    response.delete_cookie(CLIENT_SESSION_COOKIE, path="/")


def _decode(token: str, expected_type: str) -> dict:
    try:
        payload = jwt.decode(token, _secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("type") != expected_type:
        raise HTTPException(status_code=401, detail="Invalid token type")
    return payload


async def _user_by_id(user_id: str) -> Optional[dict]:
    return await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})


async def get_current_user(
    request: Request,
    access_token: Optional[str] = Cookie(default=None),
    client_session: Optional[str] = Cookie(default=None),
) -> dict:
    """Resolve the caller from a JWT access token or a client session token.

    The role is taken from the freshly loaded DB record, never from a token claim.
    """
    token = access_token
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    access_error: Optional[HTTPException] = None
    if token:
        try:
            payload = _decode(token, "access")
            user = await _user_by_id(payload["sub"])
            if user:
                return user
            access_error = HTTPException(status_code=401, detail="User not found")
        except HTTPException as exc:
            access_error = exc

    if client_session:
        user_id = await validate_client_session(client_session)
        if user_id:
            user = await _user_by_id(user_id)
            if user:
                return user
        raise access_error or HTTPException(status_code=401, detail="Invalid or expired session")

    raise access_error or HTTPException(status_code=401, detail="Not authenticated")


# --- Role assertion dependencies ------------------------------------------
# Authorization is always enforced server-side against the DB role (brief §6).


def require_roles(*allowed: str):
    """Dependency factory asserting the caller's role is in ``allowed``."""
    allowed_set = frozenset(allowed)

    async def dependency(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in allowed_set:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return dependency


async def get_current_admin(user: dict = Depends(get_current_user)) -> dict:
    """Owner or admin — full administrative capability (everything except the
    owner-only settings/billing/staff-invite surface)."""
    if user.get("role") not in ADMIN_CAPABLE_ROLES:
        raise HTTPException(status_code=403, detail="Admin only")
    return user


async def require_owner(user: dict = Depends(get_current_user)) -> dict:
    """Owner only — settings, billing, staff invites, role changes."""
    if user.get("role") not in OWNER_ROLES:
        raise HTTPException(status_code=403, detail="Owner only")
    return user


async def require_staff(user: dict = Depends(get_current_user)) -> dict:
    """Any internal staff member — owner, admin, or editor (e.g. galleries,
    bookings)."""
    if user.get("role") not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Staff only")
    return user
