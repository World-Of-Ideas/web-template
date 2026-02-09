import { NextRequest } from "next/server";
import { apiSuccess, apiError, clampInt } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getSubscribers } from "@/lib/waitlist";

export async function GET(request: NextRequest) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	const page = clampInt(request.nextUrl.searchParams.get("page"), 1, 1, 10000);
	const limit = clampInt(request.nextUrl.searchParams.get("limit"), 20, 1, 100);

	const { items, total } = await getSubscribers(page, limit);

	return apiSuccess({
		subscribers: items,
		pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
	});
}
