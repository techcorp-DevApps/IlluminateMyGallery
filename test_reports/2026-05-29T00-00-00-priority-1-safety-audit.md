# Priority 1 — Structural Safety Audit (Backend)

Date: 2026-05-29 (UTC)
Repository: `IlluminateMyGallery`
Scope: Full read of `backend/` source. **Findings only — no fixes applied.**
Authority: Task 2 FINAL handoff brief, build sequence §10 (P1 → P2 → P3 → P4).

## Method

Read every backend source file: `server.py`, `auth.py`, `db.py`, `models.py`,
`seed.py`, `storage.py`, `email_service.py`, all 10 routers under `routes/`, and
the `luma/` agent + tools + system prompt. Enumerated every HTTP endpoint and the
exact server-side guard on each. Confirmed there are no dependency guards other
than `get_current_user` and `get_current_admin` (grep verified).

The brief framed this audit around three questions:
- (a) Admin/editor routes protected only by frontend guards (no backend check)?
- (b) Client-side-only authorization assumptions?
- (c) Hardcoded roles or permissions?

Each is answered below, followed by the full severity-ranked finding list.

---

## Direct answers to the three audit questions

### (a) Admin routes protected only by frontend guards — **NONE FOUND**

Every state-changing admin endpoint enforces `Depends(get_current_admin)`
server-side, which loads the user from the DB and asserts `role == "admin"`.
Verified across all routers:

- `admin_routes`: all 6 endpoints gated.
- `galleries_routes`: create / patch / upload / delete-photo / delete / list-all gated.
- `bookings_routes`: `/admin` create, list-all, `PATCH /status` gated.
- `invoices_routes`: create, list-all, mark-paid, mark-unpaid, auto-from-booking gated.
- `documents_routes`: create, list-all gated.
- `services_routes`: package/addon create/update/delete gated.
- `portfolio_routes`: create/delete gated.
- `contract_templates_routes`: list + create-document gated.

This is the headline good news: **there is no admin action that relies on the
frontend hiding a button.** The server is the gate everywhere.

### (b) Client-side-only authorization assumptions — **ESSENTIALLY NONE, one by-design exception**

Every client-scoped read/write validates the session server-side
(`get_current_user`) **and** performs an explicit ownership check before
returning or mutating another user's data:

- `GET /bookings/{id}`, `GET /galleries/{id}`, `GET /documents/{id}`,
  `GET /invoices/{id}` — all assert `role == "admin" OR resource.owner == user.id`.
- `POST /documents/{id}/sign` — asserts `doc.client_user_id == user.id`.
- `GET /galleries/photo/{blob_id}` and `/download` — re-query the gallery scoped
  to `client_user_id == user.id` (and `allow_downloads` for download), so a client
  cannot read another client's blob by guessing its id.

Intentionally public endpoints (correct by design): `GET /portfolio`,
`GET /services/active`, `POST /auth/{register,login,refresh}`.

The one exception is **`POST /api/luma/chat`**, which is fully unauthenticated yet
performs DB writes through its tools (see H2). That is by design (prospective
clients chat before they have an account) but it is the single most abusable
surface in the backend.

### (c) Hardcoded roles / permissions — **YES (see M1) + a seeded credential (H1)**

Authorization is a binary `admin` vs `user` string compare in a single function
(`get_current_admin`). The brief's documented role taxonomy
(owner / admin / editor / client) is **not implemented** — there is no `owner`
and no `editor`. Role strings are scattered as literals across routes and seed.

---

## Findings (severity-ranked)

### HIGH

**H1 — Seeded test client with hardcoded credentials runs in every environment.**
`seed.py:40` `seed_test_user()` unconditionally creates
`client@example.com` / `client123` (a known, source-visible email+password) on
every startup via the lifespan `run_seed()` (`server.py:40`). Anyone reading the
repo can log in as a real client account in production. There is no environment
gate. → Must be restricted to non-prod, or removed.

**H2 — Unauthenticated `/api/luma/chat` performs database writes with no rate limit.**
`luma_routes.py:19` → `luma/agent.py:chat_step`. Via tools it can:
- create `users` lead records (`tool_create_booking`, `agent.py:134`) with
  `role:"user"`, `password_hash:""`, attacker-chosen email/name/phone;
- create `bookings` and fire admin notification emails;
- create `luma_sessions` / `luma_handoffs`.

Consequences:
1. **Registration lockout / email pre-emption.** `users.email` is a unique index
   (`seed.py:167`) and `/auth/register` rejects any existing email
   (`auth_routes.py:32`). A Luma-created lead at `victim@example.com` therefore
   **blocks the real owner from ever registering**, and there is no flow to claim a
   passwordless lead account / set its password.
2. **Unbounded cost / DoS.** Each call invokes the OpenAI model (litellm) with no
   auth, captcha, or rate limit → unbounded LLM spend and booking/email spam.

Note (positive): Luma never makes an authorization decision and can only create
`pending`, `role:"user"` records — blast radius is spam/lockout, **not** privilege
escalation. The brief's "Luma does not decide authorization" rule is respected.

