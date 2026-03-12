# Manual Test Scenarios — Pre-Deploy

Run these on UAT (`https://uat.example.com`) after deploying. Use an incognito window for public tests. Each section is independent — skip sections for disabled features.

## Coverage Legend

Each checkbox is tagged with its automated test coverage:

- `[AUTO]` — Fully covered by unit/integration/E2E tests. Quick visual confirmation only.
- `[PARTIAL]` — Logic tested (validation, DB ops), but UI rendering or full integration not automated. Verify visually.
- `[MANUAL]` — No automated coverage. Must be tested manually.

**Automated test suite:** 772 unit/integration tests (39 files via Vitest + getPlatformProxy) + 81 E2E tests (5 Playwright specs). Run `npm test` and `npm run test:e2e` before starting manual testing. Playwright uses `--max-failures=1` to fail fast. Pre-commit hooks (husky + lint-staged) automatically lint staged files and run unit tests; pre-push hooks run E2E tests.

---

## 1. Homepage

- [ ] `[MANUAL]` Page loads without errors
- [ ] `[MANUAL]` Hero section renders (heading, description, CTA button)
- [ ] `[MANUAL]` Hero variant matches theme setting (centered/gradient/split)
- [ ] `[MANUAL]` CTA is adaptive: shows waitlist form (pre-launch) or product links (post-launch) based on settings
- [ ] `[PARTIAL]` Latest blog posts section shows up to 3 published posts (skip if blog disabled) — *DB query tested in blog.integration.test.ts (getRecentPosts)*
- [ ] `[MANUAL]` Features section renders
- [ ] `[MANUAL]` Breadcrumbs: only "Home" (no extra crumbs)
- [ ] `[MANUAL]` FAQs accordion expands/collapses (if FAQ data exists)
- [ ] `[MANUAL]` Related pages cards link correctly
- [ ] `[PARTIAL]` JSON-LD in page source: `WebSite` schema with name, url — *JSON-LD generation tested in seo.test.ts*
- [ ] `[MANUAL]` OG meta tags present in `<head>` (title, description, image)
- [ ] `[MANUAL]` Page title uses template: `{title} | {siteName}`
- [ ] `[MANUAL]` Canonical URL points to homepage

## 2. Announcement Bar

