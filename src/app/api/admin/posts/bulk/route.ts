import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { inArray, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
	if (!(await requireAdminSession())) return apiError("UNAUTHORIZED", "Not authenticated");
	if (!(await getSiteSettingsDirect()).features.blog) return apiError("NOT_FOUND", "Blog feature is not enabled");

	try {
		const body = await request.json();
		if (!body || typeof body !== "object") return apiError("VALIDATION_ERROR", "Invalid body");
		const { action, ids } = body as { action?: string; ids?: number[] };
		if (!action || typeof action !== "string") return apiError("VALIDATION_ERROR", "Action is required");
		if (!Array.isArray(ids) || ids.length === 0) return apiError("VALIDATION_ERROR", "At least one ID is required");
		if (ids.length > 100) return apiError("VALIDATION_ERROR", "Maximum 100 items per bulk operation");
		if (!ids.every((id) => typeof id === "number" && Number.isInteger(id) && id > 0)) {
			return apiError("VALIDATION_ERROR", "All IDs must be positive integers");
		}

		const db = await getDb();
		const now = new Date().toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");

		switch (action) {
			case "publish":
				await db.update(posts).set({
					published: true,
					publishedAt: sql`CASE WHEN ${posts.publishedAt} IS NULL THEN ${now} ELSE ${posts.publishedAt} END`,
					updatedAt: now,
				}).where(inArray(posts.id, ids));
				break;
			case "unpublish":
				await db.update(posts).set({ published: false, updatedAt: now }).where(inArray(posts.id, ids));
				break;
			case "delete":
				await db.delete(posts).where(inArray(posts.id, ids));
				break;
			default:
				return apiError("VALIDATION_ERROR", "Action must be one of: publish, unpublish, delete");
		}

		return apiSuccess({ action, count: ids.length });
	} catch {
		return apiError("INTERNAL_ERROR", "Bulk operation failed");
	}
}
