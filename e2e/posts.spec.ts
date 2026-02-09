import { test, expect } from "@playwright/test";

// Helper: get block container by index (within the Content Blocks section)
function nthBlock(page: import("@playwright/test").Page, n: number) {
	return page.locator(".rounded-lg.border.p-4").nth(n);
}

// Helper: add a block via the dropdown menu
async function addBlock(page: import("@playwright/test").Page, type: string) {
	await page.getByRole("button", { name: "Add Block" }).click();
	await page.getByRole("menuitem", { name: type }).click();
	// Wait briefly for the block to render
	await page.waitForTimeout(200);
}

// Helper: click the "Published" switch (avoid ambiguity with "Ordered list" switch)
function publishSwitch(page: import("@playwright/test").Page) {
	return page.locator(".flex.items-center.gap-3").filter({ hasText: "Published" }).getByRole("switch");
}

// ─── Posts: full lifecycle ─────────────────────────────────
test.describe.serial("Posts: full lifecycle", () => {
	const SLUG = "e2e-block-types-post";

	test("create post with all content block types", async ({ page }) => {
		test.setTimeout(60_000);
		await page.goto("/admin/posts/new");
		await page.waitForLoadState("domcontentloaded");

		// Fill metadata
		await page.getByLabel("Title").fill("E2E Block Types Post");
		await expect(page.getByLabel("Slug")).toHaveValue(SLUG);
		await page.getByLabel("Description").fill("A post testing all content block types for E2E.");
		await page.getByLabel("Author").fill("Playwright");
		await page.getByLabel("Tags (comma-separated)").fill("e2e, blocks, test");

		// 1. Paragraph
		await addBlock(page, "Paragraph");
		await page.getByPlaceholder("Paragraph text...").fill("E2E paragraph content here.");

		// 2. Heading (H3)
		await addBlock(page, "Heading");
		await page.getByPlaceholder("Heading text...").fill("E2E Heading Three");
		const headingBlock = nthBlock(page, 1);
		await headingBlock.getByRole("combobox").click();
		await page.getByRole("option", { name: "H3" }).click();

		// 3. List (2 items)
		await addBlock(page, "List");
		const listBlock = nthBlock(page, 2);
		await listBlock.getByPlaceholder("Item 1").fill("First list item");
		await listBlock.getByRole("button", { name: "Add Item" }).click();
		await listBlock.getByPlaceholder("Item 2").fill("Second list item");

		// 4. Callout (Warning)
		await addBlock(page, "Callout");
		const calloutBlock = nthBlock(page, 3);
		await calloutBlock.getByPlaceholder("Callout text...").fill("E2E callout warning text.");
		await calloutBlock.getByRole("combobox").click();
		await page.getByRole("option", { name: "Warning" }).click();

		// 5. Quote
		await addBlock(page, "Quote");
		await page.getByPlaceholder("Quote text...").fill("E2E quote text here.");

		// 6. Table (2 cols, 1 row)
		await addBlock(page, "Table");
		const tableBlock = nthBlock(page, 5);
		// Header input and row cell both have "Column 1" placeholder — target header via .first()
		await tableBlock.getByPlaceholder("Column 1").first().fill("Col A");
		await tableBlock.getByRole("button", { name: "Add Column" }).click();
		await tableBlock.getByPlaceholder("Column 2").first().fill("Col B");
		// Row cells: after headers are filled, row placeholders become "Col A" and "Col B"
		await tableBlock.getByPlaceholder("Col A").fill("Cell A1");
		await tableBlock.getByPlaceholder("Col B").fill("Cell B1");

		// 7. CTA
		await addBlock(page, "CTA");
		await page.getByPlaceholder("Custom call-to-action message...").fill("E2E CTA message!");

		// Publish (target the switch next to "Published" label, not the "Ordered list" switch)
		await publishSwitch(page).click();

		// Save
		await page.getByRole("button", { name: "Create Post" }).click();
		await page.waitForURL("**/admin/posts", { timeout: 15_000 });
		await expect(page.getByText("E2E Block Types Post")).toBeVisible();
		await expect(page.getByText("Published").first()).toBeVisible();
	});

	test("all block types render on public site", async ({ page }) => {
		await page.goto(`/blog/${SLUG}`);
		await page.waitForLoadState("domcontentloaded");

		// h1 title
		await expect(page.getByRole("heading", { name: "E2E Block Types Post", level: 1 })).toBeVisible();

		// Paragraph
		await expect(page.getByText("E2E paragraph content here.")).toBeVisible();

		// Heading H3
		await expect(page.getByRole("heading", { name: "E2E Heading Three", level: 3 })).toBeVisible();

		// List items
		await expect(page.getByText("First list item")).toBeVisible();
		await expect(page.getByText("Second list item")).toBeVisible();

		// Callout with "Warning" label
		await expect(page.getByText("Warning", { exact: true })).toBeVisible();
		await expect(page.getByText("E2E callout warning text.")).toBeVisible();

		// Quote
		await expect(page.locator("blockquote", { hasText: "E2E quote text here." })).toBeVisible();

		// Table cells
		await expect(page.locator("th", { hasText: "Col A" })).toBeVisible();
		await expect(page.locator("th", { hasText: "Col B" })).toBeVisible();
		await expect(page.locator("td", { hasText: "Cell A1" })).toBeVisible();
		await expect(page.locator("td", { hasText: "Cell B1" })).toBeVisible();

		// CTA
		await expect(page.getByText("E2E CTA message!")).toBeVisible();
	});

	test("edit post and toggle unpublish", async ({ page }) => {
		await page.goto("/admin/posts");
		await page.waitForLoadState("domcontentloaded");

		await page.getByText("E2E Block Types Post").click();
		await page.waitForURL("**/admin/posts/*/edit");

		// Toggle publish OFF (switch is currently checked)
		await publishSwitch(page).click();

		await page.getByRole("button", { name: "Update Post" }).click();
		await page.waitForURL("**/admin/posts", { timeout: 10_000 });

		// Assert Draft badge
		await expect(page.getByText("Draft").first()).toBeVisible();
	});

	test("unpublished post returns 404", async ({ page }) => {
		await page.goto(`/blog/${SLUG}`);
		await expect(page.getByText("404").or(page.getByText("not found", { exact: false }))).toBeVisible();
	});

	test("re-publish post", async ({ page }) => {
		await page.goto("/admin/posts");
		await page.waitForLoadState("domcontentloaded");

		await page.getByText("E2E Block Types Post").click();
		await page.waitForURL("**/admin/posts/*/edit");

		// Toggle publish ON
		await publishSwitch(page).click();

		await page.getByRole("button", { name: "Update Post" }).click();
		await page.waitForURL("**/admin/posts", { timeout: 10_000 });
		await expect(page.getByText("Published").first()).toBeVisible();
	});

	test("re-published post accessible again", async ({ page }) => {
		await page.goto(`/blog/${SLUG}`);
		await expect(page.getByRole("heading", { name: "E2E Block Types Post", level: 1 })).toBeVisible();
	});

	test("delete post via API", async ({ page, request }) => {
		// Navigate to posts list first
		await page.goto("/admin/posts");
		await page.waitForLoadState("domcontentloaded");

		// Find the edit link to extract post ID
		const editLink = page.getByRole("link", { name: "E2E Block Types Post" });
		const href = await editLink.getAttribute("href");
		// href format: /admin/posts/{id}/edit
		const postId = href!.split("/")[3];

		const res = await request.delete(`/api/admin/posts/${postId}`);
		expect(res.ok()).toBeTruthy();

		// Reload and verify gone
		await page.reload();
		await page.waitForLoadState("domcontentloaded");
		await expect(page.getByText("E2E Block Types Post")).toHaveCount(0);
	});

	test("deleted post returns 404", async ({ page }) => {
		await page.goto(`/blog/${SLUG}`);
		await expect(page.getByText("404").or(page.getByText("not found", { exact: false }))).toBeVisible();
	});
});

