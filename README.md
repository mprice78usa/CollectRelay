# CollectRelay

**Send requests. Collect files. Stay on track.**

CollectRelay is a SaaS document collection and field management platform built for real estate professionals and contractors. Send your client a single link — they upload everything you need, and you track it all from one dashboard.

## Tech Stack

- **Frontend/Backend**: SvelteKit (Svelte 5 runes) + TypeScript
- **Hosting**: Cloudflare Pages + Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **Auth**: Session cookies (pro), magic links (client portal), API keys (REST API)
- **AI**: Cloudflare Workers AI + Claude API
- **Payments**: Stripe (checkout, billing portal, webhooks, per-seat billing)
- **Push**: Web Push via `crypto.subtle` (VAPID, no npm dependencies)
- **PDF**: `pdf-lib` for report generation
- **Offline**: IndexedDB (`idb`) + Service Worker + Background Sync API

## Features

### Core Platform
- **Templates** — Reusable checklists with 4 item types: documents, questions, checkboxes, e-signatures
- **Transactions** — Deal tracker with status lifecycle, custom fields, milestones, deal details
- **Client Portal** — Magic-link authenticated upload portal with white-label branding
- **Document Library** — Workspace-wide document storage with AI summaries
- **Activity Dashboard** — Real-time notification feed with unseen badges
- **Reports & Analytics** — Pipeline funnel, commission tracker, activity trends, CSV export
- **Team Management** — Multi-user workspaces with role-based access control, email invitations

### Pro Features
- **AI Field Intelligence** — Voice-to-task: speak naturally, AI transcribes and extracts prioritized actions
- **AI Safety Scout** — Photo analysis for OSHA violations and safety hazards with branded PDF audit reports
- **One-Click Daily Logs** — Auto-generated PDF daily reports from voice notes, photos, and safety audits
- **Smart Trade Routing** — AI-driven trade assignment and relay from voice/photo captures
- **Resilient Field Sync** — Offline-first capture with IndexedDB queue and automatic background sync

### Integrations
- **Public REST API** at `/api/v1/` with rate limiting
- **Zapier Webhooks** — Subscribe/unsubscribe for automation
- **Stripe Billing** — Free/Pro/Team/Enterprise tiers with per-seat billing
- **Web Push Notifications** — Real-time alerts for submissions, reviews, and reminders
- **PWA** — Installable web app with offline support

## Project Structure

```
src/
├── lib/
│   ├── components/ui/     # Reusable Svelte components
│   ├── offline/            # IndexedDB, sync engine, offline state
│   ├── server/             # Server-only modules
│   │   ├── db/             # Database query functions
│   │   ├── audit-processing.ts    # AI safety audit pipeline
│   │   ├── audit-report-builder.ts # Safety audit PDF
│   │   ├── daily-log-builder.ts    # Daily field log PDF
│   │   ├── report-builder.ts       # Site observation PDF
│   │   ├── pdf-builder.ts          # Template document PDF
│   │   └── pdf-convert.ts          # Image-to-PDF converter
│   └── terminology.ts     # Industry-specific label mapping
├── routes/
│   ├── app/                # Pro dashboard (auth required)
│   ├── api/                # REST endpoints
│   ├── c/[token]/          # Client portal (magic link)
│   └── (public pages)      # Landing, pricing, features, etc.
├── hooks.server.ts         # Auth middleware, security headers
└── app.html
static/
├── sw.js                   # Service worker
└── manifest.webmanifest    # PWA manifest
migrations/                 # D1 SQL migrations (0001-0035)
```

## Development

```bash
npm install
npm run dev        # Starts Vite dev server with Cloudflare platform proxy
npm run build      # Production build
npm run preview    # Preview production build locally
```

### Environment Variables

Create `.dev.vars` for local development:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
CLAUDE_API_KEY=...
```

### Database Migrations

```bash
# Apply to local D1
npx wrangler d1 execute collectrelay-db --local --file migrations/XXXX.sql

# Apply to remote D1
npx wrangler d1 execute collectrelay-db --remote --command "SQL_HERE"
```

## Deployment

Production auto-deploys from `main` branch via Cloudflare Pages GitHub integration.

```bash
# Push to both branches
git push origin master && git push origin master:main

# Manual deploy if webhook fails
npx wrangler pages deploy .svelte-kit/cloudflare --project-name collectrelay --branch main
```

## Marketing Site

Public pages at `collectrelay.com`:

| Route | Page |
|-------|------|
| `/` | Homepage with product video, how it works, feature cards |
| `/features` | Full feature breakdown with screenshots |
| `/pricing` | Plan comparison table with FAQ |
| `/security` | Security overview |
| `/pro` | Pro AI tools for contractors |
| `/contact` | Contact form + Calendly scheduling |
| `/industries/real-estate` | Real estate vertical page |
| `/industries/contractors` | Contractors vertical page |
| `/terms` | Terms of Service |
| `/privacy` | Privacy Policy |
| `/login` | Login |
| `/register` | Registration |

## Industries

CollectRelay supports multiple industries with terminology mapping:
- **Real Estate** — Transactions, clients, deals
- **Contractors** — Projects, customers, jobs

## License

Proprietary. All rights reserved.
