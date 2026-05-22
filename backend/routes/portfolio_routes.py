from typing import List

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_admin
from db import db
from models import PortfolioItemIn, PortfolioItemOut, new_id, now_iso

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@router.get("", response_model=List[PortfolioItemOut])
async def list_portfolio():
    items = await db.portfolio.find({}, {"_id": 0}).to_list(200)
    items.sort(key=lambda x: x["created_at"], reverse=True)
    return items


@router.post("", response_model=PortfolioItemOut)
async def create_portfolio_item(payload: PortfolioItemIn, _: dict = Depends(get_current_admin)):
    doc = {"id": new_id(), "created_at": now_iso(), **payload.model_dump()}
    await db.portfolio.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.delete("/{item_id}")
async def delete_portfolio_item(item_id: str, _: dict = Depends(get_current_admin)):
    res = await db.portfolio.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}
