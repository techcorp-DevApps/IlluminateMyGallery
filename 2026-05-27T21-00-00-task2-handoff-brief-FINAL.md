---
title: "IlluminateMyGallery — Task 2 Handoff Brief FINAL"
project: illuminate-my-gallery
repo: git@github.com:techcorp-DevApps/IlluminateMyGallery.git
branch_target: storage/task-2-atlas-r2
prepared: 2026-05-27
status: ALL DECISIONS CLOSED — READY TO BUILD
supersedes: task2-handoff-brief.md, task2-handoff-brief-v2.md
---

# IlluminateMyGallery — Task 2 Handoff Brief (FINAL)

**For:** Claude Code session building Task 2 — MongoDB Atlas + Cloudflare R2 + Auth.
**This document is the single source of truth for this build.**
**First action: update `.automate-dev/DECISION-RECORD.md §5` with this brief before
touching any code.**

---

## 0. Session start checklist

```bash
kstart                                               # postgres + ssh key
cd ~/kingdom/projects/illuminate-my-gallery
git pull --ff-only origin main                       # mandatory — two-sided repo
git branch                                           # expect: main only
git status                                           # expect: clean
npm run build --prefix frontend                      # expect: green, 2958 modules
```

If `git pull` refuses to fast-forward: **STOP. Do not force. Reconcile manually.**

---

## 1. What is already done — do not revisit

### Task 1 — Design-system alignment Phase 1 + Phase 2 ✓

Merged to `main`. Branch `ds/phase-1-tokens-and-primitives` deleted.

- **Phase 1 tokens** (`tailwind.config.js` + `index.css`): `letterSpacing` caps/
  caps-wide/caps-cta, `maxWidth.shell: "1400px"`, `@layer components` utilities
  (`.container-shell`, `.label-caps`, `.btn-editorial-*`).
- **Phase 2 primitives** (additive): `Button` editorial variants, `SectionShell`,
  `SectionLabel`, `StatusPill`, `PageHeadingBlock`.

Build verified green: 2958 modules, no regressions.

### Backend hardening ✓

Lazy DB, lifespan/non-fatal seed, CORS hardening, Luma vendor-neutralisation,
requirements split prod/dev.

---

## 2. Application context

**Illuminate Studios** — professional photography studio.
**Application name** — IlluminateMyGallery.

This platform must be treated as a **high-resolution burst-access gallery platform**.
The defining load case:

```
300 parents open a 1,000-image childcare gallery within 30 minutes of publish.
~75 GB of optimised media transfer in 30 minutes.
This load cannot touch the Railway backend.
```

### Non-negotiable architecture rule

```
MongoDB  → stores metadata only
R2       → stores image objects only
Cloudflare Worker + edge cache → serves gallery media
Backend  → authorizes, signs, paginates, audits
Backend  → does NOT stream image bytes. Ever.
```

### Correct scale targets

| Dimension | Value |
|---|---|
| Full-resolution image size | 25–40 MB (Canon EOS R2 workflow) |
| Images per gallery | 300–1,000 typical; up to 2,000 school/event |
| Burst concurrency target | 500 concurrent viewers (min); 1,000 hardening |
| Monthly R2 growth | 100–850 GB (production range) |
| 12-month R2 storage | 1.2–10 TB |
| MongoDB asset docs/year | 50k–1.5M (launch → production) |

---

## 3. Image pipeline — all decisions closed

### Three variants per original. No watermarking.

| Variant | File | Size | Bucket | Delivery | Used for |
|---|---|---|---|---|---|
| Thumbnail | `thumb-v{n}.webp` | 100–250 KB | `illuminate-prod-derivatives` | Cloudflare Worker + CDN | Gallery grid |
| Preview | `preview-v{n}.webp` | 2–5 MB | `illuminate-prod-derivatives` | Cloudflare Worker + CDN | Lightbox / in-app view |
| Original | `original.jpg` | 25–40 MB | `illuminate-prod-originals` | Backend-issued 60s presigned URL | Paid authorized download only |

