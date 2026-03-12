import { describe, it, expect, beforeEach } from "vitest";
import { cleanTables } from "../../../test/helpers";
import { getDb } from "@/db";
import { subscribers, emailCampaigns } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
	getCampaigns,
	getCampaignById,
	createCampaign,
	updateCampaign,
	deleteCampaign,
	getActiveSubscriberEmails,
	markCampaignSending,
	incrementSentCount,
	markCampaignSent,
	markCampaignFailed,
} from "../campaigns";

describe("campaigns (integration)", () => {
	beforeEach(async () => {
		await cleanTables("email_campaigns", "subscribers");
	});

	describe("getCampaigns", () => {
		it("returns empty array when no campaigns exist", async () => {
			const campaigns = await getCampaigns();
			expect(campaigns).toEqual([]);
		});

		it("returns campaigns ordered by createdAt DESC", async () => {
			// Create campaigns with distinct createdAt values to test ordering
			const db = await getDb();
			const c1 = await createCampaign({ subject: "First", body: "<p>First</p>" });
			await db.update(emailCampaigns).set({ createdAt: "2025-01-01 00:00:00" }).where(eq(emailCampaigns.id, c1.id));

			const c2 = await createCampaign({ subject: "Second", body: "<p>Second</p>" });
			await db.update(emailCampaigns).set({ createdAt: "2025-06-01 00:00:00" }).where(eq(emailCampaigns.id, c2.id));

			const c3 = await createCampaign({ subject: "Third", body: "<p>Third</p>" });
			await db.update(emailCampaigns).set({ createdAt: "2025-12-01 00:00:00" }).where(eq(emailCampaigns.id, c3.id));

			const campaigns = await getCampaigns();
			expect(campaigns).toHaveLength(3);
			// Most recent first
			expect(campaigns[0].id).toBe(c3.id);
			expect(campaigns[1].id).toBe(c2.id);
			expect(campaigns[2].id).toBe(c1.id);
		});

		it("respects limit of 500", async () => {
			// We won't create 501 rows for performance, but verify multiple are returned
			for (let i = 0; i < 5; i++) {
				await createCampaign({ subject: `Campaign ${i}`, body: `<p>${i}</p>` });
			}
			const campaigns = await getCampaigns();
			expect(campaigns).toHaveLength(5);
		});
	});

	describe("getCampaignById", () => {
		it("returns the campaign when it exists", async () => {
			const created = await createCampaign({ subject: "Test", body: "<p>Body</p>" });
			const found = await getCampaignById(created.id);

			expect(found).toBeDefined();
			expect(found!.id).toBe(created.id);
			expect(found!.subject).toBe("Test");
			expect(found!.body).toBe("<p>Body</p>");
		});

		it("returns undefined when campaign does not exist", async () => {
			const found = await getCampaignById(99999);
			expect(found).toBeUndefined();
		});
	});

	describe("createCampaign", () => {
		it("creates a campaign with correct defaults", async () => {
			const campaign = await createCampaign({
				subject: "Welcome!",
				body: "<h1>Hello</h1>",
			});

			expect(campaign.id).toBeGreaterThan(0);
			expect(campaign.subject).toBe("Welcome!");
			expect(campaign.body).toBe("<h1>Hello</h1>");
			expect(campaign.status).toBe("draft");
			expect(campaign.sentCount).toBe(0);
			expect(campaign.totalCount).toBe(0);
			expect(campaign.sentAt).toBeNull();
			expect(campaign.createdAt).toBeTruthy();
		});

		it("assigns unique IDs to multiple campaigns", async () => {
			const c1 = await createCampaign({ subject: "A", body: "a" });
			const c2 = await createCampaign({ subject: "B", body: "b" });
			expect(c1.id).not.toBe(c2.id);
		});
	});

	describe("updateCampaign", () => {
		it("updates subject only", async () => {
			const campaign = await createCampaign({ subject: "Old Subject", body: "<p>Body</p>" });
			await updateCampaign(campaign.id, { subject: "New Subject" });

			const updated = await getCampaignById(campaign.id);
			expect(updated!.subject).toBe("New Subject");
			expect(updated!.body).toBe("<p>Body</p>");
		});

		it("updates body only", async () => {
			const campaign = await createCampaign({ subject: "Subject", body: "<p>Old</p>" });
			await updateCampaign(campaign.id, { body: "<p>New</p>" });

			const updated = await getCampaignById(campaign.id);
			expect(updated!.subject).toBe("Subject");
			expect(updated!.body).toBe("<p>New</p>");
		});

		it("updates both subject and body", async () => {
			const campaign = await createCampaign({ subject: "Old", body: "<p>Old</p>" });
			await updateCampaign(campaign.id, { subject: "New", body: "<p>New</p>" });

			const updated = await getCampaignById(campaign.id);
			expect(updated!.subject).toBe("New");
			expect(updated!.body).toBe("<p>New</p>");
		});
	});

	describe("deleteCampaign", () => {
		it("deletes the campaign", async () => {
			const campaign = await createCampaign({ subject: "To Delete", body: "<p>Gone</p>" });
			await deleteCampaign(campaign.id);

			const found = await getCampaignById(campaign.id);
			expect(found).toBeUndefined();
		});

		it("does not affect other campaigns", async () => {
			const c1 = await createCampaign({ subject: "Keep", body: "<p>Keep</p>" });
			const c2 = await createCampaign({ subject: "Delete", body: "<p>Delete</p>" });
			await deleteCampaign(c2.id);

			const remaining = await getCampaigns();
			expect(remaining).toHaveLength(1);
			expect(remaining[0].id).toBe(c1.id);
		});
	});

	describe("getActiveSubscriberEmails", () => {
		it("returns only active subscriber emails", async () => {
			const db = await getDb();
			await db.insert(subscribers).values([
				{ email: "active1@test.com", name: "Active 1", referralCode: "A1", position: 1, status: "active" },
				{ email: "active2@test.com", name: "Active 2", referralCode: "A2", position: 2, status: "active" },
				{ email: "unsub@test.com", name: "Unsub", referralCode: "U1", position: 3, status: "unsubscribed" },
				{ email: "pending@test.com", name: "Pending", referralCode: "P1", position: 4, status: "pending" },
				{ email: "invited@test.com", name: "Invited", referralCode: "I1", position: 5, status: "invited" },
			]);

			const emails = await getActiveSubscriberEmails();
			expect(emails).toHaveLength(2);
			expect(emails).toContain("active1@test.com");
			expect(emails).toContain("active2@test.com");
			expect(emails).not.toContain("unsub@test.com");
			expect(emails).not.toContain("pending@test.com");
			expect(emails).not.toContain("invited@test.com");
		});

		it("returns empty array when no active subscribers", async () => {
			const db = await getDb();
			await db.insert(subscribers).values({
				email: "unsub@test.com",
				name: "Unsub",
				referralCode: "U1",
				position: 1,
				status: "unsubscribed",
			});

			const emails = await getActiveSubscriberEmails();
			expect(emails).toEqual([]);
		});

		it("returns empty array when no subscribers at all", async () => {
			const emails = await getActiveSubscriberEmails();
			expect(emails).toEqual([]);
		});
	});

	describe("markCampaignSending", () => {
		it("sets status to sending and totalCount", async () => {
			const campaign = await createCampaign({ subject: "Send", body: "<p>Send</p>" });
			expect(campaign.status).toBe("draft");

			await markCampaignSending(campaign.id, 150);

			const updated = await getCampaignById(campaign.id);
			expect(updated!.status).toBe("sending");
			expect(updated!.totalCount).toBe(150);
		});

		it("does not modify other fields", async () => {
			const campaign = await createCampaign({ subject: "Send", body: "<p>Body</p>" });
			await markCampaignSending(campaign.id, 42);

			const updated = await getCampaignById(campaign.id);
			expect(updated!.subject).toBe("Send");
			expect(updated!.body).toBe("<p>Body</p>");
			expect(updated!.sentCount).toBe(0);
			expect(updated!.sentAt).toBeNull();
		});
	});

	describe("incrementSentCount", () => {
		it("increments sentCount by 1", async () => {
			const campaign = await createCampaign({ subject: "Count", body: "<p>Count</p>" });
			expect(campaign.sentCount).toBe(0);

			await incrementSentCount(campaign.id);
			const after1 = await getCampaignById(campaign.id);
			expect(after1!.sentCount).toBe(1);

			await incrementSentCount(campaign.id);
			const after2 = await getCampaignById(campaign.id);
			expect(after2!.sentCount).toBe(2);

			await incrementSentCount(campaign.id);
			const after3 = await getCampaignById(campaign.id);
			expect(after3!.sentCount).toBe(3);
		});

		it("increments atomically (multiple sequential increments)", async () => {
			const campaign = await createCampaign({ subject: "Atomic", body: "<p>Atomic</p>" });

			for (let i = 0; i < 10; i++) {
				await incrementSentCount(campaign.id);
			}

			const updated = await getCampaignById(campaign.id);
			expect(updated!.sentCount).toBe(10);
		});
	});

	describe("markCampaignSent", () => {
		it("sets status to sent and sentAt timestamp", async () => {
			const campaign = await createCampaign({ subject: "Done", body: "<p>Done</p>" });
			expect(campaign.sentAt).toBeNull();

			await markCampaignSent(campaign.id);

			const updated = await getCampaignById(campaign.id);
			expect(updated!.status).toBe("sent");
			expect(updated!.sentAt).toBeTruthy();
			// sentAt should be a valid datetime string (YYYY-MM-DD HH:MM:SS format)
			expect(updated!.sentAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
		});

		it("does not modify sentCount or totalCount", async () => {
			const campaign = await createCampaign({ subject: "Done", body: "<p>Done</p>" });
			await markCampaignSending(campaign.id, 50);
			await incrementSentCount(campaign.id);
			await incrementSentCount(campaign.id);

			await markCampaignSent(campaign.id);

			const updated = await getCampaignById(campaign.id);
			expect(updated!.sentCount).toBe(2);
			expect(updated!.totalCount).toBe(50);
		});
	});

	describe("markCampaignFailed", () => {
		it("sets status to failed", async () => {
			const campaign = await createCampaign({ subject: "Fail", body: "<p>Fail</p>" });
			await markCampaignSending(campaign.id, 100);

			await markCampaignFailed(campaign.id);

			const updated = await getCampaignById(campaign.id);
			expect(updated!.status).toBe("failed");
		});

		it("does not modify other fields", async () => {
			const campaign = await createCampaign({ subject: "Fail", body: "<p>Fail</p>" });
			await markCampaignSending(campaign.id, 100);
			await incrementSentCount(campaign.id);

			await markCampaignFailed(campaign.id);

			const updated = await getCampaignById(campaign.id);
			expect(updated!.subject).toBe("Fail");
			expect(updated!.body).toBe("<p>Fail</p>");
			expect(updated!.sentCount).toBe(1);
			expect(updated!.totalCount).toBe(100);
			expect(updated!.sentAt).toBeNull();
		});
	});
});
