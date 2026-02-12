.PHONY: help dev build lint typecheck test test-watch test-coverage test-ci \
       e2e e2e-ui e2e-headed e2e-admin e2e-posts e2e-pages e2e-readonly e2e-tracking \
       db-generate db-migrate db-seed db-studio \
       deploy-uat deploy-prod preview preview-uat \
       ci audit clean

# ── Dev ──────────────────────────────────────────────────────
dev:                  ## Start Next.js dev server
	npm run dev

build:                ## Build for production
	npm run build

preview:              ## Build and preview locally via OpenNext
	npm run preview

# ── Quality ──────────────────────────────────────────────────
lint:                 ## Run ESLint
	npx next lint

typecheck:            ## Run TypeScript type checking
	npx tsc --noEmit

test:                 ## Run unit/integration tests
	npx vitest run

test-watch:           ## Run unit/integration tests in watch mode
	npx vitest

test-coverage:        ## Run tests with coverage report
	npx vitest run --coverage

# ── E2E ──────────────────────────────────────────────────────
e2e:                  ## Run all Playwright E2E tests
	npx playwright test

e2e-ui:               ## Run E2E tests with Playwright UI
	npx playwright test --ui

e2e-headed:           ## Run E2E tests in headed browser
	npx playwright test --headed

e2e-admin:            ## Run admin E2E tests only
	npx playwright test e2e/admin.spec.ts

e2e-posts:            ## Run posts E2E tests only
	npx playwright test e2e/posts.spec.ts

e2e-pages:            ## Run pages E2E tests only
	npx playwright test e2e/pages.spec.ts

e2e-readonly:         ## Run readonly-admin E2E tests only
	npx playwright test e2e/readonly-admin.spec.ts

e2e-tracking:         ## Run tracking E2E tests only
	npx playwright test e2e/tracking.spec.ts

e2e-all:              ## Run each E2E spec one by one
	npx playwright test e2e/admin.spec.ts
	npx playwright test e2e/posts.spec.ts
	npx playwright test e2e/pages.spec.ts
	npx playwright test e2e/readonly-admin.spec.ts
	npx playwright test e2e/tracking.spec.ts

# ── CI / Audit ───────────────────────────────────────────────
ci:                   ## Full CI pipeline: lint + typecheck + unit + e2e
	npx next lint
	npx tsc --noEmit
	npx vitest run
	npx playwright test

audit:                ## Pre-audit check: lint + typecheck + coverage + e2e
	npx next lint
	npx tsc --noEmit
	npx vitest run --coverage
	npx playwright test e2e/admin.spec.ts
	npx playwright test e2e/posts.spec.ts
	npx playwright test e2e/pages.spec.ts
	npx playwright test e2e/readonly-admin.spec.ts
	npx playwright test e2e/tracking.spec.ts

# ── Database ─────────────────────────────────────────────────
db-generate:          ## Generate Drizzle migration files
	npx drizzle-kit generate

db-migrate:           ## Apply migrations to local D1
	npx wrangler d1 migrations apply DB --local

db-seed:              ## Seed local D1 with test data
	npx wrangler d1 execute DB --local --file=src/db/seed.sql

db-studio:            ## Open Drizzle Studio
	npx drizzle-kit studio

db-reset:             ## Reset local DB: migrate + seed
	npx wrangler d1 migrations apply DB --local
	npx wrangler d1 execute DB --local --file=src/db/seed.sql

# ── Deploy ───────────────────────────────────────────────────
deploy-uat:           ## Build and deploy to UAT
	npm run deploy:uat

deploy-prod:          ## Build and deploy to Production
	npm run deploy:prod

preview-uat:          ## Build and preview UAT locally
	npm run preview:uat

db-migrate-uat:       ## Apply migrations to UAT D1 (remote)
	npx wrangler d1 migrations apply DB --env uat --remote

db-migrate-prod:      ## Apply migrations to Production D1 (remote)
	npx wrangler d1 migrations apply DB --env prod --remote

# ── Misc ─────────────────────────────────────────────────────
clean:                ## Remove build artifacts and test results
	rm -rf .next .open-next test-results playwright-report

cf-typegen:           ## Generate Cloudflare env type definitions
	npx wrangler types --env-interface CloudflareEnv env.d.ts

help:                 ## Show this help
	@echo ""
	@echo "\033[1mDev\033[0m"
	@grep -E '^(dev|build|preview):' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "\033[1mTests\033[0m"
	@grep -E '^(lint|typecheck|test|test-watch|test-coverage):' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "\033[1mE2E\033[0m"
	@grep -E '^e2e' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "\033[1mCI / Audit\033[0m"
	@grep -E '^(ci|audit):' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "\033[1mDatabase\033[0m"
	@grep -E '^db-' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "\033[1mDeploy\033[0m"
	@grep -E '^(deploy-uat|deploy-prod|preview-uat):' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "\033[1mMisc\033[0m"
	@grep -E '^(clean|cf-typegen|help):' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

.DEFAULT_GOAL := help
