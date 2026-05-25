# Illuminate Studios — Photography Management Application

## Original problem statement
> Photography management application with two separate interconnected workflows
> which are authentication and role gated, 'user' (customer-facing) and 'admin'
> (photographer-facing). User also asked for an AI-backed booking agent (Luma)
> that guides prospective clients through the booking process in natural
> language with user-based unique context.

## User personas
- **Photographer (admin)** — runs the studio, manages portfolio, services,
  bookings, client galleries, contracts and invoices.
- **Client (customer)** — books a session, reviews & e-signs documents, downloads
  their delivered photos (when their package includes them), pays invoices via PayID.
- **Prospective lead** — talks to Luma in chat to book a session without an account.

## Core requirements (static)
- JWT-based email/password auth, role-gated (`admin` / `user`).
- Editorial magazine-style design (Cormorant Garamond + Manrope).
- Immersive "lights-out" dark-mode viewer for galleries.
- **PayID-first invoice payments** (Australian instant payments). No Stripe.
- E-signature for contracts/documents (type-name + timestamp).
- Storage abstraction (`StorageAdapter`) — Mongo base64 dev backend, Cloudflare R2
  in production (selected automatically when `S3_BUCKET` is set).
- Luma AI booking agent per provided spec.
- Vendor-neutral: no Emergent runtime dependencies in production path.
- Resend transactional emails sent from task-specific subdomains.
- Contract template pack: 5 photography agreements + portfolio release.
- **Gallery image protection**: right-click and long-press disabled by default;
  full-resolution downloads gated on the gallery's `allow_downloads` flag
  (enabled per-gallery when digital files are part of the package).

## What's been implemented (2026-02)
- **Backend (FastAPI)**: JWT auth + bcrypt + cookie sessions, admin seed,
  pluggable `StorageAdapter` (Mongo / S3+R2), services CRUD,
  bookings CRUD + approval workflow + GET-by-id with owner/admin auth,
  galleries with photo upload/download + **`booking_id` linkage** +
  **`allow_downloads` flag** + cross-user 403, e-sign documents,
  PayID invoices with auto-generated references (`INV-YYYY-NNNN`) +
  admin mark-paid/mark-unpaid + GET-by-id, Luma agent endpoint (direct OpenAI),
  contract template engine.
- **Frontend (React + Tailwind)**:
  - **Interactive admin overview tiles** (clickable, route to filtered pages).
  - **Bookings page** with status filter buttons (URL-query driven).
  - **Editable services**: full CRUD UI for packages and add-ons.
  - **Slide-out invoice drawer** (shared between admin and customer):
    line items, PayID + BSB + reference (with copy buttons),
    booking link, client info (admin only), mark-paid / mark-unpaid,
    quick email to client.
  - **Admin galleries**: booking dropdown auto-links to a session,
    `allow_downloads` toggle, metadata badges (client, package, date,
    invoice ref) on every card and detail view; edit-details flow.
  - **Client galleries**: when `allow_downloads=False`, download buttons are
    hidden, a "Preview gallery — image saving is disabled" notice is shown,
    and the lights-out viewer's download is replaced with a "Preview only"
    lock indicator.
  - **`ProtectedImage` component**: blocks right-click context menu, drag,
    iOS long-press, and applies `user-select:none` + `-webkit-touch-callout:none`
    to every gallery image (thumbnails, covers, full-screen viewer).
  - **Client profile drawer**: Galleries tab added; invoice rows open the
    InvoiceDrawer overlaid on top of the profile drawer.
- **Email notifications (Resend)**: invoices sent from `accounts@invoicing.…`,
  notifications from `donotreply@notifications.…`. Best-effort.
- **AI booking agent (Luma)**: direct `openai` SDK with gpt-4.1, multi-turn
  with `BookingState` in Mongo.
- **Vendor-neutral**: Stripe + `emergentintegrations` removed.
- **Test credentials**: admin `admin@illuminatestudios.com.au / Illuminate2026!`,
  client `client@example.com / client123`.
- **Deployment**: live R2 + Atlas + Railway credentials captured in
  `/app/RAILWAY_ENV_VARS.md` (git-ignored). User can paste straight into
  Railway dashboard.

## Verified by testing agent (iteration 3 — 2026-02-25)
- 13/13 backend tests pass (services CRUD, gallery security, download gating,
  bookings GET-by-id, admin client profile galleries metadata, invoices/mine 200).
- 100% of tested admin frontend flows pass (overview tiles, bookings filter,
  services edit, invoice drawer w/ PayID, gallery form, calendar Plus fix,
  profile drawer + invoice overlay).

## Prioritized backlog
- **P1 (waiting on user)**: Push the captured env vars into Railway dashboard
  and deploy. `/app/RAILWAY_ENV_VARS.md` is ready to paste.
- **P2**: Bulk photo download (zip) for client galleries when `allow_downloads=True`.
- **P2**: Luma "edit-before-finalising" UI for create_booking.
- **P2**: Auto-reconcile PayID payments via bank-feed integration.
- **P2**: Pre-session reminder emails (7 days out).
- **P2**: 1-year anniversary check-in emails.
- **P3**: Photographer multi-user support.
- **P3** (cosmetic): silence the AdminInvoices `<span> in <option>` hydration
  warning; tighten `ServicePackageModel` with `extra='forbid'`.
