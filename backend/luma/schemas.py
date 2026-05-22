"""Canonical BookingState shape + tool parameter schemas (Python port of luma.schemas.ts)."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ClientState(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class BookingDetails(BaseModel):
    service_category: Optional[str] = None
    package_id: Optional[str] = None
    package_name: Optional[str] = None
    preferred_date: Optional[str] = None
    alternate_date: Optional[str] = None
    preferred_time: Optional[str] = None
    time_window: Optional[str] = None
    duration_minutes: Optional[int] = None
    location_name: Optional[str] = None
    location_address: Optional[str] = None
    suburb: Optional[str] = None
    event_type: Optional[str] = None
    guest_count: Optional[int] = None
    participant_count: Optional[int] = None
    special_requests: Optional[str] = None
    deliverables: List[str] = Field(default_factory=list)
    addons: List[str] = Field(default_factory=list)
    estimated_price: Optional[float] = None
    currency: str = "AUD"


class AvailabilityState(BaseModel):
    checked: bool = False
    available: Optional[bool] = None
    hold_id: Optional[str] = None
    alternatives: List[Dict[str, Any]] = Field(default_factory=list)


class ReviewState(BaseModel):
    summary_presented: bool = False
    summary_presented_at: Optional[str] = None
    summary_hash: Optional[str] = None
    confirmation_status: str = "none"  # none | ambiguous | explicit_confirmed


class ConsentState(BaseModel):
    terms_acknowledged: bool = False
    marketing_opt_in: bool = False


class BookingState(BaseModel):
    session_id: str
    status: str = "collecting"  # collecting | awaiting_confirmation | confirmed | needs_human | abandoned
    current_milestone: str = "welcome"
    client: ClientState = Field(default_factory=ClientState)
    booking: BookingDetails = Field(default_factory=BookingDetails)
    availability: AvailabilityState = Field(default_factory=AvailabilityState)
    review: ReviewState = Field(default_factory=ReviewState)
    consent: ConsentState = Field(default_factory=ConsentState)


# Tool parameter JSON schemas (strict OpenAI tool calling format)
GET_ACTIVE_SERVICES_PARAMS = {
    "type": "object",
    "properties": {},
    "required": [],
    "additionalProperties": False,
}

CHECK_AVAILABILITY_PARAMS = {
    "type": "object",
    "properties": {
        "preferred_date": {"type": "string", "description": "YYYY-MM-DD"},
        "preferred_time": {"type": "string", "description": "24h HH:MM"},
        "duration_minutes": {"type": "integer"},
        "service_category": {"type": "string"},
        "location_suburb": {"type": "string"},
    },
    "required": [
        "preferred_date", "preferred_time", "duration_minutes",
        "service_category", "location_suburb",
    ],
    "additionalProperties": False,
}

CREATE_BOOKING_PARAMS = {
    "type": "object",
    "properties": {
        "client_full_name": {"type": "string"},
        "client_email": {"type": "string"},
        "client_phone": {"type": "string"},
        "package_id": {"type": "string"},
        "service_category": {"type": "string"},
        "preferred_date": {"type": "string", "description": "YYYY-MM-DD"},
        "preferred_time": {"type": "string", "description": "24h HH:MM"},
        "duration_minutes": {"type": "integer"},
        "location_address": {"type": "string"},
        "suburb": {"type": "string"},
        "special_requests": {"type": "string"},
    },
    "required": [
        "client_full_name", "client_email", "client_phone",
        "package_id", "service_category",
        "preferred_date", "preferred_time", "duration_minutes",
        "location_address", "suburb", "special_requests",
    ],
    "additionalProperties": False,
}

HANDOFF_TO_HUMAN_PARAMS = {
    "type": "object",
    "properties": {
        "reason": {"type": "string"},
        "summary": {"type": "string"},
    },
    "required": ["reason", "summary"],
    "additionalProperties": False,
}
