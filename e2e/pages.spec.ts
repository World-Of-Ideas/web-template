import { test, expect } from "@playwright/test";

// ─── Pages: full CRUD lifecycle ───────────────────────────
test.describe.serial("Pages: full CRUD lifecycle", () => {
	const SLUG = "e2e-guides";

	test("create content page with block", async ({ page }) => {
		await page.goto("/admin/pages/new");
		await page.waitForLoadState("domcontentloaded");

		await page.getByRole("textbox", { name: "Title", exact: true }).fill("E2E Guides Page");
		await page.getByLabel("Slug").fill(SLUG);
		await page.getByLabel("Description").fill("A guides page for E2E testing.");

		// Add a paragraph content block
		await page.getByRole("button", { name: "Add Block" }).click();
		await page.getByRole("menuitem", { name: "Paragraph" }).click();
		await page.getByPlaceholder("Paragraph text...").fill("Welcome to the E2E guides page.");

		// Page defaults to published — no toggle needed

		await page.getByRole("button", { name: "Create Page" }).click();
		await page.waitForURL("**/admin/pages", { timeout: 10_000 });
		await expect(page.getByText("E2E Guides Page")).toBeVisible();
	});

	test("page visible on public site", async ({ page }) => {
		await page.goto(`/${SLUG}`);
		await page.waitForLoadState("domcontentloaded");
		await expect(page.getByRole("heading", { name: "E2E Guides Page", level: 1 })).toBeVisible();
		await expect(page.getByText("Welcome to the E2E guides page.")).toBeVisible();
	});

	test("edit content page", async ({ page }) => {
		await page.goto("/admin/pages");
		await page.waitForLoadState("domcontentloaded");

		await page.getByRole("link", { name: "E2E Guides Page" }).click();
		await page.waitForURL(`**/admin/pages/${SLUG}/edit`);

		await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveValue("E2E Guides Page");
		await page.getByRole("textbox", { name: "Title", exact: true }).fill("E2E Guides (Updated)");

		await page.getByRole("button", { name: "Update Page" }).click();
		await page.waitForURL("**/admin/pages", { timeout: 10_000 });
		await expect(page.getByText("E2E Guides (Updated)")).toBeVisible();
	});

	test("edited title on public site", async ({ page }) => {
		await page.goto(`/${SLUG}`);
		await page.waitForLoadState("domcontentloaded");
		await expect(page.getByRole("heading", { name: "E2E Guides (Updated)", level: 1 })).toBeVisible();
	});

	test("delete page via API", async ({ page, request }) => {
		const res = await request.delete(`/api/admin/pages/${SLUG}`);
		expect(res.ok()).toBeTruthy();

		await page.goto("/admin/pages");
		await page.waitForLoadState("domcontentloaded");
		await expect(page.getByText("E2E Guides (Updated)")).toHaveCount(0);
	});

	test("deleted page returns 404", async ({ page }) => {
		await page.goto(`/${SLUG}`);
		await expect(page.getByText("404").or(page.getByText("not found", { exact: false }))).toBeVisible();
	});
});

