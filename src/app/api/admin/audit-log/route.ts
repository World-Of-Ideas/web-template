import { NextRequest } from "next/server";
import { apiSuccess, apiError, clampInt } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	const page = clampInt(request.nextUrl.searchParams.get("page"), 1, 1, 1000);
	const limit = clampInt(request.nextUrl.searchParams.get("limit"), 50, 1, 100);

	const result = await getAuditLog(page, limit);

	return apiSuccess(result);
}
