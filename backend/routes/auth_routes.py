"""Authentication routes.

* Admin/staff + password clients: email+password → JWT access (8h) + server-side
  rotating refresh (7d), both as HttpOnly cookies.
* Clients: magic-link and gallery-claim paths issue a 30-day rolling client session.
* All refresh/session/magic-link tokens are stored hashed; raw values are returned
  once (cookie or email) and never persisted.

Rate limits guard every credential / token endpoint (audit M2).
"""
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response

from auth import (
    clear_auth_cookies,
    create_access_token,
    get_current_user,
    hash_password,
    set_auth_cookies,
    set_client_session_cookie,
    verify_password,
)
from db import db
from email_service import email_magic_link_to_client
from gallery_media import clear_gallery_media_cookie
from models import (
    LoginIn,
    MagicLinkRequestIn,
    RegisterIn,
    SetPasswordIn,
    TokenIn,
    UserOut,
    new_id,
    now_iso,
)
from roles import CLIENT
from security.rate_limit import RateLimit
from token_store import (
    consume_magic_link,
    issue_client_session,
    issue_magic_link,
    issue_refresh_token,
    mark_gallery_token_claimed,
    revoke_all_client_sessions_for_user,
    revoke_all_refresh_for_user,
    revoke_client_session,
    revoke_refresh_token,
    rotate_refresh_token,
    validate_gallery_token,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Rate limits (per client IP).
_LOGIN_LIMIT = RateLimit("auth_login", 10, 60)          # 10/min
_REGISTER_LIMIT = RateLimit("auth_register", 10, 60)     # 10/min
_REFRESH_LIMIT = RateLimit("auth_refresh", 30, 60)       # 30/min
_MAGIC_REQ_LIMIT = RateLimit("auth_magic_request", 5, 300)   # 5 per 5 min (email spam)
_MAGIC_USE_LIMIT = RateLimit("auth_magic_consume", 20, 60)   # 20/min
_CLAIM_LIMIT = RateLimit("auth_gallery_claim", 20, 60)       # 20/min


def _user_to_out(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u["name"],
        "role": u["role"],
        "created_at": u["created_at"],
    }


# ---------------------------------------------------------------------------
# Password auth (admin/staff + password clients)
# ---------------------------------------------------------------------------


@router.post("/register", response_model=UserOut, dependencies=[Depends(_REGISTER_LIMIT)])
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {
        "id": new_id(),
        "email": email,
        "name": payload.name,
        "role": CLIENT,
        "phone": "",
        "password_hash": hash_password(payload.password),
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = await issue_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return _user_to_out(user)


@router.post("/login", response_model=UserOut, dependencies=[Depends(_LOGIN_LIMIT)])
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = await issue_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return _user_to_out(user)


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    client_session: str | None = Cookie(default=None),
):
    # Server-side revocation — logout must actually invalidate the tokens, not
    # just drop the cookies (audit H3).
    if refresh_token:
        await revoke_refresh_token(refresh_token)
    if client_session:
        await revoke_client_session(client_session)
    clear_auth_cookies(response)
    clear_gallery_media_cookie(response)
    return {"ok": True}


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return _user_to_out(user)


@router.post("/refresh", response_model=UserOut, dependencies=[Depends(_REFRESH_LIMIT)])
async def refresh(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None),
):
    """Rotate the refresh token and mint a fresh access token.

    The presented refresh token is validated against the hashed store, revoked,
    and replaced (rotation). A stolen/old token cannot be reused."""
    token = refresh_token
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    rotated = await rotate_refresh_token(token)
    if not rotated:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    user_id, new_refresh = rotated
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    new_access = create_access_token(user["id"], user["email"], user["role"])
    set_auth_cookies(response, new_access, new_refresh)
    return _user_to_out(user)


# ---------------------------------------------------------------------------
# Client magic-link auth (passwordless; also the password-reset path — brief §6)
# ---------------------------------------------------------------------------


@router.post("/magic-link/request", dependencies=[Depends(_MAGIC_REQ_LIMIT)])
async def magic_link_request(payload: MagicLinkRequestIn):
    """Email a 15-minute single-use sign-in link.

    Always returns ``{"ok": true}`` regardless of whether the account exists, to
    avoid account enumeration (audit M4). A link is only sent for known accounts.
    """
    email = payload.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0, "id": 1, "email": 1})
    if user:
        raw = await issue_magic_link(email, user_id=user["id"])
        await email_magic_link_to_client(email, raw)
    return {"ok": True}


