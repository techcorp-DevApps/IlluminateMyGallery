"""Service catalog routes — admin manages, Luma reads."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_admin
from db import db
from models import ServiceAddonModel, ServicePackageModel, new_id

router = APIRouter(prefix="/api/services", tags=["services"])


@router.get("/active")
async def list_active_services():
    packages = await db.service_packages.find({"is_active": True}, {"_id": 0}).to_list(200)
    addons = await db.service_addons.find({}, {"_id": 0}).to_list(200)
    categories = sorted({p["service_category"] for p in packages})
    return {
        "version": "1",
        "fetched_at": "",
        "categories": categories,
        "packages": packages,
        "addons": addons,
    }


@router.post("/packages", response_model=ServicePackageModel)
async def create_package(payload: ServicePackageModel, _: dict = Depends(get_current_admin)):
    doc = payload.model_dump()
    if not doc.get("package_id"):
        doc["package_id"] = new_id()
    await db.service_packages.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/packages/{package_id}", response_model=ServicePackageModel)
async def update_package(package_id: str, payload: ServicePackageModel, _: dict = Depends(get_current_admin)):
    doc = payload.model_dump()
    doc["package_id"] = package_id
    res = await db.service_packages.update_one({"package_id": package_id}, {"$set": doc})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Package not found")
    return doc


@router.delete("/packages/{package_id}")
async def delete_package(package_id: str, _: dict = Depends(get_current_admin)):
    await db.service_packages.delete_one({"package_id": package_id})
    return {"ok": True}


@router.post("/addons", response_model=ServiceAddonModel)
async def create_addon(payload: ServiceAddonModel, _: dict = Depends(get_current_admin)):
    doc = payload.model_dump()
    if not doc.get("addon_id"):
        doc["addon_id"] = new_id()
    await db.service_addons.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.delete("/addons/{addon_id}")
async def delete_addon(addon_id: str, _: dict = Depends(get_current_admin)):
    await db.service_addons.delete_one({"addon_id": addon_id})
    return {"ok": True}
