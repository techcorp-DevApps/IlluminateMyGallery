---
title: "IlluminateMyGallery Scaling Report"
subtitle: "MongoDB, Cloudflare R2, Gallery Delivery, and Burst-Access Requirements"
project: "IlluminateMyGallery"
company: "Illuminate Studios"
prepared_for: "Development Team"
document_type: "Technical Scaling Report"
version: "1.0"
---

# IlluminateMyGallery Scaling Report

## MongoDB, Cloudflare R2, Gallery Delivery, and Burst-Access Requirements

Prepared for the **IlluminateMyGallery** development team.

---

## 1. Executive Summary

IlluminateMyGallery should be treated as a **high-resolution, burst-access photography gallery platform**, not simply a standard CRUD application with file uploads.

The application is being purpose-built for **Illuminate Studios**, a photography business that requires:

- Admin-side studio management
- Client-facing gallery delivery
- AI-assisted booking workflows
- Contracts
- Invoices
- Secure image storage
- High-speed gallery viewing
- Strong performance during burst-access events

The most important scale correction is that full-resolution images are expected to average **25–40 MB per image**, and galleries may be accessed by many users in a short time window, especially after shoots involving:

- Early childcare centres
- Schools
- Events
- Group photography sessions
- High-volume client releases

The system must therefore be designed around:

```txt
MongoDB stores metadata.
Cloudflare R2 stores image objects.
Cloudflare cache/CDN serves gallery media.
The backend authorizes, signs, paginates, and audits.
The backend must not stream image bytes.
```

---

## 2. Known Company and Product Context

### Company

The company branding should be standardized as:

```txt
Illuminate Studios
```

The application has been discussed as:

```txt
IlluminateMyGallery
LensFlow
Photography studio management app
Client management and photographer portal
```

For production and dev-team alignment, **IlluminateMyGallery** should be treated as the application name and **Illuminate Studios** as the operating business/brand.

---

## 3. Product Purpose

IlluminateMyGallery is a photography studio management and delivery platform with two distinct surfaces.

### Admin Cockpit

The admin cockpit supports internal studio operations:

- Bookings
- Booking requests
- Client management
- Galleries
- Contracts
- Invoices
- Checklists
- Reminders
- Service/package management
- AI booking assistant oversight
- Upload and delivery management

### Client/Public Surface

The client-facing surface supports:

- Public booking request flow
- AI booking assistant
- Gallery viewing
- Contract signing
- Invoice viewing
- Payment instructions
- Booking status pages
- Token-based gallery/document access

---

## 4. Operational Scale Classification

Illuminate Studios should be treated as a **boutique-to-growing photography studio** with professional operational requirements.

It is not yet a multi-tenant SaaS marketplace, but the platform must support **media-heavy delivery** and **short-term high-concurrency gallery access**.

### Correct Scale Model

| Area | Expected Scale |
|---|---:|
| Business type | Single photography studio |
| Admin users | 1–5 initially |
| Staff/admin growth | 5–20 |
| Clients/contacts | Hundreds initially, thousands over time |
| Bookings/month | 20–100 realistic production range |
| Galleries/month | 10–40 launch/growth range |
| Images/gallery | 300–1,000 common range |
| Full-resolution image size | 25–40 MB |
| Storage backend | Cloudflare R2 |
| Metadata backend | MongoDB |
| Hosting | Railway backend + React/Vite frontend |
| AI assistant | Backend-mediated OpenAI Responses API |

---

## 5. Critical Scaling Correction

The previous lower-scale assumption must be replaced.

### Updated Assumptions

```txt
Camera/source workflow: Canon EOS R-series workflow, user stated Canon EOS R2
Full-resolution image size: 25–40 MB average
Gallery access pattern: burst-heavy
High-risk gallery types: childcare, school, events, large group shoots
Primary scale risk: concurrent gallery viewing and media delivery
Secondary scale risk: cumulative object storage growth
```

The application should not serve full-resolution images for standard browsing.

