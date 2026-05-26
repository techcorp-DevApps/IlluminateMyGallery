"""MongoDB connection — lazy, validated, vendor-neutral.

The client is created on first use (not at import) so the application object can
be imported even before environment variables are present, and a missing
variable raises a clear error instead of an opaque ``KeyError`` at import time.

The public ``db`` symbol is preserved: every caller continues to use
``from db import db`` and ``db.<collection>`` / ``db["<collection>"]`` unchanged.
"""
from __future__ import annotations

import os
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


def _require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"Required environment variable {name!r} is not set. "
            "Configure it on the service (see RAILWAY_DEPLOY.md)."
        )
    return value


def get_database() -> AsyncIOMotorDatabase:
    """Return the application database, creating the client on first call."""
    global _client, _db
    if _db is None:
        _client = AsyncIOMotorClient(
            _require("MONGO_URL"),
            serverSelectionTimeoutMS=5000,
            uuidRepresentation="standard",
        )
        _db = _client[_require("DB_NAME")]
    return _db


class _LazyDatabase:
    """Proxy that resolves to the real Motor database on first attribute access.

    Keeps ``db`` importable at module load while deferring the connection and
    the required-environment-variable check until the database is actually used.
    """

    def __getattr__(self, name: str):
        return getattr(get_database(), name)

    def __getitem__(self, name: str):
        return get_database()[name]


db = _LazyDatabase()
