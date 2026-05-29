"""Pydantic models used across routes."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# --- Auth ---
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str
    created_at: str


# --- Task 2 auth foundation (magic link, set-password, staff invite, claim) ---
class MagicLinkRequestIn(BaseModel):
    email: EmailStr


class TokenIn(BaseModel):
    token: str


class SetPasswordIn(BaseModel):
    password: str = Field(min_length=6)


class StaffInviteIn(BaseModel):
    email: EmailStr
    role: str  # "admin" | "editor"


class StaffAcceptIn(BaseModel):
    token: str
    name: str
    password: str = Field(min_length=6)


class GalleryTokenCreateIn(BaseModel):
    """Optionally email the generated gallery access link to the client."""
    send_email: bool = False


# --- Portfolio (public galleries showcasing the photographer's work) ---
class PortfolioItemIn(BaseModel):
    title: str
    category: str
    cover_image_url: str
    description: Optional[str] = None
    images: List[str] = Field(default_factory=list)


class PortfolioItemOut(PortfolioItemIn):
    id: str
    created_at: str


# --- Services / Packages (admin-managed; Luma reads these) ---
class ServiceAddonModel(BaseModel):
    addon_id: str = Field(default_factory=new_id)
    name: str
    price: float


class ServicePackageModel(BaseModel):
    package_id: str = Field(default_factory=new_id)
    package_name: str
    service_category: str
    base_price: float
    duration_minutes: int
    description: Optional[str] = ""
    addon_ids: List[str] = Field(default_factory=list)
    is_active: bool = True


# --- Bookings ---
class BookingCreateIn(BaseModel):
    package_id: str
    service_category: str
    preferred_date: str  # ISO YYYY-MM-DD
    preferred_time: str  # HH:MM
    duration_minutes: int
    location_address: str
    suburb: str
    notes: Optional[str] = ""


class BookingOut(BaseModel):
    id: str
    user_id: str
    client_name: str
    client_email: str
    client_phone: Optional[str] = ""
    package_id: str
    package_name: str
    service_category: str
    preferred_date: str
    preferred_time: str
    duration_minutes: int
    location_address: str
    suburb: str
    notes: Optional[str] = ""
    estimated_price: float
    status: str  # pending | approved | rejected | completed
    source: str  # "manual" | "luma"
    created_at: str


# --- Client Galleries (admin uploads delivered photos for a client) ---
class GalleryIn(BaseModel):
    title: str
    client_user_id: str
    description: Optional[str] = ""
    booking_id: Optional[str] = None
    allow_downloads: bool = False


class GalleryPatchIn(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    booking_id: Optional[str] = None
    allow_downloads: Optional[bool] = None


class PhotoMeta(BaseModel):
    id: str
    blob_id: str
    filename: str
    content_type: str
    size: int


class GalleryOut(BaseModel):
    id: str
    title: str
    client_user_id: str
    description: Optional[str] = ""
    cover_blob_id: Optional[str] = None
    photo_count: int = 0
    created_at: str
    booking_id: Optional[str] = None
    allow_downloads: bool = False
    # Display metadata (populated by the route when available)
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    package_name: Optional[str] = None
    booking_date: Optional[str] = None
    invoice_reference: Optional[str] = None


# --- Documents ---
class DocumentIn(BaseModel):
    title: str
    client_user_id: str
    body: str


class DocumentOut(BaseModel):
    id: str
    title: str
    client_user_id: str
    body: str
    signed: bool = False
    signature_name: Optional[str] = None
    signed_at: Optional[str] = None
    created_at: str
    template_key: Optional[str] = None
    booking_id: Optional[str] = None


class SignIn(BaseModel):
    signature_name: str


# --- Invoices ---
class InvoiceIn(BaseModel):
    client_user_id: str
    title: str
    amount: float
    currency: str = "AUD"
    booking_id: Optional[str] = None
    description: Optional[str] = ""


class PaymentInstructions(BaseModel):
    payid: str
    business_name: str
    bsb: str
    account_number: str
    account_name: str
    reference: str


class InvoiceOut(BaseModel):
    id: str
    reference: str
    client_user_id: str
    title: str
    description: Optional[str] = ""
    amount: float
    currency: str
    booking_id: Optional[str] = None
    status: str  # unpaid | paid | cancelled
    created_at: str
    paid_at: Optional[str] = None
    payment_instructions: Optional[PaymentInstructions] = None


# --- Contract templates / documents-from-template ---
class ContractTemplateOut(BaseModel):
    id: str
    key: str
    title: str
    service_category: str
    body: str


class DocumentFromTemplateIn(BaseModel):
    template_key: str
    client_user_id: str
    booking_id: Optional[str] = None
    overrides: Optional[dict] = None
