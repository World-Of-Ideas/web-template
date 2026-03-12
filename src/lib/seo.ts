import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { posts, pages } from "@/db/schema";

interface SeoAuditItem {
	type: "page" | "post";
	slug: string;
	title: string;
	titleLength: number;
	descriptionLength: number;
	hasFaqs: boolean;
	faqCount: number;
	hasRelatedPages: boolean;
	hasCoverImage: boolean;
	hasTags: boolean;
	tagCount: number;
}

export async function getSeoAudit(): Promise<SeoAuditItem[]> {
	const db = await getDb();
	const items: SeoAuditItem[] = [];

	const [allPages, allPosts] = await Promise.all([
		db.select({
			slug: pages.slug,
			title: pages.title,
			description: pages.description,
			faqs: pages.faqs,
			relatedPages: pages.relatedPages,
			coverImage: pages.coverImage,
		}).from(pages).where(eq(pages.published, true)).limit(1000),
		db.select({
			slug: posts.slug,
			title: posts.title,
			description: posts.description,
			faqs: posts.faqs,
			coverImage: posts.coverImage,
			tags: posts.tags,
		}).from(posts).where(eq(posts.published, true)).limit(1000),
	]);

	for (const page of allPages) {
		const faqs = page.faqs as { question: string; answer: string }[] | null;
		const related = page.relatedPages as unknown[] | null;
		items.push({
			type: "page",
			slug: page.slug,
			title: page.title,
			titleLength: page.title.length,
			descriptionLength: page.description?.length ?? 0,
			hasFaqs: !!faqs && faqs.length > 0,
			faqCount: faqs?.length ?? 0,
			hasRelatedPages: !!related && related.length > 0,
			hasCoverImage: !!page.coverImage,
			hasTags: false,
			tagCount: 0,
		});
	}

	for (const post of allPosts) {
		const faqs = post.faqs as { question: string; answer: string }[] | null;
		const tags = post.tags as string[] | null;
		items.push({
			type: "post",
			slug: post.slug,
			title: post.title,
			titleLength: post.title.length,
			descriptionLength: post.description.length,
			hasFaqs: !!faqs && faqs.length > 0,
			faqCount: faqs?.length ?? 0,
			hasRelatedPages: false, // Posts use related posts via tags, not manual links
			hasCoverImage: !!post.coverImage,
			hasTags: !!tags && tags.length > 0,
			tagCount: tags?.length ?? 0,
		});
	}

	return items;
}
