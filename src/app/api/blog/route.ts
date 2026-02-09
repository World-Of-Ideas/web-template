import { NextRequest } from "next/server";
import { siteConfig } from "@/config/site";
import { apiSuccess, apiError, clampInt } from "@/lib/api";
import { getPublishedPosts } from "@/lib/blog";

export async function GET(request: NextRequest) {
	if (!siteConfig.features.blog) {
		return apiError("NOT_FOUND", "Blog is not available");
	}

	const page = clampInt(request.nextUrl.searchParams.get("page"), 1, 1, 10000);
	const limit = clampInt(request.nextUrl.searchParams.get("limit"), 12, 1, 100);

	const { items, total } = await getPublishedPosts(page, limit);

	return apiSuccess({
		posts: items,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	});
}
