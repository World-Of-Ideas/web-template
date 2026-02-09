import { NextRequest } from "next/server";
import { apiSuccess, apiError, getClientIp } from "@/lib/api";
import { search } from "@/lib/search";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
	const ip = getClientIp(request);
	if (!checkRateLimit(`search:${ip}`, 30, 60 * 1000)) {
		return apiError("RATE_LIMITED", "Too many requests. Please try again later.");
	}

	const q = request.nextUrl.searchParams.get("q") ?? "";

	if (q.length < 2) {
		return apiError("VALIDATION_ERROR", "Query must be at least 2 characters");
	}

	if (q.length > 200) {
		return apiError("VALIDATION_ERROR", "Query is too long");
	}

	const results = await search(q);

	return apiSuccess(results);
}
