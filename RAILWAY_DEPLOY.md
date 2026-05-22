# Railway Deployment Guide — Illuminate Studios

Step-by-step for deploying the full stack to Railway with Postgres + S3-compatible storage. The application is **vendor-neutral** (see `VENDOR_NEUTRAL.md`) — no Emergent dependencies remain in the runtime path.

---

## 1. Architecture on Railway

```
                  ┌────────────────────┐
                  │ app.illuminatestudios │  ← frontend domain
                  │  .com.au              │
                  └─────────┬──────────┘
                            │
              ┌─────────────▼──────────────┐
              │  illuminate-frontend       │  React (Node 20)
              │  yarn build && serve       │
              └─────────────┬──────────────┘
                            │ proxied calls
              ┌─────────────▼──────────────┐
              │  api.illuminatestudios     │  ← backend domain
              │   .com.au                  │
              └─────────────┬──────────────┘
                            │
              ┌─────────────▼──────────────┐
              │  illuminate-backend        │  FastAPI (Python 3.11)
              │  uvicorn server:app        │
              └─────┬──────────────────┬───┘
                    │                  │
        ┌───────────▼─────────┐   ┌────▼────────┐
        │  Railway Postgres   │   │ Object store │  Cloudflare R2 (recommended)
        │  (or Mongo Atlas)   │   │  / AWS S3   │
        └─────────────────────┘   └─────────────┘
```

---

## 2. Provisioning order

### a. Create the Railway project
1. Railway → New Project → Empty Project
2. Name it `illuminate-studios`

### b. Database (pick ONE)
**Option A — Postgres (Railway-managed)** — for when you swap MongoDB out:
1. Add → Database → Postgres
2. Note: I will need to implement a `PostgresStorageAdapter` to replace `MongoStorageAdapter` in `/app/backend/storage.py` AND switch the data layer from `motor` (Mongo) to `asyncpg` (Postgres). This is a moderate refactor (~1 hour). Tell me when you want it done.

**Option B — Mongo Atlas (lift-and-shift)** — fastest path, no code change:
1. Use Mongo Atlas free tier or any Mongo provider
2. Just set `MONGO_URL` and `DB_NAME` env vars on the backend service
3. No code changes needed. **This is the recommended path for a quick first deployment.**

### c. Object storage (pick ONE)
**Option 1 — Cloudflare R2 (recommended)**
1. Cloudflare dashboard → R2 → Create bucket `illuminate-studios-photos`
2. R2 → Manage R2 API Tokens → Create Token → permissions: Object Read & Write, bucket: `illuminate-studios-photos`
3. Copy the `Access Key ID`, `Secret Access Key`, and `Endpoint` URL (`https://<account-id>.r2.cloudflarestorage.com`)

**Option 2 — AWS S3**
- Create a bucket in `ap-southeast-2` (Sydney for AU latency)
- Create an IAM user with `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` scoped to the bucket
- Take the access key + secret

**Option 3 — Railway Volume (filesystem, simplest, but locked to one replica)**
- Backend service → Settings → Volumes → Mount Path: `/data`

---

## 3. Backend service setup

1. Railway → New Service → Deploy from GitHub repo → pick this repo
2. Settings → Root Directory: `/backend`
3. Settings → Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Settings → Health Check Path: `/api/`
5. Variables → set all of the following (paste-ready below)

### Backend environment variables

```bash
# ---- Database ----
# Option B (Mongo Atlas — fastest):
MONGO_URL=mongodb+srv://USER:PASS@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=illuminate_studios

# Option A (Postgres — needs code swap, see section 2.b):
# DATABASE_URL=postgresql://postgres:...@...railway.app:5432/railway

# ---- Auth ----
JWT_SECRET=<generate: python3 -c "import secrets;print(secrets.token_hex(32))">
ADMIN_EMAIL=photographer@illuminatestudios.com.au
ADMIN_PASSWORD=<your secure password>

# ---- LLM (Luma) ----
OPENAI_API_KEY=sk-proj-...
LUMA_MODEL=gpt-4.1

# ---- Email (Resend) ----
RESEND_API_KEY=re_...
MAIL_FROM_NAME=Illuminate Studios
MAIL_FROM_INVOICES=accounts@invoicing.illuminatestudios.com.au
MAIL_FROM_NOTIFICATIONS=donotreply@notifications.illuminatestudios.com.au
ADMIN_NOTIFICATION_EMAIL=photographer@illuminatestudios.com.au

# ---- PayID / Bank details (shown on every invoice) ----
PAYID_IDENTIFIER=accounts@illuminatestudios.com.au
PAYID_BUSINESS_NAME=Illuminate Studios
INVOICE_BSB=<your BSB e.g. 062-001>
INVOICE_ACCOUNT_NUMBER=<your account number>
INVOICE_ACCOUNT_NAME=Illuminate Studios Pty Ltd
INVOICE_REFERENCE_PREFIX=INV

# ---- Public URLs ----
APP_PUBLIC_URL=https://app.illuminatestudios.com.au
CORS_ORIGINS=https://app.illuminatestudios.com.au

# ---- Object storage (pick ONE block) ----
# Cloudflare R2 / S3-compatible:
S3_ENDPOINT_URL=https://<account>.r2.cloudflarestorage.com
S3_BUCKET=illuminate-studios-photos
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_REGION=auto
# OR Railway Volume:
# STORAGE_VOLUME_PATH=/data/blobs
```