Full-resolution files should be reserved for explicit, permissioned download workflows only.

---

## 6. Revised Image Size Model

| Asset Variant | Expected Size |
|---|---:|
| Thumbnail WebP | 80–250 KB |
| Gallery preview WebP/JPEG | 1.5–5 MB |
| High-quality web preview | 4–8 MB |
| Full-resolution JPEG | 25–40 MB |
| RAW/original archival, if stored | 40–100+ MB |

### Required Image Variants

For each uploaded image, the platform should support:

```txt
1. Original/full-resolution image
2. Optimized gallery preview
3. Thumbnail
4. Optional download-safe derivative
```

### Recommended Derivative Sizes

```txt
original: 25–40 MB
preview: 2–5 MB
thumbnail: 100–250 KB
download derivative, optional: 8–15 MB
```

The gallery grid, lightbox, and childcare/school parent viewing flows must use **thumbnails and previews only**.

---

## 7. Revised Per-Gallery Storage Estimates

### Small Portrait Gallery

```txt
100 images
original avg: 32 MB
preview avg: 3 MB
thumbnail avg: 0.2 MB

Storage:
100 × 35.2 MB = 3.52 GB/gallery
```

### Standard Client Gallery

```txt
300 images
original avg: 32 MB
preview avg: 3 MB
thumbnail avg: 0.2 MB

Storage:
300 × 35.2 MB = 10.56 GB/gallery
```

### School / Childcare Gallery

```txt
800 images
original avg: 32 MB
preview avg: 3 MB
thumbnail avg: 0.2 MB

Storage:
800 × 35.2 MB = 28.16 GB/gallery
```

### Large Event / School Batch

```txt
1,500 images
original avg: 32 MB
preview avg: 3 MB
thumbnail avg: 0.2 MB

Storage:
1,500 × 35.2 MB = 52.8 GB/gallery/batch
```

A single childcare, school, or large group shoot may therefore consume **25–55 GB** after originals and derivatives are stored.

---

## 8. Revised Monthly R2 Storage Growth

### Conservative Launch

```txt
10 galleries/month
300 images/gallery
35.2 MB total per image

Monthly growth:
10 × 300 × 35.2 MB = 105.6 GB/month
```

### Realistic Production

```txt
25 galleries/month
400 images/gallery
35.2 MB total per image

Monthly growth:
25 × 400 × 35.2 MB = 352 GB/month
```

### School / Childcare-Heavy Month

```txt
10 standard galleries/month
300 images/gallery
+
5 childcare/school galleries/month
1,000 images/gallery

Total images:
3,000 + 5,000 = 8,000 images

Monthly growth:
8,000 × 35.2 MB = 281.6 GB/month
```

### High-Volume Month

```txt
40 galleries/month
600 images/gallery
35.2 MB total per image

Monthly growth:
40 × 600 × 35.2 MB = 844.8 GB/month
```

### 12-Month Cumulative Estimate

| Scenario | Monthly Growth | 12-Month Storage |
|---|---:|---:|
| Conservative launch | ~106 GB | ~1.27 TB |
| Realistic production | ~352 GB | ~4.22 TB |
| Childcare/school-heavy | ~282 GB | ~3.38 TB |
| High-volume | ~845 GB | ~10.14 TB |

---

## 9. R2 Cost Envelope

Using Cloudflare R2 Standard storage pricing assumptions of approximately **$0.015/GB-month**, the rough storage cost envelope is:

| Stored Data | Approx Monthly Storage Cost |
|---:|---:|
| 1 TB | ~$15/month |
| 3 TB | ~$45/month |
| 5 TB | ~$75/month |
| 10 TB | ~$150/month |
| 25 TB | ~$375/month |

This excludes operation charges.

For this product, **read operations, cache strategy, and burst delivery architecture** are more important than raw storage cost.

---

## 10. Burst-Access Gallery Viewing Requirement

School and childcare galleries create a different traffic pattern from normal private client galleries.

