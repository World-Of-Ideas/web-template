import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAllPageSummaries, createPage, isReservedSlug } from "@/lib/pages";
import { validatePageBody } from "@/lib/validation";
import { enqueueEmail } from "@/lib/queue";

export async function GET() {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	const pages = await getAllPageSummaries();
	return apiSuccess(pages);
}

export async function POST(request: NextRequest) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	try {
		const body = await request.json();
		const bodyError = validatePageBody(body);
		if (bodyError) return apiError("VALIDATION_ERROR", bodyError);
		const { slug } = body as Parameters<typeof createPage>[0];

		if (isReservedSlug(slug)) {
			return apiError("VALIDATION_ERROR", `Slug "${slug}" is reserved`);
		}

		const page = await createPage(body as Parameters<typeof createPage>[0]);

		// Queue OG image generation (fire-and-forget)
		try {
			const { getEnv } = await import("@/db");
			const env = await getEnv();
			await enqueueEmail((env as unknown as Record<string, unknown>).EMAIL_QUEUE as Queue, { type: "og_page", payload: { slug: page.slug } });
		} catch {
			// OG generation is best-effort
		}

		return apiSuccess(page, 201);
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to create page");
	}
}
