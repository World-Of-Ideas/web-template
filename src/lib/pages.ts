import { eq, and, or, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { pages } from "@/db/schema";

/** Published AND (no schedule OR schedule has passed) */
const isPageLive = and(
	eq(pages.published, true),
	or(isNull(pages.scheduledPublishAt), lte(pages.scheduledPublishAt, sql`datetime('now')`)),
);

const SYSTEM_SLUGS = new Set(["home", "waitlist", "giveaway", "contact", "blog", "terms", "privacy", "pricing", "changelog"]);
const RESERVED_SLUGS = new Set([
	...SYSTEM_SLUGS,
	"admin", "api", "feed.xml",
	"sitemap.xml", "robots.txt", "_next", ".well-known",
]);

export function isReservedSlug(slug: string): boolean {
	return RESERVED_SLUGS.has(slug);
}

export function isSystemPage(slug: string): boolean {
	return SYSTEM_SLUGS.has(slug);
}

export async function getPageBySlug(slug: string) {
	const db = await getDb();
	return db.query.pages.findFirst({
		where: eq(pages.slug, slug),
	});
}

export async function getPublishedPageBySlug(slug: string) {
	const db = await getDb();
	return db.query.pages.findFirst({
		where: and(
			eq(pages.slug, slug),
			eq(pages.published, true),
			or(isNull(pages.scheduledPublishAt), lte(pages.scheduledPublishAt, sql`datetime('now')`)),
		),
	});
}

export async function getChildPages(parentSlug: string) {
	const db = await getDb();
	return db.query.pages.findMany({
		where: and(
			eq(pages.parentSlug, parentSlug),
			eq(pages.published, true),
			or(isNull(pages.scheduledPublishAt), lte(pages.scheduledPublishAt, sql`datetime('now')`)),
		),
		orderBy: (p, { asc }) => [asc(p.sortOrder)],
		limit: 100,
	});
}

export async function getAllPages() {
	const db = await getDb();
	return db.query.pages.findMany({
		orderBy: (p, { asc }) => [asc(p.sortOrder)],
	});
}

/** Lightweight page listing for admin — excludes heavy content/faqs/metadata columns. */
export async function getAllPageSummaries() {
	const db = await getDb();
	return db.select({
		slug: pages.slug,
		parentSlug: pages.parentSlug,
		title: pages.title,
		description: pages.description,
		layout: pages.layout,
		published: pages.published,
		scheduledPublishAt: pages.scheduledPublishAt,
		sortOrder: pages.sortOrder,
	}).from(pages).orderBy(pages.sortOrder).limit(5000);
}

export async function getPublishedContentPages() {
	const db = await getDb();
	return db.select({
		slug: pages.slug,
		title: pages.title,
		updatedAt: pages.updatedAt,
		metadata: pages.metadata,
	}).from(pages).where(isPageLive).orderBy(pages.sortOrder);
}

export async function createPage(data: {
	slug: string;
	parentSlug?: string;
	title: string;
	description?: string;
	content?: unknown;
	faqs?: unknown;
	relatedPages?: unknown;
	coverImage?: string;
	metadata?: unknown;
	layout?: string;
	published?: boolean;
	scheduledPublishAt?: string | null;
	sortOrder?: number;
}) {
	const db = await getDb();
	const [page] = await db
		.insert(pages)
		.values({
			slug: data.slug,
			parentSlug: data.parentSlug ?? null,
			title: data.title,
			description: data.description ?? null,
			content: data.content as typeof pages.$inferInsert.content,
			faqs: (data.faqs as typeof pages.$inferInsert.faqs) ?? null,
			relatedPages: (data.relatedPages as typeof pages.$inferInsert.relatedPages) ?? null,
			coverImage: data.coverImage ?? null,
			metadata: (data.metadata as typeof pages.$inferInsert.metadata) ?? null,
			layout: data.layout ?? "default",
			published: data.published ?? true,
			scheduledPublishAt: data.scheduledPublishAt ?? null,
			sortOrder: data.sortOrder ?? 0,
		})
		.returning();
	return page;
}

export async function updatePage(
	slug: string,
	data: Partial<{
		parentSlug: string | null;
		title: string;
		description: string | null;
		content: unknown;
		faqs: unknown;
		relatedPages: unknown;
		coverImage: string | null;
		metadata: unknown;
		layout: string;
		published: boolean;
		scheduledPublishAt: string | null;
		sortOrder: number;
	}>,
) {
	const db = await getDb();
	const now = new Date().toISOString();

	// Allowlist fields — never allow slug (PK) to be changed via update
	const updateData: Record<string, unknown> = { updatedAt: now };
	if (data.parentSlug !== undefined) updateData.parentSlug = data.parentSlug;
	if (data.title !== undefined) updateData.title = data.title;
	if (data.description !== undefined) updateData.description = data.description;
	if (data.content !== undefined) updateData.content = data.content;
	if (data.faqs !== undefined) updateData.faqs = data.faqs;
	if (data.relatedPages !== undefined) updateData.relatedPages = data.relatedPages;
	if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
	if (data.metadata !== undefined) updateData.metadata = data.metadata;
	if (data.layout !== undefined) updateData.layout = data.layout;
	if (data.published !== undefined) updateData.published = data.published;
	if (data.scheduledPublishAt !== undefined) updateData.scheduledPublishAt = data.scheduledPublishAt;
	if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

	const [page] = await db
		.update(pages)
		.set(updateData as typeof pages.$inferInsert)
		.where(eq(pages.slug, slug))
		.returning();
	return page;
}

export async function deletePage(slug: string) {
	if (isSystemPage(slug)) {
		throw new Error("Cannot delete system pages");
	}
	const db = await getDb();
	// Use batch to atomically clear child references and delete page
	await db.batch([
		db.update(pages).set({ parentSlug: null }).where(eq(pages.parentSlug, slug)),
		db.delete(pages).where(eq(pages.slug, slug)),
	]);
}
