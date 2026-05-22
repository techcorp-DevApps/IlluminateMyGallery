"""Invoices — admin creates, clients view & pay (Stripe)."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_admin, get_current_user
from db import db
from models import InvoiceIn, InvoiceOut, new_id, now_iso

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


@router.post("", response_model=InvoiceOut)
async def create_invoice(payload: InvoiceIn, _: dict = Depends(get_current_admin)):
    doc = {
        "id": new_id(),
        "client_user_id": payload.client_user_id,
        "title": payload.title,
        "amount": float(payload.amount),
        "currency": payload.currency or "AUD",
        "booking_id": payload.booking_id,
        "status": "unpaid",
        "created_at": now_iso(),
        "paid_at": None,
    }
    await db.invoices.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/mine", response_model=List[InvoiceOut])
async def my_invoices(user: dict = Depends(get_current_user)):
    rows = await db.invoices.find({"client_user_id": user["id"]}, {"_id": 0}).to_list(200)
    rows.sort(key=lambda x: x["created_at"], reverse=True)
    return rows


@router.get("", response_model=List[InvoiceOut])
async def all_invoices(_: dict = Depends(get_current_admin)):
    rows = await db.invoices.find({}, {"_id": 0}).to_list(500)
    rows.sort(key=lambda x: x["created_at"], reverse=True)
    return rows


@router.get("/{invoice_id}", response_model=InvoiceOut)
async def get_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Not found")
    if user["role"] != "admin" and inv["client_user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return inv
