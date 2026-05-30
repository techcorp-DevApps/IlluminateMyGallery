"""Priority 2 — auth foundation tests.

Covers the pieces finished in this task plus the foundations they build on:

* token hashing + opaque-token helpers (``security.tokens``)
* gallery media token sign/verify + cookie (``gallery_media``)
* in-process rate limiter (``security.rate_limit``)
* role taxonomy (``roles``)
* hashed-at-rest token stores (``token_store``) against in-memory Mongo
* route behaviour: auth flow, staff invite (owner-gated), gallery ``require_staff``
  + ownership, the new access-token / media-token endpoints, and the Luma
  rate-limit + session gate (H2/M2).

Run with::

    ./.venv/bin/python -m pytest tests/test_priority2_auth.py -q
"""
from __future__ import annotations

import time

import pytest

from auth import create_access_token, hash_password
from db import db
from gallery_media import (
    GALLERY_TOKEN_COOKIE,
    generate_gallery_media_token,
    verify_gallery_media_token,
)
from models import new_id, now_iso
from roles import (
    ADMIN,
    CLIENT,
    EDITOR,
    LEGACY_CLIENT,
    OWNER,
    is_admin_capable,
    is_client,
    is_owner,
    is_staff,
    normalize_role,
)
from security import tokens as tk
from security.rate_limit import SlidingWindowLimiter, enforce_key, get_limiter

pytestmark = pytest.mark.asyncio


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def make_user(role: str, *, email: str | None = None, password: str | None = None, **extra) -> dict:
    uid = new_id()
    email = (email or f"{role}-{uid[:8]}@example.com").lower()
    doc = {
        "id": uid,
        "email": email,
        "name": role.title(),
        "role": role,
        "phone": "",
        "password_hash": hash_password(password) if password else "",
        "created_at": now_iso(),
        **extra,
    }
    await db.users.insert_one(doc)
    return doc


def bearer(user: dict) -> dict:
    token = create_access_token(user["id"], user["email"], user["role"])
    return {"Authorization": f"Bearer {token}"}


async def make_gallery(client_user_id: str, *, title: str = "Test Gallery", **extra) -> dict:
    doc = {
        "id": new_id(),
        "title": title,
        "client_user_id": client_user_id,
        "description": "",
        "cover_blob_id": None,
        "photos": [],
        "booking_id": None,
        "allow_downloads": False,
        "created_at": now_iso(),
        **extra,
    }
    await db.galleries.insert_one(doc)
    return doc


# ===========================================================================
# Unit — security.tokens
# ===========================================================================


class TestTokens:
    async def test_hash_token_is_deterministic_and_peppered(self):
        raw = tk.generate_raw_token()
        assert tk.hash_token(raw) == tk.hash_token(raw)
        # A peppered SHA-256 is 64 hex chars and not the plain text.
        h = tk.hash_token(raw)
        assert len(h) == 64 and h != raw

    async def test_distinct_tokens_hash_differently(self):
        assert tk.hash_token(tk.generate_raw_token()) != tk.hash_token(tk.generate_raw_token())

    async def test_verify_token(self):
        raw = tk.generate_raw_token()
        assert tk.verify_token(raw, tk.hash_token(raw)) is True
        assert tk.verify_token("not-the-token", tk.hash_token(raw)) is False

    async def test_generate_raw_token_unique_and_urlsafe(self):
        a, b = tk.generate_raw_token(), tk.generate_raw_token()
        assert a != b
        assert all(c.isalnum() or c in "-_" for c in a)

    async def test_refresh_material_roundtrip(self):
        token_id, secret, raw = tk.new_refresh_material()
        assert raw == f"{token_id}.{secret}"
        assert tk.split_refresh_raw(raw) == (token_id, secret)
        stored = tk.hash_refresh_secret(secret)
        assert tk.verify_refresh_secret(secret, stored) is True
        assert tk.verify_refresh_secret("wrong", stored) is False

    async def test_split_refresh_raw_rejects_malformed(self):
        assert tk.split_refresh_raw("") is None
        assert tk.split_refresh_raw("no-dot") is None
        assert tk.split_refresh_raw(".only-secret") is None
        assert tk.split_refresh_raw("only-id.") is None


# ===========================================================================
# Unit — gallery_media
# ===========================================================================


