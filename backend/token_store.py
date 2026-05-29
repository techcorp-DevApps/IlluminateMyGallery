"""Hashed-at-rest token stores (handoff brief §6).

One module owning every persisted auth artifact so the "raw value is returned
once, only the hash is stored" rule is enforced in a single place. Covers:

* ``refresh_tokens``     — admin/staff JWT refresh (bcrypt, rotated on use, revocable)
* ``client_sessions``    — 30-day rolling client sessions (peppered SHA-256)
* ``magic_link_tokens``  — 15-min single-use client magic links (peppered SHA-256)
* ``staff_invites``      — 7-day owner-issued staff invites (peppered SHA-256)
* ``gallery_tokens``     — 14-day gallery access/claim tokens (peppered SHA-256)

Every record stores ``*_hash`` / ``token_hash`` and timestamps only. The brief's
SHA-256 columns are implemented as *peppered* HMAC-SHA256 (see ``security.tokens``)
— strictly stronger than bare SHA-256 and still queryable.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from pymongo import ReturnDocument

from db import db
from security.tokens import (
    generate_raw_token,
    hash_refresh_secret,
    hash_token,
    new_refresh_material,
    split_refresh_raw,
    verify_refresh_secret,
)

# TTLs — all per brief §6 "Session lengths".
REFRESH_TTL = timedelta(days=7)
CLIENT_SESSION_TTL = timedelta(days=30)
MAGIC_LINK_TTL = timedelta(minutes=15)
STAFF_INVITE_TTL = timedelta(days=7)
GALLERY_TOKEN_TTL = timedelta(days=14)

# Minimum gap between rolling-session expiry extensions, to avoid a DB write on
# every authenticated request.
_SESSION_TOUCH_INTERVAL = timedelta(hours=1)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def _parse(value: Any) -> Optional[datetime]:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str) and value:
        try:
            dt = datetime.fromisoformat(value)
        except ValueError:
            return None
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return None


def _expired(value: Any) -> bool:
    dt = _parse(value)
    return dt is None or dt <= _now()


# ===========================================================================
# Refresh tokens  (bcrypt, rotated on use, revocable)
# ===========================================================================


async def issue_refresh_token(user_id: str) -> str:
    """Create a refresh-token record and return the raw token (once)."""
    token_id, secret, raw = new_refresh_material()
    now = _now()
    await db.refresh_tokens.insert_one(
        {
            "token_id": token_id,
            "user_id": user_id,
            "token_hash": hash_refresh_secret(secret),
            "created_at": _iso(now),
            "expires_at": _iso(now + REFRESH_TTL),
            "last_used_at": None,
            "revoked_at": None,
            "rotated_to": None,
        }
    )
    return raw


async def rotate_refresh_token(raw: str) -> Optional[tuple[str, str]]:
    """Validate + rotate a refresh token.

    On success returns ``(user_id, new_raw)`` and atomically revokes the presented
    token (linking it to its replacement). Returns ``None`` if the token is
    unknown, malformed, expired, revoked, or fails the bcrypt check.
    """
    parts = split_refresh_raw(raw)
    if not parts:
        return None
    token_id, secret = parts
    rec = await db.refresh_tokens.find_one({"token_id": token_id})
    if not rec or rec.get("revoked_at") or _expired(rec.get("expires_at")):
        return None
    if not verify_refresh_secret(secret, rec.get("token_hash", "")):
        return None

    user_id = rec["user_id"]
    new_token_id, new_secret, new_raw = new_refresh_material()
    now = _now()
    await db.refresh_tokens.insert_one(
        {
            "token_id": new_token_id,
            "user_id": user_id,
            "token_hash": hash_refresh_secret(new_secret),
            "created_at": _iso(now),
            "expires_at": _iso(now + REFRESH_TTL),
            "last_used_at": None,
            "revoked_at": None,
            "rotated_to": None,
        }
    )
    await db.refresh_tokens.update_one(
        {"token_id": token_id},
        {"$set": {"revoked_at": _iso(now), "rotated_to": new_token_id, "last_used_at": _iso(now)}},
    )
    return user_id, new_raw


async def revoke_refresh_token(raw: str) -> bool:
    parts = split_refresh_raw(raw)
    if not parts:
        return False
    token_id, _secret = parts
    res = await db.refresh_tokens.update_one(
        {"token_id": token_id, "revoked_at": None},
        {"$set": {"revoked_at": _iso(_now())}},
    )
    return res.modified_count > 0


async def revoke_all_refresh_for_user(user_id: str) -> int:
    res = await db.refresh_tokens.update_many(
        {"user_id": user_id, "revoked_at": None},
        {"$set": {"revoked_at": _iso(_now())}},
    )
    return res.modified_count


# ===========================================================================
# Client sessions  (30-day rolling, peppered SHA-256)
# ===========================================================================


async def issue_client_session(user_id: str) -> str:
    raw = generate_raw_token()
    now = _now()
    await db.client_sessions.insert_one(
        {
            "token_hash": hash_token(raw),
            "user_id": user_id,
            "created_at": _iso(now),
            "expires_at": _iso(now + CLIENT_SESSION_TTL),
            "last_used_at": _iso(now),
            "revoked_at": None,
        }
    )
    return raw


async def validate_client_session(raw: str) -> Optional[str]:
    """Return the ``user_id`` for a valid client session, else ``None``.

    Rolling: a valid session has its expiry slid forward to ``now + 30d`` (at most
    once per :data:`_SESSION_TOUCH_INTERVAL` to avoid per-request writes)."""
    if not raw:
        return None
    rec = await db.client_sessions.find_one({"token_hash": hash_token(raw)})
    if not rec or rec.get("revoked_at") or _expired(rec.get("expires_at")):
        return None
    now = _now()
    last = _parse(rec.get("last_used_at"))
    if last is None or (now - last) >= _SESSION_TOUCH_INTERVAL:
        await db.client_sessions.update_one(
            {"token_hash": rec["token_hash"]},
            {"$set": {"last_used_at": _iso(now), "expires_at": _iso(now + CLIENT_SESSION_TTL)}},
        )
    return rec["user_id"]


async def revoke_client_session(raw: str) -> bool:
    if not raw:
        return False
    res = await db.client_sessions.update_one(
        {"token_hash": hash_token(raw), "revoked_at": None},
        {"$set": {"revoked_at": _iso(_now())}},
    )
    return res.modified_count > 0


async def revoke_all_client_sessions_for_user(user_id: str) -> int:
    res = await db.client_sessions.update_many(
        {"user_id": user_id, "revoked_at": None},
        {"$set": {"revoked_at": _iso(_now())}},
    )
    return res.modified_count


# ===========================================================================
# Magic links  (15-min single-use, peppered SHA-256)
# ===========================================================================


async def issue_magic_link(email: str, user_id: Optional[str] = None) -> str:
    raw = generate_raw_token()
    now = _now()
    await db.magic_link_tokens.insert_one(
        {
            "token_hash": hash_token(raw),
            "email": email.lower(),
            "user_id": user_id,
            "created_at": _iso(now),
            "expires_at": _iso(now + MAGIC_LINK_TTL),
            "used_at": None,
        }
    )
    return raw


async def consume_magic_link(raw: str) -> Optional[dict]:
    """Single-use: atomically mark the token used and return its record, or ``None``."""
    if not raw:
        return None
    rec = await db.magic_link_tokens.find_one_and_update(
        {"token_hash": hash_token(raw), "used_at": None},
        {"$set": {"used_at": _iso(_now())}},
        return_document=ReturnDocument.BEFORE,
    )
    if not rec or _expired(rec.get("expires_at")):
        return None
    return {"email": rec.get("email"), "user_id": rec.get("user_id")}


# ===========================================================================
# Staff invites  (7-day, owner-issued, peppered SHA-256)
# ===========================================================================


async def issue_staff_invite(email: str, role: str, invited_by: str) -> str:
    raw = generate_raw_token()
    now = _now()
    await db.staff_invites.insert_one(
        {
            "token_hash": hash_token(raw),
            "email": email.lower(),
            "role": role,
            "invited_by": invited_by,
            "created_at": _iso(now),
            "expires_at": _iso(now + STAFF_INVITE_TTL),
            "accepted_at": None,
        }
    )
    return raw


async def accept_staff_invite(raw: str) -> Optional[dict]:
    """Single-use: atomically mark the invite accepted and return its record."""
    if not raw:
        return None
    rec = await db.staff_invites.find_one_and_update(
        {"token_hash": hash_token(raw), "accepted_at": None},
        {"$set": {"accepted_at": _iso(_now())}},
        return_document=ReturnDocument.BEFORE,
    )
    if not rec or _expired(rec.get("expires_at")):
        return None
    return {"email": rec.get("email"), "role": rec.get("role"), "invited_by": rec.get("invited_by")}


# ===========================================================================
# Gallery access tokens  (14-day, claimable, peppered SHA-256)
# ===========================================================================


async def issue_gallery_token(
    gallery_id: str,
    *,
    client_user_id: Optional[str] = None,
    email: Optional[str] = None,
    created_by: Optional[str] = None,
) -> str:
    raw = generate_raw_token()
    now = _now()
    await db.gallery_tokens.insert_one(
        {
            "token_hash": hash_token(raw),
            "gallery_id": gallery_id,
            "client_user_id": client_user_id,
            "email": email.lower() if email else None,
            "created_by": created_by,
            "created_at": _iso(now),
            "expires_at": _iso(now + GALLERY_TOKEN_TTL),
            "claimed_at": None,
            "revoked_at": None,
        }
    )
    return raw


async def validate_gallery_token(raw: str) -> Optional[dict]:
    """Return the gallery-token record if valid (not expired/revoked), else ``None``.

    Does not consume — claiming records ``claimed_at`` separately so the link is
    idempotent within its 14-day window."""
    if not raw:
        return None
    rec = await db.gallery_tokens.find_one({"token_hash": hash_token(raw)})
    if not rec or rec.get("revoked_at") or _expired(rec.get("expires_at")):
        return None
    return rec


async def mark_gallery_token_claimed(raw: str, client_user_id: str) -> None:
    await db.gallery_tokens.update_one(
        {"token_hash": hash_token(raw)},
        {"$set": {"client_user_id": client_user_id, "claimed_at": _iso(_now())}},
    )


async def revoke_gallery_token(raw: str) -> bool:
    if not raw:
        return False
    res = await db.gallery_tokens.update_one(
        {"token_hash": hash_token(raw), "revoked_at": None},
        {"$set": {"revoked_at": _iso(_now())}},
    )
    return res.modified_count > 0