**H3 — Refresh tokens are stateless, unrevocable, and not stored/hashed at rest.**
`auth.py` issues refresh JWTs (7d) that are never persisted. `logout`
(`auth_routes.py:62`) only clears the cookie client-side. There is no server-side
store, blacklist, or rotation-with-revocation, so a stolen access (60m) or refresh
(7d) token stays valid until natural expiry — logout cannot stop it. `/auth/refresh`
mints a new refresh token but the old one still validates (rotation gives no
security benefit without a store). This diverges from the brief's mandate:
"refresh … bcrypt-hashed, rotated; all tokens hashed at rest."

### MEDIUM

**M1 — Binary, hardcoded role model; documented owner/editor/client roles unimplemented.**
The only role gate is `get_current_admin` (`auth.py:100`): `role != "admin"`.
Role literals `"admin"` / `"user"` are hardcoded in routes, `seed.py`, and Luma.
There is no `owner`, no `editor`, no central permission map / enum. A future
`editor` would be silently treated as an unprivileged client by every endpoint.
Relevant for P2: the auth rebuild needs a real role enum + role-aware dependency
(e.g. `require_roles(...)`).

**M2 — No rate limiting on authentication endpoints.**
`/auth/login`, `/auth/register`, `/auth/refresh`, and `/luma/chat` have no
throttling → credential stuffing / brute force / enumeration / cost abuse.

**M3 — Admin auth cookies use `SameSite=None` with no CSRF defense.**
`set_auth_cookies` (`auth.py:54`) sets `samesite="none"` on `access_token` and
`refresh_token`. There is no CSRF token. State-changing endpoints rely solely on
the JSON-content-type preflight + restricted CORS origins as incidental mitigation.
The brief mandates `SameSite=Strict` for the gallery media token; the admin session
cookies should be hardened in the same direction during P2.

**M4 — Account enumeration via `/auth/register`.**
`auth_routes.py:33` returns `400 "Email already registered"`, revealing which
emails have accounts. (`/login` correctly returns a generic error.) Combined with
H2, this enables targeted lockout.

**M5 — Backend streams image bytes (architecture violation).**
`GET /galleries/photo/{blob_id}` and `/photo/{blob_id}/download`
(`galleries_routes.py:158,178`) read the blob via the storage adapter and return
the raw bytes through FastAPI. Auth on these routes is correct, but this violates
the non-negotiable "backend never streams image bytes" rule and is the exact path
Priority 4 (Worker-gated delivery + presigned download) replaces. Flagged here as
structural debt, not an auth gap.

### LOW / informational

- **L1 — Storage silently falls back to inline-Mongo base64** when `S3_BUCKET`
  is unset (`storage.py:159`). In prod this would store 25–40MB originals as
  base64 inside MongoDB. Operational risk, not auth.
- **L2 — `ACCESS_TTL` is 60 min** (`auth.py:15`) vs the brief's 8h admin access.
  Shorter is safer; noted only as a divergence to reconcile in P2.
- **L3 — `seed_admin` re-applies `ADMIN_PASSWORD` from env on every boot**
  (`seed.py:34`), overwriting any out-of-band password rotation. Operational.
- **L4 — `PATCH /bookings/{id}/status` takes `status` as a query param** and writes
  with no audit-trail entry (`bookings_routes.py:94`). Minor; relevant once an
  audit log exists.

---

## Positives confirmed (defenses already in place)

These are working today and should be **preserved** through the P2 rebuild:

1. Every admin route enforces `get_current_admin` server-side (no frontend-only gates).
2. Every client route validates the session server-side and checks resource ownership.
3. **Authorization uses the DB role, not the JWT claim.** `get_current_user`
   reloads the user from MongoDB and the role check reads that fresh value
   (`auth.py:94,101`), so a stale/forged token role cannot escalate.
4. **No self-service role mutation.** `register`, admin `create_client`, and Luma
   all hardcode `role:"user"`; `update_client` (`admin_routes.py:60`) updates only
   name/email/phone/notes — never `role`. There is no `PATCH /me`. This satisfies
   the brief's "no endpoint lets a user modify their own role."
5. JWT decode pins `algorithms=["HS256"]` (`auth.py:72`) — no `alg:none` / alg
   confusion. Secret sourced from env (`JWT_SECRET`), never hardcoded.
6. `password_hash` is projected out of every user read (`{"password_hash": 0}`)
   and stripped by `_public_user` / `UserOut`.
7. Pydantic patch models bound updatable fields (e.g. `GalleryPatchIn`) — no mass
   assignment of arbitrary keys.
8. Passwords hashed with bcrypt + per-password salt (`auth.py:23`).
9. CORS correctly disables `allow_credentials` when origins are wildcard
   (`server.py:100`), avoiding the credentialed-wildcard footgun.

---

## Handoff to Priority 2 (auth) — what this audit implies, no code written

In priority order, the P2 auth work should:
1. Gate or remove the seeded test client (H1).
2. Add an authenticated/throttled boundary around Luma writes — captcha or rate
   limit + a lead-claim flow so a passwordless lead email can be registered (H2, M4).
3. Introduce a server-side token/session store enabling revocation + true refresh
   rotation, with tokens hashed at rest (H3).
4. Replace the binary role check with a role enum (owner/admin/editor/client) and a
   role-aware dependency (M1).
5. Add rate limiting to all auth endpoints (M2) and harden session-cookie SameSite
   + add CSRF defense (M3).

P4 (gallery delivery) will retire the byte-streaming photo routes (M5).

**End of Priority 1 audit. No remediation code was written, per instruction.**