class TestGalleryMedia:
    async def test_sign_verify_roundtrip(self):
        token = generate_gallery_media_token(["g1", "g2"], "client-1")
        payload = verify_gallery_media_token(token, "g1")
        assert payload is not None
        assert payload["client_id"] == "client-1"
        assert set(payload["gallery_ids"]) == {"g1", "g2"}

    async def test_gallery_membership_enforced(self):
        token = generate_gallery_media_token(["g1"], "client-1")
        assert verify_gallery_media_token(token, "g1") is not None
        assert verify_gallery_media_token(token, "other") is None

    async def test_tampered_signature_rejected(self):
        token = generate_gallery_media_token(["g1"], "client-1")
        encoded, _, _ = token.rpartition(".")
        assert verify_gallery_media_token(f"{encoded}.deadbeef") is None

    async def test_expired_token_rejected(self):
        token = generate_gallery_media_token(["g1"], "client-1", ttl_seconds=-1)
        assert verify_gallery_media_token(token, "g1") is None

    async def test_malformed_token_rejected(self):
        assert verify_gallery_media_token("") is None
        assert verify_gallery_media_token("no-dot-here") is None


# ===========================================================================
# Unit — security.rate_limit
# ===========================================================================


class TestRateLimiter:
    async def test_allows_up_to_limit_then_blocks(self):
        lim = SlidingWindowLimiter()
        assert all(lim.allow("k", 3, 60) for _ in range(3))
        assert lim.allow("k", 3, 60) is False

    async def test_window_ages_out(self):
        lim = SlidingWindowLimiter()
        assert lim.allow("k", 1, 0.05) is True
        assert lim.allow("k", 1, 0.05) is False
        time.sleep(0.06)
        assert lim.allow("k", 1, 0.05) is True

    async def test_keys_independent(self):
        lim = SlidingWindowLimiter()
        assert lim.allow("a", 1, 60) is True
        assert lim.allow("a", 1, 60) is False
        assert lim.allow("b", 1, 60) is True

    async def test_enforce_key_raises_429(self):
        from fastapi import HTTPException

        get_limiter().reset()
        enforce_key("scope:test", limit=2, window=60)
        enforce_key("scope:test", limit=2, window=60)
        with pytest.raises(HTTPException) as exc:
            enforce_key("scope:test", limit=2, window=60)
        assert exc.value.status_code == 429
        assert "Retry-After" in exc.value.headers


# ===========================================================================
# Unit — roles
# ===========================================================================


class TestRoles:
    async def test_is_staff(self):
        assert is_staff(OWNER) and is_staff(ADMIN) and is_staff(EDITOR)
        assert not is_staff(CLIENT)
        assert not is_staff(LEGACY_CLIENT)

    async def test_capability_predicates(self):
        assert is_admin_capable(OWNER) and is_admin_capable(ADMIN)
        assert not is_admin_capable(EDITOR)
        assert is_owner(OWNER) and not is_owner(ADMIN)
        assert is_client(CLIENT) and is_client(LEGACY_CLIENT)
        assert not is_client(EDITOR)

    async def test_normalize_role_legacy_alias(self):
        assert normalize_role(LEGACY_CLIENT) == CLIENT
        assert normalize_role(ADMIN) == ADMIN
        assert normalize_role(None) == ""


# ===========================================================================
# DB — token_store (against mongomock_motor)
# ===========================================================================