### Typical Burst Pattern

```txt
Gallery published at a known time
Parents receive link by email/SMS
Many users open the same gallery within 5–60 minutes
Users browse thumbnails quickly
Users open previews/lightbox
Some users download selected images
```

This is **burst traffic**, not steady-state traffic.

### Revised Concurrency Targets

| Scenario | Concurrent Users |
|---|---:|
| Normal client gallery | 5–20 |
| Popular event gallery | 25–100 |
| Childcare/school gallery release | 100–500 |
| Large school / viral share window | 500–1,500 |
| Future hardening target | 2,000+ |

### Production Target

```txt
Minimum: 250 concurrent gallery viewers
Preferred: 500 concurrent gallery viewers
Future-ready: 1,000+ concurrent gallery viewers
```

The backend must not be in the critical path for every image read.

---

## 11. Required Delivery Architecture

### Correct Architecture

```txt
Browser/client
  ↓
App backend for auth, gallery metadata, signed access
  ↓
Cloudflare R2 + Cloudflare cache/custom domain for media delivery
```

### Incorrect Architecture

```txt
Browser/client
  ↓
Railway backend
  ↓
Backend streams image bytes from R2
  ↓
Browser/client
```

The backend should authorize access and issue URLs, but image bytes should be delivered by Cloudflare.

---

## 12. R2 + CDN Configuration Requirements

### Required

```txt
Use Cloudflare custom domain for gallery media
Use cacheable optimized derivatives
Use long cache TTLs for immutable image keys
Use signed URLs or signed cookies for private gallery access
Use non-guessable object keys
Do not expose bucket listing
Do not use full-resolution originals for normal browsing
```

### Recommended Media Domains

```txt
media.illuminatestudios.com.au
cdn.illuminatestudios.com.au
galleries.illuminatestudios.com.au
```

### Cache Strategy for Immutable Derivatives

```http
Cache-Control: public, max-age=31536000, immutable
```

### Cache Strategy for Private/Tokenized Access

```http
Cache-Control: private, max-age=300
```

### Cache Strategy for Signed CDN URLs

```http
Cache-Control: public, max-age=86400
```

### Recommended Object Key Structure

```txt
prod/galleries/{gallery_id}/assets/{asset_id}/preview-v1.webp
prod/galleries/{gallery_id}/assets/{asset_id}/thumb-v1.webp
prod/galleries/{gallery_id}/assets/{asset_id}/download-v1.jpg
prod/galleries/{gallery_id}/assets/{asset_id}/original.jpg
```

If an image is regenerated, create a new versioned derivative:

```txt
preview-v2.webp
thumb-v2.webp
```

Avoid overwriting existing derivative keys unless cache purge logic is implemented.

---

## 13. Gallery Viewing Performance Requirements

### Gallery Metadata API

The backend should return lightweight, paginated gallery metadata.

Example response shape:

```json
{
  "gallery_id": "gal_...",
  "title": "Little Stars Childcare 2026",
  "asset_count": 850,
  "assets": [
    {
      "asset_id": "img_...",
      "width": 4000,
      "height": 6000,
      "thumb_url": "https://media.example.com/thumb-v1.webp",
      "preview_url": "https://media.example.com/preview-v1.webp",
      "download_enabled": true
    }
  ],
  "pagination": {
    "next_cursor": "..."
  }
}
```

Do not send all gallery asset records for large galleries in one payload.

### Required Pagination

```txt
Initial gallery load: 40–80 assets
Next page size: 40–100 assets
Admin upload review: 100–250 assets
Never load 1,000+ asset metadata records into the initial client page
```

### Frontend Requirements

```txt
Virtualized image grid
Lazy-loaded thumbnails
Responsive srcset
Lightbox prefetch: current image + next 2 only
No full-res preloading
No eager loading entire gallery
Abort stale image requests when user scrolls quickly
Skeleton states for thumbnails
Retry handling for failed image loads
```

---

## 14. Burst Scenario Calculations

