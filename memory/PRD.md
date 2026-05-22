# Illuminate Studios — Photography Management Application

## Original problem statement
> Photography management application with two separate interconnected workflows
> which are authentication and role gated, 'user' (customer-facing) and 'admin'
> (photographer-facing). User also asked for an AI-backed booking agent (Luma)
> that guides prospective clients through the booking process in natural
> language with user-based unique context.

## User personas
- **Photographer (admin)** — runs the studio, manages portfolio, services,
  bookings, client galleries, documents and invoices.
- **Client (customer)** — books a session, reviews & e-signs documents, downloads
  their delivered photos, pays invoices.
- **Prospective lead** — talks to Luma in chat to book a session without an account.

## Core requirements (static)
- JWT-based email/password auth, role-gated (`admin` / `user`).
- Editorial magazine-style design (Cormorant Garamond + Manrope).
- Immersive "lights-out" dark-mode viewer for galleries (hides nav/footer and the
  rest of the page when active).
- Stripe Checkout for invoice payments.
- E-signature for contracts/documents (type-name + timestamp).
- Storage abstraction (`StorageAdapter`) so photo blobs can be swapped from
  MongoDB to S3/Railway-Postgres later.
- Luma AI booking agent per provided spec (`luma.system.ts`, schemas,
  validators, tools).

## What's been implemented (2026-02)
- **Backend (FastAPI)**: JWT auth + bcrypt + cookie sessions, admin seed,
  Mongo-backed storage adapter, services CRUD, bookings CRUD with
  approval workflow, galleries with photo upload/download, e-sign documents,
  invoices, Stripe Checkout via `emergentintegrations`, Luma agent endpoint
  driven by litellm + EMERGENT_LLM_KEY using OpenAI function tools.
- **Frontend (React + Tailwind)**: Landing, Portfolio (with lights-out viewer
  on portfolio images too), Login/Register, public Booking flow,
  Customer dashboard (Bookings / Galleries / Documents / Invoices),
  Customer Gallery viewer with lights-out, Admin dashboard
  (Overview / Bookings / Clients / Galleries / Documents / Invoices /
  Portfolio / Services), floating Luma chat widget on every page.
- **AI booking agent (Luma)**: Python port of the provided spec. Maintains
  `BookingState` in Mongo (`luma_sessions`), executes tools sequentially,
  creates pending bookings tagged `source: "luma"` (admin can approve).
  Handoff requests are stored in `luma_handoffs`.
- **Test credentials**: admin `photographer@illuminatestudios.com / Illuminate2026!`,
  client `client@example.com / client123`.

## Prioritized backlog
- **P1**: replace MongoDB blob storage with the planned Postgres/S3 adapter for
  Railway deploy (already abstracted behind `storage.py`).
- **P1**: Stripe webhook signature verification end-to-end test.
- **P2**: Email notifications (booking received / approved / contract sent).
- **P2**: Admin calendar view (currently bookings list only).
- **P2**: Bulk photo download (zip) for client galleries.
- **P2**: Luma "edit-before-finalising" UI (currently agent finalises directly).
- **P3**: Photographer multi-user support.
