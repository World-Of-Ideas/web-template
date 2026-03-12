import { test, expect } from "@playwright/test";

// Sidebar link helper — scoped to <aside> to avoid ambiguity
async function clickSidebar(page: import("@playwright/test").Page, name: string) {
	await page.locator("aside").getByText(name, { exact: true }).click();
}

// ─── Auth (uses NO storageState — tests unauthenticated flow) ──
test.describe("Admin login", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test("shows login form at /admin", async ({ page }) => {
		await page.goto("/admin");
		await expect(page.getByPlaceholder("Enter admin password")).toBeVisible();
		await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
	});

	test("rejects wrong password", async ({ page }) => {
		await page.goto("/admin");
		await page.getByPlaceholder("Enter admin password").fill("wrong");
		// Wait for Turnstile to auto-resolve (always-pass test key)
		await expect(page.getByRole("button", { name: "Sign In" })).toBeEnabled({ timeout: 10_000 });
		await page.getByRole("button", { name: "Sign In" }).click();
		await expect(page.getByText("Invalid password")).toBeVisible();
	});

	test("logs in and shows dashboard", async ({ page }) => {
		await page.goto("/admin");
		await page.getByPlaceholder("Enter admin password").fill("admin123");
		// Wait for Turnstile to auto-resolve (always-pass test key)
		await expect(page.getByRole("button", { name: "Sign In" })).toBeEnabled({ timeout: 10_000 });
		await page.getByRole("button", { name: "Sign In" }).click();
		await page.waitForURL("**/admin/dashboard", { timeout: 10_000 });
		await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
	});
});

// ─── Dashboard (pre-authenticated via storageState) ───────────
test.describe("Admin dashboard", () => {
	test("shows stats cards", async ({ page }) => {
		await page.goto("/admin/dashboard");
		await page.waitForLoadState("domcontentloaded");
		await expect(page.getByText("Published Posts")).toBeVisible();
		await expect(page.getByText("Contact Submissions", { exact: true })).toBeVisible();
	});

	test("sidebar is visible with nav links", async ({ page }) => {
		await page.goto("/admin/dashboard");
		await page.waitForLoadState("domcontentloaded");
		const sidebar = page.locator("aside");
		await expect(sidebar).toBeVisible();
		await expect(sidebar.getByText("Dashboard")).toBeVisible();
		await expect(sidebar.getByText("Posts")).toBeVisible();
		await expect(sidebar.getByText("Pages")).toBeVisible();
		await expect(sidebar.getByText("Subscribers")).toBeVisible();
		await expect(sidebar.getByText("Giveaway")).toBeVisible();
	});

	test("does NOT show public site header", async ({ page }) => {
		await page.goto("/admin/dashboard");
		await page.waitForLoadState("domcontentloaded");
		const publicNav = page.locator("header nav a", { hasText: "Waitlist" });
		await expect(publicNav).toHaveCount(0);
	});
});

// ─── Sidebar navigation ───────────────────────────────────
test.describe("Sidebar navigation", () => {
	test("can navigate between all admin sections", async ({ page }) => {
		await page.goto("/admin/dashboard");
		await page.waitForLoadState("domcontentloaded");

		await clickSidebar(page, "Posts");
		await expect(page).toHaveURL(/\/admin\/posts/);
		await expect(page.getByRole("heading", { name: "Posts" })).toBeVisible();

		await clickSidebar(page, "Pages");
		await expect(page).toHaveURL(/\/admin\/pages/);
		await expect(page.getByRole("heading", { name: "Pages", exact: true })).toBeVisible();

		await clickSidebar(page, "Subscribers");
		await expect(page).toHaveURL(/\/admin\/subscribers/);

		await clickSidebar(page, "Giveaway");
		await expect(page).toHaveURL(/\/admin\/giveaway/);

		await clickSidebar(page, "Dashboard");
		await expect(page).toHaveURL(/\/admin\/dashboard/);
		await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
	});

	test("logout returns to login page", async ({ page, context }) => {
		await page.goto("/admin/dashboard");
		await page.waitForLoadState("domcontentloaded");
		await page.getByRole("button", { name: /log\s*out/i }).click();
		await page.waitForURL("**/admin", { timeout: 10_000 });
		await expect(page.getByPlaceholder("Enter admin password")).toBeVisible();

		// Re-authenticate and save state for subsequent test files
		await page.getByPlaceholder("Enter admin password").fill("admin123");
		await page.getByRole("button", { name: "Sign In" }).click();
		await page.waitForURL("**/admin/dashboard", { timeout: 10_000 });
		await context.storageState({ path: "e2e/.auth/admin.json" });
	});
});

// ─── Public site smoke tests ──────────────────────────────
test.describe("Public site", () => {
	test("homepage loads with header and footer", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("header")).toBeVisible();
		await expect(page.locator("footer")).toBeVisible();
	});

	test("contact page loads", async ({ page }) => {
		await page.goto("/contact");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	});

	test("blog page loads", async ({ page }) => {
		await page.goto("/blog");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	});
});
