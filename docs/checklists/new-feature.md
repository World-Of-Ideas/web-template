# Checklist: Adding a New Feature

Use this checklist when adding any new feature to the webapp.

## Planning

- [ ] Write a feature description in `docs/` or update `docs/plan.md`
- [ ] If it involves an architecture choice, create a decision record in `docs/decisions/`
- [ ] Identify which Cloudflare bindings are needed (D1, R2, Queues, KV, etc.)
- [ ] Identify if new wrangler bindings are needed in `wrangler.jsonc`
- [ ] Identify if new Terraform resources are needed in `webapp-tf`

## Infrastructure (in webapp-tf, if needed)

- [ ] Add Terraform resources for new Cloudflare services
- [ ] Apply to UAT first: `terraform workspace select uat && terraform apply`
- [ ] Verify resources exist in Cloudflare dashboard
- [ ] Apply to Production: `terraform workspace select prod && terraform apply`

## Database (if needed)

- [ ] Update Drizzle schema in `src/db/schema.ts`
- [ ] Generate migration: `npm run db:generate`
- [ ] Review generated SQL in `drizzle/`
- [ ] Apply locally: `npm run db:migrate:local`
- [ ] Test locally before applying to remote environments

## Bindings (if needed)

- [ ] Add new bindings to `wrangler.jsonc` (both `env.uat` and `env.prod`)
- [ ] Update `src/types/env.d.ts` with new binding types
- [ ] Regenerate Cloudflare types: `npm run cf-typegen`
- [ ] Set any new secrets: `wrangler secret put KEY --env uat` and `--env prod`

## Implementation

- [ ] Follow existing patterns — check `CLAUDE.md` for architecture rules
- [ ] Server components by default, `"use client"` only where interactivity needed
- [ ] Use Drizzle for all DB queries — no raw SQL
- [ ] Use `getCloudflareContext()` for all Cloudflare bindings
- [ ] Never create global/module-level clients — always request-scoped

## Testing

- [ ] Feature works in `npm run dev`
- [ ] Feature works in `npm run preview:uat`
- [ ] No TypeScript errors: `npm run check`
- [ ] No lint errors: `npm run lint`
- [ ] If D1-dependent, test with local D1 data

## Deployment

- [ ] Merge to `main` → deploy to UAT: `npm run deploy:uat`
- [ ] If DB changes: `npm run db:migrate:uat`
- [ ] Verify on UAT environment
- [ ] Merge `main` → `release` → deploy to prod: `npm run deploy:prod`
- [ ] If DB changes: `npm run db:migrate:prod`
