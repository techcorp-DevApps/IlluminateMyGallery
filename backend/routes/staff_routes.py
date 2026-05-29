"""Staff invite flow (handoff brief §6).

Only the owner can invite staff. An invite stores a SHA-256-hashed, 7-day,
single-use token; accepting it creates the account with the assigned role
(``admin`` or ``editor``) and a password the invitee chooses.
"""
from fastapi import APIRouter, Depends, HTTPException, Response

from auth import create_access_token, hash_password, require_owner, set_auth_cookies
from db import db
from email_service import email_staff_invite
from models import StaffAcceptIn, StaffInviteIn, new_id, now_iso
from roles import INVITABLE_STAFF_ROLES
from security.rate_limit import RateLimit
from token_store import accept_staff_invite, issue_refresh_token, issue_staff_invite

router = APIRouter(prefix="/api/staff", tags=["staff"])

_INVITE_LIMIT = RateLimit("staff_invite", 20, 60)
_ACCEPT_LIMIT = RateLimit("staff_accept", 10, 60)


@router.post("/invite", dependencies=[Depends(_INVITE_LIMIT)])
async def invite_staff(payload: StaffInviteIn, owner: dict = Depends(require_owner)):
    role = payload.role.strip().lower()
    if role not in INVITABLE_STAFF_ROLES:
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'editor'")
    email = payload.email.lower()
    if await db.users.find_one({"email": email}, {"_id": 0, "id": 1}):
        raise HTTPException(status_code=400, detail="A user with that email already exists")
    raw = await issue_staff_invite(email, role, invited_by=owner["id"])
    await email_staff_invite(email, role, raw)
    return {"ok": True, "email": email, "role": role}


@router.post("/accept", dependencies=[Depends(_ACCEPT_LIMIT)])
async def accept_invite(payload: StaffAcceptIn, response: Response):
    # Consume first (single-use, atomic), then create the account.
    record = await accept_staff_invite(payload.token)
    if not record:
        raise HTTPException(status_code=401, detail="Invalid or expired invite")
    email = record["email"]
    role = record["role"]
    if role not in INVITABLE_STAFF_ROLES:
        raise HTTPException(status_code=400, detail="Invite has an invalid role")
    if await db.users.find_one({"email": email}, {"_id": 0, "id": 1}):
        raise HTTPException(status_code=400, detail="An account already exists for this email")
    user = {
        "id": new_id(),
        "email": email,
        "name": payload.name,
        "role": role,
        "phone": "",
        "password_hash": hash_password(payload.password),
        "invited_by": record.get("invited_by"),
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = await issue_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {
        "id": user["id"],
        "email": email,
        "name": payload.name,
        "role": role,
        "created_at": user["created_at"],
    }
