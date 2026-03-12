import { eq, desc, sql, count, and, or, isNull, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import type { ContentBlock } from "@/types/content";

/** Published AND (no schedule OR schedule has passed) */
const isLive = and(
	eq(posts.published, true),
	or(isNull(posts.scheduledPublishAt), lte(posts.scheduledPublishAt, sql`datetime('now')`)),
);

export async function getPublishedPosts(page: number, limit: number) {
	const db = await getDb();
	const offset = (page - 1) * limit;

	const [items, [{ total }]] = await Promise.all([
		db.query.posts.findMany({
			where: isLive,
			orderBy: [desc(posts.publishedAt), desc(posts.createdAt), desc(posts.id)],
			limit,
			offset,
		}),
		db
			.select({ total: count() })
			.from(posts)
			.where(isLive),
	]);

	return { items, total };
}

export async function getPostById(id: number) {
	const db = await getDb();
	return db.query.posts.findFirst({
		where: eq(posts.id, id),
	});
}

export async function getPostBySlug(slug: string) {
	const db = await getDb();
	return db.query.posts.findFirst({
		where: eq(posts.slug, slug),
	});
}

export async function getPublishedPostBySlug(slug: string) {
	const db = await getDb();
	return db.query.posts.findFirst({
		where: and(
			eq(posts.slug, slug),
			eq(posts.published, true),
			or(isNull(posts.scheduledPublishAt), lte(posts.scheduledPublishAt, sql`datetime('now')`)),
		),
	});
}

export interface RelatedPost {
	slug: string;
	title: string;
	description: string;
	cover_image: string | null;
	published_at: string | null;
	tags: string | null;
}

export async function getRelatedPosts(currentSlug: string, tags: string[], limit = 3): Promise<RelatedPost[]> {
	if (!tags || tags.length === 0) return [];

	const db = await getDb();

	// Use json_each to find posts sharing at least one tag
	// Note: db.all() returns raw SQL rows with snake_case column names
	const results = await db.all(
		sql`SELECT DISTINCT p.slug, p.title, p.description, p.cover_image, p.published_at, p.tags FROM posts p, json_each(p.tags) AS t
			WHERE p.published = 1
			AND (p.scheduled_publish_at IS NULL OR p.scheduled_publish_at <= datetime('now'))
			AND p.slug != ${currentSlug}
			AND t.value IN (${sql.join(
				tags.map((tag) => sql`${tag}`),
				sql`, `,
			)})
			ORDER BY p.published_at DESC
			LIMIT ${limit}`,
	);

	return results as RelatedPost[];
}

export async function getRecentPosts(limit = 3) {
	const db = await getDb();
	return db.query.posts.findMany({
		where: isLive,
		orderBy: [desc(posts.publishedAt)],
		limit,
	});
}

export async function getAllPosts() {
	const db = await getDb();
	return db.query.posts.findMany({
		orderBy: [desc(posts.createdAt)],
	});
}

/** Lightweight published post listing for sitemap — only slug and updatedAt. */
export async function getPublishedPostSlugs(limit = 1000) {
	const db = await getDb();
	return db.select({
		slug: posts.slug,
		updatedAt: posts.updatedAt,
	}).from(posts).where(isLive).orderBy(desc(posts.publishedAt), desc(posts.createdAt)).limit(limit);
}

/** Lightweight post listing for admin — excludes heavy content/faqs columns. */
export async function getAllPostSummaries() {
	const db = await getDb();
	return db.select({
		id: posts.id,
		slug: posts.slug,
		title: posts.title,
		description: posts.description,
		published: posts.published,
		publishedAt: posts.publishedAt,
		scheduledPublishAt: posts.scheduledPublishAt,
		createdAt: posts.createdAt,
	}).from(posts).orderBy(desc(posts.createdAt)).limit(5000);
}

export async function createPost(data: {
	slug: string;
	title: string;
	description: string;
	content: unknown;
	faqs?: unknown;
	coverImage?: string;
	author?: string;
	tags?: unknown;
	published?: boolean;
	scheduledPublishAt?: string | null;
}) {
	const db = await getDb();
	const now = new Date().toISOString();
	const [post] = await db
		.insert(posts)
		.values({
			slug: data.slug,
			title: data.title,
			description: data.description,
			content: data.content as typeof posts.$inferInsert.content,
			faqs: (data.faqs as typeof posts.$inferInsert.faqs) ?? null,
			coverImage: data.coverImage ?? null,
			author: data.author ?? "Admin",
			tags: (data.tags as typeof posts.$inferInsert.tags) ?? null,
			published: data.published ?? false,
			publishedAt: data.published ? now : null,
			scheduledPublishAt: data.scheduledPublishAt ?? null,
			createdAt: now,
			updatedAt: now,
		})
		.returning();
	return post;
}

export async function updatePost(
	id: number,
	data: Partial<{
		slug: string;
		title: string;
		description: string;
		content: unknown;
		faqs: unknown;
		coverImage: string | null;
		author: string;
		tags: unknown;
		published: boolean;
		scheduledPublishAt: string | null;
	}>,
) {
	const db = await getDb();
	const now = new Date().toISOString();

	// Allowlist fields to prevent mass assignment (no id, createdAt, publishedAt overwrite)
	const updateData: Record<string, unknown> = { updatedAt: now };
	if (data.slug !== undefined) updateData.slug = data.slug;
	if (data.title !== undefined) updateData.title = data.title;
	if (data.description !== undefined) updateData.description = data.description;
	if (data.content !== undefined) updateData.content = data.content;
	if (data.faqs !== undefined) updateData.faqs = data.faqs;
	if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
	if (data.author !== undefined) updateData.author = data.author;
	if (data.tags !== undefined) updateData.tags = data.tags;
	if (data.published !== undefined) updateData.published = data.published;
	if (data.scheduledPublishAt !== undefined) updateData.scheduledPublishAt = data.scheduledPublishAt;

	// Set publishedAt atomically using SQL CASE to avoid TOCTOU
	if (data.published === true) {
		updateData.publishedAt = sql`CASE WHEN ${posts.publishedAt} IS NULL THEN ${now} ELSE ${posts.publishedAt} END`;
	}

	const [post] = await db
		.update(posts)
		.set(updateData as typeof posts.$inferInsert)
		.where(eq(posts.id, id))
		.returning();
	return post;
}

export async function deletePost(id: number) {
	const db = await getDb();
	// Get the post slug before deletion for R2 cleanup reference
	const post = await db.query.posts.findFirst({ where: eq(posts.id, id) });
	await db.delete(posts).where(eq(posts.id, id));
	return post?.slug ?? null;
}

export async function getPostCount() {
	const db = await getDb();
	const [{ total }] = await db
		.select({ total: count() })
		.from(posts)
		.where(isLive);
	return total;
}

// --- Tag filtering ---

export interface TagCount {
	tag: string;
	count: number;
}

export async function getAllTags(): Promise<TagCount[]> {
	const db = await getDb();
	const results = await db.all(
		sql`SELECT t.value AS tag, COUNT(*) AS count
			FROM posts p, json_each(p.tags) AS t
			WHERE p.published = 1
			AND (p.scheduled_publish_at IS NULL OR p.scheduled_publish_at <= datetime('now'))
			GROUP BY t.value
			ORDER BY count DESC, t.value ASC`,
	);
	return results as TagCount[];
}

export async function getPublishedPostsByTag(tag: string, page: number, limit: number) {
	const db = await getDb();
	const offset = (page - 1) * limit;

	const [rawItems, countResult] = await Promise.all([
		db.all(
			sql`SELECT p.id, p.slug, p.title, p.description, p.cover_image, p.published_at, p.tags
				FROM posts p, json_each(p.tags) AS t
				WHERE p.published = 1
				AND (p.scheduled_publish_at IS NULL OR p.scheduled_publish_at <= datetime('now'))
				AND t.value = ${tag}
				ORDER BY p.published_at DESC, p.created_at DESC
				LIMIT ${limit} OFFSET ${offset}`,
		),
		db.all(
			sql`SELECT COUNT(DISTINCT p.id) AS total FROM posts p, json_each(p.tags) AS t
				WHERE p.published = 1
				AND (p.scheduled_publish_at IS NULL OR p.scheduled_publish_at <= datetime('now'))
				AND t.value = ${tag}`,
		),
	]);

	// Map snake_case raw SQL results to camelCase for PostCard compatibility
	const items = (rawItems as Record<string, unknown>[]).map((row) => ({
		id: row.id as number,
		slug: row.slug as string,
		title: row.title as string,
		description: row.description as string,
		coverImage: (row.cover_image as string | null) ?? null,
		publishedAt: (row.published_at as string | null) ?? null,
		tags: row.tags ? (() => { try { return JSON.parse(row.tags as string); } catch { return null; } })() : null,
	}));

	const total = ((countResult as Record<string, unknown>[])[0]?.total as number) ?? 0;
	return { items, total };
}

// --- Prev/Next navigation ---

export interface AdjacentPosts {
	prev: { slug: string; title: string } | null;
	next: { slug: string; title: string } | null;
}

export async function getAdjacentPosts(currentSlug: string): Promise<AdjacentPosts> {
	const db = await getDb();
	const current = await getPublishedPostBySlug(currentSlug);
	if (!current || !current.publishedAt) return { prev: null, next: null };

	const [prevResults, nextResults] = await Promise.all([
		// Previous = older (published_at < current, or same date but earlier by id)
		db.all(
			sql`SELECT slug, title FROM posts
				WHERE published = 1
				AND (scheduled_publish_at IS NULL OR scheduled_publish_at <= datetime('now'))
				AND (published_at < ${current.publishedAt}
					OR (published_at = ${current.publishedAt} AND id < ${current.id}))
				ORDER BY published_at DESC, id DESC
				LIMIT 1`,
		),
		// Next = newer (published_at > current, or same date but later by id)
		db.all(
			sql`SELECT slug, title FROM posts
				WHERE published = 1
				AND (scheduled_publish_at IS NULL OR scheduled_publish_at <= datetime('now'))
				AND (published_at > ${current.publishedAt}
					OR (published_at = ${current.publishedAt} AND id > ${current.id}))
				ORDER BY published_at ASC, id ASC
				LIMIT 1`,
		),
	]);

	return {
		prev: (prevResults[0] as { slug: string; title: string } | undefined) ?? null,
		next: (nextResults[0] as { slug: string; title: string } | undefined) ?? null,
	};
}

// --- Reading time ---

function countWords(text: string | undefined | null): number {
	if (!text) return 0;
	return text.split(/\s+/).filter(Boolean).length;
}

export function calculateReadingTime(blocks: ContentBlock[]): number {
	if (!blocks || !Array.isArray(blocks)) return 1;
	let wordCount = 0;
	for (const block of blocks) {
		wordCount += countWords(block.text);
		if (block.items) {
			for (const item of block.items) wordCount += countWords(item);
		}
		wordCount += countWords(block.code);
		if (block.accordionItems) {
			for (const item of block.accordionItems) {
				wordCount += countWords(item?.title);
				wordCount += countWords(item?.content);
			}
		}
		if (block.tabs) {
			for (const tab of block.tabs) {
				wordCount += countWords(tab?.label);
				wordCount += countWords(tab?.content);
			}
		}
	}
	return Math.max(1, Math.ceil(wordCount / 250));
}

// --- Post duplication ---

export async function duplicatePost(id: number) {
	const original = await getPostById(id);
	if (!original) return null;

	const db = await getDb();
	const now = new Date().toISOString();
	const baseSlug = `${original.slug}-copy`;

	// Find a unique slug (try base, then base-2, base-3...)
	let slug = baseSlug;
	let foundUnique = false;
	for (let i = 0; i <= 10; i++) {
		const candidate = i === 0 ? baseSlug : `${baseSlug}-${i + 1}`;
		const existing = await db.query.posts.findFirst({ where: eq(posts.slug, candidate) });
		if (!existing) {
			slug = candidate;
			foundUnique = true;
			break;
		}
	}
	if (!foundUnique) throw new Error("Could not generate unique slug for duplicate");

	const [post] = await db
		.insert(posts)
		.values({
			slug,
			title: `${original.title} (Copy)`,
			description: original.description,
			content: original.content,
			faqs: original.faqs,
			coverImage: original.coverImage,
			author: original.author,
			tags: original.tags,
			published: false,
			publishedAt: null,
			scheduledPublishAt: null,
			createdAt: now,
			updatedAt: now,
		})
		.returning();
	return post;
}
