import { count } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLog } from "@/db/schema";

/** Log an admin action. Fire-and-forget — never throws. */
export async function logAuditEvent(data: {
	action: string;
	entityType?: string;
	entityId?: string;
	details?: Record<string, unknown>;
	ipAddress?: string;
}): Promise<void> {
	try {
		const db = await getDb();
		await db.insert(auditLog).values({
			action: data.action,
			entityType: data.entityType ?? null,
			entityId: data.entityId ?? null,
			details: data.details ? JSON.stringify(data.details) : null,
			ipAddress: data.ipAddress ?? null,
		});
	} catch {
		// Audit logging must never break the parent operation
	}
}

/** Get paginated audit log entries. */
export async function getAuditLog(page: number, limit: number) {
	const db = await getDb();
	const offset = (page - 1) * limit;

	const [items, [{ total }]] = await Promise.all([
		db.query.auditLog.findMany({
			orderBy: (a, { desc }) => [desc(a.createdAt)],
			limit,
			offset,
		}),
		db.select({ total: count() }).from(auditLog),
	]);

	return { items, total };
}
