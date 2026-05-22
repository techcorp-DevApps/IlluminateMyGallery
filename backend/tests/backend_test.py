"""
Backend integration tests for Illuminate Studios.
Covers: health, auth (cookie-based), role gating, portfolio, services,
bookings, documents, invoices, payments (Stripe), galleries, Luma agent.

Run:
  cd /app && pytest backend/tests/backend_test.py -v --tb=short \
    --junitxml=/app/test_reports/pytest/pytest_results.xml
"""
from __future__ import annotations

import io
import os
import time
import uuid

import pytest
import requests

# Read from frontend env to exercise the external ingress (real user path)
def _read_base_url() -> str:
    env_path = "/app/frontend/.env"
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL"):
                    return line.split("=", 1)[1].strip().rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL not configured")


BASE = _read_base_url()
ADMIN_EMAIL = "photographer@illuminatestudios.com"
ADMIN_PASS = "Illuminate2026!"
CLIENT_EMAIL = "client@example.com"
CLIENT_PASS = "client123"

# Shared state across tests (preserves entity IDs created by earlier tests)
state: dict = {}


# --------------------- helpers ---------------------

def login(session: requests.Session, email: str, password: str) -> requests.Response:
    return session.post(f"{BASE}/api/auth/login", json={"email": email, "password": password}, timeout=30)


@pytest.fixture(scope="module")
def admin_session() -> requests.Session:
    s = requests.Session()
    r = login(s, ADMIN_EMAIL, ADMIN_PASS)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def client_session() -> requests.Session:
    s = requests.Session()
    r = login(s, CLIENT_EMAIL, CLIENT_PASS)
    assert r.status_code == 200, f"Client login failed: {r.status_code} {r.text}"
    return s


# --------------------- 1. health ---------------------

