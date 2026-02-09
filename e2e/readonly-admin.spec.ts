import { test, expect } from "@playwright/test";

// ─── Read-only admin pages ────────────────────────────────
test.describe("Read-only admin pages", () => {
	test("subscribers page loads", async ({ page }) => {
		await page.goto("/admin/subscribers");
		await page.waitForLoadState("domcontentloaded");

		await expect(page.getByRole("heading", { name: "Subscribers" })).toBeVisible();
		// Table headers should be present (or empty state)
		const hasTable = await page.locator("table").count();
		if (hasTable > 0) {
			await expect(page.locator("th", { hasText: "Email" })).toBeVisible();
			await expect(page.locator("th", { hasText: "Status" })).toBeVisible();
		} else {
			await expect(page.getByText("No subscribers yet")).toBeVisible();
		}
	});

	test("giveaway page loads", async ({ page }) => {
		await page.goto("/admin/giveaway");
		await page.waitForLoadState("domcontentloaded");

		await expect(page.getByRole("heading", { name: "Giveaway" })).toBeVisible();
		// Stats cards should always be present
		await expect(page.getByText("Total Entries").first()).toBeVisible();
		await expect(page.getByText("Total Actions").first()).toBeVisible();
	});

	test("SEO audit page loads", async ({ page }) => {
		await page.goto("/admin/seo");
		await page.waitForLoadState("domcontentloaded");

		await expect(page.getByRole("heading", { name: "SEO Audit" })).toBeVisible();
		// Summary text should contain "pages fully optimized"
		await expect(page.getByText("pages fully optimized").or(page.getByText("No published content"))).toBeVisible();
	});

	test("SEO audit accessible via sidebar", async ({ page }) => {
		await page.goto("/admin/dashboard");
		await page.waitForLoadState("domcontentloaded");

		await page.locator("aside").getByText("SEO Audit", { exact: true }).click();
		await expect(page).toHaveURL(/\/admin\/seo/);
		await expect(page.getByRole("heading", { name: "SEO Audit" })).toBeVisible();
	});
});

// ─── Unauthenticated API access ──────────────────────────
test.describe("Unauthenticated API access", () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test("admin API returns 401 without auth", async ({ request }) => {
		const res = await request.get("/api/admin/posts");
		expect(res.status()).toBe(401);

		const body = await res.json();
		expect(body.error.code).toBe("UNAUTHORIZED");
	});
});
