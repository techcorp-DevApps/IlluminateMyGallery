"""Documents — admin sends, clients view & e-sign."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_admin, get_current_user
from db import db
from models import DocumentIn, DocumentOut, SignIn, new_id, now_iso

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("", response_model=DocumentOut)
async def create_document(payload: DocumentIn, _: dict = Depends(get_current_admin)):
    doc = {
        "id": new_id(),
        "title": payload.title,
        "client_user_id": payload.client_user_id,
        "body": payload.body,
        "signed": False,
        "signature_name": None,
        "signed_at": None,
        "created_at": now_iso(),
    }
    await db.documents.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/mine", response_model=List[DocumentOut])
async def my_documents(user: dict = Depends(get_current_user)):
    rows = await db.documents.find({"client_user_id": user["id"]}, {"_id": 0}).to_list(200)
    rows.sort(key=lambda x: x["created_at"], reverse=True)
    return rows


@router.get("", response_model=List[DocumentOut])
async def all_documents(_: dict = Depends(get_current_admin)):
    rows = await db.documents.find({}, {"_id": 0}).to_list(500)
    rows.sort(key=lambda x: x["created_at"], reverse=True)
    return rows


@router.get("/{document_id}", response_model=DocumentOut)
async def get_document(document_id: str, user: dict = Depends(get_current_user)):
    doc = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    if user["role"] != "admin" and doc["client_user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return doc


@router.post("/{document_id}/sign", response_model=DocumentOut)
async def sign_document(document_id: str, payload: SignIn, user: dict = Depends(get_current_user)):
    doc = await db.documents.find_one({"id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    if doc["client_user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if doc.get("signed"):
        raise HTTPException(status_code=400, detail="Already signed")
    if not payload.signature_name.strip():
        raise HTTPException(status_code=400, detail="Signature required")
    update = {
        "signed": True,
        "signature_name": payload.signature_name.strip(),
        "signed_at": now_iso(),
    }
    await db.documents.update_one({"id": document_id}, {"$set": update})
    new_doc = await db.documents.find_one({"id": document_id}, {"_id": 0})
    return new_doc
