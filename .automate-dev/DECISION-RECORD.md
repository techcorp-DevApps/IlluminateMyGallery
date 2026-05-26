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

## 5. Open decisions blocking the next build **[PENDING]**

- **P-5.1 — Delivery pattern (must choose one):**
  - **Pattern A — Backend-issued presigned GET URLs.** Simpler; secure; browser fetches
    direct from R2. No CDN edge caching (presigned URLs bypass R2's cache).
  - **Pattern B — Cloudflare Worker-gated custom domain** (e.g.
    `cdn.illuminatestudios.com.au`). Backend mints a short-lived signed token; the Worker
    validates it per request and serves from R2 with cache headers → **private AND
    edge-cached** (fastest private option). More moving parts (Worker + shared secret).
  - *Recommendation on record:* Pattern B best satisfies "highest speed + non-negotiable
    privacy." Pattern A is an acceptable v1 and can upgrade to B later without
    re-architecting (same ownership check, same private bucket).
- **P-5.2 — Watermarked previews?** Full-res unlocked only on download/purchase — yes/no.
- **P-5.3 — Download gating separate from viewing?** (Distinct authorization for
  downloading the original vs viewing a preview.)
- **P-5.4 — Variant mechanism:** Cloudflare Images (purpose-built, per-image cost) vs
  R2 + Image Transformations. (Relates to D-3.4.)
- **P-5.5 — Frontend host:** Railway static vs Cloudflare Pages (Pages is a natural fit
  given R2/CDN already on Cloudflare). See §6.

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

Resolve **P-5.1** (Pattern A or B) and **P-5.2 / P-5.3** (watermark, download gating),
then run the image security/delivery build through `automate-dev`: storage adapter
(presigning/token signing), galleries routes (authorized URL/token issuance preserving
the ownership check), frontend gallery viewer + direct-to-R2 uploader, and — if Pattern B
— the Worker and its deploy config. Update this record with the decisions when made.
