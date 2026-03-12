import { desc } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { getDb } from "@/db";
import { subscribers } from "@/db/schema";

const MAX_ROWS = 5_000;

export async function GET() {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	const settings = await getSiteSettingsDirect();
	if (!settings.features.waitlist) {
		return apiError("NOT_FOUND", "Waitlist feature is not enabled");
	}

	const db = await getDb();
	const rows = await db.select({
		name: subscribers.name,
		email: subscribers.email,
		referralCode: subscribers.referralCode,
		referredBy: subscribers.referredBy,
		referralCount: subscribers.referralCount,
		position: subscribers.position,
		status: subscribers.status,
		source: subscribers.source,
		createdAt: subscribers.createdAt,
	}).from(subscribers).orderBy(desc(subscribers.createdAt)).limit(MAX_ROWS);

	return apiSuccess({ rows });
}
