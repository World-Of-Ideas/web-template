import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { trackingSettings } from "@/db/schema";

export type TrackingSettings = typeof trackingSettings.$inferSelect;

export async function getTrackingSettings(): Promise<TrackingSettings | null> {
	const db = await getDb();
	const row = await db.query.trackingSettings.findFirst({
		where: eq(trackingSettings.id, 1),
	});
	return row ?? null;
}

export async function updateTrackingSettings(data: {
	metaPixelEnabled?: boolean;
	metaPixelId?: string | null;
	metaCapiEnabled?: boolean;
	metaCapiToken?: string | null;
	gaEnabled?: boolean;
	gaMeasurementId?: string | null;
	gaMpEnabled?: boolean;
	gaMpApiSecret?: string | null;
	gtmEnabled?: boolean;
	gtmContainerId?: string | null;
	utmTrackingEnabled?: boolean;
	cookieConsentEnabled?: boolean;
}) {
	const db = await getDb();

	// Build update set — only include fields that were explicitly provided
	const updateSet: Record<string, unknown> = { updatedAt: sql`datetime('now')` };
	if (data.metaPixelEnabled !== undefined) updateSet.metaPixelEnabled = data.metaPixelEnabled;
	if (data.metaPixelId !== undefined) updateSet.metaPixelId = data.metaPixelId;
	if (data.metaCapiEnabled !== undefined) updateSet.metaCapiEnabled = data.metaCapiEnabled;
	if (data.metaCapiToken !== undefined) updateSet.metaCapiToken = data.metaCapiToken;
	if (data.gaEnabled !== undefined) updateSet.gaEnabled = data.gaEnabled;
	if (data.gaMeasurementId !== undefined) updateSet.gaMeasurementId = data.gaMeasurementId;
	if (data.gaMpEnabled !== undefined) updateSet.gaMpEnabled = data.gaMpEnabled;
	if (data.gaMpApiSecret !== undefined) updateSet.gaMpApiSecret = data.gaMpApiSecret;
	if (data.gtmEnabled !== undefined) updateSet.gtmEnabled = data.gtmEnabled;
	if (data.gtmContainerId !== undefined) updateSet.gtmContainerId = data.gtmContainerId;
	if (data.utmTrackingEnabled !== undefined) updateSet.utmTrackingEnabled = data.utmTrackingEnabled;
	if (data.cookieConsentEnabled !== undefined) updateSet.cookieConsentEnabled = data.cookieConsentEnabled;

	// Try update first (row exists in normal operation)
	const [existing] = await db
		.update(trackingSettings)
		.set(updateSet as typeof trackingSettings.$inferInsert)
		.where(eq(trackingSettings.id, 1))
		.returning();

	if (!existing) {
		// First-time insert if no row exists yet
		await db.insert(trackingSettings).values({
			id: 1,
			metaPixelEnabled: data.metaPixelEnabled ?? false,
			metaPixelId: data.metaPixelId ?? null,
			metaCapiEnabled: data.metaCapiEnabled ?? false,
			metaCapiToken: data.metaCapiToken ?? null,
			gaEnabled: data.gaEnabled ?? false,
			gaMeasurementId: data.gaMeasurementId ?? null,
			gaMpEnabled: data.gaMpEnabled ?? false,
			gaMpApiSecret: data.gaMpApiSecret ?? null,
			gtmEnabled: data.gtmEnabled ?? false,
			gtmContainerId: data.gtmContainerId ?? null,
			utmTrackingEnabled: data.utmTrackingEnabled ?? true,
			cookieConsentEnabled: data.cookieConsentEnabled ?? false,
			updatedAt: sql`datetime('now')`,
		});
	}
}

const encoder = new TextEncoder();

export async function hashForMeta(value: string): Promise<string> {
	const normalized = value.trim().toLowerCase();
	const digest = await crypto.subtle.digest("SHA-256", encoder.encode(normalized));
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export async function sendMetaConversionEvent(params: {
	eventName: string;
	eventId: string;
	email?: string;
	sourceUrl: string;
	ip?: string;
	userAgent?: string;
}): Promise<void> {
	const settings = await getTrackingSettings();
	if (!settings?.metaCapiEnabled || !settings.metaCapiToken || !settings.metaPixelId) {
		return;
	}

	const userData: Record<string, string> = {};
	if (params.email) {
		userData.em = await hashForMeta(params.email);
	}
	if (params.ip) {
		userData.client_ip_address = params.ip;
	}
	if (params.userAgent) {
		userData.client_user_agent = params.userAgent;
	}

	const payload = {
		data: [
			{
				event_name: params.eventName,
				event_time: Math.floor(Date.now() / 1000),
				event_id: params.eventId,
				event_source_url: params.sourceUrl,
				action_source: "website",
				user_data: userData,
			},
		],
	};

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 5000);
	try {
		await fetch(
			`https://graph.facebook.com/v21.0/${settings.metaPixelId}/events`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${settings.metaCapiToken}`,
				},
				body: JSON.stringify(payload),
				signal: controller.signal,
			},
		);
	} catch {
		// Fire-and-forget: don't let CAPI errors affect the request
	} finally {
		clearTimeout(timeout);
	}
}

export async function sendGaConversionEvent(params: {
	eventName: string;
	email?: string;
	sourceUrl: string;
}): Promise<void> {
	const settings = await getTrackingSettings();
	if (!settings?.gaMpEnabled || !settings.gaMpApiSecret || !settings.gaMeasurementId) {
		return;
	}

	// Use a deterministic client_id based on email when available
	// This allows GA to correlate server-side events from the same user
	let clientId: string;
	if (params.email) {
		const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(params.email));
		clientId = Array.from(new Uint8Array(hash)).slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
	} else {
		clientId = crypto.randomUUID();
	}

	const payload = {
		client_id: clientId,
		events: [
			{
				name: params.eventName,
				params: {
					source_url: params.sourceUrl,
				},
			},
		],
	};

	const controller2 = new AbortController();
	const timeout2 = setTimeout(() => controller2.abort(), 5000);
	try {
		await fetch(
			`https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(settings.gaMeasurementId)}&api_secret=${encodeURIComponent(settings.gaMpApiSecret)}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				signal: controller2.signal,
			},
		);
	} catch {
		// Fire-and-forget: don't let GA MP errors affect the request
	} finally {
		clearTimeout(timeout2);
	}
}
