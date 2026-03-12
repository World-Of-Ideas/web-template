import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/db";
import { pages } from "@/db/schema";
import { inArray } from "drizzle-orm";

const SYSTEM_PAGES = ["home", "waitlist", "giveaway", "contact", "blog", "terms", "privacy"];

export async function POST(request: NextRequest) {
	if (!(await requireAdminSession())) return apiError("UNAUTHORIZED", "Not authenticated");

	try {
		const body = await request.json();
		if (!body || typeof body !== "object") return apiError("VALIDATION_ERROR", "Invalid body");
		const { action, slugs } = body as { action?: string; slugs?: string[] };
		if (!action || typeof action !== "string") return apiError("VALIDATION_ERROR", "Action is required");
		if (!Array.isArray(slugs) || slugs.length === 0) return apiError("VALIDATION_ERROR", "At least one slug is required");
		if (slugs.length > 100) return apiError("VALIDATION_ERROR", "Maximum 100 items per bulk operation");
		if (!slugs.every((s) => typeof s === "string" && s.length > 0)) {
			return apiError("VALIDATION_ERROR", "All slugs must be non-empty strings");
		}

		// Prevent bulk operations on system pages
		if (action === "delete") {
			const systemSlugs = slugs.filter((s) => SYSTEM_PAGES.includes(s));
			if (systemSlugs.length > 0) {
				return apiError("VALIDATION_ERROR", "Cannot delete system pages");
			}
		}

		const db = await getDb();
		const now = new Date().toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");

		switch (action) {
			case "publish":
				await db.update(pages).set({ published: true, updatedAt: now }).where(inArray(pages.slug, slugs));
				break;
			case "unpublish": {
				// Don't unpublish system pages
				const nonSystemSlugs = slugs.filter((s) => !SYSTEM_PAGES.includes(s));
				if (nonSystemSlugs.length > 0) {
					await db.update(pages).set({ published: false, updatedAt: now }).where(inArray(pages.slug, nonSystemSlugs));
				}
				break;
			}
			case "delete": {
				await db.delete(pages).where(inArray(pages.slug, slugs));
				break;
			}
			default:
				return apiError("VALIDATION_ERROR", "Action must be one of: publish, unpublish, delete");
		}

		return apiSuccess({ action, count: slugs.length });
	} catch {
		return apiError("INTERNAL_ERROR", "Bulk operation failed");
	}
}