**Originals are never referenced in any `<img src>` attribute.** The only path to an
original is a validated download authorization + backend-issued presigned URL.

### Object key structure (versioned)

```
prod/galleries/{gallery_id}/assets/{asset_id}/thumb-v1.webp
prod/galleries/{gallery_id}/assets/{asset_id}/preview-v1.webp
prod/galleries/{gallery_id}/assets/{asset_id}/original.jpg
```

Increment version on regeneration (e.g. `thumb-v2.webp`). Never overwrite existing
derivative keys — the CDN will serve stale content from cache.

### Two buckets — both private at R2 level

| Bucket env var | Bucket name | Contents | Access model |
|---|---|---|---|
| `R2_BUCKET_DERIVATIVES` | `illuminate-prod-derivatives` | Thumbnails, previews | Cloudflare Worker only (see §4) |
| `R2_BUCKET_ORIGINALS` | `illuminate-prod-originals` | Originals | Backend presigned URLs only |

**Neither bucket has R2 public access enabled.** There is no `r2.dev` subdomain.
The R2 management console "Allow Public Access" toggle remains OFF for both buckets.

Staging mirrors: `illuminate-staging-derivatives`, `illuminate-staging-originals`.

### Asset processing states

```
created → uploading → uploaded → processing → ready → failed → archived → deleted
```

### Upload pipeline — direct to R2, derivatives async

```
Admin triggers upload
 → Backend: assert role (owner/admin/editor)
            create gallery_asset (status: created)
            generate presigned R2 PUT URL for originals bucket
            return presigned URL to client

 → Client:  PUT directly to R2 originals bucket (never through backend)

 → Client:  POST /api/galleries/{id}/assets/{id}/confirm to backend

 → Backend: verify object exists in R2
            enqueue derivative job (status: processing)

 → Worker*: generate thumb-v1.webp + preview-v1.webp via Pillow
            PUT derivatives to derivatives bucket
            update gallery_asset: status → ready, r2 keys recorded

 → Admin UI: processing → ready state visible
```

\* Background worker process (Railway worker service or async task queue).
Derivative generation is **never** in the HTTP request cycle — 40 MB files will
time out a Railway dyno if processed synchronously.

---

## 4. CDN delivery — Cloudflare Worker-gated private bucket

**Both buckets are private. CDN delivery is gated by a Cloudflare Worker on the
custom domain. No public R2 access is required or used.**

### Why Worker-gated (not a public bucket)

Gallery images are client-personal content. Even derivatives (thumbnails, previews)
must only be accessible to users with a valid gallery session. A public bucket means
cached URLs are permanently accessible to anyone who obtains them — no revocation.
The Worker model allows instant gallery revocation and matches the studio's security
posture for childcare and school content.

### How it works

```
Client requests:
  GET https://media.illuminatestudios.com.au/prod/galleries/{gal_id}/assets/{id}/thumb-v1.webp
  Cookie: gallery_token={signed_gallery_jwt}

Cloudflare Worker on media.illuminatestudios.com.au:
  1. Extract gallery_token cookie
  2. Verify HMAC-SHA256 signature using CLOUDFLARE_WORKER_SHARED_SECRET
  3. Check token not expired
  4. Check gallery_id in URL path is in token's authorized gallery_ids list
  5. If valid:
       fetch object from R2 derivatives bucket using Worker R2 binding
       return response with Cache-Control: public, max-age=31536000, immutable
  6. If invalid: return 403

After first valid request:
  Cloudflare edge caches the response.
  Subsequent requests for the same URL served from edge cache —
  Worker is not re-invoked. No R2 read. No backend call.
```

### Gallery access JWT (media token — separate from main session)

The backend issues a short-lived signed token when a client loads a gallery page.
This token is used by the Worker only — it is not the main client session token.

