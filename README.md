# Web Template — Next.js Marketing Site Template

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
- **SEO** with metadata, JSON-LD, breadcrumbs, FAQs, sitemap, RSS feed, dynamic OG images
- **Search** (Cmd+K) across posts and content pages
- **Tracking** with Facebook Pixel + CAPI, Google Analytics 4 + Measurement Protocol
- **Multi-environment** — UAT (main branch) and Production (release branch)

## Tech Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS v4
- Cloudflare Workers, D1 (SQLite), R2, Queues
- Drizzle ORM, OpenNext, shadcn/ui
- Playwright (E2E), Vitest (unit/integration)
- Husky + lint-staged (git hooks)

## Prerequisites

Before you begin, make sure you have the following installed:

| Tool | Version | Install |
|:-----|:--------|:--------|
| Node.js | v22+ | [nodejs.org](https://nodejs.org) or `nvm install 22` |
| npm | v10+ | Comes with Node.js |
| Make | Any | Pre-installed on macOS/Linux |

You do **not** need a Cloudflare account for local development. Wrangler runs D1 and R2 locally.

**Windows users:** Make is not pre-installed. Use [WSL](https://learn.microsoft.com/en-us/windows/wsl/install), or run the underlying `npx`/`npm` commands from the Makefile directly.

## Local Setup (Step by Step)

### 1. Clone the repo

```bash
git clone <repo-url> web-template
cd web-template
```

### 2. Install dependencies

```bash
npm install
```

This also runs the `prepare` script which sets up **Husky** git hooks automatically:
- **pre-commit** — runs lint-staged (ESLint fix on staged `.ts`/`.tsx` files) + unit tests
- **pre-push** — runs the full Playwright E2E suite

### 3. Set up environment variables

```bash
cp .dev.vars.example .dev.vars
```

The defaults work out of the box for local development:

| Variable | Default | Purpose |
|:---------|:--------|:--------|
| `ADMIN_PASSWORD` | `admin123` | Password for `/admin` login |
| `TURNSTILE_SECRET_KEY` | Always-pass test key | Cloudflare bot protection (auto-passes locally) |
| `UNSUBSCRIBE_SECRET` | `local-dev-secret` | HMAC secret for unsubscribe token signing |
| `RESEND_API_KEY` | Test key | Email sending (emails won't actually send locally) |
| `FROM_EMAIL` | `noreply@example.com` | Sender email for outbound emails |
| `CONTACT_EMAIL` | `admin@example.com` | Where contact form submissions are sent |
| `SITE_URL` | `http://localhost:3000` | Used in sitemaps, emails, OG images |
| `R2_PUBLIC_URL` | `http://localhost:3000/api/assets` | URL prefix for uploaded assets |
| `ENVIRONMENT` | `uat` | Environment identifier |

Optional variables (uncomment in `.dev.vars` when needed):
- `API_KEY` — enables external blog API access (`POST`/`PUT`/`DELETE /api/blog`)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — override Turnstile site key for production
- `NEXT_PUBLIC_SITE_URL` — override site URL for production

### 4. Create and seed the local database

```bash
make db-recreate
```

This does three things:
1. Wipes any existing local D1 data (`rm -rf .wrangler/state/v3/d1`)
2. Applies all Drizzle migrations to create tables
3. Runs `src/db/seed.sql` to populate system pages, sample blog posts, default settings, and an admin session

### 5. Install Playwright browsers

```bash
npx playwright install
```

Downloads the Chromium binary needed for E2E tests. This is also required for the **pre-push** git hook to work.

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the marketing site.

### 7. Log in to admin

Go to [http://localhost:3000/admin](http://localhost:3000/admin) and log in with password `admin123`.

From admin you can:
- Create/edit blog posts and content pages
- Manage waitlist subscribers and giveaway entries
- Configure site identity, features, and theme
- View contact submissions and dashboard analytics

## Running Tests

### Unit and integration tests (Vitest)

```bash
make test              # Single run
make test-watch        # Watch mode
make test-coverage     # With coverage report
```

Tests use `getPlatformProxy()` from Wrangler to run against a real local D1 database. The local DB must exist first (`make db-recreate`).

### E2E tests (Playwright)

Requires browser binaries installed (step 5 above). Then run:

```bash
make e2e               # Headless (default)
make e2e-headed        # Visible browser
make e2e-ui            # Playwright UI mode
```

Playwright auto-starts the dev server if it's not already running. Tests run sequentially (`workers: 1`) because they share DB state. A global setup script resets and seeds the database before each run.

Run individual spec files:

```bash
make e2e-admin         # Admin panel tests
make e2e-posts         # Blog post CRUD tests
make e2e-pages         # Content page tests
make e2e-readonly      # Read-only admin tests
make e2e-tracking      # Tracking pixel tests
```

### Full CI pipeline

```bash
make ci                # ESLint + TypeScript + Vitest + Playwright
```

Or via npm:

```bash
npm run test:ci        # Same pipeline, also used in CI
```

## Database Commands

| Command | Action |
|:--------|:-------|
| `make db-recreate` | Wipe + migrate + seed (fresh start) |
| `make db-reset` | Migrate + seed (keeps existing data structure) |
| `make db-migrate` | Apply pending migrations only |
| `make db-seed` | Run seed SQL only |
| `make db-studio` | Open Drizzle Studio (visual DB browser) |
| `make db-generate` | Generate new migration after schema changes |

### Database workflow for schema changes

1. Edit `src/db/schema.ts`
2. `make db-generate` — creates a new migration file in `drizzle/`
3. `make db-migrate` — applies it to local D1
4. Update `src/db/seed.sql` if new tables need seed data
5. Test locally, then apply to remote: `npm run db:migrate:uat` / `npm run db:migrate:prod`

## Deployment

| Command | Action |
|:--------|:-------|
| `make deploy-uat` | Build + deploy to UAT (Cloudflare Workers) |
| `make deploy-prod` | Build + deploy to Production |
| `make preview` | Build + preview locally via OpenNext |
| `make preview-uat` | Build + preview with UAT bindings |

Deployments require a Cloudflare account with Workers, D1, R2, and Queues configured. See `wrangler.jsonc` for binding names and `docs/checklists/` for full deploy instructions.

## Git Hooks

Husky runs automatically after `npm install`:

| Hook | What it runs |
|:-----|:-------------|
| **pre-commit** | `lint-staged` (ESLint --fix on staged files) + `npm test` (Vitest) |
| **pre-push** | `npx playwright test --max-failures=1` (full E2E suite) |

To skip hooks temporarily (not recommended):

```bash
git commit --no-verify -m "wip"
git push --no-verify
```

## Project Structure

```
src/
├── app/(public)/       # Public pages (blog, waitlist, contact, etc.)
├── app/admin/          # Admin panel pages
├── app/api/            # API routes (public + admin)
├── components/         # UI, layout, content blocks, admin, shared
├── config/             # Navigation, theme presets, site config
├── db/                 # Schema, seed data, migrations
├── features/           # Product-specific features (template-safe)
├── lib/                # Business logic (34 files)
└── types/              # TypeScript interfaces
e2e/                    # Playwright E2E test specs
drizzle/                # D1 migration files
docs/
├── plan.md             # Implementation plan
├── audit/              # Security audit reports
├── decisions/          # Architecture decision records
└── checklists/         # Clone, deploy, new feature, new page
```

## All Make Commands

Run `make help` to see every available command, or refer to the table below:

| Command | Action |
|:--------|:-------|
| **Dev** | |
| `make dev` | Start Next.js dev server |
| `make build` | Build for production |
| `make preview` | Build and preview locally via OpenNext |
| **Quality** | |
| `make lint` | Run ESLint |
| `make typecheck` | Run TypeScript type checking |
| `make test` | Run unit/integration tests |
| `make test-watch` | Run tests in watch mode |
| `make test-coverage` | Run tests with coverage report |
| **E2E** | |
| `make e2e` | Run all Playwright E2E tests |
| `make e2e-ui` | Playwright UI mode |
| `make e2e-headed` | Headed browser mode |
| `make e2e-admin` | Admin tests only |
| `make e2e-posts` | Posts tests only |
| `make e2e-pages` | Pages tests only |
| `make e2e-readonly` | Read-only admin tests only |
| `make e2e-tracking` | Tracking tests only |
| **CI** | |
| `make ci` | Full pipeline: lint + typecheck + unit + E2E |
| `make audit` | Pre-audit: lint + typecheck + coverage + E2E |
| **Database** | |
| `make db-recreate` | Wipe + migrate + seed (fresh start) |
| `make db-reset` | Migrate + seed |
| `make db-migrate` | Apply pending migrations |
| `make db-seed` | Run seed SQL |
| `make db-studio` | Open Drizzle Studio |
| `make db-generate` | Generate migration from schema changes |
| **Deploy** | |
| `make deploy-uat` | Build + deploy to UAT |
| `make deploy-prod` | Build + deploy to Production |
| `make preview-uat` | Preview with UAT bindings |
| **Misc** | |
| `make clean` | Remove build artifacts and test results |
| `make cf-typegen` | Generate Cloudflare env type definitions |

## Documentation

- `CLAUDE.md` — Architecture rules and development instructions
- Full project docs maintained externally — see project docs directory for architecture, API reference, security, deployment, audit reports, checklists, and decision records
