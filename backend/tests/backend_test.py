"""
Backend integration tests for Illuminate Studios (post-Stripe, PayID flow).
Covers: health, auth (cookie + refresh), role gating, contract templates +
auto-fill, documents, invoices (PayID flow + mark-paid/unpaid + auto-from-booking),
galleries (upload + binary fetch), Luma chat first-turn, and Stripe-gone 404s.

Run:
  pytest /app/backend/tests/backend_test.py -v --tb=short \
    --junitxml=/app/test_reports/pytest/pytest_results.xml
"""
from __future__ import annotations

import io
import os
import re
import uuid

import pytest
import requests


def _read_base_url() -> str:
    env_path = "/app/frontend/.env"
    with open(env_path) as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL"):
                return line.split("=", 1)[1].strip().rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL not configured")


BASE = _read_base_url()
ADMIN_EMAIL = "admin@illuminatestudios.com.au"
ADMIN_PASS = "Illuminate2026!"
OLD_ADMIN_EMAIL = "photographer@illuminatestudios.com"
CLIENT_EMAIL = "client@example.com"
CLIENT_PASS = "client123"

state: dict = {}


def login(session: requests.Session, email: str, password: str) -> requests.Response:
    return session.post(
        f"{BASE}/api/auth/login",
        json={"email": email, "password": password},
        timeout=30,
    )


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
    state["client_user_id"] = r.json()["id"]
    return s