```python
# Backend generates on gallery page load
import hmac, hashlib, json, base64, time

def generate_gallery_media_token(gallery_ids: list[str], client_id: str) -> str:
    payload = {
        "gallery_ids": gallery_ids,
        "client_id": client_id,
        "exp": int(time.time()) + 14400,   # 4-hour TTL
        "iat": int(time.time()),
    }
    encoded = base64.urlsafe_b64encode(
        json.dumps(payload).encode()
    ).decode().rstrip("=")
    sig = hmac.new(
        CLOUDFLARE_WORKER_SHARED_SECRET.encode(),
        encoded.encode(),
        hashlib.sha256
    ).hexdigest()
    return f"{encoded}.{sig}"
```

Token is set as an **HttpOnly, Secure, SameSite=Strict** cookie named `gallery_token`
on the frontend domain. Not accessible to JavaScript.

### Cache model and revocation

- Cache key: URL path only (not the token). Once a derivative is cached at the
  Cloudflare edge, it serves without Worker invocation.
- **Revocation:** revoking the main client session prevents new gallery media tokens
  from being issued. Existing tokens expire within 4 hours. For immediate full CDN
  cache purge (e.g. gallery takedown), call Cloudflare Cache Purge API from backend.
- Gallery archive: backend stops issuing media tokens for archived gallery IDs.
  Derivatives remain in R2 (archival); they just become unreachable.

### Cache headers for derivatives

```http
# Thumbnails and previews (versioned keys — immutable once generated)
Cache-Control: public, max-age=31536000, immutable
```

---

## 5. Image protection — client-side layer

No watermarking. Applied to all non-admin users. All four mechanisms active.
Admin users are fully exempt (`currentUser?.role === 'owner' || 'admin' || 'editor'`).

### 5.1 Download blocker

```js
// Applied to all gallery image elements for non-admin users
img.setAttribute('draggable', 'false')
img.style.userSelect = 'none'
img.style.webkitUserSelect = 'none'
```

```css
/* Global for non-admin gallery surfaces */
.gallery-asset { pointer-events: none; }
```

Transparent `div` overlay absolutely positioned above each image intercepts all
pointer events. The `<img>` never receives right-click or drag.

### 5.2 Context menu disable

```js
document.addEventListener('contextmenu', (e) => {
  if (!isAdminUser()) {
    e.preventDefault()
    e.stopPropagation()
  }
})
```

### 5.3 Long-press / touch callout disable — CSS only, covers iOS + Android

```css
.gallery-image-wrapper,
.gallery-image-wrapper img {
  -webkit-touch-callout: none;   /* iOS: kills "Save Image" / "Copy" sheet */
  -webkit-user-select: none;
  user-select: none;
  touch-action: pan-x pan-y;    /* preserves scroll, suppresses long-press */
}
```

Operates at OS integration layer. No JS required.

### 5.4 Screenshot overlay — desktop keyboard shortcuts only

```js
document.addEventListener('keydown', (e) => {
  if (isAdminUser()) return
  const isMac = e.metaKey && e.shiftKey && ['3','4','5'].includes(e.key)
  const isWin = e.key === 'PrintScreen'
  if (isMac || isWin) {
    const imgs = document.querySelectorAll('.gallery-asset-img')
    imgs.forEach(el => { el.style.opacity = '0' })
    setTimeout(() => imgs.forEach(el => { el.style.opacity = '1' }), 200)
  }
})
```

iOS hardware screenshot (Side + Volume) fires no DOM event. Undetectable by any web
API. Documented as known platform gap — do not attempt workarounds.

---

## 6. Authentication and authorization — all decisions closed

### Role model

| Role | Created by | Capabilities |
|---|---|---|
| `owner` | System bootstrap (setup) | Everything — settings, billing, staff invites, all data |
| `admin` | Owner invite only | Everything except settings, billing, inviting staff |
| `editor` | Owner invite only | Galleries and bookings only |
| `client` | System on gallery token claim | Gallery view, image selections, authorized downloads |

- Role is immutable by the account holder.
- Only `owner` can invite staff or change roles.
- Client accounts created by system only — no self-registration path exists.

### Admin / staff authentication

- Email + password.
- **Access token:** JWT, 8-hour TTL, signed with `JWT_SECRET`.
- **Refresh token:** 7-day TTL, stored as bcrypt hash in `refresh_tokens` collection,
  rotated on each use.
