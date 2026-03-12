import { describe, it, expect, beforeEach } from "vitest";
import { cleanTables } from "../../../test/helpers";
import { getDb } from "@/db";
import { errorLog } from "@/db/schema";
import {
	captureException,
	captureMessage,
	getErrorLog,
	cleanupErrorLog,
} from "../error-tracking";

describe("error-tracking (integration)", () => {
	beforeEach(async () => {
		await cleanTables("error_log");
	});

	// ── captureException ──────────────────────────────────────────────

	describe("captureException", () => {
		it("logs an Error instance with message and stack", async () => {
			const err = new Error("something broke");
			await captureException(err);

			const { items } = await getErrorLog(1, 10);
			expect(items).toHaveLength(1);
			expect(items[0].level).toBe("error");
			expect(items[0].message).toBe("something broke");

			const ctx = JSON.parse(items[0].context!);
			expect(ctx.stack).toBeDefined();
			expect(ctx.stack).toContain("something broke");
		});

		it("logs a non-Error (string) — uses String(error), no stack", async () => {
			await captureException("plain string error");

			const { items } = await getErrorLog(1, 10);
			expect(items).toHaveLength(1);
			expect(items[0].message).toBe("plain string error");

			const ctx = JSON.parse(items[0].context!);
			expect(ctx.stack).toBeUndefined();
		});

		it("truncates message to 1000 chars", async () => {
			const longMessage = "x".repeat(2000);
			await captureException(new Error(longMessage));

			const { items } = await getErrorLog(1, 10);
			expect(items[0].message).toHaveLength(1000);
		});

		it("truncates stack to 2000 chars", async () => {
			const err = new Error("test");
			// Override the stack with a very long string
			err.stack = "S".repeat(5000);
			await captureException(err);

			const { items } = await getErrorLog(1, 10);
			const ctx = JSON.parse(items[0].context!);
			expect(ctx.stack).toHaveLength(2000);
		});

		it("includes source and context when provided", async () => {
			await captureException(new Error("fail"), {
				source: "queue-consumer",
				context: { jobId: 42, type: "email" },
			});

			const { items } = await getErrorLog(1, 10);
			expect(items[0].source).toBe("queue-consumer");

			const ctx = JSON.parse(items[0].context!);
			expect(ctx.jobId).toBe(42);
			expect(ctx.type).toBe("email");
		});

		it("level is always 'error'", async () => {
			await captureException("any input");

			const { items } = await getErrorLog(1, 10);
			expect(items[0].level).toBe("error");
		});

		it("does not throw for normal inputs", async () => {
			await expect(
				captureException(new Error("test")),
			).resolves.toBeUndefined();
			await expect(
				captureException("string"),
			).resolves.toBeUndefined();
			await expect(
				captureException(null),
			).resolves.toBeUndefined();
			await expect(
				captureException(undefined),
			).resolves.toBeUndefined();
		});
	});

	// ── captureMessage ────────────────────────────────────────────────

	describe("captureMessage", () => {
		it("logs a message with default level 'info'", async () => {
			await captureMessage("deployment started");

			const { items } = await getErrorLog(1, 10);
			expect(items).toHaveLength(1);
			expect(items[0].level).toBe("info");
			expect(items[0].message).toBe("deployment started");
		});

		it("respects custom level 'warning'", async () => {
			await captureMessage("disk usage high", { level: "warning" });

			const { items } = await getErrorLog(1, 10);
			expect(items[0].level).toBe("warning");
		});

		it("respects custom level 'error'", async () => {
			await captureMessage("critical failure", { level: "error" });

			const { items } = await getErrorLog(1, 10);
			expect(items[0].level).toBe("error");
		});

		it("truncates message to 1000 chars", async () => {
			const longMessage = "m".repeat(2000);
			await captureMessage(longMessage);

			const { items } = await getErrorLog(1, 10);
			expect(items[0].message).toHaveLength(1000);
		});

		it("includes context as JSON string when provided", async () => {
			await captureMessage("test", {
				context: { userId: "abc", action: "login" },
			});

			const { items } = await getErrorLog(1, 10);
			const ctx = JSON.parse(items[0].context!);
			expect(ctx.userId).toBe("abc");
			expect(ctx.action).toBe("login");
		});

		it("context is null when not provided", async () => {
			await captureMessage("no context");

			const { items } = await getErrorLog(1, 10);
			expect(items[0].context).toBeNull();
		});

		it("includes source when provided", async () => {
			await captureMessage("info", { source: "cron-job" });

			const { items } = await getErrorLog(1, 10);
			expect(items[0].source).toBe("cron-job");
		});
	});

	// ── getErrorLog ───────────────────────────────────────────────────

	describe("getErrorLog", () => {
		it("returns empty when no entries", async () => {
			const { items, total } = await getErrorLog(1, 10);
			expect(items).toEqual([]);
			expect(total).toBe(0);
		});

		it("returns entries ordered by createdAt DESC", async () => {
			// Insert 3 entries with distinct timestamps
			const db = await getDb();
			await db.insert(errorLog).values({
				level: "error",
				message: "first",
				createdAt: "2026-01-01 00:00:00",
			});
			await db.insert(errorLog).values({
				level: "error",
				message: "third",
				createdAt: "2026-01-03 00:00:00",
			});
			await db.insert(errorLog).values({
				level: "error",
				message: "second",
				createdAt: "2026-01-02 00:00:00",
			});

			const { items } = await getErrorLog(1, 10);
			expect(items).toHaveLength(3);
			expect(items[0].message).toBe("third");
			expect(items[1].message).toBe("second");
			expect(items[2].message).toBe("first");
		});

		it("pagination works correctly (page 2, limit 2 with 5 entries)", async () => {
			const db = await getDb();
			for (let i = 1; i <= 5; i++) {
				await db.insert(errorLog).values({
					level: "info",
					message: `entry-${i}`,
					createdAt: `2026-01-0${i} 00:00:00`,
				});
			}

			const { items, total } = await getErrorLog(2, 2);
			expect(total).toBe(5);
			expect(items).toHaveLength(2);
			// Page 1 (limit 2, DESC): entry-5, entry-4
			// Page 2 (limit 2, DESC): entry-3, entry-2
			expect(items[0].message).toBe("entry-3");
			expect(items[1].message).toBe("entry-2");
		});

		it("returns correct total count", async () => {
			await captureMessage("one");
			await captureMessage("two");
			await captureMessage("three");

			const { total } = await getErrorLog(1, 10);
			expect(total).toBe(3);
		});
	});

	// ── cleanupErrorLog ───────────────────────────────────────────────

	describe("cleanupErrorLog", () => {
		it("deletes entries older than given days", async () => {
			const db = await getDb();

			// Insert an old entry (60 days ago)
			const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
				.toISOString()
				.replace("T", " ")
				.replace(/\.\d{3}Z$/, "");
			await db.insert(errorLog).values({
				level: "error",
				message: "old error",
				createdAt: oldDate,
			});

			// Insert a recent entry
			const recentDate = new Date()
				.toISOString()
				.replace("T", " ")
				.replace(/\.\d{3}Z$/, "");
			await db.insert(errorLog).values({
				level: "error",
				message: "recent error",
				createdAt: recentDate,
			});

			await cleanupErrorLog(30);

			const { items, total } = await getErrorLog(1, 10);
			expect(total).toBe(1);
			expect(items[0].message).toBe("recent error");
		});

		it("preserves recent entries", async () => {
			const db = await getDb();

			// Insert entries that are 5 and 10 days old
			const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
				.toISOString()
				.replace("T", " ")
				.replace(/\.\d{3}Z$/, "");
			const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
				.toISOString()
				.replace("T", " ")
				.replace(/\.\d{3}Z$/, "");

			await db.insert(errorLog).values({
				level: "warning",
				message: "5 days old",
				createdAt: fiveDaysAgo,
			});
			await db.insert(errorLog).values({
				level: "warning",
				message: "10 days old",
				createdAt: tenDaysAgo,
			});

			// Cleanup entries older than 30 days — both should survive
			await cleanupErrorLog(30);

			const { total } = await getErrorLog(1, 10);
			expect(total).toBe(2);
		});

		it("does nothing when no old entries exist", async () => {
			// Insert only a fresh entry
			await captureMessage("just now");

			await cleanupErrorLog(7);

			const { total } = await getErrorLog(1, 10);
			expect(total).toBe(1);
		});
	});
});
