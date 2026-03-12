import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { getDb } from "@/db";
import { subscribers } from "@/db/schema";
import { generateReferralCode } from "@/lib/referral";
import { isValidEmail } from "@/lib/validation";

/** Parse a single CSV line respecting quoted fields (RFC 4180). */
function parseCsvLine(line: string): string[] {
	const fields: string[] = [];
	let current = "";
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (inQuotes) {
			if (ch === '"' && line[i + 1] === '"') {
				current += '"';
				i++; // skip escaped quote
			} else if (ch === '"') {
				inQuotes = false;
			} else {
				current += ch;
			}
		} else if (ch === '"') {
			inQuotes = true;
		} else if (ch === ",") {
			fields.push(current.trim());
			current = "";
		} else {
			current += ch;
		}
	}
	fields.push(current.trim());
	return fields;
}

function parseCsv(text: string): { email: string; name: string }[] {
	const lines = text.split(/\r?\n/).filter((line) => line.trim());
	if (lines.length < 2) return []; // need header + at least 1 row

	const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
	const emailIdx = header.indexOf("email");
	const nameIdx = header.indexOf("name");
	if (emailIdx === -1 || nameIdx === -1) return [];

	return lines.slice(1).map((line) => {
		const cols = parseCsvLine(line);
		return { email: cols[emailIdx] ?? "", name: cols[nameIdx] ?? "" };
	});
}

export async function POST(request: NextRequest) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}
	if (!(await getSiteSettingsDirect()).features.waitlist) {
		return apiError("NOT_FOUND", "Waitlist feature is not enabled");
	}

	try {
		const formData = await request.formData();
		const file = formData.get("file");
		if (!file || !(file instanceof File)) {
			return apiError("VALIDATION_ERROR", "CSV file is required");
		}
		if (file.size > 1024 * 1024) {
			return apiError("VALIDATION_ERROR", "File too large (max 1MB)");
		}

		const text = await file.text();
		const rows = parseCsv(text);
		if (rows.length === 0) {
			return apiError(
				"VALIDATION_ERROR",
				"No valid rows found. CSV must have email and name columns.",
			);
		}
		if (rows.length > 1000) {
			return apiError("VALIDATION_ERROR", "Too many rows (max 1000)");
		}

		const errors: string[] = [];
		const validRows: { email: string; name: string; referralCode: string }[] = [];

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			if (!row.email || !isValidEmail(row.email)) {
				errors.push(`Row ${i + 2}: invalid or missing email`);
				continue;
			}
			if (!row.name) {
				errors.push(`Row ${i + 2}: missing name`);
				continue;
			}
			validRows.push({ email: row.email, name: row.name, referralCode: generateReferralCode() });
		}

		// Pre-calculate start position, then batch insert with increments
		const db = await getDb();
		const [{ maxPos }] = await db.select({
			maxPos: sql<number>`COALESCE(MAX(${subscribers.position}), 0)`,
		}).from(subscribers);
		let nextPos = maxPos + 1;

		let imported = 0;
		const BATCH_SIZE = 50;
		for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
			const batch = validRows.slice(i, i + BATCH_SIZE);
			const batchStart = nextPos;
			const results = await db.insert(subscribers).values(
				batch.map((row, idx) => ({
					email: row.email,
					name: row.name,
					referralCode: row.referralCode,
					position: batchStart + idx,
				})),
			).onConflictDoNothing({ target: subscribers.email }).returning({ id: subscribers.id });
			imported += results.length;
			nextPos = batchStart + batch.length;
		}

		const skipped = validRows.length - imported;
		return apiSuccess({ imported, skipped, errors: errors.slice(0, 20) });
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to import subscribers");
	}
}
