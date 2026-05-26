"""Seed initial admin user and default Illuminate Studios service packages."""
from __future__ import annotations

import os

from auth import hash_password, verify_password
from db import db
from models import new_id, now_iso


async def seed_admin() -> None:
    email = os.environ["ADMIN_EMAIL"].lower()
    password = os.environ["ADMIN_PASSWORD"]
    # Remove any orphan admin accounts created under a previous ADMIN_EMAIL.
    await db.users.delete_many({"role": "admin", "email": {"$ne": email}})
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one(
            {
                "id": new_id(),
                "email": email,
                "name": "Illuminate Studios",
                "role": "admin",
                "phone": "",
                "password_hash": hash_password(password),
                "created_at": now_iso(),
            }
        )
    else:
        # Ensure role is admin (in case email pre-existed as a user) and password matches env.
        updates = {}
        if existing.get("role") != "admin":
            updates["role"] = "admin"
        if not verify_password(password, existing.get("password_hash", "")):
            updates["password_hash"] = hash_password(password)
        if updates:
            await db.users.update_one({"email": email}, {"$set": updates})


async def seed_test_user() -> None:
    email = "client@example.com"
    if await db.users.find_one({"email": email}) is None:
        await db.users.insert_one(
            {
                "id": new_id(),
                "email": email,
                "name": "Ava Mercer",
                "role": "user",
                "phone": "+61 412 000 000",
                "password_hash": hash_password("client123"),
                "created_at": now_iso(),
            }
        )


DEFAULT_ADDONS = [
    {"name": "Extra hour of coverage", "price": 350.0},
    {"name": "Premium retouching (20 images)", "price": 280.0},
    {"name": "Same-day preview reel", "price": 200.0},
    {"name": "Second photographer", "price": 600.0},
]

# Starter packages — admin can edit/add/remove these through the Services UI.
DEFAULT_PACKAGES = [
    {
        "package_name": "The Studio Portrait",
        "service_category": "Portrait",
        "base_price": 480.0,
        "duration_minutes": 60,
        "description": "Editorial studio session with 15 retouched images.",
    },
    {
        "package_name": "The Engagement",
        "service_category": "Couples",
        "base_price": 720.0,
        "duration_minutes": 90,
        "description": "On-location couples session at golden hour with 30 retouched images.",
    },
    {
        "package_name": "The Wedding — Half Day",
        "service_category": "Wedding",
        "base_price": 2400.0,
        "duration_minutes": 300,
        "description": "5 hours of wedding coverage with full gallery delivery in 3 weeks.",
    },
    {
        "package_name": "The Wedding — Full Day",
        "service_category": "Wedding",
        "base_price": 4200.0,
        "duration_minutes": 600,
        "description": "10 hours of coverage, second photographer, and a premium album.",
    },
    {
        "package_name": "Editorial Brand Story",
        "service_category": "Commercial",
        "base_price": 1800.0,
        "duration_minutes": 240,
        "description": "Editorial brand shoot with 40 final images, usage rights included.",
    },
]


async def seed_services() -> None:
    """Idempotent: only seeds the starter catalogue when the collection is empty.
    Admin edits via the Services UI are preserved across restarts."""
    if await db.service_packages.find_one():
        return
    await db.service_addons.delete_many({})
    addons = [{"addon_id": new_id(), **a} for a in DEFAULT_ADDONS]
    await db.service_addons.insert_many(addons)
    addon_ids = [a["addon_id"] for a in addons]
    packages = [
        {
            "package_id": new_id(),
            "addon_ids": addon_ids,
            "is_active": True,
            **p,
        }
        for p in DEFAULT_PACKAGES
    ]
    await db.service_packages.insert_many(packages)


DEFAULT_PORTFOLIO = [
    {
        "title": "Adele — Fashion Editorial",
        "category": "Editorial",
        "cover_image_url": "https://images.unsplash.com/photo-1648046016726-9260b555902b",
        "description": "Magazine cover work for an emerging slow-fashion label.",
        "images": [
            "https://images.unsplash.com/photo-1648046016726-9260b555902b",
            "https://images.unsplash.com/photo-1660018322139-0e58555df00d",
            "https://images.pexels.com/photos/13899406/pexels-photo-13899406.jpeg",
        ],
    },
    {
        "title": "Eloise & Henry — A Quiet Vow",
        "category": "Wedding",
        "cover_image_url": "https://images.unsplash.com/photo-1520854221256-17451cc331bf",
        "description": "An intimate wedding in the Yarra Valley.",
        "images": [
            "https://images.unsplash.com/photo-1520854221256-17451cc331bf",
            "https://images.pexels.com/photos/35448448/pexels-photo-35448448.jpeg",
        ],
    },
    {
        "title": "Studio Portraits — Vol. III",
        "category": "Portrait",
        "cover_image_url": "https://images.unsplash.com/photo-1541519481457-763224276691",
        "description": "Black-and-white portrait studies, shot on medium format.",
        "images": [
            "https://images.unsplash.com/photo-1541519481457-763224276691",
            "https://images.pexels.com/photos/11607515/pexels-photo-11607515.jpeg",
        ],
    },
]


async def seed_portfolio() -> None:
    if await db.portfolio.find_one():
        return
    docs = [{"id": new_id(), "created_at": now_iso(), **p} for p in DEFAULT_PORTFOLIO]
    await db.portfolio.insert_many(docs)


async def run_seed() -> None:
    await db.users.create_index("email", unique=True)
    await db.bookings.create_index("user_id")
    await db.galleries.create_index("client_user_id")
    await db.documents.create_index("client_user_id")
    await db.invoices.create_index("client_user_id")
    await db.luma_sessions.create_index("session_id", unique=True)
    await db.payment_transactions.create_index("session_id", unique=True)
    await seed_admin()
    await seed_test_user()
    await seed_services()
    await seed_portfolio()
