import { getDb } from "@/db";
import { errorLog } from "@/db/schema";

type ErrorLevel = "error" | "warning" | "info";

/**
 * Capture an exception and log it to D1. Fire-and-forget — never throws.
 * Use this in catch blocks, error boundaries, and queue consumers.
 */
export async function captureException(
	error: unknown,
	options?: {
		source?: string;
		context?: Record<string, unknown>;
	},
): Promise<void> {
	try {
		const message =
			error instanceof Error ? error.message : String(error);
		const stack = error instanceof Error ? error.stack : undefined;
		const db = await getDb();
		await db.insert(errorLog).values({
			level: "error",
			message: message.slice(0, 1000),
			context: JSON.stringify({
				...options?.context,
				...(stack && { stack: stack.slice(0, 2000) }),
			}),
			source: options?.source ?? null,
		});
	} catch {
		// Error tracking itself must never break the app
	}
}

/**
 * Log a warning or informational message. Fire-and-forget — never throws.
 */
export async function captureMessage(
	message: string,
	options?: {
		level?: ErrorLevel;
		source?: string;
		context?: Record<string, unknown>;
	},
): Promise<void> {
	try {
		const db = await getDb();
		await db.insert(errorLog).values({
			level: options?.level ?? "info",
			message: message.slice(0, 1000),
			context: options?.context ? JSON.stringify(options.context) : null,
			source: options?.source ?? null,
		});
	} catch {
		// Error tracking itself must never break the app
	}
}

/**
 * Get recent error log entries for the admin dashboard.
 */
export async function getErrorLog(page: number, limit: number) {
	const { count } = await import("drizzle-orm");
	const db = await getDb();
	const offset = (page - 1) * limit;

	const [items, [{ total }]] = await Promise.all([
		db.query.errorLog.findMany({
			orderBy: (e, { desc }) => [desc(e.createdAt)],
			limit,
			offset,
		}),
		db.select({ total: count() }).from(errorLog),
	]);

	return { items, total };
}

/**
 * Delete error log entries older than the given number of days.
 */
export async function cleanupErrorLog(olderThanDays: number): Promise<void> {
	const { sql, lt } = await import("drizzle-orm");
	const db = await getDb();
	await db.delete(errorLog).where(
		lt(errorLog.createdAt, sql`datetime('now', ${`-${olderThanDays} days`})`),
	);
}
