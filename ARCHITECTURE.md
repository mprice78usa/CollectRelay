# CollectRelay Architecture

## Overview

CollectRelay is a SvelteKit application deployed on Cloudflare Pages with Workers. It uses Cloudflare's edge infrastructure for compute, storage, and AI.

## Infrastructure

| Service | Purpose | Binding |
|---------|---------|---------|
| **Cloudflare Pages** | Hosting + SSR | — |
| **D1 (SQLite)** | Primary database | `DB` |
| **R2** | File/image storage | `FILES_BUCKET` |
| **KV** | Session store | `SESSIONS` |
| **Workers AI** | Vision model for photo analysis | `AI` |
| **Claude API** | Advanced AI processing (audits, summaries) | env `CLAUDE_API_KEY` |

## Authentication

Three auth paths, all handled in `hooks.server.ts`:

1. **Pro users** (`/app/*`) — Email/password → session cookie → KV lookup. Redirects to `/login` if unauthenticated.
2. **Client portal** (`/c/[token]`) — Magic link with signed token. No account needed.
3. **API consumers** (`/api/v1/*`) — Bearer token with `cr_live_` prefix API keys. SHA-256 hashed, stored in `api_keys` table.

Dev mode: `hooks.server.ts` bypasses auth when `import.meta.env.DEV` is true, injecting a mock user.

## Database Schema

35 migrations in `migrations/` (0001–0035). Key tables:

### Core
- `users` — Email, name, password hash
- `workspaces` — Multi-tenant container with branding, plan, industry
- `workspace_members` — User↔workspace with role (owner/admin/member)
- `transactions` — Deals/projects with status lifecycle
- `checklist_items` — Template-derived items per transaction
- `files` — Uploaded documents linked to checklist items
- `templates` / `template_items` — Reusable checklists

### Field Capture
- `voice_notes` — Audio recordings with transcripts and AI-extracted actions
- `photo_notes` — Site photos with titles, notes, AI descriptions
- `site_audits` — AI safety analysis results per photo (findings, severity, OSHA refs)

### Activity & Communication
- `comments` — Threaded discussions per checklist item
- `audit_events` — Immutable activity timeline
- `notifications` — Push notification records
- `push_subscriptions` — Web Push endpoint storage

### Offline & Sync
- `sync_log` — Idempotency table for offline sync deduplication

### Billing
- `api_keys` — REST API authentication
- Stripe fields on `workspaces` (customer ID, subscription, plan, seats)

## Server Modules

### PDF Builders (`src/lib/server/`)

All use `pdf-lib` with consistent patterns: US Letter (612×792), 50px margins, Helvetica fonts, accent color `#4a7af5`.

| Module | Purpose |
|--------|---------|
| `daily-log-builder.ts` | Daily field log — voice notes, photos, audits |
| `audit-report-builder.ts` | Safety audit report with findings and severity |
| `report-builder.ts` | Site observation report with photo gallery |
| `pdf-builder.ts` | Generic template document with fields and signatures |
| `pdf-convert.ts` | Image-to-PDF conversion utility |

### AI Processing (`src/lib/server/`)

| Module | Purpose |
|--------|---------|
| `audit-processing.ts` | Site safety audit pipeline (Workers AI vision → Claude API) |
| `ai-summary.ts` | Document/file AI summarization |

### Database Functions (`src/lib/server/db/`)

Query functions organized by domain: `transactions.ts`, `files.ts`, `comments.ts`, `collaborators.ts`, `activity.ts`, `milestones.ts`, `partner-links.ts`, `document-library.ts`, `reports.ts`.

## Offline Architecture

### Client Side (`src/lib/offline/`)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Quick Add   │────▶│  IndexedDB   │────▶│  Sync Engine │
│  (capture)   │     │  (idb queue) │     │  (sync.ts)   │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                 │
                    ┌──────────────┐              │
                    │  Status      │◀─────────────┘
                    │  (.svelte.ts)│
                    └──────────────┘
```

- **`db.ts`** — IndexedDB schema with `sync-queue` and `app-state` stores via `idb`
- **`sync.ts`** — Sync engine: replays queued items when online, rebuilds FormData from stored ArrayBuffers
- **`status.svelte.ts`** — Reactive state (Svelte 5 runes): `isOnline`, `pendingSyncCount`, `isSyncing`

### Service Worker (`static/sw.js`)

| Request Type | Strategy |
|-------------|----------|
| `/_app/immutable/` | Cache-first (content-hashed) |
| Static assets (png, svg, woff2) | Stale-while-revalidate |
| Navigation | Network-first → cached → offline page |
| `/api/*` | Network-only |

Background Sync: Listens for `cr-sync-queue` tag, posts `SYNC_REQUESTED` to client windows.

### Server Deduplication

All note creation endpoints check `X-Sync-Id` header against `sync_log` table. If duplicate, returns existing record instead of creating a new one.

## API Routes

### Public API (`/api/v1/`)
- Transactions CRUD, file uploads, webhooks
- Rate limited, API key authenticated

### Internal APIs (`/api/`)
- `/api/photo-note` — Photo capture with optional AI analysis
- `/api/voice-note` — Voice recording with transcription
- `/api/text-note` — Text note creation
- `/api/site-audit` — Safety audit CRUD and reporting
- `/api/daily-log/[id]` — Daily field log PDF generation
- `/api/stripe/*` — Checkout, portal, webhooks, seat management
- `/api/branding/logo` — Logo upload/serve from R2

## Frontend Patterns

- **Svelte 5 runes**: `$state`, `$derived`, `$props`, `$effect`
- **Tab-based indentation** throughout
- **CSS variables** for theming (dark theme: bg `#0a0e17`, accent `#4a7af5`)
- **CSS-only charts** on reports page (no chart library)
- **Industry terminology**: `getTerms(industry)` maps generic labels to industry-specific ones
- **Dev mode guards**: `if (!db || !user)` returns mock data for local development