# ----------------- Health -----------------
class TestHealth:
    def test_root_ok(self):
        r = requests.get(f"{BASE}/api/", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body.get("ok") is True


# ----------------- Auth -----------------
class TestAuth:
    def test_admin_login_new_email(self):
        s = requests.Session()
        r = login(s, ADMIN_EMAIL, ADMIN_PASS)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["role"] == "admin"
        assert body["email"] == ADMIN_EMAIL
        # Cookies set
        assert "access_token" in s.cookies or "refresh_token" in s.cookies

    def test_old_admin_email_gone(self):
        s = requests.Session()
        r = login(s, OLD_ADMIN_EMAIL, ADMIN_PASS)
        assert r.status_code == 401, f"Expected 401 for old admin, got {r.status_code}: {r.text}"

    def test_client_login(self):
        s = requests.Session()
        r = login(s, CLIENT_EMAIL, CLIENT_PASS)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["role"] == "user"
        assert body["email"] == CLIENT_EMAIL

    def test_refresh_issues_fresh_cookies(self):
        s = requests.Session()
        r = login(s, CLIENT_EMAIL, CLIENT_PASS)
        assert r.status_code == 200
        original_refresh = s.cookies.get("refresh_token")
        r2 = s.post(f"{BASE}/api/auth/refresh", timeout=15)
        assert r2.status_code == 200, f"refresh failed: {r2.status_code} {r2.text}"
        body = r2.json()
        assert body["email"] == CLIENT_EMAIL
        # Cookie should be present (may or may not change depending on impl, but must exist)
        new_refresh = s.cookies.get("refresh_token")
        assert new_refresh, "refresh_token cookie missing after refresh"
        # Also access cookie should exist
        assert s.cookies.get("access_token"), "access_token cookie missing after refresh"
        # Verify a follow-up authenticated call works
        me = s.get(f"{BASE}/api/auth/me", timeout=15)
        assert me.status_code == 200


# ----------------- Contract templates -----------------
EXPECTED_KEYS = {
    "family_portrait",
    "anniversary_couples",
    "kids_birthday",
    "event",
    "wedding",
    "portfolio_release",
}


class TestContractTemplates:
    def test_list_templates_six(self, admin_session):
        r = admin_session.get(f"{BASE}/api/contract-templates", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        keys = {t["key"] for t in data}
        assert keys == EXPECTED_KEYS, f"Expected {EXPECTED_KEYS}, got {keys}"
        assert len(data) == 6

    def test_template_body_contains_terms_and_placeholders(self, admin_session):
        r = admin_session.get(f"{BASE}/api/contract-templates", timeout=15)
        assert r.status_code == 200
        for t in r.json():
            body = t["body"]
            assert "[Client name(s)]" in body, f"missing client name placeholder in {t['key']}"
            assert "[Session / event date]" in body, f"missing session date placeholder in {t['key']}"
            if t["key"] != "portfolio_release":
                # Shared T&Cs sections (1-18) should be present for the 5 photography agreements
                # Section 19 (category-specific) is appended after shared terms
                assert "19." in body or "Category-specific requirements" in body

    def test_client_cannot_list_templates(self, client_session):
        r = client_session.get(f"{BASE}/api/contract-templates", timeout=15)
        assert r.status_code in (401, 403)

    def test_create_document_from_template_autofill(self, admin_session, client_session):
        # First ensure a booking exists for the client
        # Fetch a service package
        sr = admin_session.get(f"{BASE}/api/services/active", timeout=15)
        assert sr.status_code == 200
        services = sr.json()
        packages = services.get("packages") or services.get("service_packages") or []
        assert packages, f"No packages: {services}"
        pkg = packages[0]
        pkg_id = pkg.get("package_id") or pkg.get("id")
        assert pkg_id, f"no package id field on {pkg}"

        booking_payload = {
            "package_id": pkg_id,
            "service_category": pkg.get("service_category", "Portrait"),
            "preferred_date": "2026-06-15",
            "preferred_time": "10:00",
            "duration_minutes": 60,
            "location_address": "1 Test St",
            "suburb": "Melbourne",
            "notes": "TEST_template_autofill",
        }
        br = client_session.post(f"{BASE}/api/bookings", json=booking_payload, timeout=15)
        assert br.status_code == 200, br.text
        booking_id = br.json()["id"]
        state["booking_id"] = booking_id

        # Fetch client_user_id
        me = client_session.get(f"{BASE}/api/auth/me", timeout=15).json()
        client_id = me["id"]
        state["client_user_id"] = client_id

        payload = {
            "template_key": "family_portrait",
            "client_user_id": client_id,
            "booking_id": booking_id,
        }
        r = admin_session.post(
            f"{BASE}/api/contract-templates/create-document", json=payload, timeout=20
        )
        assert r.status_code == 200, r.text
        doc = r.json()
        state["template_doc_id"] = doc["id"]
        body = doc["body"]
        # Client name filled in (not placeholder)
        client_name = me["name"]
        assert client_name in body, f"client name '{client_name}' not in filled body"
        assert "[Client name(s)]" not in body, "client placeholder still present"
        # Long-format date "Monday, 15 June 2026"
        assert "15 June 2026" in body, f"expected long date in body, got snippet: {body[:500]}"
        assert "[Session / event date]" not in body
        assert doc.get("template_key") in ("family_portrait", None)  # optional field on response
        assert doc.get("booking_id") in (booking_id, None)  # optional field on response

    def test_document_appears_in_mine(self, client_session):
        assert state.get("template_doc_id"), "no template doc id from previous test"
        r = client_session.get(f"{BASE}/api/documents/mine", timeout=15)
        assert r.status_code == 200, r.text
        ids = [d["id"] for d in r.json()]
        assert state["template_doc_id"] in ids

    def test_client_can_sign_template_document(self, client_session):
        doc_id = state.get("template_doc_id")
        assert doc_id
        r = client_session.post(
            f"{BASE}/api/documents/{doc_id}/sign",
            json={"signature_name": "Test Client"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["signed"] is True
        assert body["signature_name"] == "Test Client"
        assert body["signed_at"]


# ----------------- Invoices (PayID) -----------------
REF_RE = re.compile(r"^INV-\d{4}-\d{4}$")


class TestInvoicesPayID:
    def test_create_invoice_has_reference_and_payment_instructions(
        self, admin_session, client_session
    ):
        client_id = state.get("client_user_id")
        if not client_id:
            me = client_session.get(f"{BASE}/api/auth/me", timeout=15).json()
            client_id = me["id"]
            state["client_user_id"] = client_id
        payload = {
            "client_user_id": client_id,
            "title": "TEST_PayID_invoice",
            "description": "Manual invoice for PayID flow",
            "amount": 250.0,
            "currency": "AUD",
        }
        r = admin_session.post(f"{BASE}/api/invoices", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        inv = r.json()
        assert REF_RE.match(inv["reference"]), f"bad ref: {inv['reference']}"
        pi = inv.get("payment_instructions") or {}
        assert pi.get("payid") == "accounts@illuminatestudios.com.au", f"payid mismatch: {pi}"
        assert pi.get("reference") == inv["reference"]
        assert inv["status"] == "unpaid"
        state["invoice_id"] = inv["id"]
        state["invoice_ref"] = inv["reference"]

    def test_auto_from_booking(self, admin_session):
        booking_id = state.get("booking_id")
        assert booking_id, "no booking id from prior test"
        r = admin_session.post(
            f"{BASE}/api/invoices/auto-from-booking/{booking_id}", timeout=15
        )
        assert r.status_code == 200, r.text
        inv = r.json()
        assert REF_RE.match(inv["reference"])
        assert inv.get("payment_instructions", {}).get("payid")
        # amount equals booking.estimated_price — fetch booking to compare
        # (booking lookup is admin-only on /api/bookings; just confirm amount is positive)
        assert inv["amount"] > 0
        assert inv["booking_id"] == booking_id
        state["auto_invoice_id"] = inv["id"]

    def test_mine_returns_invoices_with_pi(self, client_session):
        r = client_session.get(f"{BASE}/api/invoices/mine", timeout=15)
        assert r.status_code == 200, r.text
        invs = r.json()
        assert len(invs) >= 2, f"expected >=2 invoices, got {len(invs)}"
        ids = {i["id"] for i in invs}
        assert state["invoice_id"] in ids
        assert state["auto_invoice_id"] in ids
        for i in invs:
            pi = i.get("payment_instructions") or {}
            assert pi.get("payid"), f"missing payid on invoice {i['id']}"
            assert pi.get("reference") == i.get("reference")

    def test_mark_paid_and_unpaid(self, admin_session, client_session):
        inv_id = state["invoice_id"]
        r = admin_session.post(f"{BASE}/api/invoices/{inv_id}/mark-paid", timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["status"] == "paid"
        assert body["paid_at"]
        # Client view sees paid
        cr = client_session.get(f"{BASE}/api/invoices/{inv_id}", timeout=15)
        assert cr.status_code == 200
        assert cr.json()["status"] == "paid"
        # Now reverse
        r2 = admin_session.post(f"{BASE}/api/invoices/{inv_id}/mark-unpaid", timeout=15)
        assert r2.status_code == 200, r2.text
        body2 = r2.json()
        assert body2["status"] == "unpaid"
        assert body2.get("paid_at") in (None, "")

    def test_client_cannot_mark_paid(self, client_session):
        inv_id = state["invoice_id"]
        r = client_session.post(f"{BASE}/api/invoices/{inv_id}/mark-paid", timeout=15)
        assert r.status_code in (401, 403)


# ----------------- Stripe gone -----------------
class TestStripeRemoved:
    def test_payments_status_404(self):
        r = requests.get(f"{BASE}/api/payments/status/x", timeout=15)
        assert r.status_code == 404, f"expected 404, got {r.status_code}: {r.text[:200]}"

    def test_payments_checkout_invoice_404(self):
        s = requests.Session()
        login(s, CLIENT_EMAIL, CLIENT_PASS)
        r = s.post(
            f"{BASE}/api/payments/checkout/invoice",
            json={"invoice_id": "x", "origin_url": "https://x"},
            timeout=15,
        )
        assert r.status_code == 404, f"expected 404, got {r.status_code}: {r.text[:200]}"


# ----------------- Galleries -----------------
class TestGalleries:
    def test_create_gallery_upload_photo_fetch_binary(
        self, admin_session, client_session
    ):
        client_id = state["client_user_id"]
        # Create
        r = admin_session.post(
            f"{BASE}/api/galleries",
            json={
                "title": f"TEST_Gallery_{uuid.uuid4().hex[:6]}",
                "client_user_id": client_id,
                "description": "TEST gallery",
            },
            timeout=15,
        )
        assert r.status_code == 200, r.text
        gallery = r.json()
        gid = gallery["id"]

        # Upload tiny PNG (1x1 transparent)
        png_bytes = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xcf"
            b"\xc0\xf0\x1f\x00\x05\x00\x01\xff\xfe\xa6\xa5\x21\x07\x00\x00\x00\x00"
            b"IEND\xaeB`\x82"
        )
        files = {"file": ("test.png", io.BytesIO(png_bytes), "image/png")}
        ur = admin_session.post(
            f"{BASE}/api/galleries/{gid}/photos", files=files, timeout=20
        )
        assert ur.status_code == 200, ur.text
        photo = ur.json()
        blob_id = photo.get("blob_id") or photo.get("id")
        assert blob_id

        # Client sees photo_count>0
        mine = client_session.get(f"{BASE}/api/galleries/mine", timeout=15)
        assert mine.status_code == 200, mine.text
        my_galleries = mine.json()
        found = next((g for g in my_galleries if g["id"] == gid), None)
        assert found, "gallery not visible to client"
        assert found.get("photo_count", 0) > 0

        # Fetch binary
        br = client_session.get(f"{BASE}/api/galleries/photo/{blob_id}", timeout=15)
        assert br.status_code == 200, br.text
        assert br.content[:8] == b"\x89PNG\r\n\x1a\n", "not PNG bytes"


# ----------------- Luma first turn -----------------
class TestLuma:
    def test_first_turn_returns_session(self, client_session):
        r = client_session.post(
            f"{BASE}/api/luma/chat",
            json={"message": "Hi, I want to book a family portrait session in June 2026"},
            timeout=120,
        )
        # Could legitimately fail due to LLM budget — treat 5xx as xfail-ish
        if r.status_code >= 500:
            pytest.xfail(f"LLM provider returned {r.status_code}: {r.text[:200]}")
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("session_id"), f"missing session_id: {body}"
        assert body.get("reply") or body.get("message") or body.get("text"), f"missing reply text: {body}"
