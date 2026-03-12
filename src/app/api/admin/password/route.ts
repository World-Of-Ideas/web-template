import { NextRequest } from "next/server";
import { getEnv } from "@/db";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { verifyPassword } from "@/lib/admin";

export async function POST(request: NextRequest) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	try {
		let body;
		try {
			body = await request.json();
		} catch {
			return apiError("VALIDATION_ERROR", "Invalid JSON");
		}

		const { currentPassword } = body as { currentPassword?: string };

		if (
			!currentPassword ||
			typeof currentPassword !== "string" ||
			currentPassword.length > 1000
		) {
			return apiError("VALIDATION_ERROR", "Current password is required");
		}

		const env = await getEnv();
		const adminPw = env.ADMIN_PASSWORD;
		if (!adminPw || typeof adminPw !== "string") {
			return apiError("INTERNAL_ERROR", "Server configuration error");
		}

		const isValid = await verifyPassword(currentPassword, adminPw);

		if (!isValid) {
			return apiError("UNAUTHORIZED", "Current password is incorrect");
		}

		return apiSuccess({
			verified: true,
			message:
				"Password verified. To change the admin password, run: wrangler secret put ADMIN_PASSWORD --env <uat|prod>",
		});
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to verify password");
	}
}
