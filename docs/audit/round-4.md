# Audit Round 4 — Findings & Resolutions

**Date:** 2026-02-10
**Scope:** Full codebase audit of webapp (Next.js 16 on Cloudflare Workers)
**Prior rounds:** Round 1 (31 fixed), Round 2 (49 fixed), Round 3 (37 fixed) — 117 total

---

## Summary

| Severity | Found | Fixed | Deferred |
|----------|-------|-------|----------|
| Critical | 0 | — | — |
| High | 1 | 1 | 0 |
| Medium | 16 | 16 | 0 |
| Low | 25 | 24 | 1 |
| Info | 3 | 1 | 2 |
| **Total** | **45** | **42** | **3** |

**Self-inflicted from Round 3: 3** (M11, L15 were fixing bad R3 fixes; M12 was testing R3's incomplete delivery)

Also identified: 1 dead file (`src/proxy.ts`) — already deleted during this audit.

---

## Self-inflicted Regressions from Round 3

These findings exist only because Round 3 fixes were wrong or incomplete:

### M11 — Cookie consent banner uses `role="dialog"` without focus trap [FIXED — R3 regression]

**File:** `src/components/shared/cookie-consent-banner.tsx`
**Issue:** R3 L12 added `role="dialog"`, but `role="dialog"` requires focus trapping per WAI-ARIA. The banner doesn't trap focus, so R3's fix introduced a new a11y violation.
**Resolution:** Changed to `role="region"` with `aria-label="Cookie consent"`.

### M12 — `validateMagicBytes` has no test coverage [FIXED — R3 incomplete delivery]

**File:** `src/lib/__tests__/r2.test.ts`
**Issue:** R3 added magic byte validation but shipped it without any tests. The implementation was also incomplete (RIFF-only check for WebP — caught later in R5 M1).
**Resolution:** Added 7+ test cases covering PNG, JPEG, GIF, WebP, mismatched types, and short buffers. However, tests only covered the happy path and didn't test WAV/AVI bypass, which is why R5 M1 was still needed.

### L15 — Image block alt fallback says "Blog image" on non-blog pages [FIXED — R3 regression]

**File:** `src/components/content/blocks/image-block.tsx`
**Issue:** R3 L5 changed `alt=""` to `"Blog image"` as a fallback, but content pages also use image blocks. The fallback was misleading.
**Resolution:** Changed to `alt=""` (decorative) when no alt text provided. Net effect: two rounds to arrive at nearly the same code as the original.

---

## Genuine Findings

### High Severity

### H1 — `createSubscriberWithReferral` has zero test coverage [FIXED]

**File:** `src/lib/waitlist.ts` (lines 32–60)
**Issue:** The atomic referral signup function (uses `db.batch()` to create subscriber + increment referrer count) has no test coverage at all. It's a critical code path for referral-based signups.
**Resolution:** Added integration tests in `waitlist.integration.test.ts` covering subscriber creation with referral and referral count incrementing.

---

### Medium Severity

### M1 — Page titles doubled: `"Blog | Product Name | Product Name"` [FIXED]

**Files:** `src/app/(public)/blog/page.tsx`, `contact/page.tsx`, `waitlist/page.tsx`, `waitlist/[code]/page.tsx`, `giveaway/page.tsx`, `terms/page.tsx`, `privacy/page.tsx`
**Issue:** Root layout defines `title.template: '%s | ${siteConfig.name}'`. These pages manually append `| ${siteConfig.name}` in their title strings, causing double-name in browser tabs and search results.
**Resolution:** Removed `| ${siteConfig.name}` from all 7 page title strings. The template handles the suffix automatically.

### M2 — Home page title also doubled [FIXED]

**File:** `src/app/(public)/page.tsx`
**Issue:** Home page sets `title: siteConfig.name` as a plain string. The template appends the site name again.
**Resolution:** Changed to `title: { absolute: siteConfig.name }` to bypass the template.

### M3 — Login password not length-limited (PBKDF2 DoS) [FIXED]

**File:** `src/app/api/admin/login/route.ts`
**Issue:** No max length on the password field before running PBKDF2 with 100k iterations.
**Resolution:** Added `password.length > 1000` check before hashing.

### M4 — Middleware only checks cookie presence, not validity [FIXED]

**File:** `src/middleware.ts`
**Issue:** Middleware checks if `admin_session` cookie exists but not if it's a valid UUID format.
**Resolution:** Added UUID v4 format regex validation.

### M5 — R2 asset proxy response missing `X-Content-Type-Options: nosniff` [FIXED]

**File:** `src/app/api/assets/[...key]/route.ts`
**Issue:** Missing `nosniff` header on user-uploaded content responses.
**Resolution:** Added `"X-Content-Type-Options": "nosniff"` to the response headers.

### M6 — System pages can be unpublished via admin update [FIXED]

**File:** `src/app/api/admin/pages/[slug]/route.ts`
**Issue:** Admin can set `published: false` on system pages (home, terms, privacy), breaking the site.
**Resolution:** Added guard that returns `VALIDATION_ERROR` when trying to unpublish system pages.

### M7 — Upload path not restricted to allowed prefixes [FIXED]

**File:** `src/app/api/admin/upload/route.ts`
**Issue:** Admin can write to any R2 key outside allowed prefixes.
**Resolution:** Added prefix validation: only `blog/`, `uploads/`, and `og/` allowed.

### M8 — CountdownTimer floods screen readers with per-second announcements [FIXED]

**File:** `src/components/giveaway/countdown-timer.tsx`
**Issue:** `aria-live="polite"` on a timer that updates every second.
**Resolution:** Removed `aria-live="polite"`. The `role="timer"` already communicates the element's purpose.

### M9 — FaqSection and RelatedPages missing padding/max-width [FIXED]

**Files:** `src/components/layout/faq-section.tsx`, `src/components/layout/related-pages.tsx`
**Issue:** Both components stretch to full viewport width on mobile.
**Resolution:** Added `mx-auto max-w-3xl px-6` to both components.

### M10 — Search completely inaccessible on mobile [FIXED]

**File:** `src/components/layout/mobile-nav.tsx`
**Issue:** Search button hidden on mobile with no alternative.
**Resolution:** Added search trigger button inside the mobile navigation sheet.

### M13 — `deletePost` return value untested [FIXED]

**File:** `src/lib/__tests__/blog.integration.test.ts`
**Issue:** Test verifies deletion but not the slug return value or the null case.
**Resolution:** Added assertions for slug return and null on non-existent ID.

### M14 — Schema drift: 3 indexes in migrations but not in `schema.ts` [FIXED]

**File:** `src/db/schema.ts`
**Issue:** `idx_subscribers_status`, `idx_subscribers_position`, `idx_contact_created` not declared in schema.ts.
**Resolution:** Added index declarations to the subscribers and contactSubmissions table definitions.

### M15 — No lint/type-check in `test:ci` or deploy scripts [FIXED]

**File:** `package.json`
**Issue:** `test:ci` runs without lint or tsc checks.
**Resolution:** Changed to `"next lint && tsc --noEmit && vitest run && playwright test"`.

### M16 — UTM parameter values not URL-encoded [FIXED]

**File:** `src/lib/utm.ts`
**Issue:** Special characters in UTM values produce malformed query strings.
**Resolution:** Added `encodeURIComponent()` to UTM parameter values.

---

### Low Severity

### L1 — No rate limiting on public blog/referral GET endpoints [DEFERRED]

**Files:** `src/app/api/blog/route.ts`, `src/app/api/blog/[slug]/route.ts`, `src/app/api/waitlist/[code]/route.ts`
**Issue:** Read-only GET endpoints have no rate limiting. Each triggers D1 queries.
**Note:** Deferred — requires infrastructure-level rate limiting (Cloudflare WAF rules or custom middleware). Pagination caps already limit per-request cost.

### L2 — No validation that `ADMIN_PASSWORD` env var is set [FIXED]

**File:** `src/app/api/admin/login/route.ts`
**Issue:** If deployed with empty `ADMIN_PASSWORD`, the PBKDF2 comparison would accept an empty password.
**Resolution:** Added non-empty and minimum length validation at login time.

### L3 — Logout does not clear cookies on both paths [FIXED]

**File:** `src/app/api/admin/logout/route.ts`
**Issue:** Login sets cookies on `/admin` and `/api/admin` paths. Logout may only clear one.
**Resolution:** Now explicitly deletes cookies for both paths.

### L4 — Unknown queue job types silently ACKed (skip DLQ) [FIXED — but introduced R5 L4 regression]

**File:** `src/lib/queue-consumer.ts`
**Issue:** Unrecognized `job.type` values fall through to `message.ack()`, silently discarding them.
**Resolution:** Added `default` case that calls `message.retry()` with error logging.
**Post-mortem:** The error log included the raw type value (`Unknown email job type: ${type}`), which is a log injection vector. R5 L4 had to fix this to a generic message.

### L5 — CSP `frame-src` missing GTM noscript iframe domain [FIXED]

**File:** `next.config.ts`
**Issue:** GTM `<noscript>` iframe not covered by `frame-src`.
**Resolution:** Added `https://www.googletagmanager.com` to `frame-src`.

### L6 — Contact email subject uses HTML-escaped name [FIXED]

**File:** `src/lib/queue-consumer.ts`
**Issue:** Subject line uses HTML-escaped name and no CRLF stripping.
**Resolution:** Used raw name with `\r\n\t` stripping for subject line.

### L7 — CSP missing `upgrade-insecure-requests` [FIXED]

**File:** `next.config.ts`
**Issue:** Defense-in-depth directive not included alongside HSTS.
**Resolution:** Added `upgrade-insecure-requests` to CSP directives.

### L8 — Session datetime format mismatch (ISO vs SQLite) [FIXED]

**File:** `src/lib/admin.ts`
**Issue:** `createSession` stores ISO format, `cleanupExpiredSessions` compares against SQLite format.
**Resolution:** Standardized on SQLite datetime format (space-separated, no milliseconds, no Z suffix).

### L9 — `getPublicUrl` may produce double-slash URLs [FIXED]

**File:** `src/lib/r2.ts`
**Issue:** If `R2_PUBLIC_URL` ends with `/`, result has double slashes.
**Resolution:** Added `r2PublicUrl.replace(/\/$/, '')` to strip trailing slash.

### L10 — Blog loading skeleton missing `role="status"` [FIXED]

**File:** `src/app/(public)/blog/loading.tsx`
**Issue:** No accessibility announcement during blog page load.
**Resolution:** Added `role="status"` and sr-only loading text.

### L11 — Admin loading skeleton missing `role="status"` [FIXED]

**File:** `src/app/admin/loading.tsx`
**Issue:** Same as L10 for admin panel.
**Resolution:** Added `role="status"` and sr-only loading text.

### L12 — "Necessary" consent switch not associated with label [FIXED]

**File:** `src/components/shared/cookie-consent-banner.tsx`
**Issue:** Disabled "Necessary" switch has no `id`/`htmlFor` association.
**Resolution:** Added `id="consent-necessary"` and matching `htmlFor`.

### L13 — Disabled pagination buttons not semantically disabled [FIXED]

**File:** `src/app/(public)/blog/page.tsx`
**Issue:** Disabled Previous/Next rendered without `aria-disabled`.
**Resolution:** Added `aria-disabled="true"` to disabled pagination spans.

### L14 — `CtaBlock` uses `<Link>` for external URLs [FIXED]

**File:** `src/components/content/blocks/cta-block.tsx`
**Issue:** External product links use Next.js `<Link>` instead of `<a>`.
**Resolution:** Changed to `<a>` elements with `target="_blank"` and `rel="noopener noreferrer"`.

### L16 — Blog post cover image alt duplicates h1 title [FIXED]

**File:** `src/app/(public)/blog/[slug]/page.tsx`
**Issue:** `alt={post.title}` duplicates the `<h1>` — screen readers read same text twice.
**Resolution:** Changed to `alt=""` (decorative).

### L17 — PostCard cover image alt duplicates card heading [FIXED]

**File:** `src/components/blog/post-card.tsx`
**Issue:** Same pattern as L16 — `alt={post.title}` duplicates the `<h3>`.
**Resolution:** Changed to `alt=""` (decorative).

### L18 — Mobile nav missing `aria-label` [FIXED]

**File:** `src/components/layout/mobile-nav.tsx`
**Issue:** Mobile nav's `<nav>` lacks `aria-label`.
**Resolution:** Added `aria-label="Main navigation"`.

### L19 — Admin sidebar nav missing `aria-label` [FIXED]

**File:** `src/app/admin/layout.tsx`
**Issue:** Sidebar `<nav>` has no `aria-label`.
**Resolution:** Added `aria-label="Admin navigation"`.

### L20 — Image upload file input has no accessible label [FIXED]

**File:** `src/components/admin/image-upload.tsx`
**Issue:** File input has no associated label.
**Resolution:** Added `aria-label="Upload image"`.

### L21 — Giveaway action completed state not announced [FIXED]

**File:** `src/components/giveaway/action-card.tsx`
**Issue:** Green checkmark indicator has no accessible label.
**Resolution:** Added `<span className="sr-only">Completed</span>`.

### L22 — Feed.xml doesn't escape slugs in URLs [FIXED]

**File:** `src/app/(public)/feed.xml/route.ts`
**Issue:** `post.slug` interpolated into XML without escaping.
**Resolution:** Added `escapeXml()` function and applied to all interpolated values.

### L23 — Playwright retries: 0 (no CI retry) [FIXED]

**File:** `playwright.config.ts`
**Issue:** Zero retries means transient E2E failures break CI.
**Resolution:** Changed to `retries: process.env.CI ? 2 : 0`.

### L24 — Branch coverage threshold at 60% (below lines/functions at 70%) [FIXED]

**File:** `vitest.config.ts`
**Resolution:** Raised to 70% to match lines/functions.

### L25 — `isGiveawayEnded` invalid date string branch untested [FIXED]

**File:** `src/lib/__tests__/giveaway.test.ts`
**Issue:** The `isNaN(parsed.getTime())` guard has no test.
**Resolution:** Added test: `expect(isGiveawayEnded("not-a-date")).toBe(false)`.

---

## Info

### I1 — `allowedDevOrigins` uses CIDR notation — may not be supported by Next.js [DEFERRED]

**File:** `next.config.ts` (line 4)
**Note:** `"http://192.168.0.0/16"` — Next.js `allowedDevOrigins` expects origin strings, not CIDR. Needs verification.

### I2 — `referral.test.ts` uses `await` on synchronous function [FIXED]

**File:** `src/lib/__tests__/referral.test.ts`
**Note:** `generateReferralCode()` is sync but tests `await` it.
**Resolution:** Removed unnecessary `await`.

### I3 — `pages.parentSlug` has no foreign key constraint [DEFERRED]

**File:** `src/db/schema.ts` (line 93)
**Note:** No `.references()` on `parentSlug`. Application code handles orphan cleanup via `deletePage`'s `db.batch()`. D1/SQLite FK enforcement is off by default and would add complexity without benefit given the existing app-level guarantees.

---

## Deferred / Won't Fix

- **L1 — GET endpoint rate limiting:** Requires infrastructure-level solution (Cloudflare WAF). Pagination caps limit per-request cost.
- **I1 — CIDR in allowedDevOrigins:** Info only, needs verification at deploy time.
- **I3 — parentSlug FK constraint:** App-level cleanup is sufficient; D1 FK enforcement adds complexity.

---

## Test Suite After Fixes

- **Unit/Integration:** 23 test files, 350 tests passing
- **E2E:** 4 Playwright spec files, 53 tests
- **Coverage thresholds:** 70% lines, 70% functions, 70% branches (enforced)
- **TypeScript:** `tsc --noEmit` passes with zero errors

---

## Cumulative Audit History

| Round | Findings | Fixed | Deferred | Self-inflicted |
|-------|----------|-------|----------|----------------|
| 1 | 31 | 31 | 0 | — |
| 2 | 49 | 49 | 0 | — |
| 3 | 37 | 37 | 0 | — |
| 4 | 45 | 42 | 3 | 3 (from R3) |
| **Total** | **162** | **159** | **3** | **3** |

Genuine new findings in Round 4: **42** (45 total minus 3 self-inflicted)
