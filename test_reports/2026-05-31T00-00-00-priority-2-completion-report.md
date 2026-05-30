# Priority 2 — Auth Foundation: Completion Report

Date: 2026-05-31 (UTC)
Repository: `IlluminateMyGallery`
Branch: `storage/task-2-atlas-r2`
Authority: Task 2 FINAL handoff brief §4/§6 + Priority 1 safety audit (findings H2/M2).
Scope: finish the remaining Priority 2 (auth foundation) items only. Priority 3 not started.

## Starting state

The bulk of Priority 2 was already built and committed (`1e61164`): roles taxonomy,
hashed/rotating refresh tokens, client sessions, magic-link, staff-invite, and
gallery-claim flows (`auth.py`, `token_store.py`, `security/`, `routes/auth_routes.py`,
`routes/staff_routes.py`, `seed.py`). This session verified each of those and finished
the four items that remained, then added a test suite.

## Work completed

### 1. `routes/galleries_routes.py` — role-aware authz + token endpoints
- Switched all six gallery **management** routes (create, list-all, patch, upload,
  delete-photo, delete) from `get_current_admin` → `require_staff`, so the documented
  `editor` role ("galleries and bookings only") can manage galleries. `owner`/`admin`
  continue to pass.
- Replaced the binary `role != "admin"` ownership checks in `get_gallery`,
  `get_photo`, and `download_photo` with `is_staff(user["role"])`. The old check
  silently locked out `owner`/`editor` and ignored the role taxonomy entirely.
- **Task 8** — `POST /{gallery_id}/access-token` (staff only): mints a 14-day,
  hashed-at-rest gallery access token via `issue_gallery_token`, returns the raw
  token once, and optionally emails it to the gallery's client
  (`email_gallery_access_to_client`). Returns 400 if `send_email` is requested but
  the gallery has no client email. Redeemed at the existing `/api/auth/gallery/claim`.
- **Task 9** — `POST /{gallery_id}/media-token`: issues the short-lived (4h) HMAC
  media token the Cloudflare Worker validates (`generate_gallery_media_token`) and
  sets it as the `SameSite=Strict` `gallery_token` cookie. Authz mirrors the photo
  routes: staff for any gallery, otherwise the assigned client.

### 2. `server.py` — router registration
- Imported and registered `staff_router` (it was implemented but never mounted, so
  `/api/staff/*` returned 404). `auth_router` was already registered — confirmed.

### 3. `email_service.py` — senders
- Verified, no change needed: `email_magic_link_to_client`, `email_staff_invite`,
  and `email_gallery_access_to_client` are all present and wired to their routes.

### 4. `routes/luma_routes.py` — H2/M2 hardening of `POST /api/luma/chat`
The endpoint stays intentionally unauthenticated (prospective clients chat before
they have an account) but is now gated on two axes:
- **Per-IP rate limit** (M2): 30 messages/min/IP for every call, plus a stricter
  8 new-conversations/5min/IP gate on calls with no `session_id` (each new
  conversation can create a lead user + booking and fire an admin email — H2).
- **Per-session gate** (H2): 40 turns/hour keyed on `session_id`, bounding the LLM
  spend and tool-writes any single conversation can drive, independent of IP.
- Added `enforce_key(key, *, limit, window)` to `security/rate_limit.py` to throttle
  on a non-IP dimension (the session id); `enforce` now delegates to it.

### Latent bug found and fixed — auth rate limiting was entirely broken (M2 regression)
While writing route tests, every rate-limited endpoint (all of `auth_routes` and
`staff_routes`) returned **HTTP 422** instead of working:

```
{"detail":[{"type":"missing","loc":["query","request"],"msg":"Field required"}]}
```

Root cause: `security/rate_limit.py` used `from __future__ import annotations`.
`RateLimit` is consumed as a **class-instance** FastAPI dependency
(`Depends(RateLimit(...))`). FastAPI does not resolve stringized annotations on a
callable instance's `__call__`, so `request: Request` was mis-read as a required
query parameter and validation failed before the handler ran. (A plain function
dependency such as `get_current_user` resolves fine, which is why the bug was not
obvious.) This means **login, register, refresh, logout, magic-link, staff invite,
and staff accept were all returning 422 in the committed code.**

