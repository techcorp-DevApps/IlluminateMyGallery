---
title: IlluminateMyGallery — Architecture & Decision Record
project: IlluminateMyGallery
repo: github.com/techcorp-DevApps/IlluminateMyGallery
branch: main
owner: TechCorp (Melbourne, AU)
maintained_by: automate-dev workflow
created: 2026-05-26T12:25:12Z
status: LIVING DOCUMENT — supersedes ad-hoc notes; update on every material decision
related_reports:
  - 2026-05-25T04-31-54-illuminatemygallery-railway-assessment.md
  - 2026-05-25T06-22-14-illuminatemygallery-remediation-report.md
  - 2026-05-25T10-18-00-illuminatemygallery-vite-migration-report.md
  - 2026-05-27T21-00-00-task2-handoff-brief-FINAL.md
  - test_reports/full_scale_infra_assessment_2026-05-27.md
---

# IlluminateMyGallery — Decision Record

Single source of truth for decisions made to date. Sections are tagged
**[IMPLEMENTED]** (done + validated), **[DECIDED]** (locked, not yet built),
**[PENDING]** (awaiting a decision before work can proceed), and **[MANUAL]**
(infra/dashboard steps the code cannot perform).

---

## 1. Project shape

A photography studio platform: portfolio, bookings, client galleries, documents,
invoices (PayID), and an AI assistant ("Luma"). Originally scaffolded on Emergent.sh;
being taken to a standalone, vendor-neutral deployment.

### 1.1 Tech stack (current, post-migration)
| Layer | Technology |
|---|---|
| Backend | FastAPI, Motor/PyMongo, served by uvicorn |
| Database | MongoDB (Atlas) — metadata only |
| LLM | OpenAI via `litellm` (Luma assistant) |
| Object storage | Cloudflare R2 (S3-compatible; existing `S3StorageAdapter`) |
| Frontend | Vite 6 + React 19, Tailwind 3.4, shadcn/ui, react-router-dom 7 |
| Auth | JWT + bcrypt |
| Email | Resend |
| Payments | PayID (no Stripe) |

---

## 2. Deployment model **[DECIDED]**

**Two services to run, plus two external managed dependencies.**

- **Service 1 — Backend** (FastAPI). Railway, Root Directory `/backend`. Holds all
  secrets. Connects out to Atlas and R2. The only service that calls OpenAI.
- **Service 2 — Frontend** (Vite SPA). Builds to `build/`, served as static files.
  Its only config is `VITE_BACKEND_URL`. Host TBD (see §6).
- **External: MongoDB Atlas** — metadata store (gallery records, blob keys, users).
- **External: Cloudflare R2** — image bytes (never stored in Mongo).

Frontend and backend are a matched pair: frontend `VITE_BACKEND_URL` → backend URL,
and backend `CORS_ORIGINS` must include the frontend origin.

---

## 3. Image storage, delivery & upload **[DECIDED]**

Driven by the requirement: regular uploads of very-high-quality images needing the
fastest possible viewing/storage.

- **D-3.1 Store images in Cloudflare R2, not MongoDB.** Mongo blob storage is an
  anti-pattern for large media; R2 has zero egress fees (key for image-heavy apps).
  Activated by setting `S3_BUCKET` (+ R2 creds) so the existing R2 adapter is used.
- **D-3.2 Do NOT serve images by proxying through the FastAPI backend.** The current
  `photoUrl()` returns `${API}/galleries/photo/${blobId}`, streaming every image byte
  through the Railway (Singapore-region) process — the primary performance bottleneck.
  This must be repointed to an R2/CDN delivery path.
- **D-3.3 Upload browser → R2 directly via short-lived presigned PUT URLs.** Large
  files never transit the backend; the backend only mints the URL after auth.
- **D-3.4 Serve right-sized image variants** (thumbnail / preview / full, AVIF/WebP);
  serve the full original only on explicit download. (Mechanism in §5 PENDING.)
- **D-3.5 Object keys are namespaced per client/gallery**, e.g.
  `clients/{userId}/galleries/{galleryId}/{imageId}` — non-enumerable, no flat keys.

---

## 4. Security & privacy **[DECIDED — NON-NEGOTIABLE]**

Stated as a hard requirement: images must be secured; galleries are private and bound
to user/client accounts. These invariants hold under any chosen delivery pattern.

- **S-4.1** The R2 bucket is **private** — never publicly accessible. The public-bucket
  delivery path is explicitly rejected.
