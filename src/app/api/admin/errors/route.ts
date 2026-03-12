import { NextRequest } from "next/server";
import { apiSuccess, apiError, clampInt } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getErrorLog, cleanupErrorLog } from "@/lib/error-tracking";

export async function GET(request: NextRequest) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	const { searchParams } = new URL(request.url);
	const page = clampInt(searchParams.get("page"), 1, 1, 1000);
	const limit = clampInt(searchParams.get("limit"), 50, 1, 100);
	const result = await getErrorLog(page, limit);
	return apiSuccess(result);
}

export async function DELETE() {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	await cleanupErrorLog(30);
	return apiSuccess({ cleaned: true });
}
