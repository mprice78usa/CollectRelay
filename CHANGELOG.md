# Changelog

All notable changes to CollectRelay will be documented in this file.

## [0.13.0] - 2026-03-18

### Added
- **Contact page** (`/contact`) — Contact form with Calendly scheduling embed for Enterprise demos.
- **Terms of Service** (`/terms`) and **Privacy Policy** (`/privacy`) — Legal pages linked from footer.
- **Product screenshots & video** — Real product screenshots throughout marketing site:
  - Homepage hero: iPhone video of client portal experience
  - How It Works: template builder, client portal, and activity feed screenshots
  - Features page: dashboard hero screenshot and inline card screenshots
  - Industry tabs: real project detail and documents screenshots
  - Pro page: photo capture video, dashboard overview, project detail, activity feed
  - All desktop screenshots wrapped in browser chrome frames
- **Pricing FAQ section** — Answers to common questions below the pricing comparison table.
- **Feature card badges** — "New" and "Popular" badges on feature cards for visual hierarchy.

### Changed
- **Homepage shortened** — Removed redundant "Why CollectRelay" section; tightened vertical spacing across all sections.
- **Messaging unified** — All CTAs now say "Get started free" (not "Start trial" or "Get started"). Removed all 14-day trial references; aligned with free-tier-first model.
- **Security wording** — Changed "end-to-end encryption" to "Encrypted in transit (TLS 1.3) and at rest". Changed "enterprise-grade" to "layered security controls".
- **Footer expanded** — Added Terms, Privacy Policy, and Contact links.
- **Nav updated** — "Get started free" CTA. Mobile hamburger menu now includes Log in and Get started free links.
- **Closing CTA updated** — "Contact us" replaces "Book a demo". Trust signals strip added (no credit card, no client accounts, encrypted, audit trail).
- **Social proof** — "Built for professionals" replaces "Trusted by professionals".
- **Contractors page** — Improved subtitle copy; fixed "commission tracking" → "project cost tracking".
- **Pro page** — Single phone video layout (was side-by-side). Added dashboard, project detail, and activity feed screenshots.

### Fixed
- **Mobile nav** — Login/register links were missing from hamburger menu (`.nav-actions` was `display: none` on mobile).
- **Signature pad ink color** — Changed from grey to white for dark theme visibility.
- **Upload API** — Fixed `file.stream()` crash on Cloudflare (switched to `arrayBuffer()`).
- **Signature API** — Fixed unauthorized error in dev mode client portal.
- **Photo note upload** — Fixed production crash from wrong column names.
- **Workers AI vision** — Fixed model license acceptance and image format (base64 data URI).
- **iOS input zoom** — Added `maximum-scale=1` viewport meta and `font-size: 16px` on inputs.
- **AI summary display** — Strip JSON code fences from AI-generated summaries.

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
