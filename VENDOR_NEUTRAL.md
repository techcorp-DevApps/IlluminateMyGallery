# Vendor-Neutral Architecture Audit

This project is built so it can be lifted off the Emergent preview platform
with **a few env-variable swaps and (optionally) deleting two short blocks of
code**. There are no Emergent-specific runtime dependencies in the core path.

## TL;DR — to run anywhere (Railway, Fly, your own box)

1. Set your own values in `/app/backend/.env`:

   ```
   MONGO_URL=<your mongo or postgres-via-adapter url>
   DB_NAME=<your db name>
   JWT_SECRET=<random 64-char hex>
   ADMIN_EMAIL=<your admin email>
   ADMIN_PASSWORD=<your admin password>

   # Stripe — your real key replaces the Emergent dev key
   STRIPE_API_KEY=sk_live_...             # or sk_test_... from your own Stripe
   STRIPE_WEBHOOK_SECRET=whsec_...        # from Stripe Dashboard → Webhooks

   # OpenAI for Luma
   OPENAI_API_KEY=sk-...
   LUMA_MODEL=gpt-4.1

   # Resend for email
   RESEND_API_KEY=re_...
   MAIL_FROM=studio@yourdomain.com
   MAIL_FROM_NAME=Your Studio
   ADMIN_NOTIFICATION_EMAIL=admin@yourdomain.com
   APP_PUBLIC_URL=https://your-public-url
   ```

2. Set the frontend backend URL in `/app/frontend/.env`:
   ```
   REACT_APP_BACKEND_URL=https://api.yourdomain.com
   ```

3. **Optional** — delete the Emergent fallbacks:
   - `pip uninstall emergentintegrations`
   - Remove `emergentintegrations==0.1.0` from `/app/backend/requirements.txt`
   - In `/app/backend/routes/payments_routes.py`: delete the `try: from emergentintegrations...` block (around lines 33–46) and any `_is_emergent_dev_key(...)` branches.
   - In `/app/backend/luma/agent.py`: delete the `# ---- Emergent LLM fallback` block in `_llm_params`.

That's it. Native `stripe`, `openai`/`litellm`, and `resend` SDKs handle everything.

## Where Emergent currently shows up (and how to swap)

| Concern | Current dev behavior | Production behavior | What to change |
|---|---|---|---|
| **Stripe** | `STRIPE_API_KEY=sk_test_emergent` proxied via `emergentintegrations.payments.stripe` | Native `stripe` SDK with your own key | Replace `STRIPE_API_KEY` with your own. Add `STRIPE_WEBHOOK_SECRET`. The native code path activates automatically. |
| **Luma LLM** | Falls back to `EMERGENT_LLM_KEY` via `integrations.emergentagent.com/llm` if `OPENAI_API_KEY` is missing | Direct OpenAI via `OPENAI_API_KEY` | Set `OPENAI_API_KEY`. Remove `EMERGENT_LLM_KEY` from `.env` to disable the fallback. |
| **Email** | `resend` SDK, your domain `illuminatestudios.com.au` | Same — no Emergent involvement | None. |
| **DB** | Mongo via `MONGO_URL` | Same, or Postgres+S3 via `StorageAdapter` swap | Implement `PostgresStorageAdapter` in `/app/backend/storage.py` and export it as `storage`. Public methods: `put / get / delete`. |
| **Frontend backend URL** | `*.preview.emergentagent.com` | Your domain | Change `REACT_APP_BACKEND_URL` in `/app/frontend/.env`. |

## Code-level switch points (commented in source)

- `/app/backend/routes/payments_routes.py` — header docstring + `_EMERGENT_AVAILABLE` flag + `_is_emergent_dev_key` helper. Auto-detect, no code change needed; deletable in 3 hunks.
- `/app/backend/luma/agent.py` — `_llm_params()` has clearly delimited `# ---- Emergent LLM fallback` block. Delete the block to drop the dependency entirely.
- `/app/backend/storage.py` — already an interface (`MongoStorageAdapter`). Add a `PostgresStorageAdapter` / `S3StorageAdapter` and change the `storage = ...` line at the bottom of the file. No call site changes needed.

## Confirming nothing else binds you in

- `pip show emergentintegrations` is the **only** Emergent package and it is now used **only** in two clearly-marked optional branches. The app starts and runs without it (the imports are wrapped in try/except).
- No Emergent-specific URLs are baked into source. The only Emergent URL in the code is the LLM proxy default — overridden by `INTEGRATION_PROXY_URL` env var or removed entirely with the fallback block.
- Resend, Stripe, OpenAI, Mongo, Pydantic, FastAPI, React, Tailwind, Shadcn — all standard / vendor-agnostic.