### Childcare Gallery Release

Assumptions:

```txt
Gallery: 1,000 images
Parents/users: 300
Burst window: first 30 minutes

Each user views:
- 150 thumbnails
- 20 previews
- 5 downloads
```

Approximate optimized media transfer:

```txt
Thumbnails:
300 × 150 × 0.2 MB = 9,000 MB = 9 GB

Previews:
300 × 20 × 3 MB = 18,000 MB = 18 GB

Downloads:
300 × 5 × 32 MB = 48,000 MB = 48 GB

Total burst transfer:
~75 GB in 30 minutes
```

If full-resolution images were used for normal viewing:

```txt
300 × 150 × 32 MB = 1,440,000 MB = 1.44 TB
```

This is why full-resolution files must be isolated to explicit downloads only.

### Large School Release

Assumptions:

```txt
Gallery/batch: 2,000 images
Users: 1,000
Burst window: 1 hour

Each user views:
- 200 thumbnails
- 30 previews
- 10 downloads
```

Optimized media transfer:

```txt
Thumbnails:
1,000 × 200 × 0.2 MB = 40 GB

Previews:
1,000 × 30 × 3 MB = 90 GB

Downloads:
1,000 × 10 × 32 MB = 320 GB

Total burst transfer:
~450 GB in 1 hour
```

This workload must be pushed to Cloudflare edge delivery instead of the application backend.

---

## 15. MongoDB Scaling Requirements

MongoDB should store **business metadata only**, not image binaries.

### MongoDB Should Store

```txt
asset metadata
R2 object keys
image dimensions
file size
MIME type
sort order
visibility
download permissions
processing status
audit metadata
booking metadata
client metadata
contract metadata
invoice metadata
AI booking session metadata
```

### MongoDB Must Not Store

```txt
image binaries
base64 image payloads
large embedded gallery arrays
RAW files
PDF binaries
downloadable file content
```

---

## 16. Recommended MongoDB Collections

