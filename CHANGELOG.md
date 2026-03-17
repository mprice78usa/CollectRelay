# Changelog

All notable changes to CollectRelay will be documented in this file.

## [0.12.0] - 2026-03-16

### Added
- **Visual Site Audits** — AI-powered photo analysis for safety and OSHA compliance. Upload a job site photo and get instant findings with severity ratings (critical/warning/info), OSHA references, and recommendations. Includes branded PDF audit reports and relay-to-trade capability.
  - `POST /api/site-audit` — trigger AI analysis on a photo note
  - `GET /api/site-audit/[id]` — poll audit status
  - `GET /api/site-audit/report` — generate branded PDF audit report
  - `POST /api/site-audit/[id]/relay` — relay audit to a trade contact
  - `GET /api/site-audit/history` — list audits for a transaction
- **Offline-First Sync** — Full offline support for field workers in areas with poor connectivity.
  - IndexedDB queue (`idb` library) stores voice notes, photo notes, and text notes when offline
  - Service worker with intelligent caching: cache-first for immutable assets, stale-while-revalidate for static files, network-first for navigation
  - Background Sync API integration with `online` event fallback
  - `X-Sync-Id` header deduplication on all note creation endpoints
  - `OfflineBanner` component showing offline status and pending sync count
  - `sync_log` table for server-side idempotency (migration 0035)
- **Daily Field Log PDF** — One-click PDF report compiling a day's voice notes, photos, and safety audits for a transaction.
  - `GET /api/daily-log/[id]?date=YYYY-MM-DD` — generates branded PDF with embedded images, transcripts, AI analysis, and audit summaries
  - "Daily Log" button on transaction detail page header actions
- **Pro Page Refinements** — Revamped Core Pro Features section with 5 cards (AI Field Intelligence, AI Safety Scout, One-Click Daily Logs, Smart Trade Routing, Resilient Field Sync) plus a Pro Package Summary strip.
- **Photo Notes** — Capture and annotate job site photos with optional AI analysis (migration 0032).
- **Voice Notes** — Record voice memos with AI transcription and task extraction (migration 0030).

### Changed
- Dashboard mortgage rates section now only displays for real_estate industry workspaces.
- Service worker rewritten with full caching strategies (was push-notification-only).
- Transaction detail page now shows voice notes, photo notes, and site audits sections.

### Database Migrations
- `0030_voice_notes` — Voice notes table
- `0031_checklist_voice_note` — Link checklist items to voice notes
- `0032_photo_notes` — Photo notes table
- `0033_checklist_photo_note` — Link checklist items to photo notes
- `0034_site_audits` — Site audits table with severity tracking
- `0035_sync_log` — Offline sync deduplication log

## [0.11.0] - 2026-03-09

### Added
- **Photo Capture & Voice Notes** — Quick Add modal on dashboard for capturing voice and photo notes per transaction.
- **Document Library** — Searchable document storage with AI summaries and attach-from-library on checklist items.
- **Pro Page** (`/pro`) — Dedicated marketing page for Pro tier features.
- **Industry Pages** (`/industries/real-estate`, `/industries/contractors`) — Vertical-specific landing pages.

## [0.10.0] - 2026-03-05

### Added
- **Team Management** (Feature 10) — Workspace members, role management, email invitations with 7-day expiry, invite acceptance flow.
- **Reporting & Analytics** (Feature 9) — Pipeline funnel, commission tracker, completion metrics, activity trends with CSS bar charts, CSV export.

## [0.9.0] - 2026-03-02

### Added
- **Activity Dashboard** (Feature 8) — Real-time notification feed with unseen badges.
- **PWA + Push Notifications** (Feature 7) — Web app manifest, service worker, Web Push via `crypto.subtle` VAPID auth.
- **Bulk Actions** (Feature 6) — Multi-select transactions, bulk ZIP download, Accept All submitted items.

## [0.8.0] - 2026-02-28

### Added
- **Document Library** (Feature 5) — Workspace-wide document storage with categories and AI summaries.
- **White-Label Branding** (Feature 4) — Logo upload, accent color picker, business name for client portal.
- **Onboarding Flow** (Feature 3) — Guided setup with industry selection, template cloning, first transaction creation.

## [0.7.0] - 2026-02-25

### Added
- **Email Notifications** (Feature 2) — Automated emails for submissions, reviews, reminders, and comments.
- **Public API + API Keys** (Feature 1) — REST API at `/api/v1/`, rate limiting, Zapier webhook integration, API key management.

## [0.6.0] - 2026-02-22

### Added
- Stripe integration with checkout, billing portal, and webhook handler.
- Per-seat billing for Team plan with prorated seat changes.
- Pricing page with Free/Pro/Team/Enterprise tiers.

## [0.5.0] - 2026-02-18

### Added
- Client portal with magic link authentication.
- E-signature support (draw and type modes).
- File upload with drag-and-drop and AI summarization.
- Comment threads on checklist items.

## [0.1.0] - 2026-02-10

### Added
- Initial scaffold: SvelteKit + Cloudflare Pages + D1 + R2 + KV.
- Auth system with session cookies.
- Transaction CRUD with template-based checklist creation.
- Dashboard with status cards and recent activity.
