"""
StorageAdapter abstraction with two interchangeable backends:

* `MongoStorageAdapter` — base64 blobs inline in MongoDB (collection: `file_blobs`).
  Zero-config, used in dev and for demos.

* `S3StorageAdapter` — S3-compatible object storage. Works with AWS S3,
  Cloudflare R2, MinIO, Backblaze B2, or any S3-protocol provider. Metadata
  (filename, content_type, size) stays in MongoDB for lookup; only the binary
  body lives in the bucket.

The backend is selected automatically on import:

* If `S3_BUCKET` is set → S3StorageAdapter (uses optional `S3_ENDPOINT_URL`,
  `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`).
* Otherwise → MongoStorageAdapter.

Public methods on both adapters:
    async put(data: bytes, content_type: str, filename: Optional[str]) -> str
    async get(blob_id: str) -> Optional[dict]   # {'data','content_type','filename','size'}
    async delete(blob_id: str) -> None
"""
from __future__ import annotations

import asyncio
import base64
import os
import uuid
from typing import Optional

from db import db


# ============================================================================
# Mongo (default)
# ============================================================================
class MongoStorageAdapter:
    """Store binary blobs inline in MongoDB as base64. MVP / dev backend."""

    backend_name = "mongo"

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


# ============================================================================
# S3 / R2 / MinIO
# ============================================================================
class S3StorageAdapter:
    """Store binaries in an S3-compatible bucket; keep metadata in Mongo."""

    backend_name = "s3"

    def __init__(self) -> None:
        import boto3  # local import keeps boto3 optional

        self.bucket = os.environ["S3_BUCKET"]
        client_kwargs = {}
        endpoint = os.environ.get("S3_ENDPOINT_URL")
        if endpoint:
            client_kwargs["endpoint_url"] = endpoint
        region = os.environ.get("S3_REGION") or "auto"
        client_kwargs["region_name"] = region
        access_key = os.environ.get("S3_ACCESS_KEY_ID")
        secret_key = os.environ.get("S3_SECRET_ACCESS_KEY")
        if access_key and secret_key:
            client_kwargs["aws_access_key_id"] = access_key
            client_kwargs["aws_secret_access_key"] = secret_key
        # boto3 client is sync — wrap calls in asyncio.to_thread to keep FastAPI loop free.
        self._s3 = boto3.client("s3", **client_kwargs)

    async def put(self, data: bytes, content_type: str, filename: Optional[str] = None) -> str:
        blob_id = str(uuid.uuid4())
        key = f"blobs/{blob_id}"
        await asyncio.to_thread(
            self._s3.put_object,
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        await db.file_blobs.insert_one(
            {
                "_id": blob_id,
                "backend": "s3",
                "bucket": self.bucket,
                "key": key,
                "content_type": content_type,
                "filename": filename or blob_id,
                "size": len(data),
            }
        )
        return blob_id

    async def get(self, blob_id: str) -> Optional[dict]:
        meta = await db.file_blobs.find_one({"_id": blob_id})
        if not meta:
            return None
        if meta.get("backend") == "s3":
            obj = await asyncio.to_thread(self._s3.get_object, Bucket=meta["bucket"], Key=meta["key"])
            body = await asyncio.to_thread(obj["Body"].read)
            return {
                "data": body,
                "content_type": meta["content_type"],
                "filename": meta["filename"],
                "size": meta["size"],
            }
        # Backward-compat: blob was created when adapter was Mongo. Decode inline base64.
        if "data" in meta:
            return {
                "data": base64.b64decode(meta["data"]),
                "content_type": meta["content_type"],
                "filename": meta["filename"],
                "size": meta["size"],
            }
        return None

    async def delete(self, blob_id: str) -> None:
        meta = await db.file_blobs.find_one({"_id": blob_id})
        if not meta:
            return
        if meta.get("backend") == "s3":
            await asyncio.to_thread(self._s3.delete_object, Bucket=meta["bucket"], Key=meta["key"])
        await db.file_blobs.delete_one({"_id": blob_id})


# ============================================================================
# Pick a backend at import time
# ============================================================================
def _make_storage():
    if os.environ.get("S3_BUCKET"):
        return S3StorageAdapter()
    return MongoStorageAdapter()


storage = _make_storage()