```txt
users
clients
booking_requests
bookings
services
service_packages
availability_rules
availability_holds
galleries
gallery_assets
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

---

## 17. Gallery Asset Document Estimates

The larger full-resolution image size does not significantly increase MongoDB storage if the database stores only metadata.

However, childcare and school galleries increase asset document count.

| Scenario | Asset Docs / Year |
|---|---:|
| Launch | 50,000–300,000 |
| Realistic production | 300,000–1,500,000 |
| School/childcare-heavy | 1,000,000–5,000,000 |
| Future multi-school scale | 5,000,000–20,000,000+ |

---

## 18. Required MongoDB Indexes

```js
db.gallery_assets.createIndex({ gallery_id: 1, sort_order: 1 })
db.gallery_assets.createIndex({ gallery_id: 1, visibility: 1, sort_order: 1 })
db.gallery_assets.createIndex({ gallery_id: 1, created_at: -1 })
db.gallery_assets.createIndex({ asset_id: 1 }, { unique: true })
db.gallery_assets.createIndex({ r2_original_key: 1 }, { unique: true })
```

### Required Query Pattern

Use cursor pagination:

```http
GET /api/galleries/:galleryId/assets?limit=80&cursor=...
```

Avoid returning every asset in a 1,000–2,000 image gallery from a single endpoint call.

---

## 19. MongoDB Cluster Recommendation

### Production Launch

```txt
MongoDB Atlas M10 minimum
Backups enabled
Point-in-time recovery enabled where available
Separate staging and production databases
Strict network access controls
Indexes created through migration/bootstrap scripts
```

### Growth Thresholds for M20/M30 Review

Review upgrade from M10 to M20/M30 when any of the following occur:

```txt
Database size > 10–20 GB
Sustained query latency > 150–250 ms on indexed queries
Gallery asset metadata exceeds 1M documents
Admin dashboards become aggregation-heavy
AI chat/session collections exceed 500k active/recent documents
Write volume regularly exceeds current tier comfort
```

---

## 20. Upload and Processing Pipeline Requirements

Because full-resolution files are 25–40 MB each, upload handling must be designed for resilience.

### Required Upload Flow

```txt
Client requests upload intent
Backend validates admin/session/role
Backend creates gallery_asset placeholder
Backend returns presigned upload URL
Client uploads directly to R2
Client confirms upload completion
Backend verifies object exists
Backend queues derivative generation
Backend marks asset processing status
Admin UI shows upload/processing state
```

### Required Upload Capabilities

```txt
Direct-to-R2 uploads only
Multipart upload support for large/batch uploads
Upload queue with progress tracking
Batch upload resume/retry
Server-side asset records created before upload
Post-upload verification
Async derivative generation
Processing status visible in admin UI
```

### Recommended Processing States

```txt
created
uploading
uploaded
processing
ready
failed
archived
deleted
```

### Required Asset Outputs

For each original:

```txt
thumb-v1.webp
preview-v1.webp
download-v1.jpg, optional
original preserved
```

---

## 21. Authentication and Authorization Requirements

### Minimum Roles

```txt
admin
user/client
```

### Recommended Future Roles

```txt
owner
admin
editor
assistant
client
```

### Non-Negotiable Security Rules

```txt
Public visitors must not access admin routes.
Client users must not access admin components.
Users must not be able to change their own role.
Role assignment must be admin-only.
Admin APIs must use backend authorization, not only frontend hiding.
Token-based gallery/contract access must be server-generated.
Token secrets must be hashed at rest.
```

### Token Storage

Do not store raw access tokens.

Store:

```txt
access_token_hash
access_token_expires_at
last_accessed_at
revoked_at
```

---

## 22. AI Booking Assistant Requirements

The AI booking assistant, **Luma**, should not directly perform writes from the client.

The backend should own:

```txt
session state
milestone validation
booking creation
email sending
availability holds
side effects
tool execution
```

### Required State Collections

```txt
ai_booking_sessions
ai_booking_messages
availability_holds
email_outbox
booking_requests
bookings
```

### Backend Gates

```txt
Required fields must be validated server-side.
Booking creation must be idempotent.
Email confirmation must be sent through an outbox pattern.
Availability holds must expire automatically.
The model must not decide authorization.
The model must not send email directly.
The model must not create confirmed bookings without backend validation.
```

### Recommended Retention

```txt
Incomplete AI booking sessions: expire after 7–30 days
Availability holds: expire after 10–30 minutes
Email outbox records: retain 90–365 days
Audit logs: retain 1–7 years depending legal/compliance preference
```

---

## 23. Contract and Invoice Scaling Requirements

### Contracts

Contracts should be versioned. Signed contract content must not be overwritten.

Recommended model:

```txt
contract_templates
contracts
contract_signatures
contract_events
```

Each signed contract should preserve:

```txt
template_version
rendered_html_snapshot
signed_pdf_r2_key
signature_timestamp
signer_name
signer_email
ip_address
user_agent
audit_events
```

### Invoices

Invoices should be immutable after issue except through explicit adjustment or void records.

Recommended model:

```txt
invoices
invoice_line_items
invoice_events
payment_references
```

For PayID-style workflows, store:

```txt
payment_reference
amount_due
amount_paid
payment_status
manual_reconciliation_status
admin_notes
```

Do not assume automatic PayID reconciliation unless a banking/payment integration is explicitly implemented.

---

## 24. Performance Targets

### Admin Dashboard

| Action | Target |
|---|---:|
| Dashboard initial backend response | < 1.5 s |
| Booking list query | < 300 ms indexed |
| Client search | < 300 ms indexed |
| Gallery metadata load | < 500 ms |
| Invoice list query | < 300 ms |
| Contract status query | < 300 ms |

### Client Gallery

| Action | Target |
|---|---:|
| Gallery landing load | < 1.5 s |
| First thumbnail render | < 2 s |
| Pagination/infinite load API response | < 500 ms |
| Signed URL generation | < 300 ms |
| Full-res download authorization | < 500 ms |

### AI Booking Assistant

| Action | Target |
|---|---:|
| First streamed token | < 1.5 s target |
| Tool-gated booking write | < 1 s excluding email |
| Email outbox enqueue | < 300 ms |
| Booking confirmation visible | Immediate after backend write |

---

## 25. Caching Strategy

Use caching for read-heavy public/client surfaces, not for sensitive mutable admin writes.

### Recommended Cache Targets

```txt
service/package listings
public availability summaries
gallery metadata pages
signed URL short TTL cache
admin dashboard summary cards
AI service snapshot context
```

### Avoid Caching

```txt
auth session state without invalidation
role/permission changes
payment status
contract signature state
booking write flows
```

### Suggested TTLs

| Data | TTL |
|---|---:|
| Service list | 5–30 min |
| Public package list | 5–30 min |
| Gallery metadata | 1–5 min |
| Signed URLs | 5–15 min |
| Dashboard stats | 30–120 sec |
| Availability summary | 30–120 sec |

---

## 26. Observability Requirements

### Minimum Production Events

```txt
booking_request.created
booking.approved
gallery.created
gallery.published
gallery.asset_uploaded
gallery.asset_processed
gallery.asset_failed
contract.sent
contract.signed
invoice.issued
invoice.marked_paid
email.queued
email.sent
email.failed
ai_booking_session.started
ai_booking_session.completed
auth.login_failed
auth.role_denied
```

### Metrics to Track

```txt
R2 storage total GB
R2 object count
R2 Class A operations
R2 Class B operations
MongoDB database size
MongoDB slow queries
MongoDB index usage
AI session completion rate
Booking conversion rate
Email failure rate
Gallery view count
Gallery burst concurrency
Contract signature completion rate
Invoice paid/overdue rate
```

---

## 27. Data Retention Policy

Recommended baseline:

| Data Type | Retention |
|---|---:|
| Client profile | Until deletion request / business policy |
| Booking records | 7 years |
| Invoice records | 7 years |
| Signed contracts | 7 years |
| Email outbox logs | 1 year |
| AI chat transcripts | 90–365 days |
| Availability holds | TTL expiry |
| Gallery images | Configurable per package |
| Audit logs | 1–7 years |

### Gallery Retention Should Be Productized

```txt
Standard gallery hosting: 6–12 months
Extended hosting: paid add-on
Archived gallery restore: admin-only
```

---

## 28. Recommended Launch Configuration

### MongoDB

```txt
Provider: MongoDB Atlas
Production tier: M10 minimum
Growth path: M20/M30
Staging: separate cluster or separate database/project
Backups: enabled
Indexes: migration/bootstrap managed
Connection pooling: enabled
Secrets: Railway environment variables
```

### Cloudflare R2

```txt
Buckets:
- illuminate-prod-private
- illuminate-prod-public
- illuminate-staging-private
- illuminate-staging-public

