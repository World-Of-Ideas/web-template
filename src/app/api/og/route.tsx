import { NextRequest } from "next/server";
import { getEnv } from "@/db";
import { getOgImage, ogKeys } from "@/lib/og";

export async function GET(request: NextRequest) {
	const slug = request.nextUrl.searchParams.get("slug");
	if (!slug) {
		return new Response(null, { status: 404 });
	}

	try {
		const env = await getEnv();
		const bucket = (env as unknown as Record<string, unknown>).ASSETS_BUCKET as R2Bucket;
		const cached = await getOgImage(bucket, ogKeys.page(slug));
		if (cached) return cached;
	} catch {
		// R2 unavailable — fall through
	}
	return new Response(null, { status: 302, headers: { Location: "/icon.svg" } });
}
