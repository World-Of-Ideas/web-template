import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { emailCampaigns, subscribers } from "@/db/schema";

export async function getCampaigns() {
	const db = await getDb();
	return db.query.emailCampaigns.findMany({
		orderBy: (c, { desc }) => [desc(c.createdAt)],
		limit: 500,
	});
}

export async function getCampaignById(id: number) {
	const db = await getDb();
	return db.query.emailCampaigns.findFirst({
		where: eq(emailCampaigns.id, id),
	});
}

export async function createCampaign(data: { subject: string; body: string }) {
	const db = await getDb();
	const [campaign] = await db.insert(emailCampaigns).values({
		subject: data.subject,
		body: data.body,
	}).returning();
	return campaign;
}

export async function updateCampaign(id: number, data: { subject?: string; body?: string }) {
	const db = await getDb();
	await db.update(emailCampaigns).set(data).where(eq(emailCampaigns.id, id));
}

export async function deleteCampaign(id: number) {
	const db = await getDb();
	await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
}

/** Get active subscriber emails for campaign sending (capped at 10,000). */
export async function getActiveSubscriberEmails(): Promise<string[]> {
	const db = await getDb();
	const MAX_CAMPAIGN_RECIPIENTS = 10_000;
	const rows = await db.select({ email: subscribers.email })
		.from(subscribers)
		.where(eq(subscribers.status, "active"))
		.limit(MAX_CAMPAIGN_RECIPIENTS);
	return rows.map((r) => r.email);
}

/** Mark campaign as sending with total count. */
export async function markCampaignSending(id: number, totalCount: number) {
	const db = await getDb();
	await db.update(emailCampaigns).set({
		status: "sending",
		totalCount,
	}).where(eq(emailCampaigns.id, id));
}

/** Increment sent count atomically. */
export async function incrementSentCount(id: number) {
	const db = await getDb();
	await db.update(emailCampaigns).set({
		sentCount: sql`${emailCampaigns.sentCount} + 1`,
	}).where(eq(emailCampaigns.id, id));
}

/** Mark campaign as sent. */
export async function markCampaignSent(id: number) {
	const db = await getDb();
	await db.update(emailCampaigns).set({
		status: "sent",
		sentAt: new Date().toISOString().replace("T", " ").replace(/\.\d{3}Z$/, ""),
	}).where(eq(emailCampaigns.id, id));
}

/** Mark campaign as failed. */
export async function markCampaignFailed(id: number) {
	const db = await getDb();
	await db.update(emailCampaigns).set({ status: "failed" }).where(eq(emailCampaigns.id, id));
}
