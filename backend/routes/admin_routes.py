"""Admin client management."""
from typing import List

from fastapi import APIRouter, Depends

from auth import get_current_admin
from db import db

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/clients")
async def list_clients(_: dict = Depends(get_current_admin)):
    rows = await db.users.find({"role": "user"}, {"_id": 0, "password_hash": 0}).to_list(500)
    rows.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return rows


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
