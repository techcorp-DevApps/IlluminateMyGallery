"""Contract templates — list templates, and create a document from a template auto-filled
from a client + booking. The original contract text is preserved verbatim."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_admin
from contracts.templates import TEMPLATES, build_template_body, fill_placeholders
from db import db
from email_service import email_document_sent_to_client
from models import ContractTemplateOut, DocumentFromTemplateIn, DocumentOut, new_id, now_iso

router = APIRouter(prefix="/api/contract-templates", tags=["contract-templates"])


@router.get("", response_model=List[ContractTemplateOut])
async def list_templates(_: dict = Depends(get_current_admin)):
    out = []
    for t in TEMPLATES:
        out.append(
            {
                "id": t["key"],
                "key": t["key"],
                "title": t["title"],
                "service_category": t["service_category"],
                "body": build_template_body(t),
            }
        )
    return out


@router.post("/create-document", response_model=DocumentOut)
async def create_document_from_template(payload: DocumentFromTemplateIn, _: dict = Depends(get_current_admin)):
    template = next((t for t in TEMPLATES if t["key"] == payload.template_key), None)
    if not template:
        raise HTTPException(status_code=404, detail="Unknown template")
    client = await db.users.find_one({"id": payload.client_user_id}, {"_id": 0, "password_hash": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    body = build_template_body(template)

    ctx = {
        "client_name": client.get("name") or "",
        "client_email": client.get("email") or "",
        "client_phone": client.get("phone") or "",
        "client_address": "",
    }

    if payload.booking_id:
        booking = await db.bookings.find_one({"id": payload.booking_id}, {"_id": 0})
        if booking and booking.get("user_id") == client["id"]:
            ctx.update(
                {
                    "session_date": booking.get("preferred_date"),
                    "start_time": booking.get("preferred_time"),
                    "location": f"{booking.get('location_address', '')}, {booking.get('suburb', '')}".strip(", "),
                    "primary_contact": f"{client.get('name', '')} {client.get('phone', '')}".strip(),
                    "total_fee": booking.get("estimated_price"),
                }
            )

    if payload.overrides:
        ctx.update(payload.overrides)

    filled = fill_placeholders(body, ctx)

    doc = {
        "id": new_id(),
        "title": f"{template['title']} — {client.get('name') or client.get('email')}",
        "client_user_id": payload.client_user_id,
        "body": filled,
        "signed": False,
        "signature_name": None,
        "signed_at": None,
        "created_at": now_iso(),
        "template_key": template["key"],
        "booking_id": payload.booking_id,
    }
    await db.documents.insert_one(doc)
    doc.pop("_id", None)
    await email_document_sent_to_client(doc, client.get("email", ""))
    return doc
