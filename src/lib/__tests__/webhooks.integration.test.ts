import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cleanTables } from "../../../test/helpers";
import { getDb } from "@/db";
import { webhooks } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
	getWebhooks,
	getWebhookById,
	createWebhook,
	updateWebhook,
	deleteWebhook,
	fireWebhooks,
} from "../webhooks";

describe("webhooks (integration)", () => {
	beforeEach(async () => {
		await cleanTables("webhooks");
	});

	describe("getWebhooks", () => {
		it("returns empty array when no webhooks exist", async () => {
			const result = await getWebhooks();
			expect(result).toEqual([]);
		});

		it("returns webhooks ordered by createdAt DESC", async () => {
			const db = await getDb();

			const w1 = await createWebhook({
				url: "https://example.com/hook1",
				events: ["waitlist.new"],
				secret: "secret1",
			});
			await db
				.update(webhooks)
				.set({ createdAt: "2025-01-01 00:00:00" })
				.where(eq(webhooks.id, w1.id));

			const w2 = await createWebhook({
				url: "https://example.com/hook2",
				events: ["contact.new"],
				secret: "secret2",
			});
			await db
				.update(webhooks)
				.set({ createdAt: "2025-06-01 00:00:00" })
				.where(eq(webhooks.id, w2.id));

			const w3 = await createWebhook({
				url: "https://example.com/hook3",
				events: ["giveaway.entry"],
				secret: "secret3",
			});
			await db
				.update(webhooks)
				.set({ createdAt: "2025-12-01 00:00:00" })
				.where(eq(webhooks.id, w3.id));

			const result = await getWebhooks();
			expect(result).toHaveLength(3);
			expect(result[0].id).toBe(w3.id);
			expect(result[1].id).toBe(w2.id);
			expect(result[2].id).toBe(w1.id);
		});
	});

	describe("getWebhookById", () => {
		it("returns the webhook when it exists", async () => {
			const created = await createWebhook({
				url: "https://example.com/hook",
				events: ["waitlist.new"],
				secret: "mysecret",
			});

			const found = await getWebhookById(created.id);
			expect(found).toBeDefined();
			expect(found!.id).toBe(created.id);
			expect(found!.url).toBe("https://example.com/hook");
			expect(found!.secret).toBe("mysecret");
		});

		it("returns undefined when webhook does not exist", async () => {
			const found = await getWebhookById(99999);
			expect(found).toBeUndefined();
		});
	});

	describe("createWebhook", () => {
		it("creates a webhook with correct defaults", async () => {
			const webhook = await createWebhook({
				url: "https://example.com/hook",
				events: ["waitlist.new", "contact.new"],
				secret: "topsecret",
			});

			expect(webhook.id).toBeGreaterThan(0);
			expect(webhook.url).toBe("https://example.com/hook");
			expect(webhook.events).toEqual(["waitlist.new", "contact.new"]);
			expect(webhook.secret).toBe("topsecret");
			expect(webhook.active).toBe(true);
			expect(webhook.createdAt).toBeTruthy();
			expect(webhook.updatedAt).toBeTruthy();
		});

		it("returns all fields including id, createdAt, updatedAt", async () => {
			const webhook = await createWebhook({
				url: "https://example.com/hook",
				events: ["giveaway.entry"],
				secret: "abc",
			});

			expect(webhook).toHaveProperty("id");
			expect(webhook).toHaveProperty("url");
			expect(webhook).toHaveProperty("events");
			expect(webhook).toHaveProperty("secret");
			expect(webhook).toHaveProperty("active");
			expect(webhook).toHaveProperty("createdAt");
			expect(webhook).toHaveProperty("updatedAt");
		});

		it("assigns unique IDs to multiple webhooks", async () => {
			const w1 = await createWebhook({
				url: "https://example.com/hook1",
				events: ["a"],
				secret: "s1",
			});
			const w2 = await createWebhook({
				url: "https://example.com/hook2",
				events: ["b"],
				secret: "s2",
			});
			expect(w1.id).not.toBe(w2.id);
		});
	});

	describe("updateWebhook", () => {
		it("updates url only", async () => {
			const webhook = await createWebhook({
				url: "https://old.com/hook",
				events: ["waitlist.new"],
				secret: "secret",
			});

			const updated = await updateWebhook(webhook.id, {
				url: "https://new.com/hook",
			});

			expect(updated.url).toBe("https://new.com/hook");
			expect(updated.events).toEqual(["waitlist.new"]);
			expect(updated.secret).toBe("secret");
			expect(updated.active).toBe(true);
		});

		it("updates events only", async () => {
			const webhook = await createWebhook({
				url: "https://example.com/hook",
				events: ["waitlist.new"],
				secret: "secret",
			});

			const updated = await updateWebhook(webhook.id, {
				events: ["contact.new", "giveaway.entry"],
			});

			expect(updated.url).toBe("https://example.com/hook");
			expect(updated.events).toEqual(["contact.new", "giveaway.entry"]);
			expect(updated.secret).toBe("secret");
		});

		it("updates active to false", async () => {
			const webhook = await createWebhook({
				url: "https://example.com/hook",
				events: ["waitlist.new"],
				secret: "secret",
			});
			expect(webhook.active).toBe(true);

			const updated = await updateWebhook(webhook.id, { active: false });
			expect(updated.active).toBe(false);
		});

		it("partial update preserves other fields", async () => {
			const webhook = await createWebhook({
				url: "https://example.com/hook",
				events: ["waitlist.new"],
				secret: "originalsecret",
			});

			const updated = await updateWebhook(webhook.id, {
				secret: "newsecret",
			});

			expect(updated.url).toBe("https://example.com/hook");
			expect(updated.events).toEqual(["waitlist.new"]);
			expect(updated.secret).toBe("newsecret");
			expect(updated.active).toBe(true);
		});

		it("sets updatedAt to a new timestamp", async () => {
			const db = await getDb();
			const webhook = await createWebhook({
				url: "https://example.com/hook",
				events: ["waitlist.new"],
				secret: "secret",
			});

			// Force createdAt/updatedAt to an old value so the update is visibly different
			await db
				.update(webhooks)
				.set({
					createdAt: "2024-01-01 00:00:00",
					updatedAt: "2024-01-01 00:00:00",
				})
				.where(eq(webhooks.id, webhook.id));

			const updated = await updateWebhook(webhook.id, {
				url: "https://new.com/hook",
			});

			expect(updated.updatedAt).toBeTruthy();
			// updatedAt should be a valid datetime string
			expect(updated.updatedAt).toMatch(
				/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
			);
			// The updatedAt should be different from the forced old value
			expect(updated.updatedAt).not.toBe("2024-01-01 00:00:00");
		});
	});

	describe("deleteWebhook", () => {
		it("deletes the webhook", async () => {
			const webhook = await createWebhook({
				url: "https://example.com/hook",
				events: ["waitlist.new"],
				secret: "secret",
			});

			await deleteWebhook(webhook.id);

			const found = await getWebhookById(webhook.id);
			expect(found).toBeUndefined();
		});

		it("does not affect other webhooks", async () => {
			const w1 = await createWebhook({
				url: "https://example.com/keep",
				events: ["waitlist.new"],
				secret: "s1",
			});
			const w2 = await createWebhook({
				url: "https://example.com/delete",
				events: ["contact.new"],
				secret: "s2",
			});

			await deleteWebhook(w2.id);

			const remaining = await getWebhooks();
			expect(remaining).toHaveLength(1);
			expect(remaining[0].id).toBe(w1.id);
		});
	});

	describe("fireWebhooks", () => {
		const originalFetch = global.fetch;

		beforeEach(() => {
			global.fetch = vi
				.fn()
				.mockResolvedValue(new Response("OK", { status: 200 }));
		});

		afterEach(() => {
			global.fetch = originalFetch;
		});

		it("fires to matching webhooks only", async () => {
			await createWebhook({
				url: "https://example.com/waitlist-hook",
				events: ["waitlist.new"],
				secret: "secret1",
			});
			await createWebhook({
				url: "https://example.com/contact-hook",
				events: ["contact.new"],
				secret: "secret2",
			});

			await fireWebhooks("waitlist.new", { email: "test@test.com" });

			const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(mockFetch.mock.calls[0][0]).toBe(
				"https://example.com/waitlist-hook",
			);
		});

		it("sends correct headers", async () => {
			await createWebhook({
				url: "https://example.com/hook",
				events: ["contact.new"],
				secret: "secret",
			});

			await fireWebhooks("contact.new", { message: "hello" });

			const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
			expect(mockFetch).toHaveBeenCalledTimes(1);

			const callArgs = mockFetch.mock.calls[0];
			const options = callArgs[1] as RequestInit;
			const headers = options.headers as Record<string, string>;

			expect(headers["Content-Type"]).toBe("application/json");
			expect(headers["X-Webhook-Event"]).toBe("contact.new");
			expect(headers["X-Webhook-Signature"]).toBeDefined();
		});

		it("sends a valid HMAC SHA-256 hex signature (64 chars)", async () => {
			await createWebhook({
				url: "https://example.com/hook",
				events: ["waitlist.new"],
				secret: "mysecret",
			});

			await fireWebhooks("waitlist.new", { data: "test" });

			const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
			const callArgs = mockFetch.mock.calls[0];
			const options = callArgs[1] as RequestInit;
			const headers = options.headers as Record<string, string>;
			const signature = headers["X-Webhook-Signature"];

			// SHA-256 HMAC produces 32 bytes = 64 hex characters
			expect(signature).toMatch(/^[0-9a-f]{64}$/);
		});

		it("sends body containing event, data, and timestamp", async () => {
			await createWebhook({
				url: "https://example.com/hook",
				events: ["giveaway.entry"],
				secret: "secret",
			});

			await fireWebhooks("giveaway.entry", { userId: 42 });

			const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
			const callArgs = mockFetch.mock.calls[0];
			const options = callArgs[1] as RequestInit;
			const body = JSON.parse(options.body as string);

			expect(body.event).toBe("giveaway.entry");
			expect(body.data).toEqual({ userId: 42 });
			expect(body.timestamp).toBeTruthy();
			// Timestamp should be a valid ISO string
			expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
		});

		it("skips inactive webhooks", async () => {
			const webhook = await createWebhook({
				url: "https://example.com/hook",
				events: ["waitlist.new"],
				secret: "secret",
			});
			await updateWebhook(webhook.id, { active: false });

			await fireWebhooks("waitlist.new", { email: "test@test.com" });

			const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("does not throw on fetch failure", async () => {
			await createWebhook({
				url: "https://example.com/hook",
				events: ["waitlist.new"],
				secret: "secret",
			});

			(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
				new Error("Network error"),
			);

			// Should not throw
			await expect(
				fireWebhooks("waitlist.new", { email: "test@test.com" }),
			).resolves.toBeUndefined();
		});

		it("does not throw when no webhooks exist", async () => {
			await expect(
				fireWebhooks("waitlist.new", { email: "test@test.com" }),
			).resolves.toBeUndefined();

			const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
			expect(mockFetch).not.toHaveBeenCalled();
		});
	});
});
