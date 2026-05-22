"""
Stripe Checkout integration — VENDOR NEUTRAL.

Uses the official `stripe` Python SDK directly. There is **no** mandatory
Emergent dependency in this file.

If you currently rely on the Emergent test key (`sk_test_emergent`), this file
also includes a clearly-marked fallback that proxies through
`emergentintegrations.payments.stripe`. To drop the Emergent dependency
entirely:
  1. Replace `STRIPE_API_KEY` in `.env` with your own Stripe key
     (`sk_test_...` for test, `sk_live_...` for production).
  2. Optionally remove the `_emergent_fallback` block below.
  3. Optionally drop `emergentintegrations` from `requirements.txt`.

For webhook signature verification in production, set `STRIPE_WEBHOOK_SECRET`
in `.env` (from Stripe Dashboard → Developers → Webhooks).
"""
import logging
import os
from typing import Optional

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from auth import get_current_user
from db import db
from models import now_iso

router = APIRouter(prefix="/api/payments", tags=["payments"])
log = logging.getLogger("payments")


# ----------------------------------------------------------------------------
# OPTIONAL: Emergent dev-only fallback. Comment out the import and the two
# `if api_key.startswith("sk_test_emergent")` branches below to drop entirely.
# ----------------------------------------------------------------------------
_EMERGENT_AVAILABLE = False
try:
    from emergentintegrations.payments.stripe.checkout import (
        CheckoutSessionRequest as _EmergentCheckoutSessionRequest,
        StripeCheckout as _EmergentStripeCheckout,
    )

    _EMERGENT_AVAILABLE = True
except Exception:  # noqa: BLE001
    _EMERGENT_AVAILABLE = False
# ----------------------------------------------------------------------------


def _is_emergent_dev_key(api_key: str) -> bool:
    return api_key.startswith("sk_test_emergent")


def _native_stripe(api_key: str) -> None:
    stripe.api_key = api_key


# ============================================================================
# Models
# ============================================================================


class CheckoutForInvoiceIn(BaseModel):
    invoice_id: str
    origin_url: str


# ============================================================================
# Endpoints
# ============================================================================