- **S-4.2** R2 credentials live only on the backend (and, if Pattern B, the Worker
  secret). They are NEVER present in the frontend bundle.
- **S-4.3** Every image access is **authorized against the gallery↔client link**
  (`gallery.client_user_id` matches the JWT subject, or admin/photographer) BEFORE any
  URL or token is issued. The existing ownership check is preserved and remains the gate.
- **S-4.4** Access artifacts (presigned URLs / signed tokens) are **short-lived**
  (target 10–15 min). R2's multi-day presigned default is explicitly disallowed.
- **S-4.5** Caching (if used) is keyed by object but authorization is enforced
  per-request, so edge caching can never bypass the ownership check.

---

## 5. Delivery, protection & download decisions **[DECIDED]**

> Closed 2026-05-27 per the **Task 2 FINAL handoff brief**
> (`2026-05-27T21-00-00-task2-handoff-brief-FINAL.md`) — the single source of truth
> for the Task 2 build. Items P-5.1–P-5.4 (previously PENDING) are now resolved;
> P-5.5 is not addressed by the brief and is carried forward.

- **D-5.1 — Delivery pattern: Pattern B (Cloudflare Worker-gated private bucket).**
  Custom domain `media.illuminatestudios.com.au`. Both R2 buckets stay private (no
  public access, no `r2.dev`). Backend issues a short-lived **gallery media JWT**
  (HMAC-SHA256, 4h TTL) set as an HttpOnly/Secure/SameSite=Strict `gallery_token`
  cookie; the Worker validates signature + expiry + `gallery_id ∈ token.gallery_ids`
  per request, fetches from the derivatives bucket via R2 binding, and returns
  `Cache-Control: public, max-age=31536000, immutable`. Edge cache is keyed on URL
  path, so the Worker is not re-invoked on a hit. (Resolves P-5.1; supersedes the
  "Pattern A as v1" note — Task 2 builds B directly.) See brief §4.
- **D-5.2 — No watermarking.** Rejected in favour of a four-part client-side
  protection layer for non-admin users (admins exempt): transparent overlay +
  `draggable=false`/`user-select:none` download blocker, context-menu disable,
  `-webkit-touch-callout:none` long-press/callout disable (iOS + Android), and a
  desktop screenshot-keystroke opacity flash. iOS hardware screenshot is a
  documented, un-detectable platform gap — no workaround attempted. (Resolves P-5.2.)
  See brief §5.
- **D-5.3 — Download gating is separate from viewing.** Viewing = Worker-served
  derivatives (thumb/preview). Downloading an original requires: client selection
  (`gallery_selections`) → admin approval (`download_authorizations`) → backend
  validates session + authorization, enforces `download_count < download_limit` (3),
  atomically increments, then 302-redirects to a **60s presigned GET** URL for the
  originals bucket. Backend never streams bytes. (Resolves P-5.3.) See brief §7.
- **D-5.4 — Variant mechanism: self-generated, not Cloudflare Images.** Three
  variants per original — `thumb-v{n}.webp` (100–250 KB) and `preview-v{n}.webp`
  (2–5 MB) in `illuminate-prod-derivatives`, `original.jpg` (25–40 MB) in
  `illuminate-prod-originals`. Derivatives generated by an **async worker (Pillow)**,
  never in the HTTP request cycle. Versioned keys, never overwritten (CDN staleness).
  (Resolves P-5.4; closes the D-3.4 mechanism.) See brief §3.
- **P-5.5 — Frontend host (Railway static vs Cloudflare Pages): STILL OPEN.** Not
  decided by the Task 2 FINAL brief; out of scope for Task 2. Carried forward. See §6.

---

## 6. Outstanding manual / infra steps **[MANUAL]**

Carried forward from the remediation and migration reports; none are code.

**Backend service (Railway)**
- Settings → Root Directory = `/backend`.
- Set all REQUIRED env vars per `backend/.env.example` (`MONGO_URL`, `DB_NAME`,
  `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ORIGINS`, `OPENAI_API_KEY`,
  `RESEND_API_KEY`, PayID/invoice vars; R2 vars once storage is wired).
- MongoDB Atlas → Network Access: allow Railway egress (`0.0.0.0/0` first, then tighten).

**Frontend service**
- New service, Root Directory = `/frontend`, build `npm run build`, publish `build/`.
- Set `VITE_BACKEND_URL` = backend public URL (no trailing slash).
- Add the frontend origin to backend `CORS_ORIGINS`.

