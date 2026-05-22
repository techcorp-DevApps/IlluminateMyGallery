"""Stripe Checkout integration for invoices and direct booking payments."""
import os

from emergentintegrations.payments.stripe.checkout import (
    CheckoutSessionRequest,
    CheckoutStatusResponse,
    StripeCheckout,
)
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from auth import get_current_user
from db import db
from models import now_iso

router = APIRouter(prefix="/api/payments", tags=["payments"])


def _stripe(request: Request) -> StripeCheckout:
    api_key = os.environ["STRIPE_API_KEY"]
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    return StripeCheckout(api_key=api_key, webhook_url=webhook_url)


class CheckoutForInvoiceIn(BaseModel):
    invoice_id: str
    origin_url: str


@router.post("/checkout/invoice")
async def checkout_invoice(payload: CheckoutForInvoiceIn, request: Request, user: dict = Depends(get_current_user)):
    inv = await db.invoices.find_one({"id": payload.invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if inv["client_user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if inv["status"] == "paid":
        raise HTTPException(status_code=400, detail="Already paid")

    stripe = _stripe(request)
    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/dashboard/invoices?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/dashboard/invoices"
    amount = float(inv["amount"])
    currency = (inv.get("currency") or "AUD").lower()
    req = CheckoutSessionRequest(
        amount=amount,
        currency=currency,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "invoice_id": inv["id"],
            "user_id": user["id"],
            "source": "invoice_payment",
        },
    )
    session = await stripe.create_checkout_session(req)
    await db.payment_transactions.insert_one(
        {
            "session_id": session.session_id,
            "invoice_id": inv["id"],
            "user_id": user["id"],
            "amount": amount,
            "currency": currency,
            "metadata": req.metadata,
            "payment_status": "initiated",
            "status": "open",
            "created_at": now_iso(),
        }
    )
    return {"url": session.url, "session_id": session.session_id}


@router.get("/status/{session_id}")
async def status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Unknown payment session")
    if tx.get("user_id") and tx["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    stripe = _stripe(request)
    try:
        res: CheckoutStatusResponse = await stripe.get_checkout_status(session_id)
    except Exception as exc:
        # Stripe lookup failure (eventual-consistency race, network, etc.) — return the cached
        # transaction state instead of crashing the success page.
        return {
            "session_id": session_id,
            "status": tx.get("status", "open"),
            "payment_status": tx.get("payment_status", "initiated"),
            "amount_total": int(round(float(tx.get("amount", 0)) * 100)),
            "currency": tx.get("currency", "aud"),
            "warning": "Could not verify payment with provider yet — check back in a moment.",
            "provider_error": str(exc)[:200],
        }

    # Update tx; only mark invoice paid once.
    updates = {"payment_status": res.payment_status, "status": res.status}
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": updates})

    if res.payment_status == "paid" and tx.get("payment_status") != "paid":
        if tx.get("invoice_id"):
            await db.invoices.update_one(
                {"id": tx["invoice_id"], "status": {"$ne": "paid"}},
                {"$set": {"status": "paid", "paid_at": now_iso()}},
            )

    return {
        "session_id": session_id,
        "status": res.status,
        "payment_status": res.payment_status,
        "amount_total": res.amount_total,
        "currency": res.currency,
    }


@router.post("/webhook/stripe", include_in_schema=False)
async def webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    stripe = _stripe(request)
    event = await stripe.handle_webhook(body, signature)
    if event.payment_status == "paid":
        tx = await db.payment_transactions.find_one({"session_id": event.session_id})
        if tx and tx.get("invoice_id"):
            await db.invoices.update_one(
                {"id": tx["invoice_id"], "status": {"$ne": "paid"}},
                {"$set": {"status": "paid", "paid_at": now_iso()}},
            )
        await db.payment_transactions.update_one(
            {"session_id": event.session_id},
            {"$set": {"payment_status": event.payment_status, "status": "complete"}},
        )
    return {"ok": True}
