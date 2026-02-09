/**
 * Simple in-memory sliding window rate limiter.
 * Suitable for single-instance deployments (Cloudflare Worker isolates).
 * For multi-instance, use D1 or Durable Objects instead.
 */

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries to prevent memory leaks
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000; // 1 minute

function cleanup() {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL) return;
	lastCleanup = now;
	for (const [key, entry] of store) {
		if (entry.resetAt <= now) {
			store.delete(key);
		}
	}
}

/**
 * Check if a request should be rate-limited.
 * @param key - Unique identifier (e.g., "login:192.168.1.1")
 * @param maxRequests - Maximum requests per window
 * @param windowMs - Window duration in milliseconds
 * @returns true if request is allowed, false if rate-limited
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
	cleanup();
	const now = Date.now();
	const entry = store.get(key);

	if (!entry || entry.resetAt <= now) {
		store.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}

	if (entry.count >= maxRequests) {
		return false;
	}

	entry.count++;
	return true;
}
