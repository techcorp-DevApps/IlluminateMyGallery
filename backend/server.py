"""FastAPI app entry: load env, register routes, seed admin + defaults."""
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

import logging
import os

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from routes.admin_routes import router as admin_router
from routes.auth_routes import router as auth_router
from routes.bookings_routes import router as bookings_router
from routes.documents_routes import router as documents_router
from routes.galleries_routes import router as galleries_router
from routes.invoices_routes import router as invoices_router
from routes.luma_routes import router as luma_router
from routes.payments_routes import router as payments_router
from routes.portfolio_routes import router as portfolio_router
from routes.services_routes import router as services_router
from seed import run_seed

app = FastAPI(title="Illuminate Studios API")


@app.get("/api/")
async def root():
    return {"ok": True, "name": "Illuminate Studios API"}


# Mount routers
for r in (
    auth_router,
    portfolio_router,
    services_router,
    bookings_router,
    galleries_router,
    documents_router,
    invoices_router,
    payments_router,
    admin_router,
    luma_router,
):
    app.include_router(r)

# Stripe webhook is a top-level path inside payments_router (already /api/payments/webhook/stripe)
# but spec wants /api/webhook/stripe — expose alias here:
from routes.payments_routes import webhook as stripe_webhook  # noqa: E402

app.add_api_route("/api/webhook/stripe", stripe_webhook, methods=["POST"], include_in_schema=False)


# CORS — explicit origins so cookies work cross-site
_cors_origins_env = os.environ.get("CORS_ORIGINS", "*")
if _cors_origins_env.strip() == "*":
    # When wildcard, browsers refuse credentials. Reflect the request origin instead.
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=".*",
        allow_credentials=True,
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

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("illuminate")


@app.on_event("startup")
async def on_startup() -> None:
    await run_seed()
    logger.info("Seed complete")