class TestTokenStore:
    async def test_refresh_rotation_revokes_old(self):
        from token_store import issue_refresh_token, rotate_refresh_token

        raw = await issue_refresh_token("user-1")
        rotated = await rotate_refresh_token(raw)
        assert rotated is not None
        user_id, new_raw = rotated
        assert user_id == "user-1" and new_raw != raw
        # The old token can no longer be rotated (rotation revoked it).
        assert await rotate_refresh_token(raw) is None
        # The new one works.
        assert await rotate_refresh_token(new_raw) is not None

    async def test_client_session_lifecycle(self):
        from token_store import (
            issue_client_session,
            revoke_client_session,
            validate_client_session,
        )

        raw = await issue_client_session("user-2")
        assert await validate_client_session(raw) == "user-2"
        assert await revoke_client_session(raw) is True
        assert await validate_client_session(raw) is None

    async def test_magic_link_single_use(self):
        from token_store import consume_magic_link, issue_magic_link

        raw = await issue_magic_link("a@b.com", user_id="user-3")
        rec = await consume_magic_link(raw)
        assert rec and rec["user_id"] == "user-3"
        assert await consume_magic_link(raw) is None  # single-use

    async def test_staff_invite_accept_single_use(self):
        from token_store import accept_staff_invite, issue_staff_invite

        raw = await issue_staff_invite("new@studio.com", EDITOR, invited_by="owner-1")
        rec = await accept_staff_invite(raw)
        assert rec and rec["role"] == EDITOR and rec["email"] == "new@studio.com"
        assert await accept_staff_invite(raw) is None

    async def test_gallery_token_claim_and_revoke(self):
        from token_store import (
            issue_gallery_token,
            mark_gallery_token_claimed,
            revoke_gallery_token,
            validate_gallery_token,
        )

        raw = await issue_gallery_token("gal-1", email="c@d.com", created_by="admin-1")
        rec = await validate_gallery_token(raw)
        assert rec and rec["gallery_id"] == "gal-1"
        await mark_gallery_token_claimed(raw, "client-9")
        rec2 = await validate_gallery_token(raw)
        assert rec2["client_user_id"] == "client-9" and rec2["claimed_at"]
        assert await revoke_gallery_token(raw) is True
        assert await validate_gallery_token(raw) is None


# ===========================================================================
# Routes — auth flow
# ===========================================================================


