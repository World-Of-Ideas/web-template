import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import type { SiteSettings, ThemeSettings, AnnouncementSettings } from "@/types/site-settings";

const CACHE_TAG = "site-settings";

const DEFAULT_SOCIAL = { twitter: "", github: "", discord: "", instagram: "" };
const DEFAULT_PRODUCT_LINKS = { appUrl: "", appStoreUrl: "", playStoreUrl: "" };
const DEFAULT_FEATURES: Record<string, boolean> = { waitlist: true, giveaway: true, blog: true, contact: true, pricing: false, changelog: false, api: false, doubleOptIn: false, maintenance: false };
const DEFAULT_ANNOUNCEMENT: AnnouncementSettings = { enabled: false, text: "", linkUrl: "", linkText: "" };
const DEFAULT_UI: Record<string, boolean> = { search: true, themeToggle: true };
const DEFAULT_THEME: ThemeSettings = {
	preset: "bold",
	accentColor: "#9747ff",
	borderRadius: "0.625rem",
	headingWeight: "400",
	fontFamily: "inter",
	heroVariant: "gradient",
	headerVariant: "blur",
	footerVariant: "simple",
	postCardVariant: "bordered",
	ctaSectionVariant: "gradient",
};

function parseJson<T extends object>(raw: string | null | undefined, fallback: T): T {
	if (!raw) return fallback;
	try {
		const parsed = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return fallback;
		if (Object.prototype.hasOwnProperty.call(parsed, "__proto__")) return fallback;
		return parsed as T;
	} catch {
		return fallback;
	}
}

function rowToSettings(row: typeof siteSettings.$inferSelect | null | undefined): SiteSettings {
	if (!row) {
		return {
			name: "Product Name",
			description: "",
			author: "",
			social: { ...DEFAULT_SOCIAL },
			productLinks: { ...DEFAULT_PRODUCT_LINKS },
			features: { ...DEFAULT_FEATURES },
			ui: { ...DEFAULT_UI },
			theme: { ...DEFAULT_THEME },
			logoUrl: null,
			announcement: { ...DEFAULT_ANNOUNCEMENT },
		};
	}

	return {
		name: row.name,
		description: row.description,
		author: row.author,
		social: { ...DEFAULT_SOCIAL, ...parseJson(row.social, DEFAULT_SOCIAL) },
		productLinks: { ...DEFAULT_PRODUCT_LINKS, ...parseJson(row.productLinks, DEFAULT_PRODUCT_LINKS) },
		features: { ...DEFAULT_FEATURES, ...parseJson(row.features, DEFAULT_FEATURES) },
		ui: { ...DEFAULT_UI, ...parseJson(row.ui, DEFAULT_UI) },
		theme: { ...DEFAULT_THEME, ...parseJson(row.theme, DEFAULT_THEME) },
		logoUrl: row.logoUrl ?? null,
		announcement: { ...DEFAULT_ANNOUNCEMENT, ...parseJson(row.announcement, DEFAULT_ANNOUNCEMENT) },
	};
}

async function fetchSiteSettings(): Promise<SiteSettings> {
	const db = await getDb();
	const row = await db.query.siteSettings.findFirst({
		where: eq(siteSettings.id, 1),
	});
	return rowToSettings(row);
}

/** ISR-cached read, revalidated on admin update via tag. React.cache wraps for per-request dedup. */
export const getSiteSettings = cache(
	unstable_cache(fetchSiteSettings, ["site-settings"], { tags: [CACHE_TAG] }),
);

/** Uncached read for API routes (always fresh). */
export async function getSiteSettingsDirect(): Promise<SiteSettings> {
	return fetchSiteSettings();
}

/** Invalidate the ISR cache — call after admin updates. */
export function invalidateSiteSettingsCache() {
	revalidateTag(CACHE_TAG, { expire: 0 });
}

/**
 * Partial update — try update first, fallback to insert.
 * Note: Uses read-then-write pattern. Concurrent updates may overwrite each other's
 * JSON field changes. Acceptable for a single-admin settings page.
 */
export async function updateSiteSettings(data: {
	name?: string;
	description?: string;
	author?: string;
	social?: Record<string, string>;
	productLinks?: Record<string, string>;
	features?: Record<string, boolean>;
	ui?: Record<string, boolean>;
	theme?: Partial<ThemeSettings>;
	logoUrl?: string | null;
	announcement?: Partial<AnnouncementSettings>;
}) {
	const db = await getDb();

	// Read current to merge JSON fields
	const current = await fetchSiteSettings();

	const updateSet: Record<string, unknown> = { updatedAt: sql`datetime('now')` };
	if (data.name !== undefined) updateSet.name = data.name;
	if (data.description !== undefined) updateSet.description = data.description;
	if (data.author !== undefined) updateSet.author = data.author;
	if (data.social !== undefined) updateSet.social = JSON.stringify({ ...current.social, ...data.social });
	if (data.productLinks !== undefined) updateSet.productLinks = JSON.stringify({ ...current.productLinks, ...data.productLinks });
	if (data.features !== undefined) updateSet.features = JSON.stringify({ ...current.features, ...data.features });
	if (data.ui !== undefined) updateSet.ui = JSON.stringify({ ...current.ui, ...data.ui });
	if (data.theme !== undefined) updateSet.theme = JSON.stringify({ ...current.theme, ...data.theme });
	if (data.logoUrl !== undefined) updateSet.logoUrl = data.logoUrl;
	if (data.announcement !== undefined) updateSet.announcement = JSON.stringify({ ...current.announcement, ...data.announcement });

	const [existing] = await db
		.update(siteSettings)
		.set(updateSet as typeof siteSettings.$inferInsert)
		.where(eq(siteSettings.id, 1))
		.returning();

	if (!existing) {
		await db.insert(siteSettings).values({
			id: 1,
			name: data.name ?? "Product Name",
			description: data.description ?? "",
			author: data.author ?? "",
			social: JSON.stringify(data.social ?? DEFAULT_SOCIAL),
			productLinks: JSON.stringify(data.productLinks ?? DEFAULT_PRODUCT_LINKS),
			features: JSON.stringify(data.features ?? DEFAULT_FEATURES),
			ui: JSON.stringify(data.ui ?? DEFAULT_UI),
			theme: JSON.stringify(data.theme ? { ...DEFAULT_THEME, ...data.theme } : DEFAULT_THEME),
			logoUrl: data.logoUrl ?? null,
			announcement: JSON.stringify(data.announcement ? { ...DEFAULT_ANNOUNCEMENT, ...data.announcement } : DEFAULT_ANNOUNCEMENT),
			updatedAt: sql`datetime('now')`,
		});
	}
}
