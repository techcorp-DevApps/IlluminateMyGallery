"""Luma chat endpoint with graceful LLM-failure fallback.

``POST /api/luma/chat`` is intentionally unauthenticated — prospective clients chat
with Luma before they have an account (handoff brief / Priority 1 audit §b). That
makes it the single most abusable surface in the backend (audit H2): each call
hits the LLM (unbounded spend) and its tools write ``users``/``bookings`` records.

It is guarded on two axes (audit H2 + M2):

* **Per-IP rate limit** (M2) — caps total calls and, more strictly, the rate at
  which one IP can spin up *new* conversations (each new conversation is a fresh
  lead/booking-spam + LLM-cost vector).
* **Per-session gate** (H2) — caps the number of turns within a single
  conversation, bounding the LLM spend and tool-writes any one session can drive.
"""
import logging
from typing import Optional

from fastapi import APIRouter, Request
from pydantic import BaseModel

from luma.agent import chat_step
from security.rate_limit import enforce, enforce_key

router = APIRouter(prefix="/api/luma", tags=["luma"])
log = logging.getLogger("luma")

# Per-IP: every chat call. Generous enough for a real conversation, tight enough
# to bound cost/DoS from a single source.
_CHAT_PER_IP = (30, 60.0)          # 30 messages / minute / IP
# Per-IP: starting a brand-new conversation (no session_id yet). Stricter, since
# each new session can create a lead user + booking and fire admin email.
_NEW_SESSION_PER_IP = (8, 300.0)   # 8 new conversations / 5 minutes / IP
# Per-session: total turns in one conversation (the "session gate").
_TURNS_PER_SESSION = (40, 3600.0)  # 40 turns / hour / session


class ChatIn(BaseModel):
    session_id: Optional[str] = None
    message: str


@router.post("/chat")
async def chat(payload: ChatIn, request: Request):
    # M2 — throttle every call by client IP.
    enforce(request, scope="luma_chat", limit=_CHAT_PER_IP[0], window=_CHAT_PER_IP[1])

    session_id = (payload.session_id or "").strip() or None
    if session_id is None:
        # H2 — gate the creation of new conversations per IP (lead/booking spam + cost).
        enforce(
            request,
            scope="luma_chat_new",
            limit=_NEW_SESSION_PER_IP[0],
            window=_NEW_SESSION_PER_IP[1],
        )
    else:
        # H2 — session gate: cap turns within a single conversation.
        enforce_key(
            f"luma_session:{session_id}",
            limit=_TURNS_PER_SESSION[0],
            window=_TURNS_PER_SESSION[1],
        )

    if not payload.message.strip():
        return {"session_id": session_id, "reply": "", "tool_events": [], "state": None}
    try:
        return await chat_step(session_id, payload.message.strip())
    except Exception as exc:
        # Catch litellm / OpenAI failures, budget caps, network errors and return a friendly fallback
        # so the chat widget never breaks. The studio's logs will surface the real cause.
        log.exception("Luma chat_step failed: %s", exc)
        return {
            "session_id": session_id,
            "reply": (
                "I'm having trouble reaching the studio's systems just now. "
                "Could you share your full name, email and phone — I'll pass the rest to a real "
                "team member who'll be in touch within a business day."
            ),
            "tool_events": [{"name": "handoff_to_human", "args": {}, "result": {"ok": True}}],
            "state": None,
            "error": str(exc)[:200],
        }