### Domain
- Settings → Domains → Custom Domain → `api.illuminatestudios.com.au`
- DNS at your registrar: `CNAME api → <railway-provided-hostname>`

---

## 4. Frontend service setup

1. Railway → New Service → Deploy from GitHub repo → same repo
2. Settings → Root Directory: `/frontend`
3. Settings → Build Command: `yarn install --frozen-lockfile && yarn build`
4. Settings → Start Command: `npx serve -s build -l $PORT`
5. Variables:

```bash
REACT_APP_BACKEND_URL=https://api.illuminatestudios.com.au
```

6. Settings → Domains → `app.illuminatestudios.com.au` (or just `illuminatestudios.com.au` apex if you want)
7. DNS: `CNAME app → <railway-provided-hostname>`

---

## 5. Resend domain verification

For the two subdomain senders you chose, verify each in Resend:

| Subdomain | Purpose | Records to add in DNS |
|---|---|---|
| `invoicing.illuminatestudios.com.au` | Invoice emails (from `accounts@`) | SPF TXT, DKIM CNAMEs, MX (Resend provides) |
| `notifications.illuminatestudios.com.au` | Booking / contract emails (from `donotreply@`) | Same — separate set |

Resend → Domains → Add Domain (one for each subdomain) → copy records into your DNS → click "Verify".

---

## 6. Post-deploy checklist

After both services are green:

- [ ] `GET https://api.illuminatestudios.com.au/api/` returns `{"ok":true,"name":"Illuminate Studios API"}`
- [ ] Admin login at `https://app.illuminatestudios.com.au/login` works
- [ ] Create a test invoice → PayID details show — reference is `INV-2026-0001`
- [ ] Trigger an invoice email → arrives from `accounts@invoicing.illuminatestudios.com.au`
- [ ] Trigger a booking-received email → arrives from `donotreply@notifications.illuminatestudios.com.au`
- [ ] Luma chat replies within ~2s using `gpt-4.1`
- [ ] Admin → Documents → "+ From template" → generate Wedding agreement → it auto-fills the client name + session date

---

## 7. What I'll need from you to wire the **Postgres + S3 swap**

Right now the backend uses Mongo (via `MONGO_URL`) and the StorageAdapter writes blobs into Mongo's `file_blobs` collection. Once you give me:

- `DATABASE_URL` (Postgres connection string)
- `S3_ENDPOINT_URL` + `S3_BUCKET` + `S3_ACCESS_KEY_ID` + `S3_SECRET_ACCESS_KEY` + `S3_REGION`

I'll:
1. Add `asyncpg` + `boto3` to `requirements.txt`
2. Write `/app/backend/storage_postgres.py` with a `PostgresStorageAdapter` (BYTEA + metadata) and `/app/backend/storage_s3.py` with `S3StorageAdapter`
3. Refactor `/app/backend/db.py` to use either Mongo or Postgres based on whether `DATABASE_URL` is set
4. Run a one-shot migration script that copies existing Mongo blobs into S3 + Postgres rows
5. Test end-to-end and finish

The whole swap should take ~1–1.5 hours of focused work.

---

## 8. Tip: deploy Option B first

If you want to get this **live today**, deploy with **Mongo Atlas** as the database (no code changes) + **Cloudflare R2** for photos. That gets you to production with the current codebase. We can do the Postgres swap as a follow-up — no urgency.