- Staff accounts: created via owner-issued invite only (see §6.4).

### Client authentication — two paths, always available

| Path | Mechanism | Session TTL |
|---|---|---|
| Password | Email + password → session token | 30 days rolling |
| Magic link | Client enters email → 15-min signed token → emailed → click → session | 30 days rolling (new session issued on click) |

Magic link is the permanent zero-friction fallback. No separate password reset flow
required — magic link is the reset. Both paths issue the same 30-day rolling session.

### Client account lifecycle

```
1. Admin publishes gallery
   → System generates gallery access token (14-day TTL, SHA-256 hashed in DB)
   → Admin sends personalised token link to client via email outbox

2. Client clicks link
   → Backend validates token hash, checks expires_at, checks revoked_at
   → If no account exists:
       auto-provision account from booking data (name + email already in system)
       flag: has_password = false, must_set_password = true
   → Gallery attached to client account (gallery_access record)
   → Token: claimed_at recorded
   → Client lands on gallery page, prompted to set password

3. Return visits (either path):
   → Password: email + password → 30-day session
   → Magic link: enter email → 15-min token emailed → click → 30-day session

4. Gallery accessible via login until admin archives it
```

### Staff invite flow

```
Owner selects role (admin or editor) → enters staff email
 → invite record created: {email, role, token_hash (SHA-256), expires_at (7d)}
 → invite email sent via outbox with token link
 → staff clicks → sets password → account created with assigned role
 → invite: accepted_at recorded
```

### Session lengths — all closed

| Session type | TTL |
|---|---|
| Admin JWT access token | 8 hours |
| Admin refresh token | 7 days (rotated on use) |
| Client session | 30 days rolling |
| Gallery access token (initial link) | 14 days |
| Gallery media JWT (Cloudflare Worker) | 4 hours |
| Magic link token | 15 minutes, single-use |
| Staff invite token | 7 days |

### Token storage — all tokens hashed at rest, raw value never stored

| Token | Hash algorithm | Fields stored |
|---|---|---|
| Gallery access token | SHA-256 | `token_hash`, `expires_at`, `claimed_at`, `revoked_at` |
| Magic link | SHA-256 | `token_hash`, `expires_at`, `used_at` |
| JWT refresh | bcrypt | `token_hash`, `expires_at`, `revoked_at` |
| Staff invite | SHA-256 | `token_hash`, `expires_at`, `accepted_at`, `role` |

Raw token is generated, returned once (in URL or email), then discarded server-side.

### Backend enforcement rules — non-negotiable

- Every admin/editor API route: validate JWT + assert role server-side.
- Every client API route: validate session token server-side.
- No endpoint allows a user to modify their own role.
- `admin` and `editor` accounts: owner invite flow only.
- `client` accounts: system auto-provision on token claim only.
- Luma AI does not decide authorization. Backend gates every write.
- Session invalidated on: logout, password change, admin revocation, expiry.

---

## 7. Selections and download authorization

### Workflow

```
Client loads gallery page
 → Backend validates client session
 → Backend issues gallery media JWT (4h TTL, gallery_ids in payload)
 → Frontend receives JWT as HttpOnly cookie (gallery_token)
 → Gallery grid loads: thumbnail URLs from media.illuminatestudios.com.au
 → Cloudflare Worker validates cookie, serves from CDN cache

Client selects images for purchase/print
 → POST /api/galleries/{id}/selections
 → gallery_selections record: {client_id, gallery_id, asset_id, status: "pending"}

Admin reviews selections in cockpit
 → Admin approves per-image or full selection set
 → POST /api/admin/selections/{id}/approve
 → download_authorization record created

Client downloads approved image
 → POST /api/galleries/{gallery_id}/assets/{asset_id}/download
 → Backend: validate session → find download_authorization →
            check download_count < download_limit (3) →
            atomic increment download_count →
            generate 60s presigned URL for original in R2_BUCKET_ORIGINALS →
            return HTTP 302 redirect
 → Client: browser follows redirect → downloads directly from R2
 → Backend: never touches image bytes
```

