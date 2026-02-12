import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDb } from "@/db";
import { trackingSettings } from "@/db/schema";
import { cleanTables } from "../../../test/helpers";

// We import after the module-level mock setup via vitest setup.ts
import {
	hashForMeta,
	sendMetaConversionEvent,
	sendGaConversionEvent,
	getTrackingSettings,
	updateTrackingSettings,
} from "@/lib/tracking";

describe("tracking", () => {
	beforeEach(async () => {
		await cleanTables("tracking_settings");
	});

	// --- hashForMeta ---

	describe("hashForMeta", () => {
		it("returns consistent SHA-256 hex hash", async () => {
			const hash1 = await hashForMeta("test@example.com");
			const hash2 = await hashForMeta("test@example.com");
			expect(hash1).toBe(hash2);
			// SHA-256 produces 64 hex chars
			expect(hash1).toMatch(/^[0-9a-f]{64}$/);
		});

		it("normalizes case (lowercases input)", async () => {
			const lower = await hashForMeta("test@example.com");
			const upper = await hashForMeta("TEST@EXAMPLE.COM");
			expect(lower).toBe(upper);
		});

		it("normalizes whitespace (trims input)", async () => {
			const trimmed = await hashForMeta("test@example.com");
			const padded = await hashForMeta("  test@example.com  ");
			expect(trimmed).toBe(padded);
		});

		it("produces different hashes for different inputs", async () => {
			const hash1 = await hashForMeta("alice@example.com");
			const hash2 = await hashForMeta("bob@example.com");
			expect(hash1).not.toBe(hash2);
		});
	});

	// --- sendMetaConversionEvent ---

	describe("sendMetaConversionEvent", () => {
		let originalFetch: typeof globalThis.fetch;

		beforeEach(() => {
			originalFetch = globalThis.fetch;
		});

		afterEach(() => {
			globalThis.fetch = originalFetch;
		});

		it("does nothing when Meta CAPI is disabled", async () => {
			const mockFetch = vi.fn();
			globalThis.fetch = mockFetch;

			// No tracking settings in DB = disabled
			await sendMetaConversionEvent({
				eventName: "Lead",
				eventId: "test-id-1",
				sourceUrl: "https://example.com",
			});

			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("does nothing when settings exist but CAPI is disabled", async () => {
			const mockFetch = vi.fn();
			globalThis.fetch = mockFetch;

			const db = await getDb();
			await db.insert(trackingSettings).values({
				id: 1,
				metaPixelEnabled: true,
				metaPixelId: "123456",
				metaCapiEnabled: false,
				metaCapiToken: null,
			});

			await sendMetaConversionEvent({
				eventName: "Lead",
				eventId: "test-id-2",
				sourceUrl: "https://example.com",
			});

			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("calls fetch with correct URL and payload when enabled", async () => {
			const mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
			globalThis.fetch = mockFetch;

			const db = await getDb();
			await db.insert(trackingSettings).values({
				id: 1,
				metaPixelEnabled: true,
				metaPixelId: "pixel-123",
				metaCapiEnabled: true,
				metaCapiToken: "capi-token-abc",
			});

			await sendMetaConversionEvent({
				eventName: "Lead",
				eventId: "evt-001",
				email: "user@example.com",
				sourceUrl: "https://example.com/waitlist",
				ip: "1.2.3.4",
				userAgent: "TestAgent/1.0",
			});

			expect(mockFetch).toHaveBeenCalledOnce();
			const [url, options] = mockFetch.mock.calls[0];

			expect(url).toBe("https://graph.facebook.com/v21.0/pixel-123/events");
			expect(url).not.toContain("access_token");
			expect(options.headers.Authorization).toBe("Bearer capi-token-abc");

			expect(options.method).toBe("POST");
			expect(options.headers["Content-Type"]).toBe("application/json");

			const body = JSON.parse(options.body);
			expect(body.data).toHaveLength(1);
			expect(body.data[0].event_name).toBe("Lead");
			expect(body.data[0].event_id).toBe("evt-001");
			expect(body.data[0].event_source_url).toBe("https://example.com/waitlist");
			expect(body.data[0].action_source).toBe("website");
			expect(body.data[0].user_data.client_ip_address).toBe("1.2.3.4");
			expect(body.data[0].user_data.client_user_agent).toBe("TestAgent/1.0");
			// Email should be hashed
			expect(body.data[0].user_data.em).toMatch(/^[0-9a-f]{64}$/);
		});

		it("does not include email hash when email not provided", async () => {
			const mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
			globalThis.fetch = mockFetch;

			const db = await getDb();
			await db.insert(trackingSettings).values({
				id: 1,
				metaPixelEnabled: true,
				metaPixelId: "pixel-123",
				metaCapiEnabled: true,
				metaCapiToken: "capi-token-abc",
			});

			await sendMetaConversionEvent({
				eventName: "PageView",
				eventId: "evt-002",
				sourceUrl: "https://example.com",
			});

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.data[0].user_data.em).toBeUndefined();
		});

		it("does not throw when fetch fails (fire-and-forget)", async () => {
			const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
			globalThis.fetch = mockFetch;

			const db = await getDb();
			await db.insert(trackingSettings).values({
				id: 1,
				metaPixelEnabled: true,
				metaPixelId: "pixel-123",
				metaCapiEnabled: true,
				metaCapiToken: "capi-token-abc",
			});

			// Should not throw
			await expect(
				sendMetaConversionEvent({
					eventName: "Lead",
					eventId: "evt-003",
					sourceUrl: "https://example.com",
				}),
			).resolves.toBeUndefined();
		});
	});

	// --- sendGaConversionEvent ---

	describe("sendGaConversionEvent", () => {
		let originalFetch: typeof globalThis.fetch;

		beforeEach(() => {
			originalFetch = globalThis.fetch;
		});

		afterEach(() => {
			globalThis.fetch = originalFetch;
		});

		it("does nothing when GA MP is disabled", async () => {
			const mockFetch = vi.fn();
			globalThis.fetch = mockFetch;

			// No tracking settings = disabled
			await sendGaConversionEvent({
				eventName: "sign_up",
				sourceUrl: "https://example.com",
			});

			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("calls fetch with correct URL and payload when enabled", async () => {
			const mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
			globalThis.fetch = mockFetch;

			const db = await getDb();
			await db.insert(trackingSettings).values({
				id: 1,
				gaEnabled: true,
				gaMeasurementId: "G-TESTID123",
				gaMpEnabled: true,
				gaMpApiSecret: "mp-secret-xyz",
			});

			await sendGaConversionEvent({
				eventName: "sign_up",
				email: "user@example.com",
				sourceUrl: "https://example.com/waitlist",
			});

			expect(mockFetch).toHaveBeenCalledOnce();
			const [url, options] = mockFetch.mock.calls[0];

			expect(url).toContain(
				"https://www.google-analytics.com/mp/collect",
			);
			expect(url).toContain("measurement_id=G-TESTID123");
			expect(url).toContain("api_secret=mp-secret-xyz");

			// Verify URL encoding is applied
			expect(url).toBe(
				"https://www.google-analytics.com/mp/collect?measurement_id=G-TESTID123&api_secret=mp-secret-xyz",
			);

			expect(options.method).toBe("POST");

			const body = JSON.parse(options.body);
			expect(body.events).toHaveLength(1);
			expect(body.events[0].name).toBe("sign_up");
			expect(body.events[0].params.source_url).toBe("https://example.com/waitlist");
		});

		it("uses deterministic email-based client_id when email provided", async () => {
			const mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
			globalThis.fetch = mockFetch;

			const db = await getDb();
			await db.insert(trackingSettings).values({
				id: 1,
				gaMpEnabled: true,
				gaMpApiSecret: "secret",
				gaMeasurementId: "G-TEST",
			});

			await sendGaConversionEvent({
				eventName: "sign_up",
				email: "user@example.com",
				sourceUrl: "https://example.com",
			});

			const body1 = JSON.parse(mockFetch.mock.calls[0][1].body);
			const clientId1 = body1.client_id;

			// Call again with same email — should get same client_id
			await cleanTables("tracking_settings");
			await db.insert(trackingSettings).values({
				id: 1,
				gaMpEnabled: true,
				gaMpApiSecret: "secret",
				gaMeasurementId: "G-TEST",
			});

			await sendGaConversionEvent({
				eventName: "sign_up",
				email: "user@example.com",
				sourceUrl: "https://example.com",
			});

			const body2 = JSON.parse(mockFetch.mock.calls[1][1].body);
			expect(body2.client_id).toBe(clientId1);

			// Should be a 32-char hex string (first 16 bytes of SHA-256)
			expect(clientId1).toMatch(/^[0-9a-f]{32}$/);
		});

		it("uses random UUID client_id when no email provided", async () => {
			const mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
			globalThis.fetch = mockFetch;

			const db = await getDb();
			await db.insert(trackingSettings).values({
				id: 1,
				gaMpEnabled: true,
				gaMpApiSecret: "secret",
				gaMeasurementId: "G-TEST",
			});

			await sendGaConversionEvent({
				eventName: "page_view",
				sourceUrl: "https://example.com",
			});

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			// UUID format
			expect(body.client_id).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
			);
		});

		it("does not throw when fetch fails (fire-and-forget)", async () => {
			const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
			globalThis.fetch = mockFetch;

			const db = await getDb();
			await db.insert(trackingSettings).values({
				id: 1,
				gaMpEnabled: true,
				gaMpApiSecret: "secret",
				gaMeasurementId: "G-TEST",
			});

			await expect(
				sendGaConversionEvent({
					eventName: "sign_up",
					sourceUrl: "https://example.com",
				}),
			).resolves.toBeUndefined();
		});

		it("URL-encodes measurement_id and api_secret", async () => {
			const mockFetch = vi.fn().mockResolvedValue(new Response("ok"));
			globalThis.fetch = mockFetch;

			const db = await getDb();
			await db.insert(trackingSettings).values({
				id: 1,
				gaMpEnabled: true,
				gaMpApiSecret: "secret&evil=1",
				gaMeasurementId: "G-TEST",
			});

			await sendGaConversionEvent({
				eventName: "sign_up",
				sourceUrl: "https://example.com",
			});

			const [url] = mockFetch.mock.calls[0];
			// & in secret must be encoded as %26
			expect(url).toContain("api_secret=secret%26evil%3D1");
			expect(url).not.toContain("api_secret=secret&evil=1");
		});
	});

	// --- getTrackingSettings / updateTrackingSettings ---

	describe("getTrackingSettings", () => {
		it("returns null when no settings exist", async () => {
			const settings = await getTrackingSettings();
			expect(settings).toBeNull();
		});

		it("returns settings when they exist", async () => {
			const db = await getDb();
			await db.insert(trackingSettings).values({
				id: 1,
				metaPixelEnabled: true,
				metaPixelId: "pixel-999",
			});

			const settings = await getTrackingSettings();
			expect(settings).not.toBeNull();
			expect(settings!.metaPixelEnabled).toBe(true);
			expect(settings!.metaPixelId).toBe("pixel-999");
		});
	});

	describe("updateTrackingSettings", () => {
		it("creates settings on first update (upsert)", async () => {
			await updateTrackingSettings({ metaPixelEnabled: true, metaPixelId: "px-1" });

			const settings = await getTrackingSettings();
			expect(settings).not.toBeNull();
			expect(settings!.metaPixelEnabled).toBe(true);
			expect(settings!.metaPixelId).toBe("px-1");
		});

		it("updates existing settings", async () => {
			const db = await getDb();
			await db.insert(trackingSettings).values({
				id: 1,
				metaPixelEnabled: false,
				metaPixelId: null,
			});

			await updateTrackingSettings({ metaPixelEnabled: true, metaPixelId: "px-2" });

			const settings = await getTrackingSettings();
			expect(settings!.metaPixelEnabled).toBe(true);
			expect(settings!.metaPixelId).toBe("px-2");
		});

		it("only updates provided fields", async () => {
			const db = await getDb();
			await db.insert(trackingSettings).values({
				id: 1,
				metaPixelEnabled: true,
				metaPixelId: "px-original",
				gaEnabled: true,
			});

			// Only update gaEnabled, leave metaPixel unchanged
			await updateTrackingSettings({ gaEnabled: false });

			const settings = await getTrackingSettings();
			expect(settings!.metaPixelEnabled).toBe(true);
			expect(settings!.metaPixelId).toBe("px-original");
			expect(settings!.gaEnabled).toBe(false);
		});
	});
});
