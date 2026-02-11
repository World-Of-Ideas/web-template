# Audit Round 5 — Findings & Resolutions

**Date:** 2026-02-10
**Scope:** All 17 lib files, all API routes, middleware
**Prior rounds:** Round 1 (31 fixed), Round 2 (49 fixed), Round 3 (37 fixed), Round 4 (42 fixed) — 159 total

---

## Summary

| Severity | Found | Fixed | Deferred |
|----------|-------|-------|----------|
| Critical | 0 | — | — |
| High | 0 | — | — |
| Medium | 3 | 3 | 0 |
| Low | 4 | 4 | 0 |
| Info | 1 | 0 | 1 |
| **Total** | **8** | **7** | **1** |

**Self-inflicted: 2** (M1 from R3 incomplete magic bytes; L4 from R4 log injection)

---

## Self-inflicted from Prior Rounds

### M1 — WebP magic bytes incomplete [FIXED — R3 incomplete implementation]

**File:** `src/lib/r2.ts:9`
**Issue:** R3 added magic byte validation but only checked the RIFF header (bytes 0-3). WAV and AVI files also start with RIFF, so they pass the WebP check. R4 M12 added tests but only tested with a valid WebP buffer — no adversarial test cases for WAV/AVI bypass.
**Resolution:** Added secondary "WEBP" signature check at bytes 8-11 (0x57, 0x45, 0x42, 0x50). Files shorter than 12 bytes also now correctly fail validation.
**Tests:** Added WAV, AVI, and truncated-RIFF rejection test cases in `r2.test.ts`.
**Lesson:** Three rounds to get one validation right. R3 shipped incomplete code, R4 wrote happy-path-only tests. Adversarial test cases should have been written from the start.

### L4 — Queue consumer logs unknown job type value [FIXED — R4 regression]

**File:** `src/lib/queue-consumer.ts:90`
**Issue:** R4 L4 added a `default` case that logged `Unknown email job type: ${type}`, including the raw type value. This is a log injection vector if an attacker crafts a malicious queue message.
**Resolution:** Changed to generic message: `"Unknown email job type encountered"`.
**Tests:** Updated test in `queue-consumer.test.ts` to verify the exact generic message is logged.

---

## Genuine Findings

### M2 — `sendEmail` has no fetch timeout [FIXED]

**File:** `src/lib/resend.ts:10`
**Issue:** The Resend API `fetch` call has no timeout. If the API hangs, the queue consumer blocks indefinitely, consuming worker resources.
**Resolution:** Added `AbortController` with 5-second timeout (matching the pattern used in `tracking.ts` for Meta CAPI and GA MP).
**Tests:** Added `AbortSignal` presence assertion in `resend.test.ts`.

### M3 — `validatePostBody` accepts empty description [FIXED]

**File:** `src/lib/validation.ts:54`
**Issue:** `typeof b.description !== "string"` passes for `""`. Title validation correctly uses `|| !b.title` but description does not, allowing empty descriptions.
**Resolution:** Changed to `typeof b.description !== "string" || !b.description`.
**Tests:** Added empty description test case in `validation.test.ts`.

### L1 — Meta CAPI access_token as URL query param [FIXED]

**File:** `src/lib/tracking.ts:125`
**Issue:** The Meta Conversions API access token is passed as `?access_token=` in the URL query string. Tokens in URLs can leak via server access logs and Referer headers.
**Resolution:** Moved token to `Authorization: Bearer` header, which Meta's Graph API supports.
**Tests:** Updated assertion in `tracking.test.ts` to verify header-based auth and no URL query param.

### L2 — Unsubscribe endpoint lacks rate limiting [FIXED]

**File:** `src/app/api/unsubscribe/route.ts`
**Issue:** The unsubscribe endpoint has no rate limiting. While tokens are cryptographically signed (HMAC), unthrottled requests waste compute.
**Resolution:** Added `checkRateLimit` with 10 requests per minute per IP.

### L3 — Turnstile no minimum token length [FIXED]

**File:** `src/lib/turnstile.ts:5`
**Issue:** Tokens shorter than ~20 characters (or whitespace-only) are clearly invalid but still trigger a network call to Cloudflare's siteverify API.
**Resolution:** Added `token.trim().length < 20` check before the existing max-length check.
**Tests:** Added short token and whitespace-padded token test cases in `turnstile.test.ts`.

---

## Info

### I1 — GA Measurement Protocol `api_secret` must be URL query param [NO FIX]

**File:** `src/lib/tracking.ts:176`
**Issue:** The GA MP `api_secret` is passed as a URL query parameter. Google's Measurement Protocol API requires it — there is no header-based alternative.
**Note:** Limitation of Google's API design. Documented for awareness.

---

## Deferred / Won't Fix

- **I1 — GA MP `api_secret` as query param:** Required by Google's API. No alternative.
- Prior deferred items from Round 4 remain unchanged:
  - **R4-L1 — GET endpoint rate limiting:** Requires infrastructure-level solution (Cloudflare WAF).
  - **R4-I1 — CIDR in allowedDevOrigins:** Info only, needs verification at deploy time.
  - **R4-I3 — parentSlug FK constraint:** App-level cleanup is sufficient.

---

## Test Suite After Fixes

- **Unit/Integration:** 23 test files, 357 tests passing
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
| 5 | 8 | 7 | 1 | 2 (from R3, R4) |
| **Total** | **170** | **166** | **4** | **5** |

Genuine new findings across all rounds: **165** (170 total minus 5 self-inflicted)