- [ ] `[PARTIAL]` When enabled in Admin > Settings > Announcement: bar appears above header on all public pages — *settings validation tested in validation.test.ts, DB storage in site-settings.test.ts*
- [ ] `[MANUAL]` Text and link render correctly
- [ ] `[MANUAL]` Dismiss button (X) hides the bar
- [ ] `[MANUAL]` After dismissal, refreshing the page in same tab keeps it hidden (sessionStorage)
- [ ] `[MANUAL]` Open a new browser session (close all tabs) > bar reappears (sessionStorage is per-session)
- [ ] `[MANUAL]` Change announcement text in admin > old dismissal no longer applies, bar reappears
- [ ] `[MANUAL]` When disabled in settings: bar does not render at all
- [ ] `[PARTIAL]` Link opens correct URL (verify it's not javascript: or data:) — *isSafeUrl tested in utils.test.ts, announcement linkUrl validated in validation.test.ts*
- [ ] `[MANUAL]` Bar does not cause content to shift/overlap with fixed header
- [ ] `[MANUAL]` Announcement without link: text renders, no link shown
- [ ] `[MANUAL]` Announcement without text: bar does not render even if enabled

## 3. Header & Navigation

- [ ] `[MANUAL]` Logo/site name links to homepage
- [ ] `[MANUAL]` All nav links visible match enabled features (disabled features hidden)
- [ ] `[MANUAL]` Disable a feature in Admin > Settings > Features > verify its nav link disappears on refresh
- [ ] `[MANUAL]` Re-enable > verify it reappears
- [ ] `[MANUAL]` Mobile: hamburger menu opens/closes
- [ ] `[MANUAL]` Mobile: all links accessible and tappable
- [ ] `[MANUAL]` Search icon visible with Cmd+K hint
- [ ] `[MANUAL]` Active page link is visually distinguished
- [ ] `[MANUAL]` Sticky header stays visible on scroll
- [ ] `[MANUAL]` Announcement bar + header don't overlap page content
- [ ] `[MANUAL]` Header variant matches theme setting (solid/blur/transparent)
- [ ] `[MANUAL]` Theme toggle (sun/moon icon) visible in header (when `themeToggle` UI flag enabled)
- [ ] `[MANUAL]` Click theme toggle: switches between light and dark mode
- [ ] `[MANUAL]` Dark mode preference persists across page navigations and reload (localStorage)
- [ ] `[MANUAL]` CTA buttons in header respect feature flags (e.g., "Enter Giveaway" hidden when giveaway disabled)

## 4. Footer

- [ ] `[MANUAL]` All footer link groups render (Product, Resources, Legal)
- [ ] `[MANUAL]` Links for disabled features are hidden
- [ ] `[MANUAL]` Copyright year is current
- [ ] `[MANUAL]` Social links render if configured in settings
- [ ] `[MANUAL]` Social links with empty URLs: not rendered
- [ ] `[MANUAL]` All links navigate correctly
- [ ] `[MANUAL]` Footer variant matches theme setting (simple/columns/dark)

## 5. Search (Cmd+K)

- [ ] `[MANUAL]` Press Cmd+K (or Ctrl+K on Windows): search dialog opens
- [ ] `[MANUAL]` Click search icon: dialog opens
- [ ] `[PARTIAL]` Type a known blog post title: result appears under "Blog Posts" — *search logic tested in search.test.ts*
- [ ] `[PARTIAL]` Type a known page title: result appears under "Pages" — *search logic tested in search.test.ts*
- [ ] `[MANUAL]` Click a result: navigates to correct page, dialog closes
- [ ] `[MANUAL]` Press Escape: dialog closes
- [ ] `[MANUAL]` Empty query: no results shown (not an error)
- [ ] `[AUTO]` Single character query (e.g., "a"): no results (minimum 2 chars) — *search.test.ts: "minimum query length"*
- [ ] `[MANUAL]` Very long query (200+ chars): gracefully rejected
- [ ] `[MANUAL]` Gibberish query: "No results" message
- [ ] `[AUTO]` Results are grouped: Pages section and Blog Posts section (max 5 each) — *search.test.ts: "result limits"*
- [ ] `[MANUAL]` Search works on mobile
- [ ] `[AUTO]` Unpublished posts do NOT appear in search results — *search.test.ts: "unpublished exclusion"*
- [ ] `[MANUAL]` Scheduled-future content does NOT appear in search results
- [ ] `[MANUAL]` Search API directly: `GET /api/search?q=` (empty query param) returns empty results, not error
- [ ] `[MANUAL]` Search API: `GET /api/search` (no query param) returns empty results gracefully

## 6. Waitlist (feature flag: `waitlist`)

### Signup
- [ ] `[MANUAL]` Navigate to `/waitlist`
- [ ] `[PARTIAL]` Turnstile widget appears (may be invisible until challenge needed) — *token verification tested in turnstile.test.ts*
- [ ] `[PARTIAL]` Submit with empty fields: validation errors shown — *field validation in validation.test.ts*
- [ ] `[AUTO]` Submit with invalid email: validation error — *validation.test.ts: "isValidEmail" (12 cases)*
- [ ] `[MANUAL]` Submit with valid name + email: success message, redirects to referral dashboard
- [ ] `[AUTO]` Check DB: subscriber created with status `active`, position assigned — *waitlist.integration.test.ts: "createSubscriber"*

### Referral Dashboard
- [ ] `[MANUAL]` `/waitlist/[code]` page loads with referral link
- [ ] `[MANUAL]` Loading skeleton shown briefly while data fetches
- [ ] `[MANUAL]` Copy referral link button works — icon changes to checkmark for 2 seconds
- [ ] `[AUTO]` Referral link URL is valid and contains the code — *referral.test.ts: "generateReferralCode" (8-char alphanumeric)*
- [ ] `[MANUAL]` Share buttons render (if configured)
- [ ] `[AUTO]` Position number displayed — *referral.test.ts: "calculateEffectivePosition"*
- [ ] `[MANUAL]` Invalid code (e.g., `/waitlist/nonexistent`): shows error or empty state (not crash)
- [ ] `[MANUAL]` Page has `noindex` robots meta (referral pages should not be indexed)

### Referral Notification Email
- [ ] `[MANUAL]` User B signs up via user A's referral link > user A receives a referral notification email
- [ ] `[MANUAL]` Referral notification email contains `List-Unsubscribe` header
- [ ] `[AUTO]` Referral notification email HTML is properly escaped — *queue-consumer.test.ts: "referral_notification"*

### Duplicate Prevention
- [ ] `[MANUAL]` Submit same email again: redirects to existing referral dashboard (not error)
- [ ] `[AUTO]` No duplicate subscriber row created in DB — *waitlist.integration.test.ts: "getSubscriberByEmail"*

### Feature Toggle
- [ ] `[MANUAL]` Disable `waitlist` in Admin > Settings
- [ ] `[MANUAL]` `/waitlist` returns 404
- [ ] `[MANUAL]` `/waitlist/[any-code]` also returns 404
- [ ] `[MANUAL]` Waitlist link hidden from nav and footer
- [ ] `[MANUAL]` `/sitemap.xml` does not include `/waitlist`
- [ ] `[MANUAL]` CTA blocks on blog posts switch from waitlist to product links (or hide)
- [ ] `[MANUAL]` Admin sidebar hides waitlist-related sections
- [ ] `[MANUAL]` `POST /api/waitlist` returns 404 when feature disabled

## 7. Giveaway (feature flag: `giveaway`)

- [ ] `[MANUAL]` Navigate to `/giveaway`
- [ ] `[PARTIAL]` Entry form renders with Turnstile — *Turnstile tested in turnstile.test.ts*
- [ ] `[MANUAL]` Submit valid entry: success message, form hidden
- [ ] `[AUTO]` Submit same email: "already entered" message — *giveaway.integration.test.ts: "getGiveawayEntryByEmail"*
- [ ] `[AUTO]` Check DB: giveaway entry created, `totalEntries` incremented atomically — *giveaway.integration.test.ts: "createGiveawayEntry"*
- [ ] `[AUTO]` If end date is in the past: form shows "giveaway has ended" message — *giveaway.test.ts: "isGiveawayEnded" (past/future dates)*
- [ ] `[MANUAL]` If end date is in the future: countdown timer visible, counts down in real time
- [ ] `[MANUAL]` Countdown reaches zero: message changes to "Giveaway has ended"
- [ ] `[MANUAL]` After successful entry: confirmation email received with action reminders
- [ ] `[MANUAL]` Confirmation email contains `List-Unsubscribe` header
- [ ] `[MANUAL]` Feature toggle off > 404, hidden from nav/sitemap
- [ ] `[MANUAL]` `POST /api/giveaway/enter` returns 404 when feature disabled
- [ ] `[MANUAL]` Admin sidebar hides giveaway management section when giveaway disabled

### Giveaway Actions (if configured)
- [ ] `[MANUAL]` Action cards render with correct labels
- [ ] `[MANUAL]` Click action "Complete" button: loading state ("..."), then green checkmark
- [ ] `[MANUAL]` Completed action card has visual distinction (green tint)
- [ ] `[AUTO]` Submit same action twice: second attempt shows "already completed" — *giveaway.integration.test.ts: "recordGiveawayAction duplicate rejection"*
- [ ] `[MANUAL]` Invalid action type via API: rejected with validation error
- [ ] `[MANUAL]` Bonus entries applied correctly per action type

## 8. Blog (feature flag: `blog`)

### Listing Page
- [ ] `[PARTIAL]` `/blog` loads with published posts — *DB query tested in blog.integration.test.ts: "getPublishedPosts"*
- [ ] `[AUTO]` Posts sorted by date (newest first) — *blog.integration.test.ts: "getPublishedPosts" pagination/ordering*
- [ ] `[MANUAL]` Post cards show: title, description, cover image, date, tags
- [ ] `[MANUAL]` Cover images load from R2 (not broken)
- [ ] `[AUTO]` Pagination works: next/previous pages — *blog.integration.test.ts: pagination tests*
- [ ] `[MANUAL]` Page 1: "Previous" button disabled, "Next" enabled (if multiple pages)
- [ ] `[MANUAL]` Last page: "Next" button disabled, "Previous" enabled
- [ ] `[PARTIAL]` Navigate to page number beyond total (e.g., `?page=999`): handled gracefully — *api.test.ts: "clampInt" clamping*
- [ ] `[MANUAL]` Breadcrumbs: Home > Blog
- [ ] `[MANUAL]` JSON-LD: `CollectionPage` schema
- [ ] `[MANUAL]` Post card style matches theme variant (bordered/filled/minimal)

### Empty State
- [ ] `[MANUAL]` Unpublish all posts: `/blog` shows "No posts yet" message (not blank page)

### Single Post
- [ ] `[E2E]` Click a post: `/blog/[slug]` loads — *posts.spec.ts: post creation + public visibility*
- [ ] `[E2E]` All content block types render correctly (see Section 21 below) — *posts.spec.ts: creates post with Paragraph, Heading, List, Callout, Quote, Table, CTA blocks*
- [ ] `[MANUAL]` Cover image renders
- [ ] `[MANUAL]` Title (h1), date, tags displayed
- [ ] `[MANUAL]` Breadcrumbs: Home > Blog > Post Title
- [ ] `[PARTIAL]` JSON-LD: `BlogPosting` schema with author, datePublished, image — *seo.test.ts: field auditing*
- [ ] `[MANUAL]` Canonical URL present
- [ ] `[E2E]` FAQs section renders if post has FAQ data — *pages.spec.ts: FAQ creation/rendering*
- [ ] `[AUTO]` Related posts section shows posts with matching tags — *blog.integration.test.ts: "getRelatedPosts" tag matching, self-exclusion*
- [ ] `[AUTO]` Unpublished posts return 404 on public site — *blog.integration.test.ts: "getPublishedPostBySlug" unpublished rejection*
- [ ] `[AUTO]` Draft posts (published=false) not visible in listing — *blog.integration.test.ts: "getPublishedPosts" published-only*
- [ ] `[AUTO]` Post with no tags: related posts section hidden or empty — *blog.integration.test.ts: "getRelatedPosts" empty tags*

### Adjacent Posts & Reading Time
- [ ] `[AUTO]` Prev/next navigation for middle post returns correct adjacent posts — *blog-extended.integration.test.ts: "getAdjacentPosts"*
- [ ] `[AUTO]` Adjacent posts skip unpublished and future-scheduled posts — *blog-extended.integration.test.ts: "skips unpublished/future-scheduled"*
- [ ] `[AUTO]` Reading time calculated from content blocks (paragraphs, lists, code, accordions, tabs) — *blog-extended.integration.test.ts: "calculateReadingTime"*
- [ ] `[MANUAL]` Reading time displayed on post page (e.g., "2 min read")
- [ ] `[MANUAL]` Prev/Next links render at bottom of post page

### Tag Pages
- [ ] `[AUTO]` `/blog/tag/[tag]` returns posts matching the tag — *blog-extended.integration.test.ts: "getPublishedPostsByTag"*
- [ ] `[AUTO]` Tag page excludes draft and future-scheduled posts — *blog-extended.integration.test.ts*
- [ ] `[AUTO]` Tag page paginates correctly — *blog-extended.integration.test.ts: "paginates results"*
- [ ] `[AUTO]` `getAllTags` returns tags with correct counts, ordered by count DESC — *blog-extended.integration.test.ts: "getAllTags"*
- [ ] `[MANUAL]` Tag page has breadcrumbs: Home > Blog > Tag: {tag}
- [ ] `[MANUAL]` Tag page has dynamic OG image
- [ ] `[MANUAL]` Tag cloud/list shows all tags with counts

### Content Scheduling
- [ ] `[AUTO]` Create a post with `scheduledPublishAt` set to future — *blog.integration.test.ts: future-scheduled exclusion*
- [ ] `[AUTO]` Post does NOT appear in `/blog` listing before scheduled time — *blog.integration.test.ts: "getPublishedPosts" future-scheduled exclusion*
- [ ] `[AUTO]` Post returns 404 on direct URL before scheduled time — *blog.integration.test.ts: "getPublishedPostBySlug" future-scheduled rejection*
- [ ] `[MANUAL]` After scheduled time passes: post appears in listing and is accessible
- [ ] `[MANUAL]` Post does NOT appear in `/sitemap.xml` before scheduled time
- [ ] `[MANUAL]` Post does NOT appear in search results before scheduled time
- [ ] `[MANUAL]` Scheduled post shows "Scheduled" badge in admin list

### Feature Toggle
- [ ] `[MANUAL]` Disable `blog` > `/blog` returns 404, hidden from nav/sitemap
- [ ] `[MANUAL]` `GET /api/blog` returns 404 when blog disabled
- [ ] `[MANUAL]` `GET /api/blog/[slug]` returns 404 when blog disabled
- [ ] `[MANUAL]` Admin sidebar hides post management section when blog disabled

## 9. Contact Form (feature flag: `contact`)

- [ ] `[MANUAL]` Navigate to `/contact`
- [ ] `[MANUAL]` Form fields: name, email, message
- [ ] `[PARTIAL]` Turnstile widget present — *turnstile.test.ts*
- [ ] `[PARTIAL]` Submit empty form: validation errors — *validation.test.ts*
- [ ] `[MANUAL]` Submit valid form: success message shown, form hidden
- [ ] `[AUTO]` Check DB: contact_messages row created — *contact.integration.test.ts: "createContactSubmission"*
- [ ] `[AUTO]` Check email queue: email job queued (or sent via Resend) — *queue-consumer.test.ts: "contact_receipt" email type*
- [ ] `[MANUAL]` Feature toggle off > 404, hidden from nav/sitemap
- [ ] `[MANUAL]` Admin sidebar hides contact submissions section when contact disabled
- [ ] `[MANUAL]` **CSV export**: click "Export CSV" on admin contacts page > downloads CSV with submissions

## 10. Pricing (feature flag: `pricing`)

- [ ] `[MANUAL]` Navigate to `/pricing`
- [ ] `[MANUAL]` Pricing tiers render correctly
- [ ] `[PARTIAL]` CTA buttons link to correct URLs (validated with isSafeUrl) — *utils.test.ts: isSafeUrl*
- [ ] `[MANUAL]` Breadcrumbs: Home > Pricing
- [ ] `[MANUAL]` JSON-LD: `WebPage` schema
- [ ] `[MANUAL]` OG tags present
- [ ] `[MANUAL]` Canonical URL present
- [ ] `[MANUAL]` FAQs section renders if data exists
- [ ] `[MANUAL]` Feature toggle off > 404, hidden from nav/sitemap

## 11. Changelog (feature flag: `changelog`)

- [ ] `[MANUAL]` Navigate to `/changelog`
- [ ] `[MANUAL]` Changelog entries render in reverse chronological order
- [ ] `[MANUAL]` Each entry has date, title, description
- [ ] `[MANUAL]` Breadcrumbs: Home > Changelog
- [ ] `[MANUAL]` JSON-LD: `WebPage` schema
- [ ] `[MANUAL]` OG tags present
- [ ] `[MANUAL]` Canonical URL present
- [ ] `[MANUAL]` Empty changelog (no entries): shows empty state message
- [ ] `[MANUAL]` Feature toggle off > 404, hidden from nav/sitemap

## 12. Content Pages (catch-all `[...slug]`)

### Basic Page
- [ ] `[E2E]` Create a page via admin with slug `test-page` — *pages.spec.ts: create page, public visibility*
- [ ] `[E2E]` Navigate to `/test-page`: page renders with content blocks — *pages.spec.ts*
- [ ] `[MANUAL]` Breadcrumbs: Home > Test Page
- [ ] `[MANUAL]` JSON-LD present
- [ ] `[MANUAL]` Canonical URL present
- [ ] `[E2E]` FAQs section renders if data exists — *pages.spec.ts: FAQ creation/rendering*
- [ ] `[E2E]` Related pages section renders if configured — *pages.spec.ts: related page display*

### Pillar Page (parent with children)
- [ ] `[E2E]` Create parent page: slug `guides` — *pages.spec.ts: parent creation*
- [ ] `[E2E]` Create child page with parentSlug — *pages.spec.ts: child creation via API*
- [ ] `[E2E]` Navigate to parent: pillar page renders with child page cards — *pages.spec.ts: "In This Section" verification*
- [ ] `[E2E]` Navigate to child: child page renders — *pages.spec.ts: child accessible*
- [ ] `[MANUAL]` Breadcrumbs: Home > Guides > Email Marketing

### Page Templates
- [ ] `[MANUAL]` Default template renders standard layout
- [ ] `[MANUAL]` Landing template renders without sidebar/standard chrome
- [ ] `[MANUAL]` Listing template renders children as grid
- [ ] `[MANUAL]` Pillar template renders children with hierarchy

### Content Scheduling
- [ ] `[AUTO]` Page with future `scheduledPublishAt` returns 404 on public site — *pages.integration.test.ts: future-scheduled exclusion*
- [ ] `[MANUAL]` After scheduled time: page accessible
- [ ] `[MANUAL]` Scheduled page excluded from sitemap and search before scheduled time

### Reserved Slugs
- [ ] `[AUTO]` Attempt to create page with slug `blog`, `admin`, `api`, `waitlist` — should be rejected — *pages.integration.test.ts: "isReservedSlug"*
- [ ] `[MANUAL]` Attempt to create page with slug `feed.xml`, `sitemap.xml` — should be rejected

### Noindex Pages
- [ ] `[MANUAL]` Create page with noindex metadata enabled
- [ ] `[MANUAL]` Verify page has `<meta name="robots" content="noindex">` in source
- [ ] `[MANUAL]` Verify page excluded from `/sitemap.xml`

## 13. Terms & Privacy

- [ ] `[MANUAL]` `/terms` loads with content blocks from DB
- [ ] `[MANUAL]` `/privacy` loads with content blocks from DB
- [ ] `[MANUAL]` Both have breadcrumbs, JSON-LD
- [ ] `[MANUAL]` Content is editable via admin
- [ ] `[MANUAL]` If content blocks are empty: fallback message displayed (e.g., "content is being prepared")
- [ ] `[AUTO]` System page guard: cannot unpublish or delete via admin — *pages.integration.test.ts: "isSystemPage", "deletePage system page protection"*

## 14. RSS Feed

- [ ] `[MANUAL]` `/feed.xml` accessible and returns valid XML
- [ ] `[MANUAL]` Contains all published blog posts with title, description, link, pubDate
- [ ] `[MANUAL]` Does not contain draft or scheduled-future posts
- [ ] `[MANUAL]` Feed items have correct absolute URLs (not relative paths)
- [ ] `[MANUAL]` Feed `<channel>` has correct site name and description from DB settings
- [ ] `[MANUAL]` Disable blog feature > `/feed.xml` returns 404

## 15. Unsubscribe

- [ ] `[MANUAL]` Click unsubscribe link from a test email
- [ ] `[MANUAL]` Success message shown
- [ ] `[AUTO]` Check DB: subscriber status changed to `unsubscribed` — *waitlist.integration.test.ts: "unsubscribe"*
- [ ] `[MANUAL]` Click same link again: still shows success (idempotent)
- [ ] `[AUTO]` Tamper with token in URL: error message shown — *waitlist.test.ts: "verifyUnsubscribeToken" wrong token/email/secret*
- [ ] `[MANUAL]` Tamper with email in URL (keep valid token): error (HMAC mismatch)
- [ ] `[AUTO]` Rate limit: 11+ rapid requests within 60 seconds get 429 — *rate-limit.test.ts: over-limit scenarios*

## 16. Sitemap & Robots

- [ ] `[MANUAL]` `/sitemap.xml` accessible and valid XML
- [ ] `[MANUAL]` Includes: homepage, all enabled feature pages, published blog posts, published content pages
- [ ] `[MANUAL]` Excludes: admin pages, API routes, disabled features, unpublished posts, noindex pages, scheduled-future content
- [ ] `[MANUAL]` Pages with `noindex` metadata flag are excluded
- [ ] `[AUTO]` Sitemap uses lightweight `getPublishedPostSlugs` query (slug + updatedAt only) — *blog-extended.integration.test.ts: "getPublishedPostSlugs"*
- [ ] `[AUTO]` Content pages listed via `getPublishedContentPages` (excludes heavy columns) — *pages-extended.integration.test.ts: "getPublishedContentPages"*
- [ ] `[MANUAL]` `/robots.txt`:
  - UAT: `Disallow: /`
  - Production: `Allow: /`, blocks `/admin`, includes sitemap URL, includes RSS feed URL

## 17. R2 Asset Proxy (`/api/assets/[...key]`)

- [ ] `[MANUAL]` Valid image path (e.g., `/api/assets/blog/some-slug/cover.webp`) returns image with correct `Content-Type`
- [ ] `[MANUAL]` Non-existent key returns 404
- [ ] `[MANUAL]` Path traversal attempt (e.g., `/api/assets/blog/../../etc/passwd`) returns 404
- [ ] `[MANUAL]` Invalid prefix (not `blog/`, `uploads/`, `og/`) returns 404
- [ ] `[MANUAL]` Response includes `X-Content-Type-Options: nosniff` header
- [ ] `[MANUAL]` Response includes `Cache-Control: public, max-age=86400` header

## 18. Email Compliance

- [ ] `[MANUAL]` Trigger a test email (waitlist signup or contact form)
- [ ] `[AUTO]` Email contains `List-Unsubscribe` header — *queue-consumer.test.ts: "Unsubscribe headers"*
- [ ] `[MANUAL]` Unsubscribe link in email body works
- [ ] `[AUTO]` HTML content is properly escaped (no raw HTML injection) — *queue-consumer.test.ts: "HTML escaping" (script tags, entities)*
- [ ] `[MANUAL]` Sender address matches FROM_EMAIL environment variable
- [ ] `[AUTO]` Email batch queuing splits into chunks of 100 for `queue.sendBatch` — *queue.test.ts: "enqueueEmailBatch"*

## 18a. Dynamic OG Images

- [ ] `[MANUAL]` **Homepage**: root `opengraph-image.tsx` generates OG image with site name + description + accent color
- [ ] `[MANUAL]` **Blog post**: `/blog/[slug]` OG image shows post title, description, tags, author, date
- [ ] `[MANUAL]` **Blog tag page**: `/blog/tag/[tag]` OG image shows tag name in accent color
- [ ] `[MANUAL]` **Content pages**: `GET /api/og?slug={slug}` generates OG image with page title + description
- [ ] `[MANUAL]` All OG images return 1200x630 PNG
- [ ] `[MANUAL]` Missing/invalid slug in `/api/og?slug=` returns fallback image (not an error)
- [ ] `[MANUAL]` Content page metadata references `/api/og?slug=` when no cover image set
- [ ] `[MANUAL]` Content page with cover image uses cover image as OG instead of dynamic

## 19. Cookie Consent

- [ ] `[PARTIAL]` First visit (no cookies): cookie consent banner appears at bottom of page — *cookies.test.ts: parseConsentCookie undefined handling*
- [ ] `[MANUAL]` Banner shows "Accept All" and "Customize" options
- [ ] `[MANUAL]` Click "Accept All": banner disappears, consent stored
- [ ] `[PARTIAL]` Reload page: banner does not reappear — *cookies.test.ts: hasConsent, parseConsentCookie round-trip*
- [ ] `[MANUAL]` Click "Customize": expanded view shows cookie categories (Necessary always on)
- [ ] `[PARTIAL]` Toggle categories off, click "Save Preferences": banner disappears, preferences stored — *cookies.test.ts: buildConsentCookieValue, multi-category*
- [ ] `[MANUAL]` Click "Reject All" (if available): only necessary cookies allowed
- [ ] `[MANUAL]` Cookie preferences link (if in footer): reopens banner with saved preferences

### Cookie Consent + Tracking Integration
- [ ] `[MANUAL]` Enable cookie consent + GA > first visit (no consent yet): GA script does NOT load
- [ ] `[MANUAL]` Accept analytics cookies > GA script loads on next page navigation
- [ ] `[MANUAL]` Reject analytics cookies > GA script does NOT load
- [ ] `[MANUAL]` Enable cookie consent + Meta Pixel > reject marketing cookies > Pixel does NOT fire
- [ ] `[MANUAL]` Accept marketing cookies > Pixel fires
- [ ] `[MANUAL]` Cookie consent disabled in tracking settings > all tracking scripts load without consent check

---

## 20. Admin Panel

### Login
- [ ] `[E2E]` Navigate to `/admin`: login form shown — *admin.spec.ts: "login form display"*
- [ ] `[E2E]` Login with correct credentials: redirected to dashboard — *admin.spec.ts: "successful login"*
- [ ] `[E2E]` Login with wrong password: generic error message — *admin.spec.ts: "wrong password rejection"*
- [ ] `[MANUAL]` Login with very long password (>1000 chars): rejected by validation
- [ ] `[AUTO]` Login rate limit: 5+ failed attempts per IP in 1 hour > subsequent attempts get 429 — *rate-limit.test.ts*
- [ ] `[MANUAL]` After login: session cookie is HttpOnly, Secure (prod), SameSite=Lax
- [ ] `[AUTO]` Session expires after 24 hours (or 7-day absolute max) — *admin.test.ts: "validateSession" expiry + 7-day absolute max*
- [ ] `[E2E]` After logout: can't access admin pages, redirected to login — *admin.spec.ts: "logout flow"*
- [ ] `[AUTO]` Logout twice: second logout is idempotent (no error) — *admin.test.ts: "deleteSession" non-existent handling*
- [ ] `[E2E]` Direct API call to `/api/admin/*` without session: 401 — *readonly-admin.spec.ts: "Unauthenticated API returns 401"*
- [ ] `[MANUAL]` Visit `/admin` when already logged in: redirected to `/admin/dashboard`

### Dashboard
- [ ] `[E2E]` Shows summary stats: subscriber count, post count, page count — *admin.spec.ts: "stats cards"*
- [ ] `[AUTO]` Signup trend: daily signup counts for recent period — *dashboard.integration.test.ts: "getSignupTrend"*
- [ ] `[AUTO]` Contact trend: daily contact submission counts — *dashboard.integration.test.ts: "getContactTrend"*
- [ ] `[AUTO]` Top referrers: shows top referral sources ordered by count — *dashboard.integration.test.ts: "getTopReferrers"*
- [ ] `[MANUAL]` Trend charts render visually (signup + contact line charts)
- [ ] `[MANUAL]` Top referrers table displays correctly
- [ ] `[MANUAL]` Recent activity or quick links render
- [ ] `[MANUAL]` Page title doesn't duplicate site name (should be "Dashboard | Admin", not "Dashboard | Admin | SiteName")

### Post Management
- [ ] `[AUTO]` **List uses summary query**: excludes heavy content/FAQs columns — *blog-extended.integration.test.ts: "getAllPostSummaries"*
- [ ] `[E2E]` **List**: all posts displayed with title, status (Published/Draft/Scheduled), date — *posts.spec.ts*
- [ ] `[MANUAL]` **Empty state**: no posts > shows "No posts yet" message with "Create your first post" prompt
- [ ] `[E2E]` **Create**: click New Post > fill title, slug, description, cover image, tags — *posts.spec.ts: post creation*
- [ ] `[AUTO]` **Duplicate slug**: create post with slug that already exists > validation error — *blog.integration.test.ts*
- [ ] `[E2E]` **Block Editor**: add blocks of each type, reorder via drag, delete blocks — *posts.spec.ts: 7 block types tested*
- [ ] `[E2E]` **Save as draft**: post saved, not visible on public site — *posts.spec.ts: "unpublish toggle"*
- [ ] `[E2E]` **Publish**: post visible on public site — *posts.spec.ts: "publication"*
- [ ] `[MANUAL]` **Schedule**: set future publish date > post shows "Scheduled" badge
- [ ] `[E2E]` **Edit**: modify existing post > changes reflected on public site — *posts.spec.ts*
- [ ] `[AUTO]` **Delete**: post removed from listing and public site — *blog.integration.test.ts: "deletePost"*
- [ ] `[MANUAL]` **Cover image upload**: image uploads to R2, displays in editor and public site
- [ ] `[MANUAL]` **Inline image upload**: images within content blocks upload and display
- [ ] `[MANUAL]` **FAQs editor**: add/edit/remove FAQ items
- [ ] `[MANUAL]` **Tags**: add/remove tags, tags display on public post
- [ ] `[AUTO]` **Slug validation**: duplicate slugs rejected, invalid characters rejected — *validation.test.ts: "validateSlug"*
- [ ] `[AUTO]` **Duplicate**: duplicate a post > creates copy with `-copy` slug, `(Copy)` title, unpublished — *blog-extended.integration.test.ts: "duplicatePost"*
- [ ] `[AUTO]` **Duplicate slug collision**: if `-copy` slug exists, appends `-copy-2`, `-copy-3`, etc. — *blog-extended.integration.test.ts*
- [ ] `[AUTO]` **Duplicate preserves content**: FAQs, tags, description carried over — *blog-extended.integration.test.ts*

### Page Management
- [ ] `[AUTO]` **List uses summary query**: excludes heavy content/FAQs/metadata columns — *pages-extended.integration.test.ts: "getAllPageSummaries"*
- [ ] `[E2E]` **List**: all pages with title, slug, status, template — *pages.spec.ts*
- [ ] `[MANUAL]` **Empty state**: only system pages > shows appropriate message
- [ ] `[E2E]` **Create**: new page with title, slug, description, template, parent page — *pages.spec.ts*
- [ ] `[MANUAL]` **Templates**: selecting different templates changes public rendering
- [ ] `[E2E]` **Parent page**: setting parentSlug creates hierarchy — *pages.spec.ts: parent-child*
- [ ] `[E2E]` **Edit/Delete**: works correctly — *pages.spec.ts: "edit title", "delete via API"*
- [ ] `[AUTO]` **System pages** (home, terms, privacy): cannot unpublish — shows validation error — *pages.integration.test.ts: "isSystemPage"*
- [ ] `[AUTO]` **System pages**: cannot delete — shows validation error — *pages.integration.test.ts: "deletePage system page protection"*
- [ ] `[AUTO]` **Reserved slugs**: cannot create page with slug `admin`, `api` — validation error — *pages.integration.test.ts: "isReservedSlug"*
- [ ] `[MANUAL]` **Content scheduling**: same as posts

### Redirect Management
- [ ] `[MANUAL]` **List**: `/admin/redirects` shows all redirects with from, to, status code, enabled
- [ ] `[MANUAL]` **Create**: click New > enter from path (`/old-page`), to URL (`/new-page`), status (301/302)
- [ ] `[AUTO]` **Validation**: from path must start with `/`, can't be `/admin` or `/api` — *validation.test.ts: "validateRedirectBody" (65 cases)*
- [ ] `[AUTO]` **Duplicate prevention**: creating redirect with same from path as existing one shows error — *redirects schema UNIQUE constraint*
- [ ] `[MANUAL]` **Enable/disable**: toggle enabled state
- [ ] `[AUTO]` **Edit**: modify from, to, status code — *redirects.integration.test.ts: "updateRedirect"*
- [ ] `[AUTO]` **Delete**: redirect removed — *redirects.integration.test.ts: "deleteRedirect"*
- [ ] `[MANUAL]` **Verify 301 redirect**: create with 301 > visit path > browser shows 301 (check Network tab)
- [ ] `[MANUAL]` **Verify 302 redirect**: create with 302 > visit path > browser shows 302
- [ ] `[MANUAL]` **Redirect to external URL**: create redirect to `https://example.com` > verify it works
- [ ] `[AUTO]` **Redirect to relative path**: create `/old` > `/new` > verify it resolves correctly — *redirects.integration.test.ts: "getRedirectByPath"*
- [ ] `[AUTO]` **Disabled redirect**: visit path > no redirect — *redirects.integration.test.ts: "getRedirectByPath disabled rejection"*
- [ ] `[MANUAL]` **Self-redirect**: try creating `/page` > `/page` — verify behavior (should ideally be rejected)
- [ ] `[MANUAL]` `/admin/redirects/new` page loads with empty form
- [ ] `[MANUAL]` `/admin/redirects/[id]/edit` page loads with pre-filled data from existing redirect
- [ ] `[MANUAL]` Edit redirect form saves successfully and returns to list

### Subscriber Management
- [ ] `[E2E]` Subscriber list shows all subscribers with name, email, status, date — *readonly-admin.spec.ts: "Subscribers page loads"*
- [ ] `[MANUAL]` Status filters work (active, unsubscribed, invited)
- [ ] `[MANUAL]` Empty state: no subscribers > shows "No subscribers yet" message
- [ ] `[AUTO]` **CSV export**: client-side CSV generation with proper escaping (commas, quotes, newlines) — *csv-export.test.ts*
- [ ] `[MANUAL]` **Export button**: click "Export CSV" > downloads CSV file with subscriber data
- [ ] `[MANUAL]` **CSV import**: upload CSV with email/name columns > subscribers created with unique positions
- [ ] `[AUTO]` **Email verification**: transitions subscriber from pending to active — *waitlist-extended.integration.test.ts: "verifySubscriberEmail"*
- [ ] `[AUTO]` **Status tracking**: returns correct status for each lifecycle stage — *waitlist-extended.integration.test.ts: "getSubscriberStatus"*

### Giveaway Management
- [ ] `[E2E]` Entry list shows all entries — *readonly-admin.spec.ts: "Giveaway page loads"*
- [ ] `[AUTO]` Entry count matches totalEntries — *giveaway.integration.test.ts: "getGiveawayStats"*
- [ ] `[MANUAL]` Empty state: no entries > shows "No giveaway entries yet" message

### Settings
- [ ] `[AUTO]` **Site Identity**: update site name, description, logo URL > reflected on public site — *site-settings.test.ts: "updateSiteSettings"*
- [ ] `[MANUAL]` **Site name**: change name > header, footer, JSON-LD, OG tags all update
- [ ] `[AUTO]` **Logo URL**: set invalid URL > validation error — *validation.test.ts: "validateSiteSettingsBody" logoUrl*
- [ ] `[MANUAL]` Set valid logo URL > logo renders in header
- [ ] `[MANUAL]` **Features**: toggle each feature on/off > immediate effect on public site
- [ ] `[AUTO]` **Product Links**: URL safety validated — *validation.test.ts: productLinks isSafeUrl*
- [ ] `[MANUAL]` **Product Links**: update app URL, iOS URL, Android URL > CTA buttons update
- [ ] `[MANUAL]` **Product Links**: set empty > CTA blocks show nothing in post-launch mode
- [ ] `[AUTO]` **Social Links**: URL safety validated — *validation.test.ts: social URLs isSafeUrl*
- [ ] `[MANUAL]` **Social Links**: add/edit/remove social URLs > footer social links update
- [ ] `[AUTO]` **Social Links**: set `javascript:alert(1)` as URL > rejected by validation — *validation.test.ts: javascript: protocol rejection*
- [ ] `[MANUAL]` **UI Flags**: disable `themeToggle` in Settings > theme toggle icon disappears from header
- [ ] `[MANUAL]` **UI Flags**: disable `search` in Settings > search icon and Cmd+K shortcut no longer work
- [ ] `[MANUAL]` **UI Flags**: re-enable each > functionality returns
- [ ] `[MANUAL]` **Save**: success message, page refreshes with new values
- [ ] `[MANUAL]` **Validation errors**: shown inline, form not submitted

### Theme Settings
- [ ] `[AUTO]` **Accent color**: hex format validated — *color.test.ts: "hexToOklch" format validation, invalid input rejection*
- [ ] `[MANUAL]` **Accent color**: change color picker > public site primary color changes (buttons, links, badges)
- [ ] `[MANUAL]` **Accent color**: enter invalid hex > rejected or ignored
- [ ] `[AUTO]` **Border radius**: validated in allowlist — *validation.test.ts: borderRadius validation*
- [ ] `[MANUAL]` **Border radius**: adjust slider > buttons/cards roundness changes
- [ ] `[AUTO]` **Font**: validated in allowlist — *validation.test.ts: font family allowlist*
- [ ] `[MANUAL]` **Font**: switch between Inter/Geist/DM Sans/Space Grotesk > public site font changes on reload
- [ ] `[AUTO]` **Component variants**: validated in allowlists — *validation.test.ts: header/footer/postCard/cta/hero variant validation*
- [ ] `[MANUAL]` **Component variants**:
  - Header: solid/blur/transparent > header style changes
  - Footer: simple/columns/dark > footer style changes
  - Post card: bordered/filled/minimal > blog listing card style changes
  - CTA: gradient/solid/outlined > CTA section style changes
  - Hero: centered/gradient/split > homepage hero style changes
- [ ] `[MANUAL]` **Presets**: select minimal/bold/corporate/playful > all fields populate > public site updates
- [ ] `[MANUAL]` **Override after preset**: change individual values after selecting a preset > works

### Tracking Settings
- [ ] `[E2E]` **Facebook Pixel**: enter pixel ID — *tracking.spec.ts: seeded values display*
- [ ] `[E2E]` **Facebook Pixel**: enter non-numeric ID (e.g., "abc") > validation error — *tracking.spec.ts: "invalid pixel ID (digits only)"*
- [ ] `[MANUAL]` **Facebook Pixel**: pixel actually fires on public pages (check browser network tab)
- [ ] `[MANUAL]` **Facebook CAPI**: enter access token > server-side events sent
- [ ] `[MANUAL]` **Facebook CAPI**: enter token > 500 chars > validation error
- [ ] `[E2E]` **Google Analytics**: enter invalid format (e.g., "GA-123") > validation error — *tracking.spec.ts: "invalid GA measurement ID"*
- [ ] `[MANUAL]` **Google Analytics**: enter measurement ID > GA script loads on public pages
- [ ] `[MANUAL]` **GA Measurement Protocol**: enter API secret > server-side events sent
- [ ] `[MANUAL]` **GTM**: enter valid container ID (e.g., `GTM-ABCD123`) > GTM script loads on public pages
- [ ] `[MANUAL]` **GTM**: enter invalid format (e.g., `GTM_123` or `abc`) > validation error
- [ ] `[MANUAL]` **GTM**: disable > no GTM script on public pages
- [ ] `[MANUAL]` **GTM**: consent mode — script only loads when analytics cookie consent is granted
- [ ] `[MANUAL]` **UTM tracking**: enable in admin > visit page with `?utm_source=google&utm_medium=cpc` > UTM params preserved for tracking events
- [ ] `[MANUAL]` **UTM tracking**: disable > UTM params ignored
- [ ] `[MANUAL]` **Disable tracking**: clear all IDs > no tracking scripts on public pages
- [ ] `[MANUAL]` **Partial tracking**: set only GA (no Facebook) > only GA fires, no Facebook errors

### SEO Audit
- [ ] `[E2E]` `/admin/seo` loads with audit results — *readonly-admin.spec.ts: "SEO Audit loads"*
- [ ] `[AUTO]` Shows pages missing metadata, descriptions, JSON-LD, etc. — *seo.test.ts: field auditing*
- [ ] `[MANUAL]` Actionable links to edit pages with issues

### Campaign Management
- [ ] `[AUTO]` **List**: campaigns displayed ordered by date — *campaigns.integration.test.ts: "getCampaigns"*
- [ ] `[AUTO]` **Create**: campaign created with draft status, sentCount=0 — *campaigns.integration.test.ts: "createCampaign"*
- [ ] `[AUTO]` **Edit**: update subject/body — *campaigns.integration.test.ts: "updateCampaign"*
- [ ] `[AUTO]` **Delete**: campaign removed — *campaigns.integration.test.ts: "deleteCampaign"*
- [ ] `[AUTO]` **Send**: marks as sending, sets totalCount, targets active subscribers only — *campaigns.integration.test.ts: "markCampaignSending", "getActiveSubscriberEmails"*
- [ ] `[AUTO]` **Send progress**: sentCount increments atomically — *campaigns.integration.test.ts: "incrementSentCount"*
- [ ] `[AUTO]` **Send completion**: marks as sent with timestamp — *campaigns.integration.test.ts: "markCampaignSent"*
- [ ] `[AUTO]` **Batch queue**: emails sent via `enqueueEmailBatch` in batches of 100 — *queue.test.ts: "enqueueEmailBatch"*
- [ ] `[MANUAL]` **Campaign email received**: subscribers receive email with correct subject/body
- [ ] `[MANUAL]` **Campaign email**: contains List-Unsubscribe header
- [ ] `[MANUAL]` **Empty state**: no campaigns > shows "No campaigns yet"

### Webhook Management
- [ ] `[AUTO]` **List**: webhooks displayed ordered by creation date — *webhooks.integration.test.ts: "getWebhooks"*
- [ ] `[AUTO]` **Create**: webhook with URL, events, secret — *webhooks.integration.test.ts: "createWebhook"*
- [ ] `[AUTO]` **Edit**: update URL, events, secret, active status — *webhooks.integration.test.ts: "updateWebhook"*
- [ ] `[AUTO]` **Delete**: webhook removed — *webhooks.integration.test.ts: "deleteWebhook"*
- [ ] `[AUTO]` **Enable/Disable**: toggle active state — *webhooks.integration.test.ts*
- [ ] `[AUTO]` **Fire**: matching webhooks receive signed HTTP POST — *webhooks.integration.test.ts: "fireWebhooks"*
- [ ] `[AUTO]` **HMAC signature**: X-Webhook-Signature is valid SHA-256 hex — *webhooks.integration.test.ts*
- [ ] `[AUTO]` **Fire-and-forget**: webhook failure doesn't break parent operation — *webhooks.integration.test.ts*
- [ ] `[MANUAL]` **Webhook delivery**: configure test endpoint (webhook.site) > trigger event > verify delivery

### Audit Log
- [ ] `[AUTO]` **Log events**: admin actions logged with action, entity, details, IP — *audit.integration.test.ts: "logAuditEvent"*
- [ ] `[AUTO]` **Pagination**: supports paginated retrieval — *audit.integration.test.ts: "getAuditLog"*
- [ ] `[AUTO]` **Fire-and-forget**: logging failure doesn't break parent operation — *audit.integration.test.ts*
- [ ] `[MANUAL]` `/admin/audit-log` loads with audit entries sorted newest first

### Error Log
- [ ] `[AUTO]` **Capture exceptions**: errors logged with message, stack, source, context — *error-tracking.integration.test.ts: "captureException"*
- [ ] `[AUTO]` **Capture messages**: info/warning messages logged — *error-tracking.integration.test.ts: "captureMessage"*
- [ ] `[AUTO]` **Truncation**: message limited to 1000 chars, stack to 2000 chars — *error-tracking.integration.test.ts*
- [ ] `[AUTO]` **Cleanup**: old entries purged by age — *error-tracking.integration.test.ts: "cleanupErrorLog"*
- [ ] `[MANUAL]` `/admin/errors` loads with error log entries

### Asset Management
- [ ] `[AUTO]` **List assets**: R2 objects listed with key, size, date, content type — *assets.test.ts: "listAssets"*
- [ ] `[AUTO]` **List with prefix**: filtering by prefix works — *assets.test.ts*
- [ ] `[AUTO]` **Delete asset**: removes from R2 — *assets.test.ts: "deleteAsset"*
- [ ] `[AUTO]` **Public URL**: generates correct URL — *assets.test.ts: "getAssetPublicUrl"*
- [ ] `[MANUAL]` `/admin/assets` loads with asset browser
- [ ] `[MANUAL]` Delete confirmation dialog works

### File Upload
- [ ] `[AUTO]` Upload a valid WebP image: success — *r2.test.ts: "validateUpload" image types, "validateMagicBytes" WebP*
- [ ] `[AUTO]` Upload a non-image file (e.g., .txt renamed to .webp): rejected — *r2.test.ts: non-image rejection*
- [ ] `[AUTO]` Upload a WAV file with .webp extension: rejected (RIFF header but not WEBP) — *r2.test.ts: "WAV/AVI rejection"*
- [ ] `[AUTO]` Upload a file > 5MB: rejected with size error — *r2.test.ts: "5 MB limit"*
- [ ] `[MANUAL]` Upload with Content-Length header > 6MB: rejected before upload starts
- [ ] `[AUTO]` Upload with path traversal attempt (e.g., `../../etc/passwd`): rejected — *validation.test.ts: "validateR2Path" path traversal*
- [ ] `[AUTO]` Upload to invalid prefix (not `blog/`, `uploads/`, `og/`): rejected — *validation.test.ts: "validateR2Path"*

---

## 21. Content Block Types — Render Verification

Create a test post with one of each block type. Verify each renders correctly on the public post page.

E2E coverage note: `posts.spec.ts` tests 7 block types (Paragraph, Heading, List, Callout, Quote, Table, CTA). The remaining 21 block types are **MANUAL only**.

| Block | Coverage | What to verify |
|-------|----------|---------------|
| **Paragraph** | `[E2E]` | Text renders, links clickable, bold/italic preserved |
| **Heading** | `[E2E]` | h2/h3/h4 renders with correct level, anchor ID generated for TOC linking |
| **List** | `[E2E]` | Ordered and unordered lists render correctly |
| **Image** | `[MANUAL]` | Image loads from R2, alt text present in HTML, caption if set |
| **Callout** | `[E2E]` | Icon + text in styled box, variants (info/warning/error/success) |
| **Quote** | `[E2E]` | Blockquote styling, attribution text |
| **Table** | `[E2E]` | Rows/columns render, header row styled differently, scrollable on mobile |
| **CTA** | `[E2E]` | Adaptive: toggle waitlist feature on > shows "Join the Waitlist" link; toggle off > shows product links (if configured) or nothing |
| **Accordion** | `[MANUAL]` | Items expand/collapse on click, keyboard accessible (Enter/Space) |
| **Banner** | `[MANUAL]` | Text + optional background image/color, variants (info/warning/success) |
| **Button Group** | `[MANUAL]` | Multiple buttons render, links work, variants (primary/outline/ghost), invalid URLs not rendered |
| **Code** | `[MANUAL]` | Code text displayed, copy button works (copies to clipboard, shows checkmark), language label shown |
| **Comparison Table** | `[MANUAL]` | Columns render, checkmarks for true values, crosses for false, text for strings |
| **Divider** | `[MANUAL]` | Horizontal line renders, variants (solid/dashed/dotted) |
| **Download** | `[MANUAL]` | Download button renders with label, link works, `download` attribute present, invalid/unsafe URL renders nothing |
| **Email Capture** | `[MANUAL]` | Email input + submit button, submits to waitlist API, shows success/error states |
| **Embed** | `[MANUAL]` | iframe loads external content, sandboxed, height matches setting or default |
| **Feature Grid** | `[MANUAL]` | Cards in grid layout, icons/titles/descriptions, column count matches setting (2-6) |
| **Image Gallery** | `[MANUAL]` | Multiple images in grid, alt text present on each image |
| **Logo Grid** | `[MANUAL]` | Logo images in grid, alt text present, grayscale styling if set |
| **Review** | `[MANUAL]` | Star rating displays (1-5), review text, author name, aria-label on stars |
| **Spacer** | `[MANUAL]` | Vertical space rendered, height matches setting |
| **Stats Counter** | `[MANUAL]` | Numbers displayed with labels, column layout correct |
| **Tabs** | `[MANUAL]` | Tab headers clickable, content switches, first tab active by default, keyboard navigable |
| **Testimonial** | `[MANUAL]` | Quote text, author name, role, avatar if provided |
| **Timeline** | `[MANUAL]` | Events in vertical timeline, dates/titles/descriptions, empty events not rendered |
| **TOC** | `[MANUAL]` | Table of contents lists all headings in post, click scrolls to correct heading anchor |
| **Video** | `[PARTIAL]` | iframe loads YouTube/Vimeo URL, sandboxed, responsive 16:9 aspect ratio — *video.test.ts: getEmbedUrl for YouTube/Vimeo/invalid URLs* |

---

## 22. 404 Page

- [ ] `[MANUAL]` Navigate to `/nonexistent-path`: custom 404 page renders (not white screen or default)
- [ ] `[MANUAL]` With waitlist enabled: 404 page shows "Join the Waitlist" CTA button
- [ ] `[MANUAL]` With waitlist disabled + product links set: 404 page shows product link buttons
- [ ] `[MANUAL]` With no features or links: 404 page shows generic "Go Home" link
- [ ] `[MANUAL]` Navigate to `/admin/nonexistent` (while logged in): 404 or redirect to dashboard

## 23. Error & Loading States

- [ ] `[MANUAL]` Submit form with network disconnected: error message shown (not white screen)
- [ ] `[MANUAL]` Admin pages: skeleton/loading UI shown while data fetches
- [ ] `[MANUAL]` Admin page error: error boundary shows "Try again" button
- [ ] `[MANUAL]` Browser back/forward navigation works without stale data
- [ ] `[MANUAL]` Rapidly click submit on forms: button disabled after first click (no double-submit)
- [ ] `[MANUAL]` Admin error boundary (`/admin/error`): displays "Try again" button (separate from public error boundary)

---

## 24. Cross-Cutting Concerns

### Responsive Design
- [ ] `[MANUAL]` Test all pages on mobile viewport (375px)
- [ ] `[MANUAL]` Test all pages on tablet viewport (768px)
- [ ] `[MANUAL]` Test all pages on desktop viewport (1440px)
- [ ] `[MANUAL]` No horizontal scrollbar on any viewport
- [ ] `[MANUAL]` Touch targets are at least 44x44px on mobile
- [ ] `[MANUAL]` Tables scroll horizontally on mobile (not break layout)
- [ ] `[MANUAL]` Content blocks render well on all viewports (especially grids, galleries, comparison tables)

### Accessibility
- [ ] `[MANUAL]` Tab through all interactive elements: logical order, focus visible
- [ ] `[MANUAL]` All images have alt text
- [ ] `[MANUAL]` All forms have labels
- [ ] `[MANUAL]` Color contrast meets WCAG AA (4.5:1 for text)
- [ ] `[MANUAL]` Screen reader: pages announce landmarks (header, main, footer, nav)
- [ ] `[MANUAL]` Skip-to-content link works (if present)
- [ ] `[MANUAL]` Modals/dialogs trap focus (search dialog, cookie consent)
- [ ] `[MANUAL]` Accordion blocks keyboard-accessible (Enter/Space to toggle)
- [ ] `[MANUAL]` Tabs block keyboard-accessible (Arrow keys to switch)

### Performance
- [ ] `[MANUAL]` Run Lighthouse on homepage: target 90+ on all scores
- [ ] `[MANUAL]` Images lazy-loaded below the fold
- [ ] `[MANUAL]` No layout shift on page load (CLS < 0.1)
- [ ] `[MANUAL]` First Contentful Paint < 2s

### Dark Mode
- [ ] `[MANUAL]` Toggle dark mode via theme toggle in header
- [ ] `[MANUAL]` All pages readable in dark mode (text contrast, backgrounds, borders)
- [ ] `[MANUAL]` Content blocks render correctly in dark mode (callout variants, banners, tables, code blocks)
- [ ] `[MANUAL]` Admin panel usable in dark mode
- [ ] `[MANUAL]` Cookie consent banner visible and readable in dark mode

### Cache Revalidation (ISR)
- [ ] `[MANUAL]` Change site name in Admin > Settings > public site header/footer/JSON-LD updates on refresh
- [ ] `[MANUAL]` Change theme accent color in admin > public site primary color updates on refresh
- [ ] `[MANUAL]` Publish a new post via admin > blog listing shows it without redeploy
- [ ] `[MANUAL]` Update a page's content > public page reflects changes after refresh

### Security (Manual Spot Checks)
- [ ] `[MANUAL]` View page source: no secrets, API keys, or internal URLs leaked
- [ ] `[MANUAL]` Cookie inspection: admin session cookie has HttpOnly, Secure (prod), SameSite=Lax
- [ ] `[MANUAL]` Open browser console: no sensitive data logged
- [ ] `[E2E]` Try accessing `/api/admin/*` without login: 401 response — *readonly-admin.spec.ts*
- [ ] `[MANUAL]` Try accessing `/api/admin/redirects` without login: 401 response
- [ ] `[AUTO]` Try XSS in contact form message field: HTML escaped — *queue-consumer.test.ts: "HTML escaping"*
- [ ] `[MANUAL]` Try `<script>alert(1)</script>` in blog post title via API: escaped in rendering and JSON-LD
- [ ] `[AUTO]` Try SQL injection in search query: no error — *search.test.ts: "LIKE wildcard escaping"*
- [ ] `[AUTO]` Try `javascript:alert(1)` as redirect toUrl: rejected by validation — *validation.test.ts: isSafeUrl in redirects*
- [ ] `[AUTO]` Try `javascript:alert(1)` as social link URL: rejected by validation — *validation.test.ts: social URLs*
- [ ] `[MANUAL]` Admin session: open admin in two browsers, logout from one > other session still works (independent sessions)
- [ ] `[AUTO]` Admin session: session expiry > redirected to login — *admin.test.ts: "validateSession" expired*
- [ ] `[MANUAL]` Security headers present: CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff
- [ ] `[MANUAL]` R2 asset proxy responses include `X-Content-Type-Options: nosniff` header
- [ ] `[MANUAL]` Proxy/middleware: admin routes with non-UUID session cookie are rejected (UUID format validation in proxy.ts)

---

## 25. End-to-End Flows

These are full user journeys that cross multiple features. Run after individual sections pass. All flows are `[MANUAL]` — no automated test covers the full cross-feature journey.

### Flow A: New Visitor to Waitlist Subscriber
1. Visit homepage (incognito) > see hero + CTA
2. Click "Join Waitlist" CTA > navigated to `/waitlist`
3. Fill form + submit > redirected to referral dashboard
4. Copy referral link > open in another incognito window
5. Second user signs up via referral link
6. Check DB: first user's referral count incremented
7. First user receives welcome email with unsubscribe link
8. First user receives referral notification email (separate from welcome)
9. Click unsubscribe > status changes to `unsubscribed`

### Flow B: Admin Creates and Publishes Content
1. Login to admin
2. Create a new blog post with 5+ different block types
3. Save as draft > verify not visible on public site or search
4. Add FAQ items + tags
5. Publish > verify visible on `/blog` listing, direct URL, search results, and sitemap
6. Edit the post > change title > verify updated on public site
7. Delete the post > verify removed from listing, search, and sitemap
8. Create a content page with slug `test-guide`
9. Create a child page with parentSlug `test-guide`
10. Verify pillar page shows child cards on `/test-guide`
11. Delete child page > verify removed from pillar listing

### Flow C: Redirect Lifecycle
1. Create page `/old-page` with some content
2. Create redirect `/old-page` > `/blog` (301)
3. Visit `/old-page` > verify redirected to `/blog` with 301
4. Disable redirect > visit `/old-page` > verify original page loads
5. Re-enable > redirect works again
6. Delete redirect > page serves normally

### Flow D: Theme Customization
1. Apply "bold" preset in Admin > Settings > Theme
2. Visit public site > verify accent color, font, header/footer variants all changed
3. Override just the font to "Space Grotesk"
4. Visit public site > verify font changed but other preset values preserved
5. Apply "minimal" preset > verify everything resets to minimal values
6. Change accent color to a custom hex > verify primary color updates across buttons, links, badges

### Flow E: Feature Toggling
1. Note which features are currently enabled
2. Disable ALL features (waitlist, giveaway, blog, contact, pricing, changelog)
3. Verify: all feature pages return 404, nav shows no feature links, footer only shows Legal group, sitemap only has homepage + terms + privacy
4. Re-enable all features one by one, verifying each page comes back
5. Verify sitemap and nav grow as features are re-enabled

### Flow F: Content Scheduling
1. Create a blog post, set scheduledPublishAt to 3 minutes from now, publish it
2. Verify: not in blog listing, not in search, not in sitemap, 404 on direct URL
3. Wait for scheduled time to pass
4. Verify: appears in blog listing, searchable, in sitemap, accessible on direct URL
5. Repeat for a content page with scheduling

### Flow G: Cookie Consent + Tracking
1. Enable cookie consent, GA, and Meta Pixel in Admin > Tracking
2. Visit public site (incognito) > cookie consent banner appears
3. Inspect network tab: no GA or Pixel requests before consent
4. Click "Reject All" > verify no tracking scripts load on subsequent pages
5. Clear cookies > revisit > banner reappears
6. Click "Accept All" > verify GA and Pixel scripts load
7. Navigate between pages > verify pageview events fire
8. Disable cookie consent in admin > verify tracking scripts load without banner
