import { test as setup, expect } from "@playwright/test";

const ADMIN_PASSWORD = "admin123";
const AUTH_FILE = "e2e/.auth/admin.json";
// Dummy token accepted by Cloudflare's always-pass test secret key
const DUMMY_TURNSTILE_TOKEN = "test-turnstile-token-placeholder";

setup("authenticate as admin", async ({ request }) => {
	const res = await request.post("/api/admin/login", {
		data: { password: ADMIN_PASSWORD, turnstileToken: DUMMY_TURNSTILE_TOKEN },
	});
	expect(res.ok()).toBeTruthy();

	// Touch settings to invalidate the Next.js ISR cache (unstable_cache).
	// Without this, a reused dev server may serve stale site_settings from
	// before global-setup re-seeded the database.
	await request.put("/api/admin/settings", { data: {} });

	// Save the signed-in state (cookies) so other tests can reuse it
	await request.storageState({ path: AUTH_FILE });
});