**Cloudflare R2 (for §3/§4 work)**
- Create private bucket; generate API token (Access Key ID / Secret).
- Configure CORS on the bucket for browser PUT uploads.
- Pattern B only: custom domain + Worker + shared signing secret.

---

## 7. Work completed to date **[IMPLEMENTED]**

### 7.1 Backend — Railway deploy remediation (report: 2026-05-25T06-22-14)
Fixed four independent P0 boot/build blockers and supporting issues:
- Config split-brain → `railway.toml` relocated to `backend/`; root copy removed.
- Import-time `os.environ[...]` in `db.py` → lazy, validated `_LazyDatabase` proxy with
  `serverSelectionTimeoutMS`; preserves `from db import db`.
- `/app/memory` plaintext-credentials write removed (filesystem crash + security).
- Seed coupled to startup → migrated to FastAPI `lifespan`, made **non-fatal** (a DB
  outage no longer fails boot; `/api/` health check still returns 200 — verified).
- Python pinned to 3.11; `requirements.txt` split (prod vs dev), `boto3` de-duped,
  unused heavy deps dropped; **`litellm` added** (was provided by the Emergent base
  image — a hidden boot blocker).
- Lazy storage adapter; hardened CORS wildcard; `backend/.env.example` added.
- **Validation:** empty-env import OK, dead-DB boot serves 200, reviewer PASS,
  deployment_readiness (backend) 100/100.

### 7.2 Backend — vendor-neutralisation
- Removed Emergent LLM-gateway fallback in `luma/agent.py` → OpenAI-only via litellm.
- Confirmed `emergentintegrations`/Stripe already absent (PayID flow).
- `.emergent/` metadata is inert (no runtime/build effect); left in place.

### 7.3 Frontend — CRA/CRACO → Vite migration (report: 2026-05-25T10-18-00)
- Vite 6 + React 19 + `@vitejs/plugin-react`; `package.json` `type: module`, new
  scripts, toolchain swap (removed react-scripts/craco/cra-template/CRA babel plugin).
- New `vite.config.js` (ESM, `@`→`src` alias via `import.meta.url`), clean root
  `index.html`, ESLint 9 flat config, `.env.example`, `.npmrc` (legacy-peer-deps for the
  pre-existing react-day-picker↔date-fns peer conflict).
- `tailwind.config.js` + `postcss.config.js` → ESM; `src/lib/api.js` env →
  `import.meta.env.VITE_BACKEND_URL`; `src/index.css` font `@import` reordered (render
  fix); `index.js`→`main.jsx`, `App.js`→`App.jsx`. Removed craco config,
  `public/index.html`, `plugins/health-check/`.
- **Validation:** `vite build` green (2958 modules), dev server HTTP 200, `eslint .` 0
  errors, zero Emergent/PostHog refs in built output.

### 7.4 Frontend — vendor-neutralisation
Removed from the old `index.html`: `assets.emergent.sh` script, "Made with Emergent"
badge + meta, and a **PostHog analytics + session-recording snippet with a hard-coded
key**. Built output now contains zero Emergent/PostHog references.

---

## 8. Next action

Delivery, protection, and download decisions are **closed** — see §5 (D-5.1 Pattern B,
D-5.2 no watermark, D-5.3 download gating separate from viewing, D-5.4 self-generated
variants), resolved per the Task 2 FINAL handoff brief. P-5.5 (frontend host) is the
only open §5 item.

Proceed with the Task 2 build sequence (brief §10), in priority order:
1. **Priority 1 — structural safety audit.** Read the backend in full; document
   frontend-only/route-level auth gaps, client-side authorization assumptions, and
   hardcoded roles/permissions. No fixes yet.
2. **Priority 2 — auth foundation.** JWT access 8h + refresh 7d, 30-day rolling client
   sessions, role assertions (owner/admin/editor/client), owner bootstrap, staff invite,
   client auto-provision, magic link, gallery media JWT — all tokens hashed at rest.
3. **Priority 3 — storage foundation.** R2 adapter, presigned PUT/GET, `gallery_assets`
   + indexes, upload-confirm verification, async Pillow derivative worker.
4. **Priority 4 — gallery delivery.** Cursor-paginated assets, media JWT cookie, access-
   token claim, selections, admin approval, 302 download, client-side protection layer,
   virtualized grid. Requires the Cloudflare Worker deployed.

Run the build through `automate-dev`, one task at a time. Update this record on each
material decision.
