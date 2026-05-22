"""Luma agent runtime — chat loop, tool execution, MongoDB-backed session state."""
from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import litellm
from emergentintegrations.llm.utils import get_integration_proxy_url

from db import db
from email_service import email_booking_received_to_admin, email_luma_handoff_to_admin
from luma.schemas import BookingState
from luma.system import LUMA_SYSTEM_PROMPT
from luma.tools import LUMA_TOOLS, LUMA_TOOL_NAMES

# Model: configurable via LUMA_MODEL. Default: gpt-4.1 (sharp tool-calling + warm natural prose).
DEFAULT_MODEL = "gpt-4.1"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ----- Session storage helpers -----

async def get_or_create_session(session_id: Optional[str]) -> Dict[str, Any]:
    if session_id:
        existing = await db.luma_sessions.find_one({"session_id": session_id}, {"_id": 0})
        if existing:
            return existing
    sid = session_id or str(uuid.uuid4())
    doc = {
        "session_id": sid,
        "state": BookingState(session_id=sid).model_dump(),
        "messages": [],  # OpenAI-format messages excluding system prompt
        "active_services_loaded": False,
        "active_services": None,
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    }
    await db.luma_sessions.insert_one(doc)
    doc.pop("_id", None)
    return doc


async def save_session(session: Dict[str, Any]) -> None:
    session["updated_at"] = _now_iso()
    await db.luma_sessions.update_one(
        {"session_id": session["session_id"]},
        {"$set": {
            "state": session["state"],
            "messages": session["messages"],
            "active_services_loaded": session["active_services_loaded"],
            "active_services": session["active_services"],
            "updated_at": session["updated_at"],
        }},
    )


# ----- Tool implementations -----

async def tool_get_active_services() -> Dict[str, Any]:
    packages = await db.service_packages.find({"is_active": True}, {"_id": 0}).to_list(200)
    addons = await db.service_addons.find({}, {"_id": 0}).to_list(200)
    categories = sorted({p["service_category"] for p in packages})
    return {
        "version": "1",
        "fetched_at": _now_iso(),
        "categories": categories,
        "packages": packages,
        "addons": addons,
    }


async def tool_check_availability(args: Dict[str, Any]) -> Dict[str, Any]:
    """Naive: a slot is unavailable if an approved booking exists on the same date and overlapping time."""
    date = args["preferred_date"]
    start = args["preferred_time"]
    duration = int(args["duration_minutes"])
    # Find any approved booking on same date
    same_day = await db.bookings.find(
        {"preferred_date": date, "status": {"$in": ["approved", "pending"]}},
        {"_id": 0},
    ).to_list(50)

    def to_min(hhmm: str) -> int:
        try:
            h, m = hhmm.split(":")
            return int(h) * 60 + int(m)
        except Exception:
            return 0

    new_start = to_min(start)
    new_end = new_start + duration
    conflict = False
    for b in same_day:
        bs = to_min(b.get("preferred_time", "00:00"))
        be = bs + int(b.get("duration_minutes", 60))
        if new_start < be and bs < new_end:
            conflict = True
            break
    if conflict:
        # Suggest +24h alternative
        from datetime import date as _date, timedelta
        try:
            y, m, d = [int(x) for x in date.split("-")]
            alt = _date(y, m, d) + timedelta(days=1)
            alt_str = alt.isoformat()
        except Exception:
            alt_str = date
        return {
            "available": False,
            "hold_id": None,
            "alternatives": [{"preferred_date": alt_str, "preferred_time": start}],
        }
    hold_id = f"hold_{uuid.uuid4().hex[:10]}"
    return {"available": True, "hold_id": hold_id, "alternatives": []}


async def tool_create_booking(args: Dict[str, Any], state: BookingState, prospective_user_id: Optional[str]) -> Dict[str, Any]:
    """Finalise a booking. Picks the right user (prospective or registered)."""
    pkg = await db.service_packages.find_one({"package_id": args.get("package_id") or state.booking.package_id}, {"_id": 0})
    if not pkg:
        return {"ok": False, "error": "unknown_package"}

    # Find or create a "lead" user record (no password) keyed by email
    email = (args.get("client_email") or state.client.email or "").lower().strip()
    if not email:
        return {"ok": False, "error": "missing_email"}
    user = await db.users.find_one({"email": email})
    if user is None:
        user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "name": args.get("client_full_name") or state.client.full_name or "",
            "phone": args.get("client_phone") or state.client.phone or "",
            "role": "user",
            "password_hash": "",  # lead-only; cannot login until set
            "is_lead": True,
            "created_at": _now_iso(),
        }
        await db.users.insert_one(user)

    booking = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "client_name": args.get("client_full_name") or state.client.full_name or "",
        "client_email": email,
        "client_phone": args.get("client_phone") or state.client.phone or "",
        "package_id": pkg["package_id"],
        "package_name": pkg["package_name"],
        "service_category": pkg["service_category"],
        "preferred_date": args.get("preferred_date") or state.booking.preferred_date or "",
        "preferred_time": args.get("preferred_time") or state.booking.preferred_time or "",
        "duration_minutes": int(args.get("duration_minutes") or state.booking.duration_minutes or pkg["duration_minutes"]),
        "location_address": args.get("location_address") or state.booking.location_address or "",
        "suburb": args.get("suburb") or state.booking.suburb or "",
        "notes": args.get("special_requests") or state.booking.special_requests or "",
        "estimated_price": pkg["base_price"],
        "status": "pending",
        "source": "luma",
        "luma_session_id": state.session_id,
        "created_at": _now_iso(),
    }
    await db.bookings.insert_one(booking)
    # Best-effort notify the studio of the new Luma booking.
    await email_booking_received_to_admin(booking)
    return {
        "ok": True,
        "booking_id": booking["id"],
        "status": "pending_admin_approval",
        "message": "Booking created. The studio will confirm via email shortly.",
    }