// ─── Pages: parent-child hierarchy ────────────────────────
test.describe.serial("Pages: parent-child hierarchy", () => {
	test("create parent page", async ({ page }) => {
		await page.goto("/admin/pages/new");
		await page.waitForLoadState("domcontentloaded");

		await page.getByRole("textbox", { name: "Title", exact: true }).fill("E2E Parent");
		await page.getByLabel("Slug").fill("e2e-parent");
		await page.getByLabel("Description").fill("Parent page for hierarchy test.");

		await page.getByRole("button", { name: "Create Page" }).click();
		await page.waitForURL("**/admin/pages", { timeout: 10_000 });
		await expect(page.getByText("E2E Parent")).toBeVisible();
	});

	test("create child page via API", async ({ page, request }) => {
		// Parent page dropdown is not populated in create mode, so create via API
		const res = await request.post("/api/admin/pages", {
			data: {
				title: "E2E Child",
				slug: "e2e-child",
				parentSlug: "e2e-parent",
				description: "Child page under E2E Parent.",
				published: true,
				sortOrder: 0,
				content: [],
				faqs: [],
				relatedPages: [],
			},
		});
		expect(res.ok()).toBeTruthy();

		await page.goto("/admin/pages");
		await page.waitForLoadState("domcontentloaded");
		await expect(page.getByText("E2E Child")).toBeVisible();
	});

	test("parent shows child in 'In This Section'", async ({ page }) => {
		await page.goto("/e2e-parent");
		await page.waitForLoadState("domcontentloaded");

		await expect(page.getByRole("heading", { name: "E2E Parent", level: 1 })).toBeVisible();
		await expect(page.getByText("In This Section")).toBeVisible();
		await expect(page.getByRole("heading", { name: "E2E Child" })).toBeVisible();
	});

	test("child page accessible", async ({ page }) => {
		await page.goto("/e2e-child");
		await page.waitForLoadState("domcontentloaded");
		await expect(page.getByRole("heading", { name: "E2E Child", level: 1 })).toBeVisible();
	});
});

// ─── Pages: FAQs and related pages ───────────────────────
test.describe.serial("Pages: FAQs and related pages", () => {
	const SLUG = "e2e-rich-page";

	test("create page with FAQs and related pages", async ({ page }) => {
		await page.goto("/admin/pages/new");
		await page.waitForLoadState("domcontentloaded");

		await page.getByRole("textbox", { name: "Title", exact: true }).fill("E2E Rich Page");
		await page.getByLabel("Slug").fill(SLUG);
		await page.getByLabel("Description").fill("A page with FAQs and related pages.");

		// Add FAQ 1
		await page.getByRole("button", { name: "Add FAQ" }).click();
		await page.getByPlaceholder("Frequently asked question...").fill("What is this page?");
		await page.getByPlaceholder("Answer to the question...").fill("A rich test page.");

		// Add FAQ 2
		await page.getByRole("button", { name: "Add FAQ" }).click();
		await page.getByPlaceholder("Frequently asked question...").nth(1).fill("Is it useful?");
		await page.getByPlaceholder("Answer to the question...").nth(1).fill("Very useful for testing.");

		// Add Related Page 1
		await page.getByRole("button", { name: "Add Custom" }).click();
		const rp1 = page.locator(".rounded-lg.border.p-4", { hasText: "Related Page 1" });
		await rp1.getByPlaceholder("Page title").fill("Related One");
		await rp1.getByPlaceholder("Brief description").fill("First related page.");
		await rp1.getByPlaceholder("/path/to/page").fill("/blog");

		// Add Related Page 2
		await page.getByRole("button", { name: "Add Custom" }).click();
		const rp2 = page.locator(".rounded-lg.border.p-4", { hasText: "Related Page 2" });
		await rp2.getByPlaceholder("Page title").fill("Related Two");
		await rp2.getByPlaceholder("Brief description").fill("Second related page.");
		await rp2.getByPlaceholder("/path/to/page").fill("/contact");

		await page.getByRole("button", { name: "Create Page" }).click();
		await page.waitForURL("**/admin/pages", { timeout: 10_000 });
		await expect(page.getByText("E2E Rich Page")).toBeVisible();
	});

	test("FAQs render on public page", async ({ page }) => {
		await page.goto(`/${SLUG}`);
		await page.waitForLoadState("domcontentloaded");

		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(page.getByText("What is this page?")).toBeVisible();
		await expect(page.getByText("Is it useful?")).toBeVisible();
	});

	test("related pages render", async ({ page }) => {
		await page.goto(`/${SLUG}`);
		await page.waitForLoadState("domcontentloaded");

		await expect(page.getByRole("heading", { name: "Related" })).toBeVisible();
		await expect(page.getByText("Related One")).toBeVisible();
		await expect(page.getByText("Related Two")).toBeVisible();
	});

	test("remove FAQ and related page", async ({ page }) => {
		await page.goto("/admin/pages");
		await page.waitForLoadState("domcontentloaded");

		await page.getByRole("link", { name: "E2E Rich Page" }).click();
		await page.waitForURL(`**/admin/pages/${SLUG}/edit`);

		// Remove first FAQ
		const faq1 = page.locator(".rounded-lg.border.p-4", { hasText: "FAQ 1" });
		await faq1.getByTitle("Remove FAQ").click();

		// Remove first related page (now labelled "Related Page 1")
		const rp1 = page.locator(".rounded-lg.border.p-4", { hasText: "Related Page 1" });
		await rp1.getByTitle("Remove related page").click();

		await page.getByRole("button", { name: "Update Page" }).click();
		await page.waitForURL("**/admin/pages", { timeout: 10_000 });
	});

	test("removed items gone from public", async ({ page }) => {
		await page.goto(`/${SLUG}`);
		await page.waitForLoadState("domcontentloaded");

		// First FAQ/related gone
		await expect(page.getByText("What is this page?")).toHaveCount(0);
		await expect(page.getByText("Related One")).toHaveCount(0);

		// Second FAQ/related still present
		await expect(page.getByText("Is it useful?")).toBeVisible();
		await expect(page.getByText("Related Two")).toBeVisible();
	});
});

