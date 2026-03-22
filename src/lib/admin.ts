import { eq, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { adminSessions } from "@/db/schema";

export async function createSession(): Promise<string> {
	const db = await getDb();
	const id = crypto.randomUUID();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

	await db.insert(adminSessions).values({
		id,
		expiresAt: expiresAt.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, ""),
	});

	return id;
}

const MAX_SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days absolute max

export async function validateSession(sessionId: string): Promise<boolean> {
	const db = await getDb();
	const session = await db.query.adminSessions.findFirst({
		where: eq(adminSessions.id, sessionId),
	});

	if (!session) return false;
	if (new Date(session.expiresAt) < new Date()) {
		await db.delete(adminSessions).where(eq(adminSessions.id, sessionId));
		return false;
	}

	// Enforce absolute max session lifetime (7 days from creation)
	const createdAt = new Date(session.createdAt).getTime();
	if (Date.now() - createdAt > MAX_SESSION_AGE_MS) {
		await db.delete(adminSessions).where(eq(adminSessions.id, sessionId));
		return false;
	}

	// Extend session TTL on successful validation (sliding window)
	const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
	await db
		.update(adminSessions)
		.set({ expiresAt: newExpiry })
		.where(eq(adminSessions.id, sessionId));

	return true;
}

export async function deleteSession(sessionId: string): Promise<void> {
	const db = await getDb();
	await db.delete(adminSessions).where(eq(adminSessions.id, sessionId));
}

export async function cleanupExpiredSessions(): Promise<void> {
	const db = await getDb();
	await db
		.delete(adminSessions)
		.where(lt(adminSessions.expiresAt, sql`datetime('now')`));
}

/**
 * Derive a key from a password using PBKDF2 with a fixed salt.
 * PBKDF2 adds computational cost to prevent brute-force attacks,
 * unlike plain SHA-256 which is too fast for password hashing.
 */
async function deriveKey(password: string, salt: ArrayBuffer): Promise<ArrayBuffer> {
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	return crypto.subtle.deriveBits(
		{ name: "PBKDF2", salt, iterations: 10_000, hash: "SHA-256" },
		keyMaterial,
		256,
	);
}

export async function verifyPassword(password: string, adminPassword: string): Promise<boolean> {
	// Use a fixed salt derived from the admin password itself.
	// This is acceptable because admin password comes from env var (not user-chosen),
	// and the goal is brute-force resistance, not rainbow table protection.
	const encoder = new TextEncoder();
	const salt = await crypto.subtle.digest("SHA-256", encoder.encode("woi-admin-salt:" + adminPassword));

	const [derivedA, derivedB] = await Promise.all([
		deriveKey(password, salt),
		deriveKey(adminPassword, salt),
	]);
	const a = new Uint8Array(derivedA);
	const b = new Uint8Array(derivedB);
	let result = 0;
	for (let i = 0; i < a.byteLength; i++) {
		result |= a[i] ^ b[i];
	}
	return result === 0;
}
