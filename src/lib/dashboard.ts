import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { subscribers, contactSubmissions } from "@/db/schema";

/** Get daily signup counts for the last N days */
export async function getSignupTrend(days: number = 30) {
	const db = await getDb();
	const safeDays = Math.min(Math.max(Math.round(days), 1), 365);
	const results = await db.all(
		sql`SELECT date(created_at) AS date, COUNT(*) AS count
			FROM ${subscribers}
			WHERE created_at >= datetime('now', ${`-${safeDays} days`})
			AND status = 'active'
			GROUP BY date(created_at)
			ORDER BY date ASC`,
	);
	return results as { date: string; count: number }[];
}

/** Get daily contact submission counts for the last N days */
export async function getContactTrend(days: number = 30) {
	const db = await getDb();
	const results = await db.all(
		sql`SELECT date(created_at) AS date, COUNT(*) AS count
			FROM ${contactSubmissions}
			WHERE created_at >= datetime('now', ${`-${days} days`})
			GROUP BY date(created_at)
			ORDER BY date ASC`,
	);
	return results as { date: string; count: number }[];
}

/** Get referral stats: top referrers by referral count */
export async function getTopReferrers(limit: number = 5) {
	const db = await getDb();
	const results = await db.all(
		sql`SELECT name, email, referral_count AS referralCount, referral_code AS referralCode
			FROM ${subscribers}
			WHERE referral_count > 0
			ORDER BY referral_count DESC
			LIMIT ${limit}`,
	);
	return results as { name: string; email: string; referralCount: number; referralCode: string }[];
}