async def tool_handoff_to_human(args: Dict[str, Any], state: BookingState) -> Dict[str, Any]:
    handoff = {
        "id": str(uuid.uuid4()),
        "session_id": state.session_id,
        "reason": args.get("reason", ""),
        "summary": args.get("summary", ""),
        "client_email": state.client.email,
        "client_name": state.client.full_name,
        "client_phone": state.client.phone,
        "resolved": False,
        "created_at": _now_iso(),
    }
    await db.luma_handoffs.insert_one(handoff)
    handoff.pop("_id", None)
    await email_luma_handoff_to_admin(handoff)
    return {"ok": True, "message": "Handed off to the studio. A team member will reach out."}


# ----- LLM call -----

def _llm_params(messages: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Pick the credentials provider in this order:
    1. OPENAI_API_KEY — direct OpenAI (preferred when set; full budget control).
    2. EMERGENT_LLM_KEY — proxied via the Emergent LLM gateway.
    """
    model = os.environ.get("LUMA_MODEL", DEFAULT_MODEL)
    base: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "tools": LUMA_TOOLS,
        "tool_choice": "auto",
        "parallel_tool_calls": False,
        "temperature": 0.4,
    }
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        base["api_key"] = openai_key
        return base
    emergent_key = os.environ["EMERGENT_LLM_KEY"]
    base["api_key"] = emergent_key
    base["api_base"] = get_integration_proxy_url() + "/llm"
    base["custom_llm_provider"] = "openai"
    return base


async def _llm_call(messages: List[Dict[str, Any]]):
    return await litellm.acompletion(**_llm_params(messages))


# ----- Agent step -----

async def chat_step(session_id: Optional[str], user_text: str) -> Dict[str, Any]:
    session = await get_or_create_session(session_id)
    state = BookingState(**session["state"])

    messages: List[Dict[str, Any]] = [{"role": "system", "content": LUMA_SYSTEM_PROMPT}]
    messages.extend(session["messages"])
    messages.append({"role": "user", "content": user_text})

    # Loop: allow tool calls (max 6 iterations to avoid runaway)
    tool_events: List[Dict[str, Any]] = []
    final_text = ""
    for _ in range(6):
        resp = await _llm_call(messages)
        choice = resp.choices[0]
        msg = choice.message
        msg_dict: Dict[str, Any] = {"role": "assistant", "content": msg.content or ""}
        tool_calls = getattr(msg, "tool_calls", None)
        if tool_calls:
            msg_dict["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                }
                for tc in tool_calls
            ]
        messages.append(msg_dict)

        if not tool_calls:
            final_text = msg.content or ""
            break

        # Execute each tool call sequentially (parallel_tool_calls=false so usually 1)
        for tc in tool_calls:
            name = tc.function.name
            if name not in LUMA_TOOL_NAMES:
                result = {"error": f"unknown tool {name}"}
            else:
                try:
                    args = json.loads(tc.function.arguments or "{}")
                except json.JSONDecodeError:
                    args = {}
                if name == "get_active_services":
                    result = await tool_get_active_services()
                    session["active_services_loaded"] = True
                    session["active_services"] = result
                elif name == "check_availability":
                    result = await tool_check_availability(args)
                    state.availability.checked = True
                    state.availability.available = bool(result.get("available"))
                    state.availability.hold_id = result.get("hold_id")
                    state.availability.alternatives = result.get("alternatives", [])
                elif name == "create_booking":
                    # Capture provided arguments into state for the record
                    if args.get("client_full_name"):
                        state.client.full_name = args["client_full_name"]
                    if args.get("client_email"):
                        state.client.email = args["client_email"]
                    if args.get("client_phone"):
                        state.client.phone = args["client_phone"]
                    if args.get("package_id"):
                        state.booking.package_id = args["package_id"]
                    if args.get("service_category"):
                        state.booking.service_category = args["service_category"]
                    if args.get("preferred_date"):
                        state.booking.preferred_date = args["preferred_date"]
                    if args.get("preferred_time"):
                        state.booking.preferred_time = args["preferred_time"]
                    if args.get("duration_minutes"):
                        state.booking.duration_minutes = int(args["duration_minutes"])
                    if args.get("location_address"):
                        state.booking.location_address = args["location_address"]
                    if args.get("suburb"):
                        state.booking.suburb = args["suburb"]
                    if args.get("special_requests"):
                        state.booking.special_requests = args["special_requests"]
                    result = await tool_create_booking(args, state, None)
                    if result.get("ok"):
                        state.status = "confirmed"
                        state.current_milestone = "completed"
                elif name == "handoff_to_human":
                    result = await tool_handoff_to_human(args, state)
                    state.status = "needs_human"
                else:
                    result = {"error": "no_handler"}

            tool_events.append({"name": name, "args": args if name != "get_active_services" else {}, "result": result})
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": name,
                    "content": json.dumps(result),
                }
            )

    # Persist conversation (without system prompt) and state
    session["messages"] = [m for m in messages if m["role"] != "system"]
    session["state"] = state.model_dump()
    await save_session(session)

    return {
        "session_id": session["session_id"],
        "reply": final_text,
        "tool_events": tool_events,
        "state": state.model_dump(),
    }