class TestAuthRoutes:
    async def test_register_login_me(self, client):
        r = await client.post(
            "/api/auth/register",
            json={"name": "Ada", "email": "ada@example.com", "password": "secret1"},
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["role"] == CLIENT and body["email"] == "ada@example.com"

        r2 = await client.post(
            "/api/auth/login", json={"email": "ada@example.com", "password": "secret1"}
        )
        assert r2.status_code == 200, r2.text

        r3 = await client.post(
            "/api/auth/login", json={"email": "ada@example.com", "password": "wrong"}
        )
        assert r3.status_code == 401

    async def test_me_requires_auth(self, client):
        assert (await client.get("/api/auth/me")).status_code == 401
        user = await make_user(ADMIN)
        r = await client.get("/api/auth/me", headers=bearer(user))
        assert r.status_code == 200 and r.json()["id"] == user["id"]

    async def test_magic_link_request_is_enumeration_safe(self, client):
        # Unknown account still returns ok:true (no enumeration).
        r = await client.post("/api/auth/magic-link/request", json={"email": "nobody@x.com"})
        assert r.status_code == 200 and r.json() == {"ok": True}

    async def test_magic_link_consume_issues_session(self, client):
        from token_store import issue_magic_link

        user = await make_user(CLIENT, email="ml@example.com")
        raw = await issue_magic_link("ml@example.com", user_id=user["id"])
        r = await client.post("/api/auth/magic-link/consume", json={"token": raw})
        assert r.status_code == 200, r.text
        assert r.json()["id"] == user["id"]
        # A client-session cookie is set so the user is signed in.
        assert "client_session" in r.cookies

    async def test_gallery_claim_provisions_session(self, client):
        from token_store import issue_gallery_token

        owner_client = await make_user(CLIENT, email="claimer@example.com")
        gallery = await make_gallery(owner_client["id"])
        raw = await issue_gallery_token(
            gallery["id"], client_user_id=owner_client["id"], email="claimer@example.com"
        )
        r = await client.post("/api/auth/gallery/claim", json={"token": raw})
        assert r.status_code == 200, r.text
        assert r.json()["gallery_id"] == gallery["id"]
        assert "client_session" in r.cookies


# ===========================================================================
# Routes — staff invite (owner-gated)
# ===========================================================================


class TestStaffRoutes:
    async def test_only_owner_can_invite(self, client):
        owner = await make_user(OWNER)
        admin = await make_user(ADMIN)
        editor = await make_user(EDITOR)
        regular = await make_user(CLIENT)

        ok = await client.post(
            "/api/staff/invite",
            json={"email": "hire@studio.com", "role": "editor"},
            headers=bearer(owner),
        )
        assert ok.status_code == 200, ok.text
        assert ok.json()["role"] == "editor"
        # A hashed invite record exists; raw token is never stored.
        assert await db.staff_invites.count_documents({"email": "hire@studio.com"}) == 1

        for staff in (admin, editor, regular):
            denied = await client.post(
                "/api/staff/invite",
                json={"email": "hire2@studio.com", "role": "editor"},
                headers=bearer(staff),
            )
            assert denied.status_code == 403, f"{staff['role']} should be denied"

    async def test_invite_rejects_non_staff_role(self, client):
        owner = await make_user(OWNER)
        r = await client.post(
            "/api/staff/invite",
            json={"email": "x@studio.com", "role": "owner"},
            headers=bearer(owner),
        )
        assert r.status_code == 400

    async def test_accept_creates_account_with_role(self, client):
        from token_store import issue_staff_invite

        raw = await issue_staff_invite("editor@studio.com", EDITOR, invited_by="owner-x")
        r = await client.post(
            "/api/staff/accept",
            json={"token": raw, "name": "Edie", "password": "secret9"},
        )
        assert r.status_code == 200, r.text
        assert r.json()["role"] == EDITOR
        created = await db.users.find_one({"email": "editor@studio.com"})
        assert created and created["role"] == EDITOR


# ===========================================================================
# Routes — galleries: require_staff + ownership
# ===========================================================================


class TestGalleryAuthz:
    async def test_editor_can_manage_client_cannot(self, client):
        editor = await make_user(EDITOR)
        regular = await make_user(CLIENT)
        payload = {"title": "Wedding", "client_user_id": regular["id"]}

        ok = await client.post("/api/galleries", json=payload, headers=bearer(editor))
        assert ok.status_code == 200, ok.text

        denied = await client.post("/api/galleries", json=payload, headers=bearer(regular))
        assert denied.status_code == 403

        # all_galleries is staff-only too.
        assert (await client.get("/api/galleries", headers=bearer(editor))).status_code == 200
        assert (await client.get("/api/galleries", headers=bearer(regular))).status_code == 403

    async def test_get_gallery_ownership(self, client):
        owner_client = await make_user(CLIENT)
        other_client = await make_user(CLIENT)
        editor = await make_user(EDITOR)
        gallery = await make_gallery(owner_client["id"])

        # Owning client: 200.
        assert (
            await client.get(f"/api/galleries/{gallery['id']}", headers=bearer(owner_client))
        ).status_code == 200
        # Different client: 403.
        assert (
            await client.get(f"/api/galleries/{gallery['id']}", headers=bearer(other_client))
        ).status_code == 403
        # Staff (editor): 200 even though not the assigned client.
        assert (
            await client.get(f"/api/galleries/{gallery['id']}", headers=bearer(editor))
        ).status_code == 200

    async def test_legacy_user_role_treated_as_client(self, client):
        # Pre-Task-2 accounts stored role "user"; they must NOT be treated as staff.
        legacy = await make_user(LEGACY_CLIENT)
        assert (await client.get("/api/galleries", headers=bearer(legacy))).status_code == 403


# ===========================================================================
# Routes — gallery access token (Task 8)
# ===========================================================================


class TestGalleryAccessToken:
    async def test_staff_issues_token_client_denied(self, client):
        admin = await make_user(ADMIN)
        the_client = await make_user(CLIENT, email="gc@example.com")
        gallery = await make_gallery(the_client["id"])

        r = await client.post(
            f"/api/galleries/{gallery['id']}/access-token",
            json={"send_email": False},
            headers=bearer(admin),
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["token"] and body["emailed"] is False
        assert body["expires_in_days"] == 14
        # Stored hashed, never in the clear.
        assert await db.gallery_tokens.count_documents({"gallery_id": gallery["id"]}) == 1
        assert await db.gallery_tokens.find_one({"token_hash": body["token"]}) is None

        denied = await client.post(
            f"/api/galleries/{gallery['id']}/access-token",
            json={"send_email": False},
            headers=bearer(the_client),
        )
        assert denied.status_code == 403

    async def test_send_email_path(self, client):
        admin = await make_user(ADMIN)
        the_client = await make_user(CLIENT, email="sendme@example.com")
        gallery = await make_gallery(the_client["id"])
        r = await client.post(
            f"/api/galleries/{gallery['id']}/access-token",
            json={"send_email": True},
            headers=bearer(admin),
        )
        assert r.status_code == 200, r.text
        assert r.json()["emailed"] is True

    async def test_send_email_without_client_email_is_400(self, client):
        admin = await make_user(ADMIN)
        gallery = await make_gallery("")  # unassigned gallery → no client email
        r = await client.post(
            f"/api/galleries/{gallery['id']}/access-token",
            json={"send_email": True},
            headers=bearer(admin),
        )
        assert r.status_code == 400

    async def test_unknown_gallery_404(self, client):
        admin = await make_user(ADMIN)
        r = await client.post(
            "/api/galleries/does-not-exist/access-token",
            json={"send_email": False},
            headers=bearer(admin),
        )
        assert r.status_code == 404


# ===========================================================================
# Routes — gallery media token (Task 9)
# ===========================================================================


class TestGalleryMediaTokenRoute:
    async def test_owning_client_gets_verifiable_token_and_cookie(self, client):
        the_client = await make_user(CLIENT)
        gallery = await make_gallery(the_client["id"])
        r = await client.post(
            f"/api/galleries/{gallery['id']}/media-token", headers=bearer(the_client)
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["expires_in_seconds"] == 14400
        # The returned token validates for this gallery via the Worker's own check.
        payload = verify_gallery_media_token(body["gallery_token"], gallery["id"])
        assert payload and payload["client_id"] == the_client["id"]
        # And is set as the SameSite=Strict gallery_token cookie.
        assert GALLERY_TOKEN_COOKIE in r.cookies

    async def test_other_client_denied_staff_allowed(self, client):
        the_client = await make_user(CLIENT)
        other = await make_user(CLIENT)
        admin = await make_user(ADMIN)
        gallery = await make_gallery(the_client["id"])

        assert (
            await client.post(
                f"/api/galleries/{gallery['id']}/media-token", headers=bearer(other)
            )
        ).status_code == 403
        assert (
            await client.post(
                f"/api/galleries/{gallery['id']}/media-token", headers=bearer(admin)
            )
        ).status_code == 200

    async def test_media_token_unknown_gallery_404(self, client):
        the_client = await make_user(CLIENT)
        r = await client.post(
            "/api/galleries/missing/media-token", headers=bearer(the_client)
        )
        assert r.status_code == 404


# ===========================================================================
# Routes — Luma chat rate-limit + session gate (H2 / M2)
# ===========================================================================


class TestLumaGate:
    async def test_per_ip_message_limit(self, client):
        # Fixed session_id → takes the per-session branch, so only the per-IP
        # message limit (30/min) gates here. Empty messages are cheap probes that
        # still pass through the limiter before the early return.
        headers = {"X-Forwarded-For": "10.0.0.1"}
        body = {"session_id": "sess-A", "message": ""}
        for i in range(30):
            r = await client.post("/api/luma/chat", json=body, headers=headers)
            assert r.status_code == 200, f"call {i} unexpectedly limited: {r.text}"
        blocked = await client.post("/api/luma/chat", json=body, headers=headers)
        assert blocked.status_code == 429
        assert "retry-after" in {k.lower() for k in blocked.headers}

    async def test_new_conversation_gate_per_ip(self, client):
        # No session_id → new-conversation branch (8 per 5 min / IP).
        headers = {"X-Forwarded-For": "10.0.0.2"}
        body = {"message": ""}
        for i in range(8):
            r = await client.post("/api/luma/chat", json=body, headers=headers)
            assert r.status_code == 200, f"call {i}: {r.text}"
        assert (await client.post("/api/luma/chat", json=body, headers=headers)).status_code == 429

    async def test_session_gate_independent_of_ip(self, client):
        # Same session_id from many different IPs → per-IP limit never trips, but
        # the per-session turn cap (40/hour) does. This is the "session gate".
        body_sid = "sess-shared"
        for i in range(40):
            r = await client.post(
                "/api/luma/chat",
                json={"session_id": body_sid, "message": ""},
                headers={"X-Forwarded-For": f"172.16.0.{i}"},
            )
            assert r.status_code == 200, f"call {i}: {r.text}"
        blocked = await client.post(
            "/api/luma/chat",
            json={"session_id": body_sid, "message": ""},
            headers={"X-Forwarded-For": "172.16.0.250"},
        )
        assert blocked.status_code == 429

    async def test_different_ips_not_limited_together(self, client):
        # Sanity: the per-IP limiter keys on IP, so two IPs don't share a bucket.
        a = await client.post(
            "/api/luma/chat", json={"session_id": "s1", "message": ""},
            headers={"X-Forwarded-For": "8.8.8.8"},
        )
        b = await client.post(
            "/api/luma/chat", json={"session_id": "s2", "message": ""},
            headers={"X-Forwarded-For": "9.9.9.9"},
        )
        assert a.status_code == 200 and b.status_code == 200
