import { describe, it, expect, beforeEach } from "vitest";
import { cleanTables } from "../../../test/helpers";
import {
	createPage,
	getAllPageSummaries,
	getPublishedContentPages,
} from "../pages";

describe("pages extended (integration)", () => {
	beforeEach(async () => {
		await cleanTables("pages");
	});

	describe("getAllPageSummaries", () => {
		it("returns summary fields for each page", async () => {
			await createPage({
				slug: "about",
				title: "About Us",
				description: "Learn about us",
				layout: "default",
				published: true,
				sortOrder: 1,
			});

			const summaries = await getAllPageSummaries();
			expect(summaries).toHaveLength(1);

			const summary = summaries[0];
			expect(summary.slug).toBe("about");
			expect(summary.title).toBe("About Us");
			expect(summary.description).toBe("Learn about us");
			expect(summary.layout).toBe("default");
			expect(summary.published).toBe(true);
			expect(summary.sortOrder).toBe(1);
			expect(summary.parentSlug).toBeNull();
			expect(summary.scheduledPublishAt).toBeNull();
		});

		it("excludes heavy fields (content, faqs, relatedPages, coverImage, metadata)", async () => {
			await createPage({
				slug: "heavy-page",
				title: "Heavy Page",
				description: "Has heavy fields",
				content: [{ type: "paragraph", text: "Hello world" }],
				faqs: [{ question: "Q?", answer: "A." }],
				relatedPages: [{ slug: "other", title: "Other" }],
				coverImage: "https://example.com/cover.webp",
				metadata: { seoTitle: "SEO Title", custom: true },
			});

			const summaries = await getAllPageSummaries();
			expect(summaries).toHaveLength(1);

			const summary = summaries[0];
			// Summary should have lightweight fields
			expect(summary.slug).toBe("heavy-page");
			expect(summary.title).toBe("Heavy Page");
			expect(summary.description).toBe("Has heavy fields");

			// Heavy fields must NOT be present on the returned object
			expect("content" in summary).toBe(false);
			expect("faqs" in summary).toBe(false);
			expect("relatedPages" in summary).toBe(false);
			expect("coverImage" in summary).toBe(false);
			expect("metadata" in summary).toBe(false);
			expect("updatedAt" in summary).toBe(false);
		});

		it("returns pages ordered by sortOrder ascending", async () => {
			await createPage({ slug: "third", title: "Third", sortOrder: 30 });
			await createPage({ slug: "first", title: "First", sortOrder: 10 });
			await createPage({ slug: "second", title: "Second", sortOrder: 20 });

			const summaries = await getAllPageSummaries();
			expect(summaries).toHaveLength(3);
			expect(summaries[0].slug).toBe("first");
			expect(summaries[1].slug).toBe("second");
			expect(summaries[2].slug).toBe("third");
		});

		it("includes both published and unpublished pages", async () => {
			await createPage({ slug: "pub", title: "Published", published: true });
			await createPage({ slug: "draft", title: "Draft", published: false });

			const summaries = await getAllPageSummaries();
			expect(summaries).toHaveLength(2);

			const slugs = summaries.map((s) => s.slug);
			expect(slugs).toContain("pub");
			expect(slugs).toContain("draft");
		});

		it("includes parentSlug when set", async () => {
			await createPage({ slug: "parent", title: "Parent" });
			await createPage({ slug: "child", title: "Child", parentSlug: "parent", sortOrder: 1 });

			const summaries = await getAllPageSummaries();
			const child = summaries.find((s) => s.slug === "child");
			expect(child?.parentSlug).toBe("parent");
		});

		it("does not truncate a normal-sized dataset", async () => {
			const count = 50;
			for (let i = 0; i < count; i++) {
				await createPage({ slug: `page-${i}`, title: `Page ${i}`, sortOrder: i });
			}

			const summaries = await getAllPageSummaries();
			expect(summaries).toHaveLength(count);
		});
	});

	describe("getPublishedContentPages", () => {
		it("returns only published pages", async () => {
			await createPage({ slug: "visible", title: "Visible", published: true });
			await createPage({ slug: "hidden", title: "Hidden", published: false });

			const pages = await getPublishedContentPages();
			expect(pages).toHaveLength(1);
			expect(pages[0].slug).toBe("visible");
		});

		it("excludes future-scheduled pages", async () => {
			await createPage({ slug: "live", title: "Live", published: true });
			await createPage({
				slug: "future",
				title: "Future",
				published: true,
				scheduledPublishAt: "2099-01-01T00:00:00Z",
			});

			const pages = await getPublishedContentPages();
			expect(pages).toHaveLength(1);
			expect(pages[0].slug).toBe("live");
		});

		it("includes past-scheduled pages that are now live", async () => {
			await createPage({
				slug: "past-scheduled",
				title: "Past Scheduled",
				published: true,
				scheduledPublishAt: "2020-01-01T00:00:00Z",
			});

			const pages = await getPublishedContentPages();
			expect(pages).toHaveLength(1);
			expect(pages[0].slug).toBe("past-scheduled");
		});

		it("returns only slug, title, updatedAt, and metadata fields", async () => {
			await createPage({
				slug: "full-page",
				title: "Full Page",
				description: "A description",
				content: [{ type: "paragraph", text: "Body text" }],
				faqs: [{ question: "Why?", answer: "Because." }],
				relatedPages: [{ slug: "other", title: "Other" }],
				coverImage: "https://example.com/img.webp",
				metadata: { ogTitle: "OG Title" },
				published: true,
			});

			const pages = await getPublishedContentPages();
			expect(pages).toHaveLength(1);

			const page = pages[0];
			// Expected fields
			expect(page.slug).toBe("full-page");
			expect(page.title).toBe("Full Page");
			expect(page.updatedAt).toBeDefined();
			expect(page.metadata).toEqual({ ogTitle: "OG Title" });

			// Fields that should NOT be present
			expect("description" in page).toBe(false);
			expect("content" in page).toBe(false);
			expect("faqs" in page).toBe(false);
			expect("relatedPages" in page).toBe(false);
			expect("coverImage" in page).toBe(false);
			expect("layout" in page).toBe(false);
			expect("published" in page).toBe(false);
			expect("scheduledPublishAt" in page).toBe(false);
			expect("sortOrder" in page).toBe(false);
			expect("parentSlug" in page).toBe(false);
		});

		it("returns pages ordered by sortOrder ascending", async () => {
			await createPage({ slug: "c", title: "C", sortOrder: 30, published: true });
			await createPage({ slug: "a", title: "A", sortOrder: 10, published: true });
			await createPage({ slug: "b", title: "B", sortOrder: 20, published: true });

			const pages = await getPublishedContentPages();
			expect(pages).toHaveLength(3);
			expect(pages[0].slug).toBe("a");
			expect(pages[1].slug).toBe("b");
			expect(pages[2].slug).toBe("c");
		});

		it("returns metadata as null when not set", async () => {
			await createPage({ slug: "no-meta", title: "No Meta", published: true });

			const pages = await getPublishedContentPages();
			expect(pages).toHaveLength(1);
			expect(pages[0].metadata).toBeNull();
		});
	});
});
