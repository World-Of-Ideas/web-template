import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { redirects } from "@/db/schema";

export async function getRedirectByPath(path: string) {
	const db = await getDb();
	return db.query.redirects.findFirst({
		where: and(eq(redirects.fromPath, path), eq(redirects.enabled, true)),
	});
}

export async function getAllRedirects() {
	const db = await getDb();
	return db.query.redirects.findMany({
		orderBy: (r, { desc }) => [desc(r.createdAt)],
		limit: 500,
	});
}

export async function createRedirect(data: {
	fromPath: string;
	toUrl: string;
	statusCode?: number;
	enabled?: boolean;
}) {
	const db = await getDb();
	const [redirect] = await db
		.insert(redirects)
		.values({
			fromPath: data.fromPath,
			toUrl: data.toUrl,
			statusCode: data.statusCode ?? 301,
			enabled: data.enabled ?? true,
		})
		.returning();
	return redirect;
}

export async function updateRedirect(
	id: number,
	data: Partial<{
		fromPath: string;
		toUrl: string;
		statusCode: number;
		enabled: boolean;
	}>,
) {
	const db = await getDb();
	const now = new Date().toISOString();

	const updateData: Record<string, unknown> = { updatedAt: now };
	if (data.fromPath !== undefined) updateData.fromPath = data.fromPath;
	if (data.toUrl !== undefined) updateData.toUrl = data.toUrl;
	if (data.statusCode !== undefined) updateData.statusCode = data.statusCode;
	if (data.enabled !== undefined) updateData.enabled = data.enabled;

	const [redirect] = await db
		.update(redirects)
		.set(updateData as typeof redirects.$inferInsert)
		.where(eq(redirects.id, id))
		.returning();
	return redirect;
}

export async function deleteRedirect(id: number) {
	const db = await getDb();
	await db.delete(redirects).where(eq(redirects.id, id));
}