// ─── Pages: system page edit ──────────────────────────────
test.describe("Pages: system page edit", () => {
	test("system page has disabled slug and metadata field", async ({ page }) => {
		await page.goto("/admin/pages/home/edit");
		await page.waitForLoadState("domcontentloaded");

		// Slug should be disabled for system pages
		await expect(page.getByLabel("Slug")).toBeDisabled();

		// Metadata textarea should be visible
		await expect(page.getByLabel("Metadata (JSON)")).toBeVisible();
	});

	test("can update system page title", async ({ page }) => {
		await page.goto("/admin/pages/home/edit");
		await page.waitForLoadState("domcontentloaded");

		// Use #page-title to avoid ambiguity with related page "Title" labels
		const titleInput = page.locator("#page-title");
		const originalTitle = await titleInput.inputValue();

		// Change title slightly
		await titleInput.fill(originalTitle + " E2E");

		await page.getByRole("button", { name: "Update Page" }).click();
		await page.waitForURL("**/admin/pages", { timeout: 10_000 });

		// Restore original title
		await page.getByRole("link", { name: originalTitle + " E2E" }).click();
		await page.waitForURL("**/admin/pages/home/edit");
		await page.locator("#page-title").fill(originalTitle);
		await page.getByRole("button", { name: "Update Page" }).click();
		await page.waitForURL("**/admin/pages", { timeout: 10_000 });
	});
});

// ─── Pages: error handling ────────────────────────────────
test.describe("Pages: error handling", () => {
	test("reserved slug rejected", async ({ page }) => {
		await page.goto("/admin/pages/new");
		await page.waitForLoadState("domcontentloaded");

		await page.getByRole("textbox", { name: "Title", exact: true }).fill("E2E Reserved Slug Test");
		await page.getByLabel("Slug").fill("admin");

		await page.getByRole("button", { name: "Create Page" }).click();

		// Should show error about reserved slug
		await expect(page.locator(".text-destructive")).toBeVisible({ timeout: 10_000 });
		await expect(page.locator(".text-destructive")).toContainText("reserved");
	});

	test("duplicate slug rejected", async ({ page, request }) => {
		// Create a page via API first
		await request.post("/api/admin/pages", {
			data: {
				title: "E2E Dup Page Seed",
				slug: "e2e-dup-page",
				description: "Seed page for duplicate test.",
				published: true,
				sortOrder: 0,
				content: [],
				faqs: [],
				relatedPages: [],
			},
		});

		// Try creating via UI with same slug
		await page.goto("/admin/pages/new");
		await page.waitForLoadState("domcontentloaded");

		await page.getByRole("textbox", { name: "Title", exact: true }).fill("E2E Dup Page Attempt");
		await page.getByLabel("Slug").fill("e2e-dup-page");

		await page.getByRole("button", { name: "Create Page" }).click();

		// Should show error
		await expect(page.locator(".text-destructive")).toBeVisible({ timeout: 10_000 });
	});
});
