import { describe, it, expect, beforeEach } from "vitest";
import { cleanTables } from "../../../test/helpers";
import { getDb } from "@/db";
import { subscribers, contactSubmissions } from "@/db/schema";
import { getSignupTrend, getContactTrend, getTopReferrers } from "../dashboard";

function nowSqlite(): string {
	return new Date().toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
}

describe("dashboard (integration)", () => {
	beforeEach(async () => {
		await cleanTables("subscribers", "contact_submissions");
	});

	describe("getSignupTrend", () => {
		it("returns empty array when no subscribers", async () => {
			const result = await getSignupTrend();
			expect(result).toEqual([]);
		});

		it("returns grouped daily counts for recent subscribers", async () => {
			const db = await getDb();
			const now = nowSqlite();

			await db.insert(subscribers).values({
				email: "a@test.com",
				name: "A",
				referralCode: "REF001",
				position: 1,
				status: "active",
				createdAt: now,
			});
			await db.insert(subscribers).values({
				email: "b@test.com",
				name: "B",
				referralCode: "REF002",
				position: 2,
				status: "active",
				createdAt: now,
			});

			const result = await getSignupTrend();
			expect(result).toHaveLength(1);
			expect(result[0].count).toBe(2);
			// Date should be today in YYYY-MM-DD format
			const todayStr = new Date().toISOString().slice(0, 10);
			expect(result[0].date).toBe(todayStr);
		});

		it("only counts active subscribers", async () => {
			const db = await getDb();
			const now = nowSqlite();

			await db.insert(subscribers).values({
				email: "active@test.com",
				name: "Active",
				referralCode: "ACT001",
				position: 1,
				status: "active",
				createdAt: now,
			});
			await db.insert(subscribers).values({
				email: "unsub@test.com",
				name: "Unsub",
				referralCode: "UNS001",
				position: 2,
				status: "unsubscribed",
				createdAt: now,
			});
			await db.insert(subscribers).values({
				email: "invited@test.com",
				name: "Invited",
				referralCode: "INV001",
				position: 3,
				status: "invited",
				createdAt: now,
			});

			const result = await getSignupTrend();
			expect(result).toHaveLength(1);
			expect(result[0].count).toBe(1);
		});

		it("clamps days parameter: 0 becomes 1", async () => {
			const db = await getDb();
			const now = nowSqlite();

			await db.insert(subscribers).values({
				email: "today@test.com",
				name: "Today",
				referralCode: "TOD001",
				position: 1,
				status: "active",
				createdAt: now,
			});

			// days=0 should be clamped to 1, which still includes today
			const result = await getSignupTrend(0);
			expect(result).toHaveLength(1);
			expect(result[0].count).toBe(1);
		});

		it("clamps days parameter: 1000 becomes 365", async () => {
			const db = await getDb();
			const now = nowSqlite();

			await db.insert(subscribers).values({
				email: "recent@test.com",
				name: "Recent",
				referralCode: "REC001",
				position: 1,
				status: "active",
				createdAt: now,
			});

			// days=1000 should be clamped to 365, still includes today
			const result = await getSignupTrend(1000);
			expect(result).toHaveLength(1);
			expect(result[0].count).toBe(1);
		});
	});

	describe("getContactTrend", () => {
		it("returns empty array when no submissions", async () => {
			const result = await getContactTrend();
			expect(result).toEqual([]);
		});

		it("returns grouped daily counts", async () => {
			const db = await getDb();
			const now = nowSqlite();

			await db.insert(contactSubmissions).values({
				name: "Alice",
				email: "alice@test.com",
				message: "Hello",
				createdAt: now,
			});
			await db.insert(contactSubmissions).values({
				name: "Bob",
				email: "bob@test.com",
				message: "Hi there",
				createdAt: now,
			});
			await db.insert(contactSubmissions).values({
				name: "Charlie",
				email: "charlie@test.com",
				message: "Question",
				createdAt: now,
			});

			const result = await getContactTrend();
			expect(result).toHaveLength(1);
			expect(result[0].count).toBe(3);
			const todayStr = new Date().toISOString().slice(0, 10);
			expect(result[0].date).toBe(todayStr);
		});
	});

	describe("getTopReferrers", () => {
		it("returns empty array when no referrers", async () => {
			const result = await getTopReferrers();
			expect(result).toEqual([]);
		});

		it("returns referrers ordered by count descending", async () => {
			const db = await getDb();

			await db.insert(subscribers).values({
				email: "low@test.com",
				name: "Low",
				referralCode: "LOW001",
				referralCount: 2,
				position: 1,
				status: "active",
			});
			await db.insert(subscribers).values({
				email: "high@test.com",
				name: "High",
				referralCode: "HIGH01",
				referralCount: 10,
				position: 2,
				status: "active",
			});
			await db.insert(subscribers).values({
				email: "mid@test.com",
				name: "Mid",
				referralCode: "MID001",
				referralCount: 5,
				position: 3,
				status: "active",
			});

			const result = await getTopReferrers();
			expect(result).toHaveLength(3);
			expect(result[0].name).toBe("High");
			expect(result[0].referralCount).toBe(10);
			expect(result[1].name).toBe("Mid");
			expect(result[1].referralCount).toBe(5);
			expect(result[2].name).toBe("Low");
			expect(result[2].referralCount).toBe(2);
		});

		it("respects limit parameter", async () => {
			const db = await getDb();

			for (let i = 1; i <= 5; i++) {
				await db.insert(subscribers).values({
					email: `ref${i}@test.com`,
					name: `Referrer ${i}`,
					referralCode: `REFL0${i}`,
					referralCount: i,
					position: i,
					status: "active",
				});
			}

			const result = await getTopReferrers(2);
			expect(result).toHaveLength(2);
			// Top 2 should be the ones with highest counts
			expect(result[0].referralCount).toBe(5);
			expect(result[1].referralCount).toBe(4);
		});

		it("only includes subscribers with referralCount > 0", async () => {
			const db = await getDb();

			await db.insert(subscribers).values({
				email: "norefs@test.com",
				name: "No Refs",
				referralCode: "NOR001",
				referralCount: 0,
				position: 1,
				status: "active",
			});
			await db.insert(subscribers).values({
				email: "hasrefs@test.com",
				name: "Has Refs",
				referralCode: "HAS001",
				referralCount: 3,
				position: 2,
				status: "active",
			});

			const result = await getTopReferrers();
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("Has Refs");
			expect(result[0].referralCount).toBe(3);
			expect(result[0].email).toBe("hasrefs@test.com");
			expect(result[0].referralCode).toBe("HAS001");
		});
	});
});