Access:
- Backend-only R2 credentials
- Presigned URLs for uploads/downloads
- No public bucket listing
- Non-guessable object keys
- Custom domain/CDN for optimized media delivery
```

### Railway Backend

The backend owns:

```txt
Auth
Role checks
Booking creation
Gallery permissions
Contract signing gates
Invoice state
AI tool execution
Email sending
R2 signed URL generation
Upload intent creation
Derivative processing orchestration
Audit logging
```

### Frontend

React/Vite should support:

```txt
Public landing
Booking chat
Client gallery
Contract signing
Invoice/payment page
Admin cockpit
Virtualized gallery grid
Lazy-loaded thumbnail/preview rendering
```

Expo React Native, if used, should:

```txt
Call backend only
Never call OpenAI directly
Never access R2 credentials
Use backend-issued URLs only
Respect role-gated surfaces
```

---

## 29. Build Priorities for Dev Team

### Priority 1 — Structural Safety

```txt
Enforce admin/client route split.
Protect all admin APIs with backend role checks.
Remove client-side-only authorization assumptions.
Prevent user role self-escalation.
Hash token-based access secrets.
```

### Priority 2 — Storage Foundation

```txt
Implement R2 adapter.
Implement direct-to-R2 presigned uploads.
Implement gallery asset metadata collection.
Generate thumbnails/previews.
Store only metadata in MongoDB.
Add object key versioning.
Add R2 object lifecycle/retention strategy.
```

### Priority 3 — Gallery Burst Performance

```txt
Use Cloudflare custom-domain cached delivery.
Serve thumbnails/previews for browsing.
Avoid full-resolution image browsing.
Implement cursor-paginated asset APIs.
Implement virtualized image grid.
Implement lazy loading and responsive image sizes.
Add burst traffic monitoring.
```

### Priority 4 — Booking System

```txt
Move Luma booking flow to backend-owned state machine.
Add required-field gates.
Add availability holds.
Add idempotent booking creation.
Add email outbox.
Add admin approval flow.
```

### Priority 5 — Contracts and Invoices

```txt
Version contract templates.
Snapshot signed contract content.
Generate signed PDF into R2.
Add invoice numbering.
Add PayID/manual reconciliation status.
Add invoice event history.
```

### Priority 6 — Scale and Operations

```txt
Add database indexes.
Add slow-query monitoring.
Add R2 storage metrics.
Add R2 operation metrics.
Add CDN/cache analytics.
Add admin dashboard performance metrics.
Add audit log.
Add backup/restore runbook.
```

---

## 30. Revised Production Launch Targets

The dev team should build against the following baseline.

```txt
Clients/contacts: 1,000–5,000
Bookings/month: 20–100
Galleries/month: 10–40
Images/gallery: 300–1,000
Full-res image size: 25–40 MB
Monthly R2 growth: 100–850 GB
12-month R2 storage: 1.2–10 TB
MongoDB asset docs/year: 50k–1.5M
Concurrent gallery viewers: 250–500
Burst-hardening target: 1,000 concurrent gallery viewers
```

---

## 31. Revised 12–24 Month Growth Target

```txt
Clients/contacts: 10,000–30,000
Bookings/month: 100–300
Galleries/month: 40–150
Images/gallery: 500–1,500
Full-res image size: 25–40 MB
Monthly R2 growth: 1–5 TB
12-month R2 storage growth: 12–60 TB
MongoDB asset docs/year: 1.5M–10M
Concurrent gallery viewers: 1,000–2,000
Burst-hardening target: 5,000 concurrent gallery viewers
```

At this point, review:

```txt
MongoDB Atlas M20/M30+
Dedicated background worker service
Queue-based image processing
Cloudflare cache analytics
R2 operation volume
Gallery-specific rate limiting
Regional latency
```

---

## 32. Final Dev-Team Instruction

IlluminateMyGallery must be implemented as a **high-resolution, burst-access gallery platform**.

The central architecture rule is:

```txt
MongoDB stores metadata.
R2 stores image objects.
Cloudflare cache serves gallery media.
The backend authorizes, signs, paginates, and audits.
The backend does not stream image bytes.
```

For school and childcare use cases, the system must absorb hundreds of users opening the same gallery in a short window.

The only safe architecture is:

```txt
Optimized derivatives
CDN-backed delivery
Lazy loading
Cursor pagination
Virtualized gallery rendering
Strict avoidance of full-resolution browsing
Direct-to-R2 upload workflows
Async image processing
```

The revised minimum production target should be:

```txt
500 concurrent gallery viewers
1,000-image galleries
25–40 MB full-resolution originals
100–850 GB/month new R2 storage
1M+ gallery asset records/year
Cloudflare custom-domain cached media delivery
Direct-to-R2 uploads
Async derivative generation
Cursor-paginated gallery assets
```

This is the correct scaling posture for IlluminateMyGallery given the full-resolution image size and school/childcare burst-access requirement.
