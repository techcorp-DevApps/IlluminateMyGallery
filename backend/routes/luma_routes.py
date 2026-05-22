"""Luma chat endpoint."""
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from luma.agent import chat_step

router = APIRouter(prefix="/api/luma", tags=["luma"])


class ChatIn(BaseModel):
    session_id: Optional[str] = None
    message: str


@router.post("/chat")
async def chat(payload: ChatIn):
    if not payload.message.strip():
        return {"session_id": payload.session_id, "reply": "", "tool_events": [], "state": None}
    out = await chat_step(payload.session_id, payload.message.strip())
    return out
