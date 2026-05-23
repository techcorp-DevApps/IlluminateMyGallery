"""Admin client management — list, create, update, full profile with related records."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from auth import get_current_admin, hash_password
from db import db
from models import new_id, now_iso

router = APIRouter(prefix="/api/admin", tags=["admin"])


class ClientCreateIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    notes: Optional[str] = ""


class ClientPatchIn(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


def _public_user(u: dict) -> dict:
    return {k: v for k, v in u.items() if k not in {"_id", "password_hash"}}


@router.get("/clients")
async def list_clients(_: dict = Depends(get_current_admin)):
    rows = await db.users.find({"role": "user"}, {"_id": 0, "password_hash": 0}).to_list(500)
    rows.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return rows


@router.post("/clients", status_code=201)
async def create_client(payload: ClientCreateIn, _: dict = Depends(get_current_admin)):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="A client with that email already exists")
    user = {
        "id": new_id(),
        "email": email,
        "name": payload.name,
        "role": "user",
        "phone": payload.phone or "",
        "notes": payload.notes or "",
        "password_hash": "",  # lead-only — cannot login until they register
        "is_lead": True,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    return _public_user(user)


@router.patch("/clients/{client_id}")
async def update_client(client_id: str, payload: ClientPatchIn, _: dict = Depends(get_current_admin)):
    client = await db.users.find_one({"id": client_id})
    if not client or client.get("role") != "user":
        raise HTTPException(status_code=404, detail="Client not found")
    updates: dict = {}
    if payload.name is not None:
        updates["name"] = payload.name
    if payload.email is not None:
        new_email = payload.email.lower()
        if new_email != client["email"]:
            clash = await db.users.find_one({"email": new_email, "id": {"$ne": client_id}})
            if clash:
                raise HTTPException(status_code=400, detail="Another user already uses that email")
            updates["email"] = new_email
    if payload.phone is not None:
        updates["phone"] = payload.phone
    if payload.notes is not None:
        updates["notes"] = payload.notes
    if updates:
        await db.users.update_one({"id": client_id}, {"$set": updates})
    updated = await db.users.find_one({"id": client_id}, {"_id": 0, "password_hash": 0})
    return updated


@router.get("/clients/{client_id}")
async def get_client_profile(client_id: str, _: dict = Depends(get_current_admin)):
    """Full profile: client info + all bookings + galleries + documents + invoices."""
    client = await db.users.find_one({"id": client_id}, {"_id": 0, "password_hash": 0})
    if not client or client.get("role") != "user":
        raise HTTPException(status_code=404, detail="Client not found")
    bookings = await db.bookings.find({"user_id": client_id}, {"_id": 0}).to_list(200)
    galleries = await db.galleries.find({"client_user_id": client_id}, {"_id": 0}).to_list(200)
    documents = await db.documents.find({"client_user_id": client_id}, {"_id": 0}).to_list(200)
    invoices = await db.invoices.find({"client_user_id": client_id}, {"_id": 0}).to_list(200)
    for arr in (bookings, galleries, documents, invoices):
        arr.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    # Galleries — strip embedded photos array from list view, just return count
    galleries = [
        {**g, "photo_count": len(g.get("photos", [])), "photos": None} for g in galleries
    ]
    return {
        "client": client,
        "bookings": bookings,
        "galleries": galleries,
        "documents": documents,
        "invoices": invoices,
        "stats": {
            "bookings": len(bookings),
            "completed_bookings": sum(1 for b in bookings if b.get("status") == "completed"),
            "approved_bookings": sum(1 for b in bookings if b.get("status") == "approved"),
            "total_paid_aud": round(sum(float(i.get("amount", 0)) for i in invoices if i.get("status") == "paid"), 2),
            "unpaid_invoices": sum(1 for i in invoices if i.get("status") == "unpaid"),
            "documents": len(documents),
        },
    }


@router.delete("/clients/{client_id}")
async def delete_client(client_id: str, _: dict = Depends(get_current_admin)):
    client = await db.users.find_one({"id": client_id})
    if not client or client.get("role") != "user":
        raise HTTPException(status_code=404, detail="Client not found")
    # We don't cascade-delete bookings/invoices/etc; instead mark client as archived.
    await db.users.update_one({"id": client_id}, {"$set": {"is_archived": True}})
    return {"ok": True, "archived": True}


@router.get("/overview")
async def overview(_: dict = Depends(get_current_admin)):
    bookings = await db.bookings.count_documents({})
    pending = await db.bookings.count_documents({"status": "pending"})
    approved = await db.bookings.count_documents({"status": "approved"})
    clients = await db.users.count_documents({"role": "user"})
    galleries = await db.galleries.count_documents({})
    unpaid = await db.invoices.count_documents({"status": "unpaid"})
    return {
        "bookings": bookings,
        "pending_bookings": pending,
        "approved_bookings": approved,
        "clients": clients,
        "galleries": galleries,
        "unpaid_invoices": unpaid,
    }
