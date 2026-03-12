import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { escapeLike } from "@/lib/validation";
import { getSiteSettingsDirect } from "@/lib/site-settings";

/** Maps system page slugs to their feature flag key */
const SLUG_FEATURE_MAP: Record<string, string> = {
	waitlist: "waitlist",
	giveaway: "giveaway",
	contact: "contact",
	pricing: "pricing",
	changelog: "changelog",
};

interface SearchResult {
	type: "page" | "post";
	title: string;
	description: string | null;
	href: string;
}

export async function search(query: string): Promise<{
	pages: SearchResult[];
	posts: SearchResult[];
}> {
	if (query.length < 2) return { pages: [], posts: [] };

	const db = await getDb();
	const settings = await getSiteSettingsDirect();
	const pattern = `%${escapeLike(query.trim())}%`;

	const [pageResults, postResults] = await Promise.all([
		db.all(
			sql`SELECT slug, title, description FROM pages
				WHERE published = 1
				AND (scheduled_publish_at IS NULL OR scheduled_publish_at <= datetime('now'))
				AND (title LIKE ${pattern} ESCAPE '\\' OR description LIKE ${pattern} ESCAPE '\\')
				LIMIT 5`,
		),
		settings.features.blog
			? db.all(
					sql`SELECT slug, title, description FROM posts
					WHERE published = 1
					AND (scheduled_publish_at IS NULL OR scheduled_publish_at <= datetime('now'))
					AND (title LIKE ${pattern} ESCAPE '\\' OR description LIKE ${pattern} ESCAPE '\\')
					LIMIT 5`,
				)
			: Promise.resolve([]),
	]);

	const pages = (pageResults as { slug: string; title: string; description: string | null }[])
		.filter((r) => {
			const featureKey = SLUG_FEATURE_MAP[r.slug];
			return !featureKey || settings.features[featureKey];
		})
		.map((r) => ({
			type: "page" as const,
			title: r.title,
			description: r.description,
			href: r.slug === "home" ? "/" : `/${r.slug}`,
		}));

	const posts = (postResults as { slug: string; title: string; description: string | null }[]).map((r) => ({
		type: "post" as const,
		title: r.title,
		description: r.description,
		href: `/blog/${r.slug}`,
	}));

	return { pages, posts };
}