// ─── Posts: block operations ──────────────────────────────
test.describe.serial("Posts: block operations", () => {
	const SLUG = "e2e-block-ops";

	test("create post with two blocks", async ({ page }) => {
		await page.goto("/admin/posts/new");
		await page.waitForLoadState("domcontentloaded");

		await page.getByLabel("Title").fill("E2E Block Ops");
		await page.getByLabel("Slug").fill(SLUG);
		await page.getByLabel("Description").fill("Testing block reorder and delete.");

		// Add Paragraph
		await addBlock(page, "Paragraph");
		await page.getByPlaceholder("Paragraph text...").fill("First paragraph");

		// Add Heading
		await addBlock(page, "Heading");
		await page.getByPlaceholder("Heading text...").fill("Second heading");

		// Publish
		await publishSwitch(page).click();

		await page.getByRole("button", { name: "Create Post" }).click();
		await page.waitForURL("**/admin/posts", { timeout: 10_000 });
		await expect(page.getByText("E2E Block Ops")).toBeVisible();
	});

	test("reorder blocks (move first block down)", async ({ page }) => {
		await page.goto("/admin/posts");
		await page.waitForLoadState("domcontentloaded");

		await page.getByText("E2E Block Ops").click();
		await page.waitForURL("**/admin/posts/*/edit");

		// Verify initial order: paragraph first (index 0), heading second (index 1)
		const firstBlock = nthBlock(page, 0);
		await expect(firstBlock.locator(".inline-flex", { hasText: "paragraph" })).toBeVisible();

		// Click "Move down" on the first block
		await firstBlock.getByTitle("Move down").click();

		// Now heading should be first, paragraph second
		const newFirstBlock = nthBlock(page, 0);
		await expect(newFirstBlock.locator(".inline-flex", { hasText: "heading" })).toBeVisible();

		const newSecondBlock = nthBlock(page, 1);
		await expect(newSecondBlock.locator(".inline-flex", { hasText: "paragraph" })).toBeVisible();

		await page.getByRole("button", { name: "Update Post" }).click();
		await page.waitForURL("**/admin/posts", { timeout: 10_000 });
	});

	test("verify reorder persisted", async ({ page }) => {
		await page.goto("/admin/posts");
		await page.waitForLoadState("domcontentloaded");

		await page.getByText("E2E Block Ops").click();
		await page.waitForURL("**/admin/posts/*/edit");

		// Heading should be first
		const firstBlock = nthBlock(page, 0);
		await expect(firstBlock.locator(".inline-flex", { hasText: "heading" })).toBeVisible();

		// Paragraph should be second
		const secondBlock = nthBlock(page, 1);
		await expect(secondBlock.locator(".inline-flex", { hasText: "paragraph" })).toBeVisible();
	});

	test("delete a content block", async ({ page }) => {
		await page.goto("/admin/posts");
		await page.waitForLoadState("domcontentloaded");

		await page.getByText("E2E Block Ops").click();
		await page.waitForURL("**/admin/posts/*/edit");

		// Should have 2 blocks initially
		await expect(page.locator(".rounded-lg.border.p-4")).toHaveCount(2);

		// Delete the last block (paragraph at index 1)
		const lastBlock = nthBlock(page, 1);
		await lastBlock.getByTitle("Delete block").click();

		// Only 1 block should remain
		await expect(page.locator(".rounded-lg.border.p-4")).toHaveCount(1);

		await page.getByRole("button", { name: "Update Post" }).click();
		await page.waitForURL("**/admin/posts", { timeout: 10_000 });
	});
});

