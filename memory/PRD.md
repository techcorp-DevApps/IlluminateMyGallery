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
  their delivered photos, pays invoices via PayID.
- **Prospective lead** — talks to Luma in chat to book a session without an account.

## Core requirements (static)
- JWT-based email/password auth, role-gated (`admin` / `user`).
- Editorial magazine-style design (Cormorant Garamond + Manrope).
- Immersive "lights-out" dark-mode viewer for galleries.
- **PayID-first invoice payments** (Australian instant payments). No Stripe.
- E-signature for contracts/documents (type-name + timestamp).
- Storage abstraction (`StorageAdapter`) so blobs can be swapped from
  MongoDB to Postgres + S3 later.
- Luma AI booking agent per provided spec (`luma.system.ts`, schemas,
  validators, tools).
- Vendor-neutral: no Emergent runtime dependencies in production path.
- Resend transactional emails sent from task-specific subdomains.
- Contract template pack: 5 photography agreements + portfolio release,
  auto-filled from client + booking.

## What's been implemented (2026-02)
- **Backend (FastAPI)**: JWT auth + bcrypt + cookie sessions + `/api/auth/refresh`,
  admin seed, Mongo-backed `StorageAdapter`, services CRUD, bookings CRUD with
  approval workflow, galleries with photo upload/download, e-sign documents,
  PayID invoices with auto-generated references (`INV-YYYY-NNNN`) + admin mark-paid,
  Luma agent endpoint driven by litellm + OpenAI gpt-4.1 (your key) with optional
  Emergent fallback, contract template engine that fills `[Placeholder]` fields
  from client + booking data.
- **Contract templates** (verbatim from uploaded .docx):
  Family Portrait, Anniversary & Couples, Kids Birthday, Event, Wedding,
  Optional Portfolio & Marketing Release — shared T&Cs in `_shared_terms.md`,
  per-template specs in `contracts/templates.py`.
- **Frontend (React + Tailwind)**: Landing, Portfolio, Login/Register,
  public Booking flow, Customer dashboard (Bookings / Galleries / Documents /
  Invoices with PayID + BSB + copy-able reference), Customer Gallery viewer
  with lights-out, Admin dashboard (Overview / Calendar / Bookings / Clients /
  Galleries / Documents [template + custom] / Invoices [auto-from-booking +
  manual + mark-paid] / Portfolio / Services), floating Luma chat widget.
- **Email notifications (Resend)**: invoices sent from `accounts@invoicing.…`,
  notifications from `donotreply@notifications.…`. Best-effort: failures logged
  but never crash the underlying create/update.
- **AI booking agent (Luma)**: Python port of the provided spec. Multi-turn
  with `BookingState` in Mongo, OpenAI gpt-4.1 with tool calling, creates
  pending bookings tagged `source: "luma"` + emails admin.
- **Vendor-neutral**: Stripe removed entirely (PayID flow), `stripe` and
  `emergentintegrations` uninstalled. Only Emergent reference left is an
  optional LLM-key fallback block in `luma/agent.py` (clearly marked, deletable).
- **Test credentials**: admin `photographer@illuminatestudios.com / Illuminate2026!`,
  client `client@example.com / client123`.

## Prioritized backlog
- **P1 (waiting on user)**: Railway deploy. See `/app/RAILWAY_DEPLOY.md` for
  full step-by-step + env var list. Recommended path: Mongo Atlas + Cloudflare R2
  (no code change). Postgres swap is a follow-up if you want it later.
- **P2**: Bulk photo download (zip) for client galleries.
- **P2**: Luma "edit-before-finalising" UI for create_booking.
- **P2**: Auto-reconcile PayID payments via bank-feed integration (manual
  mark-paid works today).
- **P2**: Pre-session reminder emails (7 days out) — quiet revenue lift.
- **P3**: Photographer multi-user support.
