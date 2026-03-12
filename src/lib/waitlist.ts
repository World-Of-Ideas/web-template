import { eq, sql, count } from "drizzle-orm";
import { getDb } from "@/db";
import { subscribers } from "@/db/schema";

export async function createSubscriber(data: {
	email: string;
	name: string;
	referralCode: string;
	referredBy?: string;
	source?: string;
	status?: string;
}) {
	const db = await getDb();

	// Atomic position assignment using a subquery to avoid race conditions.
	// The INSERT + subquery runs as a single statement, preventing duplicate positions.
	const [subscriber] = await db
		.insert(subscribers)
		.values({
			email: data.email,
			name: data.name,
			referralCode: data.referralCode,
			referredBy: data.referredBy ?? null,
			source: data.source ?? null,
			status: data.status ?? "active",
			position: sql`(SELECT COALESCE(MAX(${subscribers.position}), 0) + 1 FROM ${subscribers})`,
		})
		.returning();

	return subscriber;
}

/** Create subscriber and increment referrer's count atomically in a batch. */
export async function createSubscriberWithReferral(data: {
	email: string;
	name: string;
	referralCode: string;
	referredBy: string;
	source?: string;
	status?: string;
}) {
	const db = await getDb();

	const insertStmt = db
		.insert(subscribers)
		.values({
			email: data.email,
			name: data.name,
			referralCode: data.referralCode,
			referredBy: data.referredBy,
			source: data.source ?? null,
			status: data.status ?? "active",
			position: sql`(SELECT COALESCE(MAX(${subscribers.position}), 0) + 1 FROM ${subscribers})`,
		})
		.returning();

	const updateStmt = db
		.update(subscribers)
		.set({ referralCount: sql`${subscribers.referralCount} + 1` })
		.where(eq(subscribers.referralCode, data.referredBy));

	const [results] = await db.batch([insertStmt, updateStmt]);
	return results[0];
}

export async function getSubscriberByEmail(email: string) {
	const db = await getDb();
	return db.query.subscribers.findFirst({
		where: eq(subscribers.email, email),
	});
}

export async function getSubscriberByReferralCode(code: string) {
	const db = await getDb();
	return db.query.subscribers.findFirst({
		where: eq(subscribers.referralCode, code),
	});
}

export async function incrementReferralCount(referralCode: string) {
	const db = await getDb();
	await db
		.update(subscribers)
		.set({ referralCount: sql`${subscribers.referralCount} + 1` })
		.where(eq(subscribers.referralCode, referralCode));
}

export async function getSubscriberCount() {
	const db = await getDb();
	const [result] = await db
		.select({ value: count() })
		.from(subscribers)
		.where(eq(subscribers.status, "active"));
	return result.value;
}

export async function unsubscribe(email: string) {
	const db = await getDb();
	await db
		.update(subscribers)
		.set({ status: "unsubscribed" })
		.where(eq(subscribers.email, email));
}

export async function getSubscribers(page: number, limit: number) {
	const db = await getDb();
	const offset = (page - 1) * limit;

	const [items, [{ total }]] = await Promise.all([
		db.query.subscribers.findMany({
			orderBy: (s, { desc }) => [desc(s.createdAt)],
			limit,
			offset,
		}),
		db.select({ total: count() }).from(subscribers),
	]);

	return { items, total };
}

export async function verifySubscriberEmail(email: string) {
	const db = await getDb();
	await db
		.update(subscribers)
		.set({ status: "active" })
		.where(eq(subscribers.email, email));
}

export async function getSubscriberStatus(email: string): Promise<string | null> {
	const db = await getDb();
	const sub = await db.query.subscribers.findFirst({
		where: eq(subscribers.email, email),
		columns: { status: true },
	});
	return sub?.status ?? null;
}

// --- Unsubscribe token helpers (HMAC-SHA256) ---

const encoder = new TextEncoder();

async function getHmacKey(secret: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"],
	);
}

function bufferToHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function hexToBuffer(hex: string): ArrayBuffer {
	if (hex.length % 2 !== 0) throw new Error("Invalid hex string length");
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes.buffer;
}

export async function generateUnsubscribeToken(email: string, secret: string): Promise<string> {
	const key = await getHmacKey(secret);
	const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(email));
	return bufferToHex(signature);
}

export async function verifyUnsubscribeToken(email: string, token: string, secret: string): Promise<boolean> {
	try {
		const key = await getHmacKey(secret);
		return crypto.subtle.verify("HMAC", key, hexToBuffer(token), encoder.encode(email));
	} catch {
		return false;
	}
}
