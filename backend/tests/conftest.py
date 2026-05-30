"""Pytest fixtures for the Priority 2 auth-foundation tests.

These tests run fully in-process — no real MongoDB, no live server, no LLM:

* ``db`` is backed by ``mongomock_motor`` (an async in-memory Mongo). The app's
  lazy ``db`` proxy resolves the module-global ``_db``, so swapping it in is all
  that's needed.
* ``litellm`` is stubbed in ``sys.modules`` so ``luma.agent`` (and therefore the
  Luma router) imports without the optional production dependency. The chat route
  wraps the LLM call in try/except, so the stub simply drives the friendly
  fallback path — the rate-limit / session-gate logic runs *before* that and is
  what these tests exercise.
* The in-process rate limiter is a process-global singleton, so it is reset
  before every test to keep cases independent.
"""
from __future__ import annotations

import os
import sys
import types

# --- Environment: set required secrets before any app module reads them. ---
os.environ.setdefault("JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("CLIENT_SESSION_SECRET", "test-client-session-pepper")
os.environ.setdefault("CLOUDFLARE_WORKER_SHARED_SECRET", "test-worker-shared-secret")
os.environ.setdefault("ENVIRONMENT", "test")
# Never attempt real email sends during tests.
os.environ.pop("RESEND_API_KEY", None)

# --- Stub the optional litellm dependency so the Luma router imports. ---
if "litellm" not in sys.modules:
    sys.modules["litellm"] = types.ModuleType("litellm")

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from mongomock_motor import AsyncMongoMockClient  # noqa: E402

import db as db_module  # noqa: E402
from security.rate_limit import get_limiter  # noqa: E402

# Live-deployment integration suites (require /app/frontend/.env + a running
# server). Skip them when that environment is absent so unit runs stay green.
if not os.path.exists("/app/frontend/.env"):
    collect_ignore = ["backend_test.py", "test_iteration3.py"]


@pytest.fixture(autouse=True)
def fresh_state():
    """Give every test a clean in-memory database and rate limiter."""
    db_module._db = AsyncMongoMockClient()["test"]
    get_limiter().reset()
    yield
    get_limiter().reset()


@pytest.fixture
def app():
    """A minimal app mounting exactly the routers touched by Priority 2."""
    from fastapi import FastAPI

    from routes.auth_routes import router as auth_router
    from routes.galleries_routes import router as galleries_router
    from routes.luma_routes import router as luma_router
    from routes.staff_routes import router as staff_router

    application = FastAPI()
    for router in (auth_router, staff_router, galleries_router, luma_router):
        application.include_router(router)
    return application


@pytest_asyncio.fixture
async def client(app):
    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