### New collections (Task 2)

**`gallery_selections`**
```
client_id, gallery_id, asset_id, selected_at,
status: "pending" | "approved" | "rejected"
```

**`download_authorizations`**
```
client_id, asset_id, gallery_id,
authorized_at, authorized_by (admin user_id),
download_count: 0, download_limit: 3
```

---

## 8. MongoDB Atlas — authoritative collection list

**Store metadata only. Never store image binaries, base64, large embedded arrays.**

```
users                   owner / admin / editor accounts
clients                 client accounts (separate auth model from admin users)
booking_requests
bookings
services
service_packages
availability_rules
availability_holds
galleries
gallery_assets          ★ primary new collection — Task 2
gallery_selections      ★ new — Task 2
download_authorizations ★ new — Task 2
gallery_tokens          ★ new — Task 2 (hashed gallery access tokens)
magic_link_tokens       ★ new — Task 2
staff_invites           ★ new — Task 2
refresh_tokens          ★ new — Task 2 (admin/staff JWT refresh)
contracts
contract_templates
contract_signatures
invoices
invoice_events
payments
email_outbox
ai_booking_sessions
ai_booking_messages
audit_logs
admin_activity
settings
```

### Required indexes — gallery_assets

```js
db.gallery_assets.createIndex({ gallery_id: 1, sort_order: 1 })
db.gallery_assets.createIndex({ gallery_id: 1, visibility: 1, sort_order: 1 })
db.gallery_assets.createIndex({ gallery_id: 1, created_at: -1 })
db.gallery_assets.createIndex({ asset_id: 1 }, { unique: true })
db.gallery_assets.createIndex({ r2_original_key: 1 }, { unique: true })
```

All indexes via bootstrap/migration script — never manually in Atlas console.

### Atlas cluster

```
Production:  M10 minimum, backups enabled, point-in-time recovery enabled
Staging:     separate database (or separate cluster)
Pooling:     enabled
Secrets:     MONGODB_URI in Railway environment variables
```

---

## 9. Environment variables — complete and corrected

All secrets live in Railway environment variables and local `.env`.
**Never commit values. Never log them.**

```bash
# MongoDB
MONGODB_URI=mongodb+srv://...

# Cloudflare R2 — both buckets private, no public access
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT_URL=https://{account_id}.r2.cloudflarestorage.com
R2_BUCKET_DERIVATIVES=illuminate-prod-derivatives
R2_BUCKET_ORIGINALS=illuminate-prod-originals

# CDN / Cloudflare Worker
R2_CUSTOM_DOMAIN=https://media.illuminatestudios.com.au
CLOUDFLARE_WORKER_SHARED_SECRET=...   # shared between backend and Worker

# Auth
JWT_SECRET=...                         # admin/staff JWT signing
CLIENT_SESSION_SECRET=...              # client session token signing

# App
ENVIRONMENT=production
CORS_ORIGINS=https://illuminatemygallery.com,...
```

`R2_BUCKET_PUBLIC` is retired — the concept of a "public bucket" does not exist in
this architecture. Both buckets are private at R2 level.

---

## 10. Build sequence — follow priority order, do not skip ahead

### Priority 1 — Structural safety audit (before writing new code)

Read the existing backend codebase in full. Identify:
- Any admin routes currently protected by frontend-only guards (no backend auth check).
- Any client-side-only authorization assumptions.
- Any hardcoded roles or permissions.

Document findings. Do not fix auth implementation yet — that is Priority 2.

### Priority 2 — Auth foundation

```
JWT middleware (access 8h + refresh 7d)
Client session middleware (30-day rolling)
Role assertion dependencies for owner / admin / editor / client
Owner bootstrap (system setup endpoint or seed)
Staff invite flow: create → email → accept → account activated
Client auto-provision on gallery token claim
Password set flow (first-access prompt for auto-provisioned accounts)
Magic link generation + validation
Gallery media JWT generation (4h TTL, for Cloudflare Worker)
Gallery media JWT set as HttpOnly Secure cookie on gallery page load
All tokens stored hashed per §6 — raw values never persisted
```

