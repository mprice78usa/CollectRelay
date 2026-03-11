# CollectRelay — Implementation Roadmap

*Created: March 11, 2026*

---

## Overview

10 features to implement before launch. Ordered by priority and dependency.
Estimated total: ~8-10 sessions of focused work.

---

## Phase 1: Launch Essentials (Features 1-3)
*Goal: Make the product usable for real users from day one.*

### ✅ Feature 2: Email Delivery — ALREADY DONE
- **Status**: Fully implemented via Resend API
- **Files**: `src/lib/server/email.ts`
- **Covers**: Magic links, submission notifications, review notifications, comment notifications, reminders, partner invites
- **Action**: Verify Resend is configured in production env vars (`EMAIL_API_KEY`, `EMAIL_FROM`)

### Feature 3: Onboarding Flow
- **Scope**: Guide new users to create their first transaction within 5 minutes
- **Effort**: ~1 session
- **Implementation**:
  1. Add `onboarded` boolean column to `users` table (migration 0021)
  2. Create `/app/welcome` route — 3-step onboarding wizard:
     - **Step 1: Profile** — Name, company name, phone (pre-filled from registration)
     - **Step 2: Pick a Template** — Show the 4 starter templates, let them preview
     - **Step 3: Create First Transaction** — Pre-filled form with the selected template, just add client name + email
  3. In `hooks.server.ts` — redirect to `/app/welcome` if `user.onboarded === false`
  4. After first transaction is created, set `onboarded = true`
  5. Add a "Skip" link for users who want to explore on their own
- **Files to create/modify**:
  - `migrations/0021_onboarding.sql`
  - `src/routes/app/welcome/+page.svelte`
  - `src/routes/app/welcome/+page.server.ts`
  - `src/hooks.server.ts` (add redirect check)
  - `src/lib/server/db/users.ts` (add onboarded field)

### Feature 1: Zapier Integration
- **Scope**: Expose a public REST API that Zapier can consume + create a Zapier app
- **Effort**: ~2 sessions (API + Zapier app definition)
- **Implementation**:
  1. **Public API endpoints** (authenticated via API key in header):
     - `GET /api/v1/transactions` — list transactions (with filters)
     - `GET /api/v1/transactions/:id` — get transaction detail
     - `POST /api/v1/transactions` — create transaction from template
     - `GET /api/v1/templates` — list templates
     - `POST /api/v1/webhooks/subscribe` — Zapier subscription endpoint
     - `DELETE /api/v1/webhooks/subscribe/:id` — Zapier unsubscribe
  2. **API key management** in Settings:
     - Generate/revoke API keys (store hashed in DB)
     - Show key once on creation
     - Migration 0022: `api_keys` table (id, workspace_id, key_hash, name, created_at, last_used, revoked_at)
  3. **Zapier app** (can be a private integration initially):
     - Triggers: file_uploaded, item_reviewed, status_changed, signature_submitted, comment_added
     - Actions: create_transaction, send_reminder
     - Auth: API Key in header
  4. **Rate limiting**: Add basic rate limiting middleware (100 req/min per key)
- **Files to create/modify**:
  - `migrations/0022_api_keys.sql`
  - `src/routes/api/v1/transactions/+server.ts`
  - `src/routes/api/v1/transactions/[id]/+server.ts`
  - `src/routes/api/v1/templates/+server.ts`
  - `src/routes/api/v1/webhooks/subscribe/+server.ts`
  - `src/lib/server/db/api-keys.ts`
  - `src/lib/server/api-auth.ts` (middleware)
  - Settings page: API Keys section

---

## Phase 2: Competitive Parity (Features 4-7)
*Goal: Match what competitors offer so users don't churn.*

