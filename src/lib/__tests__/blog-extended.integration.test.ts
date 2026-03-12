import { describe, it, expect, beforeEach } from "vitest";
import { cleanTables } from "../../../test/helpers";
import {
	createPost,
	getAllTags,
	getPublishedPostsByTag,
	getAdjacentPosts,
	calculateReadingTime,
	duplicatePost,
	getAllPostSummaries,
	getPublishedPostSlugs,
} from "../blog";
import type { ContentBlock } from "@/types/content";

describe("blog extended (integration)", () => {
	beforeEach(async () => {
		await cleanTables("posts");
	});

	// ---------------------------------------------------------------
	// getAllTags
	// ---------------------------------------------------------------

	describe("getAllTags", () => {
		it("returns tags with correct counts from published posts", async () => {
			await createPost({ slug: "a", title: "A", description: "d", content: [], tags: ["js", "react"], published: true });
			await createPost({ slug: "b", title: "B", description: "d", content: [], tags: ["js", "vue"], published: true });
			await createPost({ slug: "c", title: "C", description: "d", content: [], tags: ["python"], published: true });

			const tags = await getAllTags();

			expect(tags).toHaveLength(4);
			const jsTag = tags.find((t) => t.tag === "js");
			expect(jsTag).toBeDefined();
			expect(jsTag!.count).toBe(2);

			const reactTag = tags.find((t) => t.tag === "react");
			expect(reactTag!.count).toBe(1);

			const vueTag = tags.find((t) => t.tag === "vue");
			expect(vueTag!.count).toBe(1);

			const pythonTag = tags.find((t) => t.tag === "python");
			expect(pythonTag!.count).toBe(1);
		});

		it("excludes tags from draft posts", async () => {
			await createPost({ slug: "published", title: "Pub", description: "d", content: [], tags: ["visible"], published: true });
			await createPost({ slug: "draft", title: "Draft", description: "d", content: [], tags: ["hidden"] });

			const tags = await getAllTags();

			expect(tags).toHaveLength(1);
			expect(tags[0].tag).toBe("visible");
		});

		it("excludes tags from future-scheduled posts", async () => {
			await createPost({
				slug: "future",
				title: "Future",
				description: "d",
				content: [],
				tags: ["future-tag"],
				published: true,
				scheduledPublishAt: "2099-01-01T00:00:00Z",
			});
			await createPost({ slug: "live", title: "Live", description: "d", content: [], tags: ["live-tag"], published: true });

			const tags = await getAllTags();

			expect(tags).toHaveLength(1);
			expect(tags[0].tag).toBe("live-tag");
		});

		it("returns empty array when no published posts exist", async () => {
			await createPost({ slug: "draft", title: "Draft", description: "d", content: [], tags: ["orphan"] });

			const tags = await getAllTags();
			expect(tags).toHaveLength(0);
		});

		it("orders by count descending, then tag name ascending", async () => {
			await createPost({ slug: "a", title: "A", description: "d", content: [], tags: ["beta", "alpha"], published: true });
			await createPost({ slug: "b", title: "B", description: "d", content: [], tags: ["beta", "gamma"], published: true });

			const tags = await getAllTags();

			// beta=2, alpha=1, gamma=1 -> beta first, then alpha before gamma
			expect(tags[0].tag).toBe("beta");
			expect(tags[0].count).toBe(2);
			expect(tags[1].tag).toBe("alpha");
			expect(tags[2].tag).toBe("gamma");
		});
	});

	// ---------------------------------------------------------------
	// getPublishedPostsByTag
	// ---------------------------------------------------------------

	describe("getPublishedPostsByTag", () => {
		it("returns posts matching the specified tag", async () => {
			await createPost({ slug: "a", title: "A", description: "d", content: [], tags: ["js", "react"], published: true });
			await createPost({ slug: "b", title: "B", description: "d", content: [], tags: ["js", "vue"], published: true });
			await createPost({ slug: "c", title: "C", description: "d", content: [], tags: ["python"], published: true });

			const { items, total } = await getPublishedPostsByTag("js", 1, 10);

			expect(total).toBe(2);
			expect(items).toHaveLength(2);
			expect(items.map((i) => i.slug).sort()).toEqual(["a", "b"]);
		});

		it("returns camelCase fields (coverImage, publishedAt)", async () => {
			await createPost({
				slug: "camel",
				title: "Camel",
				description: "test camelCase",
				content: [],
				tags: ["ts"],
				published: true,
				coverImage: "cover.webp",
			});

			const { items } = await getPublishedPostsByTag("ts", 1, 10);

			expect(items).toHaveLength(1);
			expect(items[0]).toHaveProperty("coverImage");
			expect(items[0]).toHaveProperty("publishedAt");
			expect(items[0].coverImage).toBe("cover.webp");
			expect(items[0].publishedAt).toBeTruthy();
		});

		it("excludes draft posts", async () => {
			await createPost({ slug: "pub", title: "Pub", description: "d", content: [], tags: ["shared"], published: true });
			await createPost({ slug: "draft", title: "Draft", description: "d", content: [], tags: ["shared"] });

			const { items, total } = await getPublishedPostsByTag("shared", 1, 10);

			expect(total).toBe(1);
			expect(items[0].slug).toBe("pub");
		});

		it("excludes future-scheduled posts", async () => {
			await createPost({
				slug: "future",
				title: "Future",
				description: "d",
				content: [],
				tags: ["common"],
				published: true,
				scheduledPublishAt: "2099-01-01T00:00:00Z",
			});
			await createPost({ slug: "live", title: "Live", description: "d", content: [], tags: ["common"], published: true });

			const { items, total } = await getPublishedPostsByTag("common", 1, 10);

			expect(total).toBe(1);
			expect(items[0].slug).toBe("live");
		});

		it("paginates results correctly", async () => {
			// Create 5 published posts with the same tag
			for (let i = 1; i <= 5; i++) {
				await createPost({
					slug: `post-${i}`,
					title: `Post ${i}`,
					description: "d",
					content: [],
					tags: ["paginated"],
					published: true,
				});
			}

			const page1 = await getPublishedPostsByTag("paginated", 1, 2);
			expect(page1.items).toHaveLength(2);
			expect(page1.total).toBe(5);

			const page2 = await getPublishedPostsByTag("paginated", 2, 2);
			expect(page2.items).toHaveLength(2);
			expect(page2.total).toBe(5);

			const page3 = await getPublishedPostsByTag("paginated", 3, 2);
			expect(page3.items).toHaveLength(1);
			expect(page3.total).toBe(5);

			// No overlap between pages
			const allSlugs = [...page1.items, ...page2.items, ...page3.items].map((i) => i.slug);
			expect(new Set(allSlugs).size).toBe(5);
		});

		it("returns empty results for a non-existent tag", async () => {
			await createPost({ slug: "a", title: "A", description: "d", content: [], tags: ["real"], published: true });

			const { items, total } = await getPublishedPostsByTag("nonexistent", 1, 10);

			expect(items).toHaveLength(0);
			expect(total).toBe(0);
		});

		it("parses tags JSON in returned items", async () => {
			await createPost({ slug: "multi", title: "Multi", description: "d", content: [], tags: ["a", "b", "c"], published: true });

			const { items } = await getPublishedPostsByTag("a", 1, 10);

			expect(items[0].tags).toEqual(["a", "b", "c"]);
		});
	});

	// ---------------------------------------------------------------
	// getAdjacentPosts
	// ---------------------------------------------------------------

	describe("getAdjacentPosts", () => {
		it("returns prev and next for the middle post", async () => {
			// All published at the same timestamp; tiebreaker is id (ascending = older)
			// id=1 (oldest), id=2 (middle), id=3 (newest)
			await createPost({ slug: "oldest", title: "Oldest", description: "d", content: [], published: true });
			await createPost({ slug: "middle", title: "Middle", description: "d", content: [], published: true });
			await createPost({ slug: "newest", title: "Newest", description: "d", content: [], published: true });

			const adj = await getAdjacentPosts("middle");

			expect(adj.prev).toEqual({ slug: "oldest", title: "Oldest" });
			expect(adj.next).toEqual({ slug: "newest", title: "Newest" });
		});

		it("returns no prev for the oldest (lowest id) post", async () => {
			await createPost({ slug: "oldest", title: "Oldest", description: "d", content: [], published: true });
			await createPost({ slug: "newer", title: "Newer", description: "d", content: [], published: true });

			const adj = await getAdjacentPosts("oldest");

			expect(adj.prev).toBeNull();
			expect(adj.next).toEqual({ slug: "newer", title: "Newer" });
		});

		it("returns no next for the newest (highest id) post", async () => {
			await createPost({ slug: "older", title: "Older", description: "d", content: [], published: true });
			await createPost({ slug: "newest", title: "Newest", description: "d", content: [], published: true });

			const adj = await getAdjacentPosts("newest");

			expect(adj.prev).toEqual({ slug: "older", title: "Older" });
			expect(adj.next).toBeNull();
		});

		it("returns { prev: null, next: null } for an unpublished post", async () => {
			await createPost({ slug: "draft", title: "Draft", description: "d", content: [] });

			const adj = await getAdjacentPosts("draft");

			expect(adj.prev).toBeNull();
			expect(adj.next).toBeNull();
		});

		it("returns { prev: null, next: null } for a non-existent slug", async () => {
			const adj = await getAdjacentPosts("does-not-exist");

			expect(adj.prev).toBeNull();
			expect(adj.next).toBeNull();
		});

		it("returns { prev: null, next: null } for a single published post", async () => {
			await createPost({ slug: "only-one", title: "Only", description: "d", content: [], published: true });

			const adj = await getAdjacentPosts("only-one");

			expect(adj.prev).toBeNull();
			expect(adj.next).toBeNull();
		});

		it("skips unpublished posts in prev/next navigation", async () => {
			// id=1 (published), id=2 (draft), id=3 (published)
			await createPost({ slug: "first", title: "First", description: "d", content: [], published: true });
			await createPost({ slug: "draft-middle", title: "Draft", description: "d", content: [] });
			await createPost({ slug: "last", title: "Last", description: "d", content: [], published: true });

			const adj = await getAdjacentPosts("first");

			expect(adj.prev).toBeNull();
			expect(adj.next).toEqual({ slug: "last", title: "Last" });
		});

		it("skips future-scheduled posts in prev/next navigation", async () => {
			await createPost({ slug: "first", title: "First", description: "d", content: [], published: true });
			await createPost({
				slug: "future",
				title: "Future",
				description: "d",
				content: [],
				published: true,
				scheduledPublishAt: "2099-01-01T00:00:00Z",
			});
			await createPost({ slug: "third", title: "Third", description: "d", content: [], published: true });

			const adj = await getAdjacentPosts("first");

			// next should skip the future-scheduled post
			expect(adj.next).toEqual({ slug: "third", title: "Third" });
		});
	});

	// ---------------------------------------------------------------
	// calculateReadingTime
	// ---------------------------------------------------------------

	describe("calculateReadingTime", () => {
		it("returns 1 for empty blocks", () => {
			expect(calculateReadingTime([])).toBe(1);
		});

		it("returns 1 for null input", () => {
			expect(calculateReadingTime(null as unknown as ContentBlock[])).toBe(1);
		});

		it("returns 1 for undefined input", () => {
			expect(calculateReadingTime(undefined as unknown as ContentBlock[])).toBe(1);
		});

		it("returns 1 for non-array input", () => {
			expect(calculateReadingTime("not-an-array" as unknown as ContentBlock[])).toBe(1);
		});

		it("returns 1 for a short paragraph", () => {
			const blocks: ContentBlock[] = [
				{ type: "paragraph", text: "Hello world, this is a short paragraph." },
			];
			expect(calculateReadingTime(blocks)).toBe(1);
		});

		it("calculates correct time for many words", () => {
			// 500 words = 2 minutes at 250 wpm
			const words = Array(500).fill("word").join(" ");
			const blocks: ContentBlock[] = [{ type: "paragraph", text: words }];

			expect(calculateReadingTime(blocks)).toBe(2);
		});

		it("rounds up to next minute", () => {
			// 251 words = ceil(251/250) = 2
			const words = Array(251).fill("word").join(" ");
			const blocks: ContentBlock[] = [{ type: "paragraph", text: words }];

			expect(calculateReadingTime(blocks)).toBe(2);
		});

		it("returns exact minute for exact multiples of 250", () => {
			// 250 words = ceil(250/250) = 1
			const words = Array(250).fill("word").join(" ");
			const blocks: ContentBlock[] = [{ type: "paragraph", text: words }];

			expect(calculateReadingTime(blocks)).toBe(1);
		});

		it("counts words in list items", () => {
			// 50 items * 5 words = 250 words = 1 minute
			const items = Array(50).fill("word word word word word");
			const blocks: ContentBlock[] = [{ type: "list", items }];

			expect(calculateReadingTime(blocks)).toBe(1);
		});

		it("counts words in code blocks", () => {
			const code = Array(300).fill("token").join(" ");
			const blocks: ContentBlock[] = [{ type: "code", code }];

			expect(calculateReadingTime(blocks)).toBe(2);
		});

		it("counts words in accordion items (title + content)", () => {
			// Each accordion item: title 5 words + content 5 words = 10 words
			// 25 items * 10 words = 250 words = 1 minute
			const accordionItems = Array(25).fill({
				title: "Accordion title here now yes",
				content: "Content of accordion item here",
			});
			const blocks: ContentBlock[] = [{ type: "accordion", accordionItems }];

			expect(calculateReadingTime(blocks)).toBe(1);
		});

		it("counts words in tabs (label + content)", () => {
			// 1 tab with label (1 word) + content (249 words) = 250 words = 1 minute
			const content = Array(249).fill("word").join(" ");
			const tabs = [{ label: "Tab", content }];
			const blocks: ContentBlock[] = [{ type: "tabs", tabs }];

			expect(calculateReadingTime(blocks)).toBe(1);
		});

		it("sums words across multiple blocks of different types", () => {
			// 100 + 100 + 100 = 300 words -> ceil(300/250) = 2
			const blocks: ContentBlock[] = [
				{ type: "paragraph", text: Array(100).fill("word").join(" ") },
				{ type: "code", code: Array(100).fill("token").join(" ") },
				{ type: "list", items: Array(20).fill("word word word word word") }, // 20 * 5 = 100
			];

			expect(calculateReadingTime(blocks)).toBe(2);
		});

		it("handles accordion items with undefined title/content gracefully", () => {
			const blocks: ContentBlock[] = [
				{
					type: "accordion",
					accordionItems: [
						{ title: undefined as unknown as string, content: "some content" },
						{ title: "a title", content: undefined as unknown as string },
					],
				},
			];
			// "some content" = 2 words, "a title" = 2 words -> 4 words -> 1 min
			expect(calculateReadingTime(blocks)).toBe(1);
		});

		it("handles tabs with undefined label/content gracefully", () => {
			const blocks: ContentBlock[] = [
				{
					type: "tabs",
					tabs: [
						{ label: undefined as unknown as string, content: "tab content here" },
						{ label: "label", content: undefined as unknown as string },
					],
				},
			];
			// "tab content here" = 3 words, "label" = 1 word -> 4 words -> 1 min
			expect(calculateReadingTime(blocks)).toBe(1);
		});

		it("handles blocks with no text-bearing properties", () => {
			const blocks: ContentBlock[] = [
				{ type: "divider" },
				{ type: "spacer" },
				{ type: "image", image: "photo.webp", alt: "A photo" },
			];
			expect(calculateReadingTime(blocks)).toBe(1);
		});
	});

	// ---------------------------------------------------------------
	// duplicatePost
	// ---------------------------------------------------------------

	describe("duplicatePost", () => {
		it("creates a copy with -copy slug and (Copy) title", async () => {
			const original = await createPost({
				slug: "original",
				title: "Original Post",
				description: "desc",
				content: [{ type: "paragraph", text: "Hello" }],
				tags: ["a", "b"],
				coverImage: "cover.webp",
				published: true,
			});

			const copy = await duplicatePost(original.id);

			expect(copy).not.toBeNull();
			expect(copy!.slug).toBe("original-copy");
			expect(copy!.title).toBe("Original Post (Copy)");
			expect(copy!.description).toBe("desc");
			expect(copy!.content).toEqual([{ type: "paragraph", text: "Hello" }]);
			expect(copy!.tags).toEqual(["a", "b"]);
			expect(copy!.coverImage).toBe("cover.webp");
			expect(copy!.published).toBe(false);
			expect(copy!.publishedAt).toBeNull();
			expect(copy!.scheduledPublishAt).toBeNull();
		});

		it("handles slug collision by appending -copy-2", async () => {
			const original = await createPost({
				slug: "post",
				title: "Post",
				description: "d",
				content: [],
				published: true,
			});

			// Create the -copy slug so it collides
			await createPost({
				slug: "post-copy",
				title: "Post Copy",
				description: "d",
				content: [],
			});

			const copy = await duplicatePost(original.id);

			expect(copy).not.toBeNull();
			expect(copy!.slug).toBe("post-copy-2");
			expect(copy!.title).toBe("Post (Copy)");
		});

		it("handles multiple slug collisions incrementally", async () => {
			const original = await createPost({
				slug: "item",
				title: "Item",
				description: "d",
				content: [],
			});

			// Occupy -copy and -copy-2
			await createPost({ slug: "item-copy", title: "IC1", description: "d", content: [] });
			await createPost({ slug: "item-copy-2", title: "IC2", description: "d", content: [] });

			const copy = await duplicatePost(original.id);

			expect(copy).not.toBeNull();
			expect(copy!.slug).toBe("item-copy-3");
		});

		it("returns null for a non-existent post id", async () => {
			const result = await duplicatePost(99999);
			expect(result).toBeNull();
		});

		it("preserves faqs in the duplicate", async () => {
			const original = await createPost({
				slug: "with-faqs",
				title: "With FAQs",
				description: "d",
				content: [],
				faqs: [{ question: "Q1", answer: "A1" }],
			});

			const copy = await duplicatePost(original.id);

			expect(copy).not.toBeNull();
			expect(copy!.faqs).toEqual([{ question: "Q1", answer: "A1" }]);
		});
	});

	// ---------------------------------------------------------------
	// getAllPostSummaries
	// ---------------------------------------------------------------

	describe("getAllPostSummaries", () => {
		it("returns posts with summary fields only", async () => {
			await createPost({
				slug: "summary-test",
				title: "Summary Test",
				description: "A description",
				content: [{ type: "paragraph", text: "Heavy content here" }],
				faqs: [{ question: "Q", answer: "A" }],
				published: true,
			});

			const summaries = await getAllPostSummaries();

			expect(summaries).toHaveLength(1);
			const s = summaries[0];

			// Expected fields present
			expect(s).toHaveProperty("id");
			expect(s).toHaveProperty("slug", "summary-test");
			expect(s).toHaveProperty("title", "Summary Test");
			expect(s).toHaveProperty("description", "A description");
			expect(s).toHaveProperty("published", true);
			expect(s).toHaveProperty("publishedAt");
			expect(s).toHaveProperty("scheduledPublishAt");
			expect(s).toHaveProperty("createdAt");

			// Heavy fields absent
			expect(s).not.toHaveProperty("content");
			expect(s).not.toHaveProperty("faqs");
			expect(s).not.toHaveProperty("coverImage");
			expect(s).not.toHaveProperty("author");
			expect(s).not.toHaveProperty("tags");
		});

		it("includes both published and draft posts", async () => {
			await createPost({ slug: "pub", title: "Pub", description: "d", content: [], published: true });
			await createPost({ slug: "draft", title: "Draft", description: "d", content: [] });

			const summaries = await getAllPostSummaries();

			expect(summaries).toHaveLength(2);
			const slugs = summaries.map((s) => s.slug);
			expect(slugs).toContain("pub");
			expect(slugs).toContain("draft");
		});

		it("orders by createdAt descending (newest first)", async () => {
			// Posts are created sequentially; later ones have a later (or same) createdAt.
			// With same createdAt, ordering within the second is by id descending due to creation order.
			await createPost({ slug: "first-created", title: "First", description: "d", content: [] });
			await createPost({ slug: "second-created", title: "Second", description: "d", content: [] });

			const summaries = await getAllPostSummaries();

			// The second-created post has a >= createdAt, so it appears first
			expect(summaries).toHaveLength(2);
			expect(summaries[0].slug).toBe("second-created");
			expect(summaries[1].slug).toBe("first-created");
		});
	});

	// ---------------------------------------------------------------
	// getPublishedPostSlugs
	// ---------------------------------------------------------------

	describe("getPublishedPostSlugs", () => {
		it("returns slugs and updatedAt for published posts", async () => {
			await createPost({ slug: "pub-slug", title: "Pub", description: "d", content: [], published: true });
			await createPost({ slug: "draft-slug", title: "Draft", description: "d", content: [] });

			const slugs = await getPublishedPostSlugs();

			expect(slugs).toHaveLength(1);
			expect(slugs[0].slug).toBe("pub-slug");
			expect(slugs[0]).toHaveProperty("updatedAt");
		});

		it("excludes future-scheduled posts", async () => {
			await createPost({
				slug: "future-sitemap",
				title: "Future",
				description: "d",
				content: [],
				published: true,
				scheduledPublishAt: "2099-01-01T00:00:00Z",
			});
			await createPost({ slug: "live-sitemap", title: "Live", description: "d", content: [], published: true });

			const slugs = await getPublishedPostSlugs();

			expect(slugs).toHaveLength(1);
			expect(slugs[0].slug).toBe("live-sitemap");
		});

		it("respects the limit parameter", async () => {
			for (let i = 1; i <= 5; i++) {
				await createPost({ slug: `slug-${i}`, title: `Post ${i}`, description: "d", content: [], published: true });
			}

			const limited = await getPublishedPostSlugs(3);

			expect(limited).toHaveLength(3);
		});

		it("returns empty array when no published posts exist", async () => {
			await createPost({ slug: "only-draft", title: "Draft", description: "d", content: [] });

			const slugs = await getPublishedPostSlugs();

			expect(slugs).toHaveLength(0);
		});

		it("includes posts with past scheduledPublishAt", async () => {
			await createPost({
				slug: "past-scheduled",
				title: "Past Scheduled",
				description: "d",
				content: [],
				published: true,
				scheduledPublishAt: "2020-01-01T00:00:00Z",
			});

			const slugs = await getPublishedPostSlugs();

			expect(slugs).toHaveLength(1);
			expect(slugs[0].slug).toBe("past-scheduled");
		});

		it("only returns slug and updatedAt fields", async () => {
			await createPost({ slug: "fields-check", title: "FC", description: "d", content: [], published: true });

			const slugs = await getPublishedPostSlugs();

			expect(slugs).toHaveLength(1);
			const entry = slugs[0];
			expect(Object.keys(entry)).toEqual(expect.arrayContaining(["slug", "updatedAt"]));
			expect(entry).not.toHaveProperty("title");
			expect(entry).not.toHaveProperty("content");
			expect(entry).not.toHaveProperty("id");
		});
	});
});
