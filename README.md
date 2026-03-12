# Webapp — Next.js Marketing Site Template

A full-featured marketing site template built with **Next.js 16** and deployed on **Cloudflare Workers** via OpenNext. Includes waitlist, giveaway, blog, contact forms, content pages, pricing, changelog, admin panel, and theme system — all config-driven from a single DB table.

## Features

- **Waitlist** with referral tracking and position queuing
- **Giveaway** with bonus entry actions
- **Blog** with 28 content block types, scheduling, and tagging
- **Contact form** with async email via Cloudflare Queues + Resend
- **Content pages** with pillar/subpage hierarchy and catch-all routing
- **Pricing** and **Changelog** pages (data-driven from admin)
- **Admin panel** with post editor, page editor, subscriber management, settings, SEO audit
- **Theme system** with accent color, 4 fonts, component variants, and 4 presets
- **Feature toggles** — enable/disable any feature from admin (waitlist, giveaway, blog, contact, pricing, changelog, api)
- **External API** with Bearer token auth for programmatic blog management
- **Bot protection** via Cloudflare Turnstile on all public forms and admin login
- **SEO** with metadata, JSON-LD, breadcrumbs, FAQs, sitemap, RSS feed, OG images
- **Search** (Cmd+K) across posts and content pages
- **Tracking** with Facebook Pixel + CAPI, Google Analytics 4 + Measurement Protocol
- **Multi-environment** — UAT (main branch) and Production (release branch)

## Tech Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS v4
- Cloudflare Workers, D1 (SQLite), R2, Queues
- Drizzle ORM, OpenNext, shadcn/ui
- Playwright (E2E), Vitest (unit/integration)

## Getting Started

```bash
# Install dependencies
npm install

# Copy env file and configure
cp .env.example .dev.vars

# Create local D1 database and seed data
make db-recreate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin panel at [http://localhost:3000/admin](http://localhost:3000/admin) (password: `admin123`).

## Project Structure

```
src/
├── app/(public)/       # Public pages (blog, waitlist, contact, etc.)
├── app/admin/          # Admin panel pages
├── app/api/            # API routes (public + admin)
├── components/         # UI, layout, content blocks, admin, shared
├── config/             # Navigation, theme presets, site config
├── db/                 # Schema, seed data
├── features/           # Product-specific features (template-safe)
├── lib/                # Business logic (34 files)
└── types/              # TypeScript interfaces
docs/
├── plan.md             # Implementation plan
├── audit/              # Security audit reports (rounds 3-8)
├── decisions/          # Architecture decision records
└── checklists/         # Clone, deploy, new feature, new page
```

## Key Commands

| Command | Action |
|:--------|:-------|
| `make dev` | Start dev server |
| `make test` | Run unit/integration tests |
| `make e2e` | Run E2E tests |
| `make ci` | Lint + typecheck + test |
| `make db-recreate` | Drop and recreate local D1 with seed data |
| `make deploy-uat` | Deploy to UAT environment |
| `make deploy-prod` | Deploy to production |

## Documentation

- `CLAUDE.md` — Architecture rules and development instructions
- `docs/plan.md` — Original implementation plan
- `docs/audit/` — Security audit reports
- `docs/decisions/` — Architecture decision records (queues, ORM, releases, Terraform)
- `docs/checklists/` — Operational checklists (clone template, deploy, add feature, add page)