@router.post("/checkout/invoice")
async def checkout_invoice(
    payload: CheckoutForInvoiceIn,
    request: Request,
    user: dict = Depends(get_current_user),
):
    inv = await db.invoices.find_one({"id": payload.invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if inv["client_user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if inv["status"] == "paid":
        raise HTTPException(status_code=400, detail="Already paid")

    api_key = os.environ["STRIPE_API_KEY"]
    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/dashboard/invoices?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/dashboard/invoices"
    amount = float(inv["amount"])
    currency = (inv.get("currency") or "AUD").lower()
    metadata = {
        "invoice_id": inv["id"],
        "user_id": user["id"],
        "source": "invoice_payment",
    }

    if _is_emergent_dev_key(api_key) and _EMERGENT_AVAILABLE:
        # Emergent dev fallback (preview pods only).
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        emergent = _EmergentStripeCheckout(api_key=api_key, webhook_url=webhook_url)
        req = _EmergentCheckoutSessionRequest(
            amount=amount,
            currency=currency,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
        )
        session = await emergent.create_checkout_session(req)
        session_url, session_id = session.url, session.session_id
    else:
        _native_stripe(api_key)
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                mode="payment",
                line_items=[
                    {
                        "price_data": {
                            "currency": currency,
                            "product_data": {"name": inv["title"]},
                            "unit_amount": int(round(amount * 100)),
                        },
                        "quantity": 1,
                    }
                ],
                success_url=success_url,
                cancel_url=cancel_url,
                metadata=metadata,
                client_reference_id=inv["id"],
            )
        except stripe.error.StripeError as exc:
            raise HTTPException(status_code=502, detail=f"Stripe error: {exc.user_message or str(exc)}")
        session_url, session_id = session.url, session.id

    await db.payment_transactions.insert_one(
        {
            "session_id": session_id,
            "invoice_id": inv["id"],
            "user_id": user["id"],
            "amount": amount,
            "currency": currency,
            "metadata": metadata,
            "payment_status": "initiated",
            "status": "open",
            "created_at": now_iso(),
        }
    )
    return {"url": session_url, "session_id": session_id}


@router.get("/status/{session_id}")
async def status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Unknown payment session")
    if tx.get("user_id") and tx["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    api_key = os.environ["STRIPE_API_KEY"]
    payment_status: str
    session_status: str
    amount_total: int
    currency: str

    try:
        if _is_emergent_dev_key(api_key) and _EMERGENT_AVAILABLE:
            host_url = str(request.base_url).rstrip("/")
            webhook_url = f"{host_url}/api/webhook/stripe"
            emergent = _EmergentStripeCheckout(api_key=api_key, webhook_url=webhook_url)
            res = await emergent.get_checkout_status(session_id)
            session_status = res.status
            payment_status = res.payment_status
            amount_total = res.amount_total
            currency = res.currency
        else:
            _native_stripe(api_key)
            res = stripe.checkout.Session.retrieve(session_id)
            session_status = res.status or "open"
            payment_status = res.payment_status or "unpaid"
            amount_total = res.amount_total or int(round(float(tx.get("amount", 0)) * 100))
            currency = res.currency or tx.get("currency", "aud")
    except Exception as exc:  # noqa: BLE001
        # Stripe/Emergent lookup failed — return cached state and surface the warning.
        return {
            "session_id": session_id,
            "status": tx.get("status", "open"),
            "payment_status": tx.get("payment_status", "initiated"),
            "amount_total": int(round(float(tx.get("amount", 0)) * 100)),
            "currency": tx.get("currency", "aud"),
            "warning": "Could not verify payment with provider yet — check back in a moment.",
            "provider_error": str(exc)[:200],
        }

    await db.payment_transactions.update_one(
        {"session_id": session_id}, {"$set": {"payment_status": payment_status, "status": session_status}}
    )
    if payment_status == "paid" and tx.get("payment_status") != "paid":
        if tx.get("invoice_id"):
            await db.invoices.update_one(
                {"id": tx["invoice_id"], "status": {"$ne": "paid"}},
                {"$set": {"status": "paid", "paid_at": now_iso()}},
            )

    return {
        "session_id": session_id,
        "status": session_status,
        "payment_status": payment_status,
        "amount_total": amount_total,
        "currency": currency,
    }


@router.post("/webhook/stripe", include_in_schema=False)
async def webhook(request: Request):
    """Stripe webhook handler with optional signature verification."""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    api_key = os.environ["STRIPE_API_KEY"]
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

    session_id: Optional[str] = None
    payment_status: Optional[str] = None

    if _is_emergent_dev_key(api_key) and _EMERGENT_AVAILABLE:
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        emergent = _EmergentStripeCheckout(api_key=api_key, webhook_url=webhook_url)
        event = await emergent.handle_webhook(body, signature)
        session_id = event.session_id
        payment_status = event.payment_status
    else:
        _native_stripe(api_key)
        try:
            if webhook_secret:
                event = stripe.Webhook.construct_event(body, signature, webhook_secret)
            else:
                # Dev/preview without a configured secret — parse without verification.
                # Set STRIPE_WEBHOOK_SECRET in production.
                import json
                event = json.loads(body.decode("utf-8"))
        except Exception as exc:  # noqa: BLE001
            log.exception("webhook parse failed: %s", exc)
            raise HTTPException(status_code=400, detail="Invalid webhook")
        if (event.get("type") if isinstance(event, dict) else event["type"]) == "checkout.session.completed":
            obj = event["data"]["object"] if isinstance(event, dict) else event.data.object
            session_id = obj.get("id") if isinstance(obj, dict) else obj["id"]
            payment_status = (
                obj.get("payment_status") if isinstance(obj, dict) else obj["payment_status"]
            )

    if session_id and payment_status == "paid":
        tx = await db.payment_transactions.find_one({"session_id": session_id})
        if tx and tx.get("invoice_id"):
            await db.invoices.update_one(
                {"id": tx["invoice_id"], "status": {"$ne": "paid"}},
                {"$set": {"status": "paid", "paid_at": now_iso()}},
            )
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": payment_status, "status": "complete"}},
        )
    return {"ok": True}
