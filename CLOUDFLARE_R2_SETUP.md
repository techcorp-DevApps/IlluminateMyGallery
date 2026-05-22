# Cloudflare R2 Setup — Step-by-Step for Illuminate Studios

Cloudflare R2 is an S3-compatible object storage service with **zero egress fees**, which makes it the cheapest sensible choice for a photography studio (you read lots of large image files when clients view their galleries).

The Illuminate Studios backend reads four env vars and routes all photo storage through R2 automatically once they're set:

```
S3_BUCKET=illuminate-studios-photos
S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_REGION=auto
```

You don't need to change any code — the moment `S3_BUCKET` exists in the backend's environment, the `StorageAdapter` switches to S3.

---

## Step 1 — Create a Cloudflare account (if you don't have one)

1. Go to https://dash.cloudflare.com/sign-up and sign up with an email + password (or Google).
2. Verify the email confirmation Cloudflare sends.

You **do not** need to add `illuminatestudios.com.au` to Cloudflare's DNS to use R2 — R2 works on any Cloudflare account.

---

## Step 2 — Enable R2

1. In the Cloudflare dashboard left sidebar → click **R2 Object Storage**.
2. If this is the first time, Cloudflare will ask you to "**Enable R2**". You'll need to confirm a billing setup — R2 has a free tier (10 GB storage + 10 M Class A operations + 10 M Class B operations per month), so this won't cost anything to start, but Cloudflare still requires a card on file.
3. Add a payment method when prompted.

---

## Step 3 — Note your Account ID

1. Right after enabling R2, look at the URL: `https://dash.cloudflare.com/<ACCOUNT_ID>/r2/...`
2. Or: top-right of the dashboard, click your name → **Account ID** appears in the dropdown.
3. **Copy the Account ID** somewhere — you'll need it for the endpoint URL.

The endpoint URL is:
```
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

---

## Step 4 — Create the bucket

1. R2 dashboard → **Create bucket**.
2. Bucket name: `illuminate-studios-photos` (must be lowercase, hyphens allowed).
3. Location: leave **Automatic** (Cloudflare picks the optimal region — there's a hint they'll put it in Australia/Asia-Pacific for you).
4. Default storage class: **Standard** (Infrequent Access is cheaper for archives but slower; don't use for client galleries).
5. Click **Create bucket**.

---

## Step 5 — Create R2 API tokens

1. From the R2 dashboard → top right → **Manage R2 API Tokens** (or sidebar → R2 → API Tokens).
2. Click **Create API token**.
3. Configure:
   - **Token name**: `illuminate-backend`
   - **Permissions**: **Object Read & Write**
   - **Specify bucket(s)**: select **only** `illuminate-studios-photos` (scope-restrict — don't give it access to all buckets).
   - **TTL**: leave blank for never-expiring, or set a long expiry (e.g. 1 year) and rotate later.
4. Click **Create API token**.
5. **Copy these three values now** — Cloudflare won't show them again:
   - **Access Key ID** → `S3_ACCESS_KEY_ID`
   - **Secret Access Key** → `S3_SECRET_ACCESS_KEY`
   - **Endpoint** → `S3_ENDPOINT_URL` (this is the `https://<account-id>.r2.cloudflarestorage.com` URL)

Store them in your password manager.

---

## Step 6 — Public access (optional, only if you want hot-linking)

For Illuminate Studios you **don't** need public bucket access — the backend serves photos through `/api/galleries/photo/<blob_id>` which authenticates the user first. Leave the bucket private.

If you ever want to expose select photos publicly (e.g. for a public portfolio cache), you can enable R2's **Public bucket** setting later — it gives you a `https://pub-<hash>.r2.dev` URL.

---

## Step 7 — Paste env vars into Railway

In your Railway **`illuminate-backend`** service → **Variables**, paste:

```
S3_BUCKET=illuminate-studios-photos
S3_ENDPOINT_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=<the Access Key ID from Step 5>
S3_SECRET_ACCESS_KEY=<the Secret Access Key from Step 5>
S3_REGION=auto
```

Railway will redeploy automatically. The backend logs will show:

```
INFO storage S3StorageAdapter using bucket illuminate-studios-photos
```

(Currently the log line is only printed by the adapter on startup — you'll see the active backend in the boot logs.)

---

## Step 8 — Verify

1. Sign into the admin panel `https://app.illuminatestudios.com.au/admin/galleries`.
2. Create a new gallery for the test client.
3. Upload a photo.
4. Open the bucket in Cloudflare R2 dashboard → you should see `blobs/<uuid>` containing the image.
5. Open the gallery in the client portal → photo loads. (Backend fetches it from R2 transparently.)

---

## Step 9 — Backup & lifecycle (recommended, not required)

R2 doesn't have versioning enabled by default. You can:

- **Enable versioning**: bucket → Settings → Object Versioning → Enable. Useful for "client deleted their photos by accident" scenarios.
- **Set a lifecycle rule** (e.g. delete versions older than 90 days): R2 → Lifecycle rules. Saves on storage costs.

---

## Cost sanity check (Feb 2026 pricing)

- Storage: $0.015 / GB / month — 100 GB of client photos ≈ $1.50/month.
- Class A operations (uploads/deletes): $4.50 / million — you won't hit this.
- Class B operations (downloads/lists): $0.36 / million — even with high gallery traffic, this is cents.
- **Egress: $0.00** — this is R2's killer feature. AWS S3 would charge ~$9 per 100 GB of downloads.

You'll comfortably stay within $5/month for a single-photographer studio.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Backend logs "InvalidAccessKeyId" | Wrong `S3_ACCESS_KEY_ID` | Verify you copied the Access Key ID (not the bucket key) |
| Backend logs "SignatureDoesNotMatch" | Wrong `S3_SECRET_ACCESS_KEY` or extra whitespace | Regenerate the API token in Cloudflare |
| 403 on photo download | Token scoped to wrong bucket | Recreate token, ensure scope is `illuminate-studios-photos` |
| "NoSuchBucket" | Typo in `S3_BUCKET` or bucket not created yet | Check dashboard, recreate if needed |
| Photos upload OK but download returns 0 bytes | Endpoint URL points to wrong account | Confirm `S3_ENDPOINT_URL` matches `<account-id>.r2.cloudflarestorage.com` exactly |
