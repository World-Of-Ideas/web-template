import { desc } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { getDb } from "@/db";
import { contactSubmissions } from "@/db/schema";

const MAX_ROWS = 5_000;

export async function GET() {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	const settings = await getSiteSettingsDirect();
	if (!settings.features.contact) {
		return apiError("NOT_FOUND", "Contact feature is not enabled");
	}

	const db = await getDb();
	const rows = await db.select({
		name: contactSubmissions.name,
		email: contactSubmissions.email,
		message: contactSubmissions.message,
		source: contactSubmissions.source,
		createdAt: contactSubmissions.createdAt,
	}).from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt)).limit(MAX_ROWS);

	return apiSuccess({ rows });
}