Fix: removed the future-annotations import from `security/rate_limit.py` (the only
module where it caused this) so the annotations are live. A comment documents why.
All other annotations in that module evaluate fine without it. This is the minimal,
surgical fix and matches how the working route modules are written.

## Tests

New suite: `backend/tests/test_priority2_auth.py` (+ `backend/tests/conftest.py`).
Runs fully in-process — no live server, no real MongoDB, no LLM:
- `mongomock_motor` backs the lazy `db` proxy (swap module-global `_db`).
- `litellm` is stubbed in `sys.modules` so the Luma router imports; the chat route's
  try/except drives the fallback path, and the rate-limit/session-gate logic (which
  runs first) is what the Luma tests assert.
- The process-global rate limiter is reset before every test.
- `conftest.collect_ignore` skips the pre-existing live-deployment integration suites
  (`backend_test.py`, `test_iteration3.py`) when `/app/frontend/.env` is absent, so
  they no longer error at collection in a local checkout.

Coverage (45 tests, all passing):
- **Unit**: `security.tokens` (peppered hash determinism, verify, refresh
  split/verify), `gallery_media` (sign/verify roundtrip, gallery-membership,
  tamper/expiry/malformed rejection), `security.rate_limit` (window behaviour,
  `enforce_key` 429 + Retry-After), `roles` (staff/owner/client predicates + legacy
  `"user"` alias).
- **DB (mongomock)**: `token_store` — refresh rotation revokes the old token,
  client-session lifecycle, magic-link/staff-invite single-use, gallery-token
  claim+revoke.
- **Routes**: register/login/me, enumeration-safe magic-link request, magic-link
  consume issues a session, gallery claim provisions a session; staff invite is
  owner-only (admin/editor/client → 403) and accept creates the role; gallery
  `require_staff` (editor manages, client 403, legacy `"user"` 403), ownership on
  `GET /{id}` (owner-client 200, other 403, staff 200); access-token endpoint
  (staff issues + hashed at rest, client 403, send_email path, 400 without client
  email, 404 unknown); media-token endpoint (verifiable token + cookie, other-client
  403, staff 200, 404 unknown); Luma per-IP limit, new-conversation gate, and the
  session gate (verified IP-independent), plus distinct-IP isolation.

### How to run
```bash
cd backend
./.venv/bin/python -m pytest tests/test_priority2_auth.py -q
# → 45 passed
```

## Import / assembly verification
- `py_compile` clean across all backend modules.
- The full `server.app` was assembled (stubbing only the genuinely prod-only deps
  absent from this test venv — `dotenv` as a no-op loader and a bare `litellm`):
  imports resolve end-to-end, **64 routes**, with `/api/staff/{invite,accept}`,
  `/api/galleries/{id}/access-token`, `/api/galleries/{id}/media-token`, and
  `/api/luma/chat` all present.

Note: this venv is intentionally test-scoped and does **not** include `litellm`,
`boto3`, or `python-dotenv` (all in `requirements.txt`). They are stubbed only for
verification; production installs them normally.

## Not done (out of scope — Priority 3+)
- R2 adapter / presigned upload + download, `gallery_assets` model, derivative worker
  (Priority 3).
- Cloudflare Worker deployment and end-to-end media delivery (Priority 4) — the
  backend media-token issuer is in place; the Worker is a separate artifact.
- CSRF defense for `SameSite=None` admin cookies (audit M3) — explicitly noted in the
  brief as out of Priority 2 scope.

## Files changed
- `backend/routes/galleries_routes.py` (require_staff + ownership + 2 endpoints)
- `backend/server.py` (register `staff_router`)
- `backend/routes/luma_routes.py` (rate-limit + session gate)
- `backend/security/rate_limit.py` (`enforce_key`; removed future-annotations import — bug fix)
- `backend/tests/conftest.py` (new)
- `backend/tests/test_priority2_auth.py` (new)
- `test_reports/2026-05-31T00-00-00-priority-2-completion-report.md` (this file)
