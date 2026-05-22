"""Luma chat endpoint with graceful LLM-failure fallback."""
import logging
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from luma.agent import chat_step

router = APIRouter(prefix="/api/luma", tags=["luma"])
log = logging.getLogger("luma")


class ChatIn(BaseModel):
    session_id: Optional[str] = None
    message: str


@router.post("/chat")
async def chat(payload: ChatIn):
    if not payload.message.strip():
        return {"session_id": payload.session_id, "reply": "", "tool_events": [], "state": None}
    try:
        return await chat_step(payload.session_id, payload.message.strip())
    except Exception as exc:
        # Catch litellm / OpenAI failures, budget caps, network errors and return a friendly fallback
        # so the chat widget never breaks. The studio's logs will surface the real cause.
        log.exception("Luma chat_step failed: %s", exc)
        return {
            "session_id": payload.session_id,
            "reply": (
                "I'm having trouble reaching the studio's systems just now. "
                "Could you share your full name, email and phone — I'll pass the rest to a real "
                "team member who'll be in touch within a business day."
            ),
            "tool_events": [{"name": "handoff_to_human", "args": {}, "result": {"ok": True}}],
            "state": None,
            "error": str(exc)[:200],
        }
