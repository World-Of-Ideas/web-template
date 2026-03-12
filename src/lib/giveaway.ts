import { eq, sql, count } from "drizzle-orm";
import { getDb } from "@/db";
import { giveawayEntries, giveawayActions } from "@/db/schema";

export async function createGiveawayEntry(data: {
	email: string;
	subscriberId?: number;
	source?: string;
}) {
	const db = await getDb();
	const [entry] = await db
		.insert(giveawayEntries)
		.values({
			email: data.email,
			subscriberId: data.subscriberId ?? null,
			source: data.source ?? null,
		})
		.returning();
	return entry;
}

export async function getGiveawayEntryByEmail(email: string) {
	const db = await getDb();
	return db.query.giveawayEntries.findFirst({
		where: eq(giveawayEntries.email, email),
	});
}

export async function recordGiveawayAction(data: {
	entryId: number;
	action: string;
	bonusEntries: number;
	metadata?: string;
}) {
	const db = await getDb();

	// Insert action and atomically increment totalEntries in a batch
	await db.batch([
		db.insert(giveawayActions).values({
			entryId: data.entryId,
			action: data.action,
			bonusEntries: data.bonusEntries,
			metadata: data.metadata ?? null,
		}),
		db
			.update(giveawayEntries)
			.set({
				totalEntries: sql`${giveawayEntries.totalEntries} + ${data.bonusEntries}`,
			})
			.where(eq(giveawayEntries.id, data.entryId)),
	]);
}

export async function getGiveawayActions(entryId: number) {
	const db = await getDb();
	return db.query.giveawayActions.findMany({
		where: eq(giveawayActions.entryId, entryId),
		limit: 100,
	});
}

export function isGiveawayEnded(endDate: string | undefined): boolean {
	if (!endDate) return false;
	const parsed = new Date(endDate);
	if (isNaN(parsed.getTime())) return false;
	return parsed < new Date();
}

export async function getGiveawayEntries(page: number, limit: number) {
	const db = await getDb();
	const offset = (page - 1) * limit;

	const [items, [{ total }]] = await Promise.all([
		db.query.giveawayEntries.findMany({
			orderBy: (e, { desc }) => [desc(e.createdAt)],
			limit,
			offset,
		}),
		db.select({ total: count() }).from(giveawayEntries),
	]);

	return { items, total };
}

export async function getGiveawayStats() {
	const db = await getDb();
	const [[{ totalEntries }], [{ totalActions }]] = await Promise.all([
		db.select({ totalEntries: count() }).from(giveawayEntries),
		db.select({ totalActions: count() }).from(giveawayActions),
	]);
	return { totalEntries, totalActions };
}