// ─── Posts: FAQ management ────────────────────────────────
test.describe.serial("Posts: FAQ management", () => {
	const SLUG = "e2e-faq-post";

	test("create post with 2 FAQs", async ({ page }) => {
		await page.goto("/admin/posts/new");
		await page.waitForLoadState("domcontentloaded");

		await page.getByLabel("Title").fill("E2E FAQ Post");
		await page.getByLabel("Slug").fill(SLUG);
		await page.getByLabel("Description").fill("A post with FAQs for E2E testing.");

		// Add a paragraph block (post needs content)
		await addBlock(page, "Paragraph");
		await page.getByPlaceholder("Paragraph text...").fill("Post with FAQs.");

		// Add FAQ 1
		await page.getByRole("button", { name: "Add FAQ" }).click();
		await page.getByPlaceholder("Frequently asked question...").fill("What is E2E?");
		await page.getByPlaceholder("Answer to the question...").fill("End-to-end testing.");

		// Add FAQ 2
		await page.getByRole("button", { name: "Add FAQ" }).click();
		await page.getByPlaceholder("Frequently asked question...").nth(1).fill("Why test?");
		await page.getByPlaceholder("Answer to the question...").nth(1).fill("Ensures quality.");

		// Publish
		await publishSwitch(page).click();

		await page.getByRole("button", { name: "Create Post" }).click();
		await page.waitForURL("**/admin/posts", { timeout: 10_000 });
		await expect(page.getByText("E2E FAQ Post")).toBeVisible();
	});

	test("FAQs render on public post", async ({ page }) => {
		await page.goto(`/blog/${SLUG}`);
		await page.waitForLoadState("domcontentloaded");

		await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
		await expect(page.getByText("What is E2E?")).toBeVisible();
		await expect(page.getByText("Why test?")).toBeVisible();
	});

	test("delete FAQ and verify", async ({ page }) => {
		await page.goto("/admin/posts");
		await page.waitForLoadState("domcontentloaded");

		await page.getByText("E2E FAQ Post").click();
		await page.waitForURL("**/admin/posts/*/edit");

		// Remove first FAQ (the "What is E2E?" one)
		const faq1 = page.locator(".rounded-lg.border.p-4", { hasText: "FAQ 1" });
		await faq1.getByTitle("Remove FAQ").click();

		await page.getByRole("button", { name: "Update Post" }).click();
		await page.waitForURL("**/admin/posts", { timeout: 10_000 });

		// Visit public page and verify
		await page.goto(`/blog/${SLUG}`);
		await page.waitForLoadState("domcontentloaded");

		// First FAQ gone
		await expect(page.getByText("What is E2E?")).toHaveCount(0);
		// Second FAQ still there
		await expect(page.getByText("Why test?")).toBeVisible();
	});
});