### Feature 4: White-Label / Custom Branding
- **Scope**: Let Pro/Team users customize the client portal with their logo and colors
- **Effort**: ~1 session
- **Implementation**:
  1. Migration 0023: Add columns to `workspaces` table:
     - `brand_logo_r2_key` (TEXT, nullable)
     - `brand_color` (TEXT, nullable — hex color)
     - `brand_name` (TEXT, nullable — overrides "CollectRelay" in client portal)
  2. Settings page: New "Branding" section
     - Logo upload (stored in R2 under `branding/{workspace_id}/logo.png`)
     - Color picker for accent color
     - Business name override
     - Live preview of client portal header
  3. Client portal (`/c/[token]`): Load workspace branding from transaction → workspace
     - Replace "CollectRelay" logo with custom logo
     - Apply custom accent color via CSS variable
     - Show brand name in header
  4. Free tier: Show "Powered by CollectRelay" footer (keep for viral distribution)
     - Team/Enterprise: Option to remove "Powered by" badge
- **Files to create/modify**:
  - `migrations/0023_branding.sql`
  - `src/routes/app/settings/+page.svelte` (Branding section)
  - `src/routes/app/settings/+page.server.ts` (logo upload action)
  - `src/routes/c/[token]/+layout.server.ts` (load branding)
  - `src/routes/c/[token]/+layout.svelte` (apply branding)

### ✅ Feature 5: Document Library — ALREADY DONE
- **Status**: Fully implemented
- **Files**: `src/lib/server/db/document-library.ts`, `src/routes/app/documents/`
- **Action**: Verify it works end-to-end in production. Consider adding:
  - "Attach from library" button on transaction detail page (link library docs to checklist items)
  - This is a small enhancement, not a full feature build

### Feature 6: Bulk Actions
- **Scope**: Batch operations across transactions and within a transaction
- **Effort**: ~1 session
- **Implementation**:
  1. **Transaction list page** — Add multi-select with checkboxes:
     - Bulk "Send Reminder" (sends reminder to all selected)
     - Bulk "Download All" (creates ZIP of all files across selected transactions)
     - Bulk "Mark In Review" / "Mark Complete"
     - Bulk "Cancel"
  2. **Transaction detail page**:
     - "Download All Files" already exists — ensure it creates a proper ZIP
     - "Accept All Submitted" button — accept all items in submitted status at once
  3. **API endpoint**: `POST /api/transactions/bulk` with action + transaction IDs
  4. **ZIP generation**: Use `@zip.js/zip.js` or stream from R2 into a ZIP response
- **Files to create/modify**:
  - `src/routes/app/transactions/+page.svelte` (multi-select UI)
  - `src/routes/api/transactions/bulk/+server.ts`
  - `src/routes/api/transactions/[id]/download/+server.ts` (ZIP download)

### Feature 7: Client-Side PWA + Push Notifications
- **Scope**: Make client portal installable with push notifications for new messages/status changes
- **Effort**: ~1 session
- **Implementation**:
  1. **PWA manifest** (`static/manifest.json`):
     - App name, icons, theme color, start URL `/c/`
     - Display: standalone
  2. **Service worker** (`static/sw.js`):
     - Cache client portal shell for offline "loading" state
     - Handle push events → show notification
  3. **Web Push** (via Cloudflare Workers + Web Push API):
     - Migration 0024: `push_subscriptions` table (endpoint, keys, client_email, transaction_id)
     - Client portal: "Enable notifications" prompt after first visit
     - Server: Send push when comment added, item reviewed, reminder due
  4. **Client portal UX**:
     - "Add to Home Screen" prompt on mobile
     - Notification badge on items with new activity
- **Files to create/modify**:
  - `static/manifest.json`
  - `static/sw.js`
  - `migrations/0024_push_subscriptions.sql`
  - `src/lib/server/push.ts` (Web Push sending)
  - `src/routes/api/push/subscribe/+server.ts`
  - `src/routes/c/[token]/+layout.svelte` (register SW, prompt)

---

## Phase 3: Differentiation (Features 8-10)
*Goal: Features that make CollectRelay better than alternatives.*

### Feature 8: Activity Dashboard
- **Scope**: Standalone activity feed page with filters, replacing the partial dashboard widget
- **Effort**: ~0.5 session (infrastructure exists)
- **Implementation**:
  1. Create `/app/activity` route
  2. Load all audit events for workspace, grouped by day
  3. Filters: by transaction, by event type, by date range, by actor
  4. Each event links to the relevant transaction/item
  5. Mark-as-read functionality (already have `activity_seen` table)
  6. Real-time updates via the existing activity poller
