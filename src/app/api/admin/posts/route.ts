import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { getAllPostSummaries, createPost } from "@/lib/blog";
import { validatePostBody } from "@/lib/validation";
import { enqueueEmail } from "@/lib/queue";

export async function GET() {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}
	if (!(await getSiteSettingsDirect()).features.blog) {
		return apiError("NOT_FOUND", "Blog feature is not enabled");
	}

	const posts = await getAllPostSummaries();
	return apiSuccess(posts);
}

export async function POST(request: NextRequest) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}
	if (!(await getSiteSettingsDirect()).features.blog) {
		return apiError("NOT_FOUND", "Blog feature is not enabled");
	}

	try {
		const body = await request.json();
		const bodyError = validatePostBody(body);
		if (bodyError) return apiError("VALIDATION_ERROR", bodyError);
		const post = await createPost(body as Parameters<typeof createPost>[0]);

		// Queue OG image generation (fire-and-forget)
		try {
			const { getEnv } = await import("@/db");
			const env = await getEnv();
			await enqueueEmail((env as unknown as Record<string, unknown>).EMAIL_QUEUE as Queue, { type: "og_post", payload: { slug: post.slug } });
		} catch {
			// OG generation is best-effort
		}

		return apiSuccess(post, 201);
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to create post");
	}
}
