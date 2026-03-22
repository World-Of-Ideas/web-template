import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { updatePost, deletePost } from "@/lib/blog";
import { validatePostUpdateBody } from "@/lib/validation";
import { ogKeys } from "@/lib/og";
import { enqueueEmail } from "@/lib/queue";

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}
	if (!(await getSiteSettingsDirect()).features.blog) {
		return apiError("NOT_FOUND", "Blog feature is not enabled");
	}

	try {
		const { id } = await params;
		const numId = Number(id);
		if (!Number.isInteger(numId) || numId <= 0) return apiError("VALIDATION_ERROR", "Invalid post ID");
		const body = await request.json();
		const bodyError = validatePostUpdateBody(body);
		if (bodyError) return apiError("VALIDATION_ERROR", bodyError);
		try {
			const post = await updatePost(numId, body as Parameters<typeof updatePost>[1]);

			// Queue OG image regeneration (fire-and-forget)
			try {
				const { getEnv } = await import("@/db");
				const env = await getEnv();
				await enqueueEmail((env as unknown as Record<string, unknown>).EMAIL_QUEUE as Queue, { type: "og_post", payload: { slug: post.slug } });
			} catch {
				// OG generation is best-effort
			}

			return apiSuccess(post);
		} catch (err) {
			if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
				return apiError("VALIDATION_ERROR", "A post with this slug already exists");
			}
			throw err;
		}
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to update post");
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}
	if (!(await getSiteSettingsDirect()).features.blog) {
		return apiError("NOT_FOUND", "Blog feature is not enabled");
	}

	try {
		const { id } = await params;
		const numId = Number(id);
		if (!Number.isInteger(numId) || numId <= 0) return apiError("VALIDATION_ERROR", "Invalid post ID");
		const deletedSlug = await deletePost(numId);

		// Clean up R2 assets for deleted post (fire-and-forget)
		if (deletedSlug) {
			try {
				const { getEnv } = await import("@/db");
				const env = await getEnv();
				const bucket = (env as unknown as Record<string, unknown>).ASSETS_BUCKET as R2Bucket;
				const listed = await bucket.list({ prefix: `blog/${deletedSlug}/` });
				if (listed.objects.length > 0) {
					await bucket.delete(listed.objects.map((o) => o.key));
				}
				// Also delete the OG image
				await bucket.delete(ogKeys.post(deletedSlug));
			} catch {
				// R2 cleanup is best-effort
			}
		}

		return apiSuccess({ success: true });
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to delete post");
	}
}
