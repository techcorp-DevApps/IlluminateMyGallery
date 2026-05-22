"""Invoices — admin creates, clients view, payment is via PayID (Australian instant payments).

PayID details and BSB/account fallback are returned on every invoice for the
client to use when paying. Admin can mark an invoice as paid once payment is
reconciled in the bank feed.
"""
import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_admin, get_current_user
from db import db
from email_service import email_invoice_sent_to_client
from models import InvoiceIn, InvoiceOut, PaymentInstructions, new_id, now_iso

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


def _payment_instructions(reference: str) -> dict:
    return {
        "payid": os.environ.get("PAYID_IDENTIFIER", ""),
        "business_name": os.environ.get("PAYID_BUSINESS_NAME", "Illuminate Studios"),
        "bsb": os.environ.get("INVOICE_BSB", ""),
        "account_number": os.environ.get("INVOICE_ACCOUNT_NUMBER", ""),
        "account_name": os.environ.get("INVOICE_ACCOUNT_NAME", "Illuminate Studios"),
        "reference": reference,
    }


def _attach_pi(inv: dict) -> dict:
    inv["payment_instructions"] = _payment_instructions(inv.get("reference") or inv["id"])
    return inv


async def _next_reference() -> str:
    prefix = os.environ.get("INVOICE_REFERENCE_PREFIX", "INV")
    year = now_iso()[:4]
    # Atomic counter per year.
    counter = await db.counters.find_one_and_update(
        {"_id": f"invoice_{year}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    seq = counter["seq"] if counter and "seq" in counter else 1
    return f"{prefix}-{year}-{seq:04d}"


async def _ensure_reference(inv: dict) -> dict:
    """Backfill a reference onto any legacy invoice that pre-dates the PayID change."""
    if inv.get("reference"):
        return inv
    new_ref = await _next_reference()
    await db.invoices.update_one({"id": inv["id"]}, {"$set": {"reference": new_ref}})
    inv["reference"] = new_ref
    return inv


@router.post("", response_model=InvoiceOut)
async def create_invoice(payload: InvoiceIn, _: dict = Depends(get_current_admin)):
    ref = await _next_reference()
    doc = {
        "id": new_id(),
        "reference": ref,
        "client_user_id": payload.client_user_id,
        "title": payload.title,
        "description": payload.description or "",
        "amount": float(payload.amount),
        "currency": payload.currency or "AUD",
        "booking_id": payload.booking_id,
        "status": "unpaid",
        "created_at": now_iso(),
        "paid_at": None,
    }
    await db.invoices.insert_one(doc)
    doc.pop("_id", None)
    client = await db.users.find_one({"id": payload.client_user_id}, {"_id": 0, "password_hash": 0})
    if client:
        await email_invoice_sent_to_client(doc, client.get("email", ""))
    return _attach_pi(doc)


@router.get("/mine", response_model=List[InvoiceOut])
async def my_invoices(user: dict = Depends(get_current_user)):
    rows = await db.invoices.find({"client_user_id": user["id"]}, {"_id": 0}).to_list(200)
    rows.sort(key=lambda x: x["created_at"], reverse=True)
    rows = [await _ensure_reference(r) for r in rows]
    return [_attach_pi(r) for r in rows]


@router.get("", response_model=List[InvoiceOut])
async def all_invoices(_: dict = Depends(get_current_admin)):
    rows = await db.invoices.find({}, {"_id": 0}).to_list(500)
    rows.sort(key=lambda x: x["created_at"], reverse=True)
    rows = [await _ensure_reference(r) for r in rows]
    return [_attach_pi(r) for r in rows]


@router.get("/{invoice_id}", response_model=InvoiceOut)
async def get_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Not found")
    if user["role"] != "admin" and inv["client_user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    inv = await _ensure_reference(inv)
    return _attach_pi(inv)


@router.post("/{invoice_id}/mark-paid", response_model=InvoiceOut)
async def mark_paid(invoice_id: str, _: dict = Depends(get_current_admin)):
    inv = await db.invoices.find_one({"id": invoice_id})
    if not inv:
        raise HTTPException(status_code=404, detail="Not found")
    if inv.get("status") == "paid":
        raise HTTPException(status_code=400, detail="Already paid")
    await db.invoices.update_one(
        {"id": invoice_id}, {"$set": {"status": "paid", "paid_at": now_iso()}}
    )
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    return _attach_pi(inv)


@router.post("/{invoice_id}/mark-unpaid", response_model=InvoiceOut)
async def mark_unpaid(invoice_id: str, _: dict = Depends(get_current_admin)):
    inv = await db.invoices.find_one({"id": invoice_id})
    if not inv:
        raise HTTPException(status_code=404, detail="Not found")
    await db.invoices.update_one(
        {"id": invoice_id}, {"$set": {"status": "unpaid", "paid_at": None}}
    )
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    return _attach_pi(inv)


@router.post("/auto-from-booking/{booking_id}", response_model=InvoiceOut)
async def auto_from_booking(booking_id: str, _: dict = Depends(get_current_admin)):
    """One-click: turn an approved booking into an invoice for the full estimated price."""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    ref = await _next_reference()
    doc = {
        "id": new_id(),
        "reference": ref,
        "client_user_id": booking["user_id"],
        "title": f"{booking['package_name']} · {booking['preferred_date']}",
        "description": f"{booking['service_category']} session on {booking['preferred_date']} at {booking.get('location_address', '')}, {booking.get('suburb', '')}",
        "amount": float(booking.get("estimated_price", 0)),
        "currency": "AUD",
        "booking_id": booking["id"],
        "status": "unpaid",
        "created_at": now_iso(),
        "paid_at": None,
    }
    await db.invoices.insert_one(doc)
    doc.pop("_id", None)
    client = await db.users.find_one({"id": booking["user_id"]}, {"_id": 0, "password_hash": 0})
    if client:
        await email_invoice_sent_to_client(doc, client.get("email", ""))
    return _attach_pi(doc)