### Priority 3 — Storage foundation

```
R2 adapter (boto3 with R2 endpoint URL)
Presigned PUT URL endpoint for direct-to-R2 uploads
Presigned GET URL generation for originals (60s TTL, download endpoint)
gallery_assets MongoDB model + required indexes
Upload confirm + R2 object existence verification
Async derivative generation worker (Pillow: thumb-v1.webp + preview-v1.webp)
Processing state transitions (created → ... → ready)
Processing status visible in admin gallery management UI
```

### Priority 4 — Gallery delivery

```
Cursor-paginated gallery asset API
  GET /api/galleries/{id}/assets?limit=80&cursor=...
  Initial: 40–80 assets. Pages: 40–100. Admin review: 250.
  Thumb/preview URLs constructed at response time using R2_CUSTOM_DOMAIN + key.
  Never stored raw in MongoDB.

Gallery media JWT issued on gallery page load (sets gallery_token cookie)
Gallery access token validation (14-day claim flow)
Client selections endpoint (create/update gallery_selections)
Admin approval endpoint (create download_authorizations)
Download endpoint (§7 workflow — 302 redirect to 60s presigned URL)
Client-side image protection layer (§5.1–5.4)
Virtualized gallery grid + lazy-loaded thumbnails (frontend)
```

### Priority 5+ — Booking, contracts, invoices

Out of scope for Task 2. Do not begin until Priority 4 is verified working in staging.

---

## 11. Cloudflare Worker — implementation notes

The Worker is a separate deployment artifact (not part of the Railway backend).
It lives at `media.illuminatestudios.com.au` and uses a Cloudflare R2 binding to
access the derivatives bucket directly from the Worker runtime.

Key implementation points:
- Worker uses the R2 binding (not the S3-compatible API) for lowest-latency fetches.
- HMAC verification uses the same algorithm as the backend (HMAC-SHA256).
- The Worker must check: signature valid + not expired + gallery_id in path is in
  token's `gallery_ids` list.
- Response must include correct `Content-Type` (from R2 object metadata) and the
  `Cache-Control: public, max-age=31536000, immutable` header.
- Worker script can be minimal — validation + R2 fetch + response passthrough.
- Deploy via Cloudflare dashboard or `wrangler deploy` (separate from Railway).

Flag to owner if the Worker is not yet deployed — gallery delivery cannot be
verified without it. The backend and storage builds (Priorities 2–3) can proceed
without the Worker, but Priority 4 gallery delivery requires it.

---

## 12. Authoritative docs — read before writing code

In repo at `~/kingdom/projects/illuminate-my-gallery`:

| Path | What |
|---|---|
| `test_reports/full_scale_infra_assessment_2026-05-27.md` | Storage/DB plan of record |
| `.automate-dev/DECISION-RECORD.md` | Living ADR — **update §5 from this brief first** |
| `frontend/docs/design-system-audit-workplan.md` | Design-system reference |
| `FIRST-SESSION.md` | Cold-start brief |

---

## 13. Operating rules — always apply

- Production-ready, complete code. No placeholders, no `# ... unchanged`, no stubs.
- Preserve existing functionality. No breaking changes without explicit approval.
- Do not silently change `railway.toml` or Railway service config — flag it.
- Backend never streams image bytes. No exceptions.
- Deliver code/config as downloadable files — never copy-paste blocks.
- Use `automate-dev` for multi-step build, one task at a time.
- Verify by running. Build green ≠ works. Confirm gallery renders and responds.
- `git pull --ff-only` only. Never force-push.

---

*Prepared 2026-05-27 FINAL. All decisions closed. Both previous brief versions
(task2-handoff-brief.md and task2-handoff-brief-v2.md) are superseded by this file.*
*Update `.automate-dev/DECISION-RECORD.md §5` before starting Priority 1.*
*Update `kingdom-continuation-v3-FINAL.md` on session close.*
