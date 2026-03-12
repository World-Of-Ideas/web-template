# Checklist: Clone Template for a New Product

Use this checklist when cloning the webapp template for a new product launch site.

## 1. Create New Repos

- [ ] Copy `webapp` → `{product}-webapp`
- [ ] Copy `webapp-tf` → `{product}-webapp-tf`
- [ ] Planning docs are in `webapp/docs/` — no separate plan repo needed
- [ ] Initialize git in each new repo

## 2. Update Terraform (`{product}-webapp-tf`)

- [ ] Update `variables.tf`: change `project_name` default from `"webapp"` to `"{product}"`
  - This changes all resource names: `{product}-uat-db`, `{product}-prod-assets`, etc.
- [ ] Update `envs/example.tfvars` with new domain
- [ ] Create `envs/uat.tfvars` and `envs/prod.tfvars` with actual values
- [ ] Run `terraform init && terraform apply` for both workspaces

## 3. Update Site Config

`src/config/site.ts` is minimal — only `url` (from env) and `turnstileSiteKey` (from env). Everything else is DB-driven via Admin > Settings.

- [ ] Set `NEXT_PUBLIC_SITE_URL` env var for production URL
- [ ] Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` env var for production Turnstile widget key

After deploying and seeding, configure via **Admin > Settings**:
- [ ] `name` — product name
- [ ] `description` — one-line value proposition
- [ ] `author` — company name
- [ ] `productLinks` — appUrl, appStoreUrl, playStoreUrl (as applicable)
- [ ] `social` — twitter, github, discord, instagram (as applicable)
- [ ] `features` — enable/disable waitlist, giveaway, blog, contact, pricing, changelog, api, doubleOptIn, maintenance
- [ ] `theme` — accent color, font, component variants, or select a preset

## 4. Update Navigation Config (`src/config/navigation.ts`)

- [ ] Header links — adjust labels and ordering
- [ ] Footer link groups — update company name, links
- [ ] Breadcrumb labels — update any product-specific segment labels
- [ ] CTA text — update button labels

## 5. Update Wrangler Config (`wrangler.jsonc`)

- [ ] Top-level `"name"` — change from `"webapp"` to `"{product}"`
- [ ] `env.uat.name` — change from `"webapp-uat"` to `"{product}-uat"`
- [ ] `env.prod.name` — change from `"webapp"` to `"{product}"`
- [ ] All `database_name` values — `{product}-uat-db`, `{product}-prod-db`
- [ ] All `database_id` values — from Terraform output
- [ ] All `bucket_name` values — `{product}-uat-assets`, `{product}-prod-assets`, etc.
- [ ] All queue names — `{product}-uat-email-queue`, `{product}-prod-email-queue`, etc.
- [ ] All DLQ names — `{product}-uat-email-dlq`, `{product}-prod-email-dlq`

## 6. Update Next.js Config (`next.config.ts`)

- [ ] `images.remotePatterns` — add product's R2 custom domain if using one

## 7. Set Wrangler Secrets (per environment)

```bash
# For each environment (--env uat / --env prod):
wrangler secret put SITE_URL --env uat          # https://uat.newproduct.com
wrangler secret put R2_PUBLIC_URL --env uat      # https://assets-uat.newproduct.com
wrangler secret put RESEND_API_KEY --env uat
wrangler secret put FROM_EMAIL --env uat         # hello@newproduct.com
wrangler secret put CONTACT_EMAIL --env uat      # support@newproduct.com
wrangler secret put ADMIN_PASSWORD --env uat
wrangler secret put TURNSTILE_SECRET_KEY --env uat
wrangler secret put UNSUBSCRIBE_SECRET --env uat
# Optional: for external blog API access
wrangler secret put API_KEY --env uat
```

## 8. Create Cloudflare Queues

```bash
wrangler queues create {product}-uat-email-queue
wrangler queues create {product}-uat-email-dlq
wrangler queues create {product}-prod-email-queue
wrangler queues create {product}-prod-email-dlq
```

## 9. Update Content

- [ ] Replace placeholder text in seed data (`db/seed.ts`)
- [ ] Update system page content (home, terms, privacy) for new product
- [ ] Upload product images to R2 (hero mockup, OG images, favicon)
- [ ] Replace `favicon.ico` and `app/icon.png`
- [ ] Update default OG image

## 10. DNS Setup

- [ ] `www.newproduct.com` → Cloudflare Pages (production)
- [ ] `uat.newproduct.com` → Cloudflare Pages (UAT)
- [ ] `app.newproduct.com` → separate project (if web app — not managed by this template)

## 11. Deploy & Verify

- [ ] Run migrations: `npm run db:migrate:uat`
- [ ] Seed data: `npm run db:seed:local` (for local dev)
- [ ] Deploy UAT: `npm run deploy:uat`
- [ ] Follow `checklists/deployment.md` verification steps
- [ ] Deploy prod when ready

## Files to Search-Replace

When cloning, do a global search for these strings and replace:

| Search for | Replace with | Files affected |
| ---------- | ------------ | -------------- |
| `webapp` (in resource names) | `{product}` | `wrangler.jsonc` |
| `Product Name` | Actual product name | `seed.sql` (then configure via Admin > Settings) |
| `example.com` | Actual domain | `SITE_URL` wrangler secret (runtime, not in code) |
