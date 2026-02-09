import { test as setup, expect } from "@playwright/test";

const ADMIN_PASSWORD = "admin123";
const AUTH_FILE = "e2e/.auth/admin.json";

setup("authenticate as admin", async ({ request }) => {
	const res = await request.post("/api/admin/login", {
		data: { password: ADMIN_PASSWORD },
	});
	expect(res.ok()).toBeTruthy();

	// Save the signed-in state (cookies) so other tests can reuse it
	await request.storageState({ path: AUTH_FILE });
});
