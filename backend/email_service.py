"""Resend-backed email service.

Design notes:
- All sends are guarded by try/except so a Resend failure NEVER crashes the
  caller (booking/invoice/document creation must always succeed).
- If RESEND_API_KEY is absent, sends are skipped with a log line — the app
  still works in environments without an email provider configured.
- Resend's SDK is synchronous, so we run it in a thread to keep the FastAPI
  event loop non-blocking.
- Emails use inline-CSS / table layouts (the only thing email clients render
  reliably). The template style is editorial-magazine to match the studio.
"""
from __future__ import annotations

import asyncio
import logging
import os
from typing import Optional

import resend

log = logging.getLogger("email")

_BRAND = "Illuminate Studios"


def _enabled() -> bool:
    return bool(os.environ.get("RESEND_API_KEY"))


def _from_addr_notifications() -> str:
    name = os.environ.get("MAIL_FROM_NAME", _BRAND)
    addr = os.environ.get("MAIL_FROM_NOTIFICATIONS", "onboarding@resend.dev")
    return f"{name} <{addr}>"


def _from_addr_invoices() -> str:
    name = os.environ.get("MAIL_FROM_NAME", _BRAND)
    addr = os.environ.get("MAIL_FROM_INVOICES", "onboarding@resend.dev")
    return f"{name} Accounts <{addr}>"


def _from_addr(channel: str) -> str:
    return _from_addr_invoices() if channel == "invoices" else _from_addr_notifications()


def _public_url() -> str:
    return os.environ.get("APP_PUBLIC_URL", "").rstrip("/")


def _admin_addr() -> Optional[str]:
    return os.environ.get("ADMIN_NOTIFICATION_EMAIL")


