from fastapi import APIRouter, HTTPException, Response, Depends

from auth import (
    clear_auth_cookies,
    create_access_token,
    create_refresh_token,
    decode_refresh,
    get_current_user,
    hash_password,
    set_auth_cookies,
    verify_password,
)
from db import db
from models import LoginIn, RegisterIn, UserOut, new_id, now_iso

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_to_out(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u["name"],
        "role": u["role"],
        "created_at": u["created_at"],
    }


@router.post("/register", response_model=UserOut)
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {
        "id": new_id(),
        "email": email,
        "name": payload.name,
        "role": "user",
        "phone": "",
        "password_hash": hash_password(payload.password),
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return _user_to_out(user)


@router.post("/login", response_model=UserOut)
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return _user_to_out(user)


@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return _user_to_out(user)


@router.post("/refresh")
async def refresh(response: Response, refresh_token: str | None = None):
    # Read refresh from cookie
    from fastapi import Request  # noqa
    raise HTTPException(status_code=501, detail="Use /login")