- **Files to create/modify**:
  - `src/routes/app/activity/+page.svelte`
  - `src/routes/app/activity/+page.server.ts`
  - `src/lib/server/db/audit.ts` (add filtered query)

### Feature 9: Reporting & Analytics
- **Scope**: Business intelligence for agents/team leads
- **Effort**: ~1.5 sessions
- **Implementation**:
  1. Create `/app/reports` route with tabs:
     - **Overview**: Total transactions, completion rate, avg days to complete, active vs completed trend
     - **Pipeline**: Revenue by status, commission forecast, deals by template type
     - **Performance**: Items pending review (aging), client response time, documents per transaction
  2. Aggregate queries on existing tables (transactions, checklist_items, audit_events, files)
  3. Simple chart library (Chart.js or just styled stat cards + bar charts via CSS)
  4. Date range selector (last 7 days, 30 days, 90 days, custom)
  5. Export as CSV
- **Files to create/modify**:
  - `src/routes/app/reports/+page.svelte`
  - `src/routes/app/reports/+page.server.ts`
  - `src/lib/server/db/reports.ts` (aggregate queries)

### Feature 10: Team Management
- **Scope**: Invite team members, assign roles, manage workspace access
- **Effort**: ~1.5 sessions (DB scaffolding exists)
- **Implementation**:
  1. **Settings → Team section**:
     - List current members (name, email, role, joined date)
     - Invite by email (sends invite link)
     - Change role (owner, admin, member)
     - Remove member
  2. **Invite flow**:
     - Migration 0025: `team_invites` table (id, workspace_id, email, role, token, expires_at, accepted_at)
     - `POST /api/team/invite` — create invite + send email
     - `/join/[token]` route — accept invite, create account or link existing
  3. **Role-based access**:
     - Owner: full access + billing + delete workspace
     - Admin: full access except billing and workspace deletion
     - Member: can manage assigned transactions only
  4. **Transaction assignment**:
     - Add `assigned_to` column to transactions
     - Members only see their assigned transactions
     - Admins/owners see all
- **Files to create/modify**:
  - `migrations/0025_team_invites.sql`
  - `src/routes/app/settings/+page.svelte` (Team section)
  - `src/routes/api/team/invite/+server.ts`
  - `src/routes/join/[token]/+page.svelte`
  - `src/routes/join/[token]/+page.server.ts`
  - `src/lib/server/db/team.ts`
  - `src/hooks.server.ts` (role-based access checks)

---

## Implementation Order & Dependencies

```
Phase 1 (Launch Essentials)
├── ✅ Email (done)
├── Feature 3: Onboarding ──────────────────┐
└── Feature 1: Zapier / Public API ─────────┤
                                            │
Phase 2 (Competitive Parity)                │
├── Feature 4: White-Label ─────────────────┤
├── ✅ Document Library (done)              │
├── Feature 6: Bulk Actions ────────────────┤
└── Feature 7: PWA + Push ─────────────────┤
                                            │
Phase 3 (Differentiation)                   │
├── Feature 8: Activity Dashboard ──────────┤
├── Feature 9: Reporting ───────────────────┤
└── Feature 10: Team Management ────────────┘
```

### Suggested Build Order (optimal dependency chain):
1. **Onboarding** (quick win, improves first-run experience)
2. **Activity Dashboard** (builds on existing infrastructure, quick win)
3. **White-Label** (high perceived value, moderate effort)
4. **Bulk Actions** (quality of life, moderate effort)
5. **Public API + API Keys** (foundation for Zapier)
6. **Zapier App** (depends on #5)
7. **PWA + Push** (standalone, no dependencies)
8. **Reporting** (standalone, needs data to be meaningful)
9. **Team Management** (complex, save for last)

---

## Post-Implementation: Launch Plan
*See LAUNCH-PLAN.md (to be created after features are complete)*

- Pricing page implementation
- Landing page refinements
- "Powered by CollectRelay" viral footer
- Initial outreach strategy
- Beta user program
