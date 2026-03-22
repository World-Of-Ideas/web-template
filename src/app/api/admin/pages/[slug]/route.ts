import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { updatePage, deletePage, isSystemPage } from "@/lib/pages";
import { validatePageBody } from "@/lib/validation";
import { ogKeys } from "@/lib/og";
import { enqueueEmail } from "@/lib/queue";

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	try {
		const { slug } = await params;
		const body = await request.json();
		const bodyError = validatePageBody(body, false);
		if (bodyError) return apiError("VALIDATION_ERROR", bodyError);
		// Strip slug from body — slug is the PK and must not be changed via update
		const { slug: _ignoredSlug, ...safeBody } = body as Record<string, unknown>;

		if (isSystemPage(slug) && (safeBody as Record<string, unknown>).published === false) {
			return apiError("VALIDATION_ERROR", "System pages cannot be unpublished");
		}
		const page = await updatePage(slug, safeBody as Parameters<typeof updatePage>[1]);

		// Queue OG image regeneration (fire-and-forget)
		try {
			const { getEnv } = await import("@/db");
			const env = await getEnv();
			await enqueueEmail((env as unknown as Record<string, unknown>).EMAIL_QUEUE as Queue, { type: "og_page", payload: { slug: page.slug } });
		} catch {
			// OG generation is best-effort
		}

		return apiSuccess(page);
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to update page");
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> },
) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	try {
		const { slug } = await params;

		if (isSystemPage(slug)) {
			return apiError("VALIDATION_ERROR", "System pages cannot be deleted");
		}

		await deletePage(slug);

		// Clean up OG image (fire-and-forget)
		try {
			const { getEnv } = await import("@/db");
			const env = await getEnv();
			const bucket = (env as unknown as Record<string, unknown>).ASSETS_BUCKET as R2Bucket;
			await bucket.delete(ogKeys.page(slug));
		} catch {
			// OG cleanup is best-effort
		}

		return apiSuccess({ success: true });
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to delete page");
	}
}
