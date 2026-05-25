"""Galleries and Photos — admin uploads delivered photos, clients view/download."""
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response

from auth import get_current_admin, get_current_user
from db import db
from models import GalleryIn, GalleryOut, GalleryPatchIn, new_id, now_iso
from storage import storage

router = APIRouter(prefix="/api/galleries", tags=["galleries"])


async def _enrich(g: dict) -> dict:
    """Attach client / booking / invoice display metadata for the gallery card."""
    out = {
        "id": g["id"],
        "title": g["title"],
        "client_user_id": g["client_user_id"],
        "description": g.get("description", ""),
        "cover_blob_id": g.get("cover_blob_id"),
        "photo_count": len(g.get("photos", [])),
        "created_at": g["created_at"],
        "booking_id": g.get("booking_id"),
        "allow_downloads": bool(g.get("allow_downloads", False)),
        "client_name": None,
        "client_email": None,
        "package_name": None,
        "booking_date": None,
        "invoice_reference": None,
    }
    client = await db.users.find_one(
        {"id": g["client_user_id"]}, {"_id": 0, "name": 1, "email": 1}
    )
    if client:
        out["client_name"] = client.get("name")
        out["client_email"] = client.get("email")
    if g.get("booking_id"):
        booking = await db.bookings.find_one({"id": g["booking_id"]}, {"_id": 0})
        if booking:
            out["package_name"] = booking.get("package_name")
            out["booking_date"] = booking.get("preferred_date")
        invoice = await db.invoices.find_one(
            {"booking_id": g["booking_id"]}, {"_id": 0, "reference": 1}
        )
        if invoice:
            out["invoice_reference"] = invoice.get("reference")
    return out


@router.post("", response_model=GalleryOut)
async def create_gallery(payload: GalleryIn, _: dict = Depends(get_current_admin)):
    doc = {
        "id": new_id(),
        "title": payload.title,
        "client_user_id": payload.client_user_id,
        "description": payload.description or "",
        "cover_blob_id": None,
        "photos": [],
        "booking_id": payload.booking_id,
        "allow_downloads": bool(payload.allow_downloads),
        "created_at": now_iso(),
    }
    await db.galleries.insert_one(doc)
    return await _enrich(doc)


@router.get("/mine", response_model=List[GalleryOut])
async def my_galleries(user: dict = Depends(get_current_user)):
    rows = await db.galleries.find({"client_user_id": user["id"]}, {"_id": 0}).to_list(200)
    rows.sort(key=lambda x: x["created_at"], reverse=True)
    return [await _enrich(g) for g in rows]


@router.get("", response_model=List[GalleryOut])
async def all_galleries(_: dict = Depends(get_current_admin)):
    rows = await db.galleries.find({}, {"_id": 0}).to_list(500)
    rows.sort(key=lambda x: x["created_at"], reverse=True)
    return [await _enrich(g) for g in rows]


@router.get("/{gallery_id}")
async def get_gallery(gallery_id: str, user: dict = Depends(get_current_user)):
    g = await db.galleries.find_one({"id": gallery_id}, {"_id": 0})
    if not g:
        raise HTTPException(status_code=404, detail="Gallery not found")
    if user["role"] != "admin" and g["client_user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    base = await _enrich(g)
    return {**base, "photos": g.get("photos", [])}


@router.patch("/{gallery_id}", response_model=GalleryOut)
async def update_gallery(
    gallery_id: str, payload: GalleryPatchIn, _: dict = Depends(get_current_admin)
):
    g = await db.galleries.find_one({"id": gallery_id})
    if not g:
        raise HTTPException(status_code=404, detail="Gallery not found")
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if updates:
        await db.galleries.update_one({"id": gallery_id}, {"$set": updates})
    g = await db.galleries.find_one({"id": gallery_id}, {"_id": 0})
    return await _enrich(g)


@router.post("/{gallery_id}/photos")
async def upload_photo(
    gallery_id: str,
    file: UploadFile = File(...),
    _: dict = Depends(get_current_admin),
):
    g = await db.galleries.find_one({"id": gallery_id})
    if not g:
        raise HTTPException(status_code=404, detail="Gallery not found")
    data = await file.read()
    blob_id = await storage.put(data, file.content_type or "image/jpeg", file.filename)
    photo = {
        "id": new_id(),
        "blob_id": blob_id,
        "filename": file.filename or f"{blob_id}.jpg",
        "content_type": file.content_type or "image/jpeg",
        "size": len(data),
    }
    set_cover = {} if g.get("cover_blob_id") else {"cover_blob_id": blob_id}
    await db.galleries.update_one(
        {"id": gallery_id},
        {"$push": {"photos": photo}, "$set": set_cover},
    )
    return photo


@router.delete("/{gallery_id}/photos/{photo_id}")
async def delete_photo(gallery_id: str, photo_id: str, _: dict = Depends(get_current_admin)):
    g = await db.galleries.find_one({"id": gallery_id})
    if not g:
        raise HTTPException(status_code=404, detail="Gallery not found")
    photo = next((p for p in g.get("photos", []) if p["id"] == photo_id), None)
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    await storage.delete(photo["blob_id"])
    await db.galleries.update_one({"id": gallery_id}, {"$pull": {"photos": {"id": photo_id}}})
    return {"ok": True}


@router.delete("/{gallery_id}")
async def delete_gallery(gallery_id: str, _: dict = Depends(get_current_admin)):
    g = await db.galleries.find_one({"id": gallery_id})
    if not g:
        raise HTTPException(status_code=404, detail="Gallery not found")
    for p in g.get("photos", []):
        await storage.delete(p["blob_id"])
    await db.galleries.delete_one({"id": gallery_id})
    return {"ok": True}


@router.get("/photo/{blob_id}")
async def get_photo(blob_id: str, user: dict = Depends(get_current_user)):
    # Authorisation: client can only access photos in galleries assigned to them.
    if user.get("role") != "admin":
        gallery = await db.galleries.find_one(
            {"photos.blob_id": blob_id, "client_user_id": user["id"]},
            {"_id": 0, "id": 1},
        )
        if not gallery:
            raise HTTPException(status_code=403, detail="Forbidden")
    blob = await storage.get(blob_id)
    if not blob:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(
        content=blob["data"],
        media_type=blob["content_type"],
        headers={"Content-Disposition": f'inline; filename="{blob["filename"]}"'},
    )


@router.get("/photo/{blob_id}/download")
async def download_photo(blob_id: str, user: dict = Depends(get_current_user)):
    """Full-resolution download. Clients only allowed when the gallery has
    `allow_downloads=True` (e.g. digital purchase package). Admin can always download."""
    if user.get("role") != "admin":
        gallery = await db.galleries.find_one(
            {"photos.blob_id": blob_id, "client_user_id": user["id"]},
            {"_id": 0, "id": 1, "allow_downloads": 1},
        )
        if not gallery:
            raise HTTPException(status_code=403, detail="Forbidden")
        if not gallery.get("allow_downloads"):
            raise HTTPException(
                status_code=403,
                detail="Downloads are not enabled for this gallery. Please contact the studio.",
            )
    blob = await storage.get(blob_id)
    if not blob:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(
        content=blob["data"],
        media_type=blob["content_type"],
        headers={"Content-Disposition": f'attachment; filename="{blob["filename"]}"'},
    )