def _wrap(title: str, intro: str, body_html: str, cta: Optional[tuple[str, str]] = None) -> str:
    cta_html = ""
    if cta:
        label, href = cta
        cta_html = f"""
        <tr><td style="padding:24px 0 0 0;">
          <a href="{href}" style="display:inline-block;background:#1A1A1A;color:#FFFFFF;
             text-decoration:none;padding:14px 24px;font-family:Manrope,Arial,sans-serif;
             font-size:11px;letter-spacing:0.3em;text-transform:uppercase;">{label}</a>
        </td></tr>"""
    return f"""<!doctype html>
<html><body style="margin:0;background:#F9F9F7;font-family:Manrope,Arial,sans-serif;color:#1A1A1A;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9F9F7;padding:40px 0;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E5E3DB;">
      <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #E5E3DB;">
        <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;letter-spacing:-0.02em;">Illuminate Studios</p>
        <p style="margin:4px 0 0;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#73716A;">{title}</p>
      </td></tr>
      <tr><td style="padding:32px 40px;">
        <p style="margin:0 0 16px;font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;line-height:1.05;letter-spacing:-0.02em;">{intro}</p>
        <div style="font-size:14px;line-height:1.7;color:#1A1A1A;">{body_html}</div>
        <table role="presentation" cellpadding="0" cellspacing="0">{cta_html}</table>
      </td></tr>
      <tr><td style="padding:24px 40px;border-top:1px solid #E5E3DB;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#73716A;">
        © Illuminate Studios · Melbourne
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""


async def _send(to: str, subject: str, html: str, tag: str, channel: str = "notifications") -> None:
    if not _enabled():
        log.info("[email:%s] skipped (no RESEND_API_KEY) → %s", tag, to)
        return
    if not to:
        return
    resend.api_key = os.environ["RESEND_API_KEY"]

    primary_from = _from_addr(channel)
    fallback_from = f"{os.environ.get('MAIL_FROM_NAME', _BRAND)} <studio@illuminatestudios.com.au>"

    async def _try(from_addr: str) -> Optional[dict]:
        params = {"from": from_addr, "to": [to], "subject": subject, "html": html}
        return await asyncio.to_thread(resend.Emails.send, params)

    # Try the task-specific subdomain first; if Resend refuses (subdomain not yet
    # verified, key not scoped to it), fall back to the verified apex sender so the
    # email still goes out and the studio doesn't lose a notification.
    try:
        result = await _try(primary_from)
        log.info("[email:%s] sent from=%s to=%s id=%s", tag, primary_from, to,
                 result.get("id") if isinstance(result, dict) else result)
        return
    except Exception as exc:
        msg = str(exc)
        if "not authorized" in msg.lower() or "verify a domain" in msg.lower() or "domain is not verified" in msg.lower():
            log.warning("[email:%s] primary sender %s rejected (%s) — retrying from apex",
                        tag, primary_from, msg.splitlines()[0][:160])
            try:
                result = await _try(fallback_from)
                log.info("[email:%s] sent (fallback apex) from=%s to=%s id=%s",
                         tag, fallback_from, to,
                         result.get("id") if isinstance(result, dict) else result)
                return
            except Exception as exc2:
                log.exception("[email:%s] fallback also failed → %s : %s", tag, to, exc2)
                return
        log.exception("[email:%s] failed → %s : %s", tag, to, exc)


# ---------- Public template senders ----------

async def email_booking_received_to_admin(booking: dict) -> None:
    admin = _admin_addr()
    if not admin:
        return
    public = _public_url()
    body = f"""
    <p><strong>Client:</strong> {booking.get('client_name') or booking.get('client_email')}<br/>
    <strong>Email:</strong> {booking.get('client_email')}<br/>
    <strong>Phone:</strong> {booking.get('client_phone') or '—'}</p>
    <p><strong>Package:</strong> {booking.get('package_name')}<br/>
    <strong>When:</strong> {booking.get('preferred_date')} · {booking.get('preferred_time')} ({booking.get('duration_minutes')} min)<br/>
    <strong>Where:</strong> {booking.get('location_address')}, {booking.get('suburb')}<br/>
    <strong>Notes:</strong> {booking.get('notes') or '—'}<br/>
    <strong>Source:</strong> {booking.get('source')}</p>
    """
    await _send(
        admin,
        f"New booking enquiry · {booking.get('package_name')}",
        _wrap(
            "Booking enquiry",
            "A new session has been requested.",
            body,
            ("Open studio dashboard", f"{public}/admin/bookings") if public else None,
        ),
        "booking_received_admin",
    )


async def email_booking_approved_to_client(booking: dict) -> None:
    public = _public_url()
    body = f"""
    <p>Your <strong>{booking.get('package_name')}</strong> session is confirmed.</p>
    <p><strong>When:</strong> {booking.get('preferred_date')} · {booking.get('preferred_time')}<br/>
    <strong>Where:</strong> {booking.get('location_address')}, {booking.get('suburb')}</p>
    <p>You'll find the booking, any contracts, and your delivered photographs in your private portal.</p>
    """
    await _send(
        booking.get("client_email", ""),
        f"Confirmed · {booking.get('package_name')}",
        _wrap(
            "Booking confirmed",
            "Your session is in the diary.",
            body,
            ("Open my portal", f"{public}/dashboard/bookings") if public else None,
        ),
        "booking_approved_client",
    )


async def email_document_sent_to_client(document: dict, client_email: str) -> None:
    public = _public_url()
    body = f"""
    <p>The studio has sent you a contract for review and signature.</p>
    <p><strong>Document:</strong> {document.get('title')}</p>
    <p>Sign in to your portal to read the full text and add your signature when you're ready.</p>
    """
    await _send(
        client_email,
        f"Contract for review · {document.get('title')}",
        _wrap(
            "Document",
            "A contract for your review.",
            body,
            ("Review and sign", f"{public}/dashboard/documents") if public else None,
        ),
        "document_sent_client",
    )


async def email_invoice_sent_to_client(invoice: dict, client_email: str) -> None:
    public = _public_url()
    payid = os.environ.get("PAYID_IDENTIFIER", "")
    bsb = os.environ.get("INVOICE_BSB", "")
    acct = os.environ.get("INVOICE_ACCOUNT_NUMBER", "")
    acct_name = os.environ.get("INVOICE_ACCOUNT_NAME", _BRAND)
    ref = invoice.get("reference") or invoice.get("id", "")
    body = f"""
    <p>An invoice has been issued for your booking.</p>
    <p><strong>Reference:</strong> {ref}<br/>
    <strong>{invoice.get('title')}</strong><br/>
    <strong>Amount:</strong> {invoice.get('currency')} {float(invoice.get('amount', 0)):.2f}</p>
    <p style="background:#F0EFEB;border:1px solid #E5E3DB;padding:14px;">
      <strong>Pay by PayID</strong><br/>
      PayID: <strong>{payid}</strong><br/>
      Reference (please include exactly): <strong>{ref}</strong><br/><br/>
      <em>Or by bank transfer:</em><br/>
      BSB: {bsb}<br/>
      Account: {acct}<br/>
      Account name: {acct_name}<br/>
      Reference: <strong>{ref}</strong>
    </p>
    <p>Your invoice and payment instructions are also available in your portal.</p>
    """
    await _send(
        client_email,
        f"Invoice {ref} · {invoice.get('title')}",
        _wrap(
            "Invoice",
            f"Invoice {ref}.",
            body,
            ("Open invoice", f"{public}/dashboard/invoices") if public else None,
        ),
        "invoice_sent_client",
        channel="invoices",
    )


async def email_luma_handoff_to_admin(handoff: dict) -> None:
    admin = _admin_addr()
    if not admin:
        return
    public = _public_url()
    body = f"""
    <p>Luma has flagged a chat for follow-up.</p>
    <p><strong>Reason:</strong> {handoff.get('reason')}<br/>
    <strong>Summary:</strong> {handoff.get('summary')}<br/>
    <strong>Client:</strong> {handoff.get('client_name') or '—'} ({handoff.get('client_email') or '—'})<br/>
    <strong>Phone:</strong> {handoff.get('client_phone') or '—'}</p>
    """
    await _send(
        admin,
        "Luma handoff · client needs follow-up",
        _wrap("Handoff", "Luma needs you to take over.", body, ("Open studio dashboard", f"{public}/admin/bookings") if public else None),
        "luma_handoff_admin",
    )