@router.post("/magic-link/consume", dependencies=[Depends(_MAGIC_USE_LIMIT)])
async def magic_link_consume(payload: TokenIn, response: Response):
    record = await consume_magic_link(payload.token)
    if not record:
        raise HTTPException(status_code=401, detail="Invalid or expired link")
    user = None
    if record.get("user_id"):
        user = await db.users.find_one({"id": record["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user and record.get("email"):
        user = await db.users.find_one({"email": record["email"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Account not found")
    session = await issue_client_session(user["id"])
    set_client_session_cookie(response, session)
    return {**_user_to_out(user), "must_set_password": bool(user.get("must_set_password"))}


@router.post("/set-password")
async def set_password(payload: SetPasswordIn, response: Response, user: dict = Depends(get_current_user)):
    """Set/replace the caller's password (first-access for auto-provisioned
    accounts, and the magic-link reset path).

    A password change invalidates every other session for the account (brief §6);
    the current caller is re-issued a fresh client session so they stay signed in.
    """
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "password_hash": hash_password(payload.password),
            "must_set_password": False,
            "is_lead": False,
        }},
    )
    await revoke_all_refresh_for_user(user["id"])
    await revoke_all_client_sessions_for_user(user["id"])
    session = await issue_client_session(user["id"])
    set_client_session_cookie(response, session)
    return {"ok": True}


# ---------------------------------------------------------------------------
# Gallery access-token claim (client auto-provision — brief §6)
# ---------------------------------------------------------------------------


@router.post("/gallery/claim", dependencies=[Depends(_CLAIM_LIMIT)])
async def gallery_claim(payload: TokenIn, response: Response):
    """Claim a gallery access link.

    Validates the hashed gallery token, attaches/auto-provisions the client
    account, records the claim, and issues a 30-day client session. New or
    passwordless accounts are flagged ``must_set_password`` so the frontend can
    prompt for a password (the account is still usable via magic link)."""
    rec = await validate_gallery_token(payload.token)
    if not rec:
        raise HTTPException(status_code=401, detail="Invalid or expired gallery link")
    gallery = await db.galleries.find_one({"id": rec["gallery_id"]}, {"_id": 0})
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")

    client_user_id = gallery.get("client_user_id") or rec.get("client_user_id")
    user = await db.users.find_one({"id": client_user_id}) if client_user_id else None
    must_set_password = False

    if user is None:
        # Defensive auto-provision from the token's email (name from booking if any).
        email = (rec.get("email") or "").lower()
        if not email:
            raise HTTPException(status_code=400, detail="Gallery link is not linked to a client")
        user = await db.users.find_one({"email": email})
        if user is None:
            user = {
                "id": new_id(),
                "email": email,
                "name": "",
                "role": CLIENT,
                "phone": "",
                "password_hash": "",
                "is_lead": True,
                "must_set_password": True,
                "created_at": now_iso(),
            }
            await db.users.insert_one(user)
            must_set_password = True
        client_user_id = user["id"]
        await db.galleries.update_one({"id": gallery["id"]}, {"$set": {"client_user_id": client_user_id}})

    if not user.get("password_hash"):
        must_set_password = True
        await db.users.update_one({"id": user["id"]}, {"$set": {"must_set_password": True}})

    # Idempotent gallery↔client link.
    await db.gallery_access.update_one(
        {"client_user_id": client_user_id, "gallery_id": gallery["id"]},
        {"$set": {"client_user_id": client_user_id, "gallery_id": gallery["id"], "linked_at": now_iso()}},
        upsert=True,
    )
    await mark_gallery_token_claimed(payload.token, client_user_id)

    session = await issue_client_session(client_user_id)
    set_client_session_cookie(response, session)
    fresh = await db.users.find_one({"id": client_user_id}, {"_id": 0, "password_hash": 0})
    return {
        **_user_to_out(fresh),
        "gallery_id": gallery["id"],
        "must_set_password": bool(must_set_password or fresh.get("must_set_password")),
    }