// ─── Posts: error handling ────────────────────────────────
test.describe("Posts: error handling", () => {
	test("duplicate slug shows error", async ({ page, request }) => {
		// Create a post via API first
		await request.post("/api/admin/posts", {
			data: {
				title: "E2E Dup Slug Seed",
				slug: "e2e-dup-slug",
				description: "Seed post for duplicate slug test.",
				author: "Playwright",
				tags: ["e2e"],
				published: false,
				content: [],
				faqs: [],
			},
		});

		// Try creating another post with the same slug via UI
		await page.goto("/admin/posts/new");
		await page.waitForLoadState("domcontentloaded");

		await page.getByLabel("Title").fill("E2E Dup Slug Attempt");
		await page.getByLabel("Slug").fill("e2e-dup-slug");
		await page.getByLabel("Description").fill("This should fail.");

		await page.getByRole("button", { name: "Create Post" }).click();

		// Should show error message
		await expect(page.locator(".text-destructive")).toBeVisible({ timeout: 10_000 });
	});

	test("slug auto-generates from title", async ({ page }) => {
		await page.goto("/admin/posts/new");
		await page.waitForLoadState("domcontentloaded");

		await page.getByLabel("Title").fill("E2E Slug Gen Test");
		await expect(page.getByLabel("Slug")).toHaveValue("e2e-slug-gen-test");

		// Manually override slug
		await page.getByLabel("Slug").fill("e2e-custom-slug");
		await expect(page.getByLabel("Slug")).toHaveValue("e2e-custom-slug");

		// Title change should still update slug in create mode
		await page.getByLabel("Title").fill("E2E Another Title");
		await expect(page.getByLabel("Slug")).toHaveValue("e2e-another-title");
	});
});
