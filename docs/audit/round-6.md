# Audit Round 6 — Findings & Resolutions

**Date:** 2026-02-12
**Scope:** Full codebase — 17 lib files, 20 API routes, proxy, config, schema, all components, all pages
**Prior rounds:** Round 1 (31), Round 2 (49), Round 3 (37), Round 4 (42), Round 5 (7) — 166 fixed, 4 deferred

---

## Summary

| Severity | Found | Fixed | Deferred |
|----------|-------|-------|----------|
| Critical | 0 | — | — |
| High | 0 | — | — |
| Medium | 3 | 3 | 0 |
| Low | 4 | 4 | 0 |
| **Total** | **7** | **7** | **0** |

**Self-inflicted: 0** — All findings are genuine new discoveries from first full-codebase audit.

---

## Medium Findings

### M1 — `validatePostUpdateBody` missing description validation [FIXED]

**File:** `src/lib/validation.ts:66-81`
**Issue:** `validatePostUpdateBody()` validates slug, title, content, tags, and published — but not description. An admin could set `description: ""` or `description: <501 chars>` via update API without rejection. `validatePostBody()` (create) correctly validates description.
**Resolution:** Added empty-string and max-length (500) checks for description, consistent with create validator.
**Tests:** Added 3 tests in `validation.test.ts`: empty string, too long, valid.

### M2 — GA MP URL params not URL-encoded [FIXED]

**File:** `src/lib/tracking.ts:179`
**Issue:** `measurement_id` and `api_secret` are interpolated directly into the URL without `encodeURIComponent()`. If an admin enters a secret containing `&`, `=`, or `?`, the URL breaks or the secret is truncated.
**Resolution:** Wrapped both params with `encodeURIComponent()`.
**Tests:** Added URL-encoding test with `&` and `=` in secret to verify proper escaping.

### M3 — Breadcrumb JSON-LD `item: ""` invalid Schema.org [FIXED]

**File:** `src/components/layout/breadcrumbs.tsx:37`
**Issue:** The last breadcrumb (current page) emits `item: ""` in JSON-LD. Schema.org requires `item` to be a valid URL or omitted entirely. Google's Rich Results validator flags empty strings as errors.
**Resolution:** Omitted the `item` field for the last breadcrumb per Google's structured data spec (item is optional for the current page).

---

## Low Findings

### L1 — Breadcrumb missing `aria-current="page"` [FIXED]

**File:** `src/components/layout/breadcrumbs.tsx:57`
**Issue:** The current page breadcrumb `<span>` has no `aria-current="page"` attribute. Screen readers cannot identify which breadcrumb represents the current page per WCAG 2.1.
**Resolution:** Added `aria-current="page"` to the current page span.

### L2 — Post card missing `isSafeUrl()` for coverImage [FIXED]

**File:** `src/components/blog/post-card.tsx:30`
**Issue:** The blog post detail page (`blog/[slug]/page.tsx:136`) validates cover images with `isSafeUrl()` before rendering, but `PostCard` does not. If the database is compromised, unsafe URLs could render in the blog list.
**Resolution:** Added `isSafeUrl()` check before rendering cover image, consistent with blog post page.

### L3 — `hexToBuffer` missing even-length validation [FIXED]

**File:** `src/lib/waitlist.ts:137-143`
**Issue:** `hexToBuffer()` does not validate that the hex string has even length. An odd-length string causes `parseInt()` to read a 1-char substring on the last iteration, producing `NaN` in the byte array.
**Resolution:** Added `if (hex.length % 2 !== 0) throw new Error("Invalid hex string length")` at the start. The `verifyUnsubscribeToken()` catch block already handles this gracefully.

### L4 — Upload route lacks Content-Length pre-check [FIXED]

**File:** `src/app/api/admin/upload/route.ts:14`
**Issue:** The upload route calls `request.formData()` without checking Content-Length. While file size is validated after parsing (max 5 MB via `validateUpload`), a malformed request with excessive multipart overhead could waste memory during parsing.
**Resolution:** Added Content-Length pre-check (6 MB limit — 5 MB file + multipart overhead) before parsing formData.

---

## Dismissed False Positives

Several agent findings were correctly identified as false positives:

- **Cookie `path: "/"` and `sameSite: "lax"`** (flagged by 2 agents): Intentional fix from this session — Next.js `cookies().set()` overwrites same-name cookies, so dual-path cookies don't work. Single `path: "/"` is the correct approach.
- **`alt=""` on blog cover images** (flagged as a11y issue): Intentionally changed in R4 L15/L16/L17. These are decorative images within linked cards — the link text provides the accessible name.
- **`aria-disabled` on `<span>` for pagination** (flagged as a11y issue): Intentionally added in R4 L13. Visual-only disabled state with aria-disabled is appropriate for non-interactive elements.
- **`allowedDevOrigins` CIDR notation** (flagged as invalid): Already deferred in R4 I1 — dev-only config, needs verification at deploy time.

---

## Deferred / Won't Fix

Prior deferred items remain unchanged:
- **R5-I1 — GA MP `api_secret` as query param:** Required by Google's API. No alternative.
- **R4-L1 — GET endpoint rate limiting:** Requires infrastructure-level solution (Cloudflare WAF).
- **R4-I1 — CIDR in allowedDevOrigins:** Info only, needs verification at deploy time.
- **R4-I3 — parentSlug FK constraint:** App-level cleanup is sufficient.

---

## Test Suite After Fixes

- **Unit/Integration:** 23 test files, 361 tests passing (+4 new)
- **E2E:** 5 Playwright spec files, 85 tests
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
| 5 | 8 | 7 | 1 | 2 (from R3, R4) |
| 6 | 7 | 7 | 0 | 0 |
| **Total** | **177** | **173** | **4** | **5** |

Genuine new findings across all rounds: **172** (177 total minus 5 self-inflicted)
