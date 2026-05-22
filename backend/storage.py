"""
StorageAdapter abstraction.

Photos and document blobs go through this adapter so the data layer is
swappable: today we store base64 in MongoDB (collection: file_blobs).
Tomorrow you can wire this seam to Railway Postgres + S3 by writing a
PostgresStorageAdapter / S3StorageAdapter that implements the same
3 methods and exporting it as `storage`.
"""
from __future__ import annotations

import base64
import uuid
from typing import Optional

from db import db


class MongoStorageAdapter:
    """Store binary blobs inline in MongoDB as base64. Suitable for MVP and demos."""

    async def put(self, data: bytes, content_type: str, filename: Optional[str] = None) -> str:
        blob_id = str(uuid.uuid4())
        await db.file_blobs.insert_one(
            {
                "_id": blob_id,
                "data": base64.b64encode(data).decode("ascii"),
                "content_type": content_type,
                "filename": filename or blob_id,
                "size": len(data),
            }
        )
        return blob_id

    async def get(self, blob_id: str) -> Optional[dict]:
        doc = await db.file_blobs.find_one({"_id": blob_id})
        if not doc:
            return None
        return {
            "data": base64.b64decode(doc["data"]),
            "content_type": doc["content_type"],
            "filename": doc["filename"],
            "size": doc["size"],
        }

    async def delete(self, blob_id: str) -> None:
        await db.file_blobs.delete_one({"_id": blob_id})


storage: MongoStorageAdapter = MongoStorageAdapter()
