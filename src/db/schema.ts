import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import type { ContentBlock, FAQ, RelatedPage } from "@/types/content";

// --- Subscribers (Waiting List) ---

export const subscribers = sqliteTable(
	"subscribers",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		email: text("email").notNull().unique(),
		name: text("name").notNull(),
		referralCode: text("referral_code").notNull().unique(),
		referredBy: text("referred_by"),
		referralCount: integer("referral_count").notNull().default(0),
		position: integer("position").notNull(),
		status: text("status").notNull().default("active"), // "active" | "unsubscribed" | "invited"
		source: text("source"),
		createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
	},
	(table) => [
		index("idx_subscribers_status").on(table.status),
		index("idx_subscribers_position").on(table.position),
	],
);

// --- Posts (Blog) ---

export const posts = sqliteTable(
	"posts",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		slug: text("slug").notNull().unique(),
		title: text("title").notNull(),
		description: text("description").notNull(),
		content: text("content", { mode: "json" }).$type<ContentBlock[]>().notNull(),
		faqs: text("faqs", { mode: "json" }).$type<FAQ[]>(),
		coverImage: text("cover_image"),
		author: text("author").notNull().default("Admin"),
		tags: text("tags", { mode: "json" }).$type<string[]>(),
		published: integer("published", { mode: "boolean" }).notNull().default(false),
		publishedAt: text("published_at"),
		createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
		updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
	},
	(table) => [
		index("idx_posts_listing").on(table.published, table.createdAt),
		index("idx_posts_published_at").on(table.publishedAt),
	],
);

// --- Contact Submissions ---

export const contactSubmissions = sqliteTable(
	"contact_submissions",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		name: text("name").notNull(),
		email: text("email").notNull(),
		message: text("message").notNull(),
		source: text("source"),
		createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
	},
	(table) => [
		index("idx_contact_created").on(table.createdAt),
	],
);

// --- Giveaway Entries ---

export const giveawayEntries = sqliteTable("giveaway_entries", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	email: text("email").notNull().unique(),
	subscriberId: integer("subscriber_id").references(() => subscribers.id),
	totalEntries: integer("total_entries").notNull().default(1),
	source: text("source"),
	createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// --- Giveaway Actions ---

export const giveawayActions = sqliteTable(
	"giveaway_actions",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		entryId: integer("entry_id")
			.notNull()
			.references(() => giveawayEntries.id),
		action: text("action").notNull(),
		bonusEntries: integer("bonus_entries").notNull(),
		metadata: text("metadata"),
		completedAt: text("completed_at").notNull().default(sql`(datetime('now'))`),
	},
	(table) => [
		uniqueIndex("uq_entry_action").on(table.entryId, table.action),
		index("idx_actions_entry").on(table.entryId),
	],
);

// --- Pages (System + Content) ---

export const pages = sqliteTable(
	"pages",
	{
		slug: text("slug").primaryKey(),
		parentSlug: text("parent_slug"),
		title: text("title").notNull(),
		description: text("description"),
		content: text("content", { mode: "json" }).$type<ContentBlock[]>(),
		faqs: text("faqs", { mode: "json" }).$type<FAQ[]>(),
		relatedPages: text("related_pages", { mode: "json" }).$type<RelatedPage[]>(),
		coverImage: text("cover_image"),
		metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
		layout: text("layout").notNull().default("default"),
		published: integer("published", { mode: "boolean" }).notNull().default(true),
		sortOrder: integer("sort_order").notNull().default(0),
		updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
	},
	(table) => [index("idx_pages_parent").on(table.parentSlug)],
);

// --- Admin Sessions ---

export const adminSessions = sqliteTable(
	"admin_sessions",
	{
		id: text("id").primaryKey(),
		createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
		expiresAt: text("expires_at").notNull(),
	},
	(table) => [index("idx_sessions_expires").on(table.expiresAt)],
);

// --- Tracking Settings (single-row config) ---

export const trackingSettings = sqliteTable("tracking_settings", {
	id: integer("id").primaryKey().default(1),
	metaPixelEnabled: integer("meta_pixel_enabled", { mode: "boolean" }).notNull().default(false),
	metaPixelId: text("meta_pixel_id"),
	metaCapiEnabled: integer("meta_capi_enabled", { mode: "boolean" }).notNull().default(false),
	metaCapiToken: text("meta_capi_token"),
	gaEnabled: integer("ga_enabled", { mode: "boolean" }).notNull().default(false),
	gaMeasurementId: text("ga_measurement_id"),
	gaMpEnabled: integer("ga_mp_enabled", { mode: "boolean" }).notNull().default(false),
	gaMpApiSecret: text("ga_mp_api_secret"),
	gtmEnabled: integer("gtm_enabled", { mode: "boolean" }).notNull().default(false),
	gtmContainerId: text("gtm_container_id"),
	utmTrackingEnabled: integer("utm_tracking_enabled", { mode: "boolean" }).notNull().default(true),
	cookieConsentEnabled: integer("cookie_consent_enabled", { mode: "boolean" }).notNull().default(false),
	updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});
