"""FastAPI app entry: load env, register routes, seed admin + defaults."""
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from routes.admin_routes import router as admin_router
from routes.auth_routes import router as auth_router
from routes.bookings_routes import router as bookings_router
from routes.contract_templates_routes import router as contract_templates_router
from routes.documents_routes import router as documents_router
from routes.galleries_routes import router as galleries_router
from routes.invoices_routes import router as invoices_router
from routes.luma_routes import router as luma_router
from routes.portfolio_routes import router as portfolio_router
from routes.services_routes import router as services_router
from seed import run_seed

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("illuminate")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run idempotent seeding on startup without letting it block the service.

    Seeding (index creation + default data) is a one-time data concern. If the
    database is briefly unreachable or a seed step fails, the API must still
    start so the ``/api/`` health check passes; the error is logged and the next
    deploy/restart retries seeding.
    """
    try:
        await run_seed()
        logger.info("Seed complete")
    except Exception:
        logger.exception("Seed step failed; continuing startup so the API stays available")
    yield


app = FastAPI(title="Illuminate Studios API", lifespan=lifespan)


@app.get("/api/")
async def root():
    """Health/liveness endpoint used by the Railway health check."""
    return {"ok": True, "name": "Illuminate Studios API"}


# Mount routers
for r in (
    auth_router,
    portfolio_router,
    services_router,
    bookings_router,
    galleries_router,
    documents_router,
    contract_templates_router,
    invoices_router,
    admin_router,
    luma_router,
):
    app.include_router(r)

# Stripe webhook alias removed — PayID-based payment flow does not use Stripe webhooks.


# CORS — explicit origins so cookies work cross-site
_cors_origins_env = os.environ.get("CORS_ORIGINS", "*")
if _cors_origins_env.strip() == "*":
    # Wildcard is a development fallback only. Browsers refuse credentials with a
    # wildcard origin, and reflecting any origin while allowing credentials is
    # unsafe, so credentials are disabled here. Set CORS_ORIGINS explicitly in
    # production to enable cross-site cookies.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in _cors_origins_env.split(",") if o.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
