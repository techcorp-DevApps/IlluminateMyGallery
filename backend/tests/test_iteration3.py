"""
Iteration 3 backend tests — galleries (allow_downloads + booking_id + cross-user 403),
services packages CRUD, admin overview, bookings GET by id auth, admin client profile
includes allow_downloads on galleries, and the previously-failing /api/invoices/mine.
"""
from __future__ import annotations

import io
import os
import uuid

import pytest
import requests


def _read_base_url() -> str:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL"):
                return line.split("=", 1)[1].strip().rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL not configured")


BASE = _read_base_url()
ADMIN = {"email": "admin@illuminatestudios.com.au", "password": "Illuminate2026!"}
CLIENT = {"email": "client@example.com", "password": "client123"}

PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xcf"
    b"\xc0\xf0\x1f\x00\x05\x00\x01\xff\xfe\xa6\xa5\x21\x07\x00\x00\x00\x00"
    b"IEND\xaeB`\x82"
)


def _login(creds):
    s = requests.Session()
    r = s.post(f"{BASE}/api/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return s, r.json()


@pytest.fixture(scope="module")
def admin():
    s, _ = _login(ADMIN)
    return s


@pytest.fixture(scope="module")
def client():
    s, me = _login(CLIENT)
    return s, me


# -------- Admin overview --------
class TestOverview:
    def test_overview_returns_counts(self, admin):
        r = admin.get(f"{BASE}/api/admin/overview", timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        for k in ("bookings", "pending_bookings", "approved_bookings",
                  "clients", "galleries", "unpaid_invoices"):
            assert k in body and isinstance(body[k], int), f"missing/bad {k}"


# -------- Services packages CRUD --------
class TestServicesCRUD:
    def test_active_returns_seeded_packages(self, admin):
        r = admin.get(f"{BASE}/api/services/active", timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        pkgs = body.get("packages", [])
        addons = body.get("addons", [])
        assert len(pkgs) >= 5, f"expected >=5 packages, got {len(pkgs)}"
        assert len(addons) >= 4, f"expected >=4 addons, got {len(addons)}"
        for p in pkgs:
            assert p.get("package_id")
            assert p.get("package_name")
            assert p.get("service_category")
            assert "base_price" in p

    def test_create_update_delete_package(self, admin):
        pid = f"test_pkg_{uuid.uuid4().hex[:6]}"
        payload = {
            "package_id": pid,
            "package_name": "TEST_Pkg",
            "service_category": "Portrait",
            "description": "test",
            "duration_minutes": 60,
            "base_price": 199.0,
            "includes": ["test"],
            "is_active": True,
        }
        r = admin.post(f"{BASE}/api/services/packages", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["package_id"] == pid

        # Update
        upd = {**payload, "base_price": 299.0, "package_name": "TEST_Pkg_Updated"}
        r2 = admin.put(f"{BASE}/api/services/packages/{pid}", json=upd, timeout=15)
        assert r2.status_code == 200, r2.text
        assert r2.json()["base_price"] == 299.0
        assert r2.json()["package_name"] == "TEST_Pkg_Updated"

        # Verify via GET
        r3 = admin.get(f"{BASE}/api/services/active", timeout=15)
        found = next((p for p in r3.json()["packages"] if p["package_id"] == pid), None)
        assert found and found["base_price"] == 299.0

        # Delete
        r4 = admin.delete(f"{BASE}/api/services/packages/{pid}", timeout=15)
        assert r4.status_code == 200

    def test_create_addon(self, admin):
        aid = f"test_addon_{uuid.uuid4().hex[:6]}"
        payload = {
            "addon_id": aid,
            "name": "TEST_Addon",
            "price": 50.0,
        }
        r = admin.post(f"{BASE}/api/services/addons", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        admin.delete(f"{BASE}/api/services/addons/{aid}", timeout=15)


# -------- Galleries: allow_downloads + booking_id + cross-user 403 --------
class TestGalleriesIteration3:
    def _create_gallery(self, admin, client_id, booking_id=None, allow=False):
        payload = {
            "title": f"TEST_GalIt3_{uuid.uuid4().hex[:6]}",
            "client_user_id": client_id,
            "description": "iter3",
            "allow_downloads": allow,
        }
        if booking_id:
            payload["booking_id"] = booking_id
        r = admin.post(f"{BASE}/api/galleries", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        return r.json()

    def _upload(self, admin, gid):
        files = {"file": ("t.png", io.BytesIO(PNG), "image/png")}
        r = admin.post(f"{BASE}/api/galleries/{gid}/photos", files=files, timeout=20)
        assert r.status_code == 200, r.text
        return r.json()

    def test_create_with_allow_downloads_and_metadata(self, admin, client):
        _, me = client
        # Get a booking for this client (or create one)
        bs = admin.get(f"{BASE}/api/bookings", timeout=15).json()
        my_bk = next((b for b in bs if b.get("user_id") == me["id"]), None)
        booking_id = my_bk["id"] if my_bk else None

        gal = self._create_gallery(admin, me["id"], booking_id=booking_id, allow=True)
        assert gal["allow_downloads"] is True
        assert gal["client_user_id"] == me["id"]
        assert gal.get("client_name")  # enriched
        if booking_id:
            assert gal["booking_id"] == booking_id
            # package_name & booking_date should populate
            assert gal.get("package_name") or gal.get("booking_date")

    def test_patch_gallery_allow_downloads(self, admin, client):
        _, me = client
        gal = self._create_gallery(admin, me["id"], allow=False)
        gid = gal["id"]
        r = admin.patch(
            f"{BASE}/api/galleries/{gid}",
            json={"allow_downloads": True, "description": "patched"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json()["allow_downloads"] is True
        # Verify via GET
        r2 = admin.get(f"{BASE}/api/galleries/{gid}", timeout=15)
        assert r2.status_code == 200
        assert r2.json()["allow_downloads"] is True

    def test_cross_user_gallery_403(self, admin):
        # Create gallery for client@example.com, attempt to GET it as a different user
        client_session, me = _login(CLIENT)
        gal = self._create_gallery(admin, me["id"], allow=False)
        gid = gal["id"]

        # Create another user (or use admin trying as 'user' — we need a 2nd non-admin user)
        other_email = f"TEST_other_{uuid.uuid4().hex[:6]}@example.com"
        other_pw = "Other123!"
        reg = requests.post(
            f"{BASE}/api/auth/register",
            json={"email": other_email, "password": other_pw, "name": "Other"},
            timeout=15,
        )
        assert reg.status_code in (200, 201), reg.text
        other_s, _ = _login({"email": other_email, "password": other_pw})

        r = other_s.get(f"{BASE}/api/galleries/{gid}", timeout=15)
        assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text}"

        # Also confirm the owning client CAN access it
        r2 = client_session.get(f"{BASE}/api/galleries/{gid}", timeout=15)
        assert r2.status_code == 200

    def test_download_endpoint_gating(self, admin, client):
        client_session, me = client
        # Gallery WITHOUT downloads
        gal_no = self._create_gallery(admin, me["id"], allow=False)
        photo_no = self._upload(admin, gal_no["id"])
        blob_no = photo_no["blob_id"]

        # Client should get 403 on /download
        r = client_session.get(f"{BASE}/api/galleries/photo/{blob_no}/download", timeout=15)
        assert r.status_code == 403, f"expected 403, got {r.status_code}"

        # Client CAN view the preview /photo/{blob_id} (200)
        r2 = client_session.get(f"{BASE}/api/galleries/photo/{blob_no}", timeout=15)
        assert r2.status_code == 200
        assert r2.content[:8] == b"\x89PNG\r\n\x1a\n"

        # Admin can always download
        r3 = admin.get(f"{BASE}/api/galleries/photo/{blob_no}/download", timeout=15)
        assert r3.status_code == 200, r3.text

        # Gallery WITH downloads
        gal_yes = self._create_gallery(admin, me["id"], allow=True)
        photo_yes = self._upload(admin, gal_yes["id"])
        blob_yes = photo_yes["blob_id"]
        r4 = client_session.get(f"{BASE}/api/galleries/photo/{blob_yes}/download", timeout=15)
        assert r4.status_code == 200, r4.text
        # Content-Disposition should be attachment
        cd = r4.headers.get("Content-Disposition", "")
        assert "attachment" in cd.lower()


# -------- Bookings GET by id auth --------
class TestBookingsGetById:
    def test_admin_can_get_any_booking(self, admin):
        bs = admin.get(f"{BASE}/api/bookings", timeout=15).json()
        if not bs:
            pytest.skip("no bookings to test")
        bid = bs[0]["id"]
        r = admin.get(f"{BASE}/api/bookings/{bid}", timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["id"] == bid

    def test_client_can_get_own_booking(self, client):
        client_session, _ = client
        bs = client_session.get(f"{BASE}/api/bookings/mine", timeout=15).json()
        if not bs:
            pytest.skip("client has no bookings")
        bid = bs[0]["id"]
        r = client_session.get(f"{BASE}/api/bookings/{bid}", timeout=15)
        assert r.status_code == 200, r.text

    def test_client_cannot_get_others_booking(self, admin, client):
        # Find a booking that doesn't belong to client
        client_session, me = client
        bs = admin.get(f"{BASE}/api/bookings", timeout=15).json()
        others = [b for b in bs if b.get("user_id") != me["id"]]
        if not others:
            pytest.skip("no other-user bookings to test")
        r = client_session.get(f"{BASE}/api/bookings/{others[0]['id']}", timeout=15)
        assert r.status_code == 403, f"expected 403, got {r.status_code}"


# -------- Admin client profile includes allow_downloads on galleries --------
class TestAdminClientProfile:
    def test_profile_galleries_include_allow_downloads(self, admin, client):
        _, me = client
        r = admin.get(f"{BASE}/api/admin/clients/{me['id']}", timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        gals = body.get("galleries", [])
        assert isinstance(gals, list)
        # At least one (created above)
        if gals:
            for g in gals:
                assert "allow_downloads" in g
                assert "photo_count" in g


# -------- /api/invoices/mine (was failing in iteration 2) --------
class TestInvoicesMine:
    def test_client_mine_returns_200(self, client):
        client_session, _ = client
        r = client_session.get(f"{BASE}/api/invoices/mine", timeout=15)
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text[:400]}"
        invs = r.json()
        assert isinstance(invs, list)
        for inv in invs:
            # Reference may be optional or backfilled; ensure either field exists or is None
            assert "reference" in inv
