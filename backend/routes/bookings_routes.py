"""Booking routes."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_admin, get_current_user
from db import db
from models import BookingCreateIn, BookingOut, new_id, now_iso

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


async def _build_booking_from_input(user: dict, payload: BookingCreateIn, source: str = "manual") -> dict:
    pkg = await db.service_packages.find_one({"package_id": payload.package_id}, {"_id": 0})
    if not pkg:
        raise HTTPException(status_code=400, detail="Unknown package")
    return {
        "id": new_id(),
        "user_id": user["id"],
        "client_name": user.get("name", ""),
        "client_email": user["email"],
        "client_phone": user.get("phone", ""),
        "package_id": pkg["package_id"],
        "package_name": pkg["package_name"],
        "service_category": pkg["service_category"],
        "preferred_date": payload.preferred_date,
        "preferred_time": payload.preferred_time,
        "duration_minutes": payload.duration_minutes or pkg["duration_minutes"],
        "location_address": payload.location_address,
        "suburb": payload.suburb,
        "notes": payload.notes or "",
        "estimated_price": pkg["base_price"],
        "status": "pending",
        "source": source,
        "created_at": now_iso(),
    }


@router.post("", response_model=BookingOut)
async def create_booking(payload: BookingCreateIn, user: dict = Depends(get_current_user)):
    doc = await _build_booking_from_input(user, payload, "manual")
    await db.bookings.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/mine", response_model=List[BookingOut])
async def my_bookings(user: dict = Depends(get_current_user)):
    rows = await db.bookings.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    rows.sort(key=lambda x: x["created_at"], reverse=True)
    return rows


@router.get("", response_model=List[BookingOut])
async def all_bookings(_: dict = Depends(get_current_admin)):
    rows = await db.bookings.find({}, {"_id": 0}).to_list(500)
    rows.sort(key=lambda x: x["created_at"], reverse=True)
    return rows


@router.patch("/{booking_id}/status", response_model=BookingOut)
async def change_status(booking_id: str, status: str, _: dict = Depends(get_current_admin)):
    if status not in {"pending", "approved", "rejected", "completed"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    res = await db.bookings.update_one({"id": booking_id}, {"$set": {"status": status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    doc = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return doc
