import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { duplicatePost } from "@/lib/blog";
import { enqueueEmail } from "@/lib/queue";

export async function POST(
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
    if (!Number.isInteger(numId) || numId <= 0) {
      return apiError("VALIDATION_ERROR", "Invalid post ID");
    }

    const post = await duplicatePost(numId);
    if (!post) {
      return apiError("NOT_FOUND", "Post not found");
    }

    // Queue OG image generation (fire-and-forget)
    try {
      const { getEnv } = await import("@/db");
      const env = await getEnv();
      await enqueueEmail((env as unknown as Record<string, unknown>).EMAIL_QUEUE as Queue, { type: "og_post", payload: { slug: post.slug } });
    } catch {
      // OG generation is best-effort
    }

    return apiSuccess(post, 201);
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
      return apiError("VALIDATION_ERROR", "Could not generate unique slug for duplicate");
    }
    return apiError("INTERNAL_ERROR", "Failed to duplicate post");
  }
}