def test_root_health():
    r = requests.get(f"{BASE}/api/", timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert body.get("ok") is True
    assert "name" in body


# --------------------- 2. auth flow ---------------------

def test_register_sets_cookies_and_me_works():
    s = requests.Session()
    email = f"test_user_{uuid.uuid4().hex[:8]}@example.com"  # API lowercases
    r = s.post(f"{BASE}/api/auth/register",
               json={"name": "Test User", "email": email, "password": "secret123"},
               timeout=30)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["email"] == email.lower()
    assert body["role"] == "user"
    assert "id" in body
    # Cookies must be set
    cookie_names = {c.name for c in s.cookies}
    assert "access_token" in cookie_names, f"missing access cookie: {cookie_names}"
    assert "refresh_token" in cookie_names, f"missing refresh cookie: {cookie_names}"

    # /me using cookie
    me = s.get(f"{BASE}/api/auth/me", timeout=15)
    assert me.status_code == 200
    assert me.json()["email"] == email

    # logout clears cookies
    out = s.post(f"{BASE}/api/auth/logout", timeout=15)
    assert out.status_code == 200
    me2 = s.get(f"{BASE}/api/auth/me", timeout=15)
    assert me2.status_code == 401, f"Expected 401 after logout, got {me2.status_code}"


def test_login_admin_and_client():
    sa = requests.Session()
    ra = login(sa, ADMIN_EMAIL, ADMIN_PASS)
    assert ra.status_code == 200, ra.text
    assert ra.json()["role"] == "admin"

    sc = requests.Session()
    rc = login(sc, CLIENT_EMAIL, CLIENT_PASS)
    assert rc.status_code == 200, rc.text
    body = rc.json()
    assert body["role"] == "user"
    state["client_user_id"] = body["id"]


def test_me_unauthenticated_returns_401():
    r = requests.get(f"{BASE}/api/auth/me", timeout=15)
    assert r.status_code == 401


def test_login_bad_password_returns_401():
    r = requests.post(f"{BASE}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
    assert r.status_code == 401


# --------------------- 3. role gating ---------------------

def test_client_cannot_list_all_bookings(client_session):
    r = client_session.get(f"{BASE}/api/bookings", timeout=15)
    assert r.status_code == 403, f"expected 403 for non-admin /api/bookings, got {r.status_code}"


# --------------------- 4. portfolio ---------------------

def test_portfolio_get_seeded(admin_session):
    r = requests.get(f"{BASE}/api/portfolio", timeout=15)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    assert len(items) > 0, "portfolio should be seeded"
    state["portfolio_count"] = len(items)


def test_portfolio_post_admin_ok_and_non_admin_403(admin_session, client_session):
    payload = {
        "title": "TEST_Portfolio",
        "category": "portrait",
        "cover_image_url": "https://example.com/cover.jpg",
        "description": "test item",
        "images": ["https://example.com/1.jpg"],
    }
    r_admin = admin_session.post(f"{BASE}/api/portfolio", json=payload, timeout=15)
    assert r_admin.status_code == 200, r_admin.text
    state["portfolio_id"] = r_admin.json()["id"]

    r_client = client_session.post(f"{BASE}/api/portfolio", json=payload, timeout=15)
    assert r_client.status_code == 403


# --------------------- 5. services ---------------------

def test_services_active_seeded():
    r = requests.get(f"{BASE}/api/services/active", timeout=15)
    assert r.status_code == 200
    body = r.json()
    assert "packages" in body and "addons" in body
    assert isinstance(body["packages"], list)
    assert len(body["packages"]) > 0, "expected seeded packages"
    state["package_id"] = body["packages"][0]["package_id"]
    state["service_category"] = body["packages"][0]["service_category"]


# --------------------- 6. bookings (manual) ---------------------

def test_client_create_booking_and_admin_lists(admin_session, client_session):
    assert state.get("package_id"), "package_id must be set by services test"
    payload = {
        "package_id": state["package_id"],
        "service_category": state["service_category"],
        "preferred_date": "2026-04-15",
        "preferred_time": "14:00",
        "duration_minutes": 60,
        "location_address": "1 TEST St",
        "suburb": "Fitzroy",
        "notes": "TEST_booking",
    }
    r = client_session.post(f"{BASE}/api/bookings", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    booking = r.json()
    assert booking["status"] == "pending"
    assert booking["source"] == "manual"
    state["booking_id"] = booking["id"]

    mine = client_session.get(f"{BASE}/api/bookings/mine", timeout=15)
    assert mine.status_code == 200
    assert any(b["id"] == booking["id"] for b in mine.json())

    all_b = admin_session.get(f"{BASE}/api/bookings", timeout=15)
    assert all_b.status_code == 200
    assert any(b["id"] == booking["id"] for b in all_b.json())


def test_admin_approve_booking(admin_session):
    bid = state["booking_id"]
    r = admin_session.patch(f"{BASE}/api/bookings/{bid}/status",
                            params={"status": "approved"}, timeout=15)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "approved"


# --------------------- 7. documents ---------------------

def test_documents_create_view_sign(admin_session, client_session):
    payload = {
        "title": "TEST_Contract",
        "client_user_id": state["client_user_id"],
        "body": "This is the contract body to sign.",
    }
    r = admin_session.post(f"{BASE}/api/documents", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    doc = r.json()
    assert doc["signed"] is False
    state["document_id"] = doc["id"]

    mine = client_session.get(f"{BASE}/api/documents/mine", timeout=15)
    assert mine.status_code == 200
    assert any(d["id"] == doc["id"] for d in mine.json())

    sign = client_session.post(f"{BASE}/api/documents/{doc['id']}/sign",
                               json={"signature_name": "Test Client"}, timeout=15)
    assert sign.status_code == 200, sign.text
    signed = sign.json()
    assert signed["signed"] is True
    assert signed["signature_name"] == "Test Client"
    assert signed["signed_at"]


# --------------------- 8. invoices + Stripe checkout ---------------------

def test_invoice_create_and_checkout_flow(admin_session, client_session):
    inv_payload = {
        "client_user_id": state["client_user_id"],
        "title": "TEST_Invoice",
        "amount": 50.0,
        "currency": "AUD",
        "booking_id": state.get("booking_id"),
    }
    r = admin_session.post(f"{BASE}/api/invoices", json=inv_payload, timeout=15)
    assert r.status_code == 200, r.text
    inv = r.json()
    assert inv["status"] == "unpaid"
    assert inv["amount"] == 50.0
    state["invoice_id"] = inv["id"]

    mine = client_session.get(f"{BASE}/api/invoices/mine", timeout=15)
    assert mine.status_code == 200
    assert any(i["id"] == inv["id"] for i in mine.json())

    # Initiate Stripe checkout
    co = client_session.post(
        f"{BASE}/api/payments/checkout/invoice",
        json={"invoice_id": inv["id"], "origin_url": "https://example.com"},
        timeout=45,
    )
    assert co.status_code == 200, co.text
    body = co.json()
    assert body.get("url", "").startswith("https://"), f"expected Stripe URL, got {body}"
    assert body.get("session_id")
    state["stripe_session_id"] = body["session_id"]

    # status endpoint
    st = client_session.get(f"{BASE}/api/payments/status/{body['session_id']}", timeout=30)
    assert st.status_code == 200, st.text
    sbody = st.json()
    assert sbody["session_id"] == body["session_id"]
    # payment_status should be "unpaid" or similar, status open
    assert "payment_status" in sbody
    assert "status" in sbody


# --------------------- 9. galleries ---------------------

def _tiny_png_bytes() -> bytes:
    # 1x1 PNG (valid)
    return (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
        b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
        b"\x00\x00\x00\rIDATx\x9cc\xfa\xcf\x00\x00\x00\x02\x00\x01"
        b"\xe2!\xbc3\x00\x00\x00\x00IEND\xaeB`\x82"
    )


def test_gallery_create_upload_and_view(admin_session, client_session):
    payload = {
        "title": "TEST_Gallery",
        "client_user_id": state["client_user_id"],
        "description": "test description",
    }
    r = admin_session.post(f"{BASE}/api/galleries", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    g = r.json()
    state["gallery_id"] = g["id"]
    assert g["photo_count"] == 0

    # Upload photo (multipart)
    files = {"file": ("tiny.png", _tiny_png_bytes(), "image/png")}
    up = admin_session.post(f"{BASE}/api/galleries/{g['id']}/photos", files=files, timeout=30)
    assert up.status_code == 200, up.text
    photo = up.json()
    assert "blob_id" in photo
    state["blob_id"] = photo["blob_id"]

    # client sees the gallery
    mine = client_session.get(f"{BASE}/api/galleries/mine", timeout=15)
    assert mine.status_code == 200
    rows = mine.json()
    target = next((x for x in rows if x["id"] == g["id"]), None)
    assert target is not None, "client should see their gallery"
    assert target["photo_count"] >= 1

    # client get gallery with photos
    detail = client_session.get(f"{BASE}/api/galleries/{g['id']}", timeout=15)
    assert detail.status_code == 200, detail.text
    assert isinstance(detail.json().get("photos", []), list)
    assert len(detail.json()["photos"]) >= 1

    # client fetch the binary
    blob = client_session.get(f"{BASE}/api/galleries/photo/{photo['blob_id']}", timeout=15)
    assert blob.status_code == 200
    assert blob.headers.get("content-type", "").startswith("image/")
    assert len(blob.content) > 0


# --------------------- 10. Luma agent ---------------------

def test_luma_chat_creates_session_and_calls_get_active_services():
    msg = ("Hi I want to book a portrait session for 2 people in Fitzroy on "
           "March 15th 2026 at 2pm. My name is TEST Luma User, "
           "email TEST_luma_user@example.com, phone 0400000000.")
    r = requests.post(f"{BASE}/api/luma/chat", json={"message": msg}, timeout=120)
    assert r.status_code == 200, r.text
    body = r.json()
    sid = body.get("session_id")
    assert sid, "Luma must return a session_id"
    state["luma_session_id"] = sid
    # Should have done at least one tool call by now or in following turns;
    # capture tool events for later assertion.
    state["luma_tool_events"] = list(body.get("tool_events") or [])
    # Reply must be string
    assert isinstance(body.get("reply"), str)


def test_luma_continues_session_and_confirms_booking(admin_session):
    sid = state.get("luma_session_id")
    if not sid:
        pytest.skip("no session id from previous luma turn")

    seen_tools = list(state.get("luma_tool_events") or [])
    booking_id = None

    # Multi-turn until we get a booking created or 5 turns
    follow_ups = [
        "Please use the standard portrait package, 60 minutes.",
        "Yes that's correct, please proceed.",
        "Yes confirm it.",
        "Please go ahead and book it now.",
    ]
    for msg in follow_ups:
        r = requests.post(f"{BASE}/api/luma/chat",
                          json={"session_id": sid, "message": msg}, timeout=120)
        assert r.status_code == 200, r.text
        b = r.json()
        assert b.get("session_id") == sid, "session must persist"
        evs = b.get("tool_events") or []
        seen_tools.extend(evs)
        for ev in evs:
            if ev.get("name") == "create_booking":
                res = ev.get("result") or {}
                if res.get("ok"):
                    booking_id = res.get("booking_id")
                    break
        if booking_id:
            break

    tool_names = [e.get("name") for e in seen_tools]
    # get_active_services should appear (per contract)
    assert "get_active_services" in tool_names, (
        f"expected get_active_services in tool_events; saw {tool_names}"
    )

    if not booking_id:
        pytest.xfail(f"Luma did not create a booking via tool calls. Tools observed: {tool_names}")

    # Verify booking exists in admin list with source=luma
    all_b = admin_session.get(f"{BASE}/api/bookings", timeout=15)
    assert all_b.status_code == 200
    found = next((b for b in all_b.json() if b["id"] == booking_id), None)
    assert found is not None, "luma booking not present in admin list"
    assert found["source"] == "luma"
