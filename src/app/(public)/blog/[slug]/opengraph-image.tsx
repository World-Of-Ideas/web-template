import { getEnv } from "@/db";
import { getOgImage, ogKeys } from "@/lib/og";

export const alt = "Blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	try {
		const { slug } = await params;
		const env = await getEnv();
		const bucket = (env as unknown as Record<string, unknown>).ASSETS_BUCKET as R2Bucket;
		const cached = await getOgImage(bucket, ogKeys.post(slug));
		if (cached) return cached;
	} catch {
		// R2 unavailable — fall through
	}
	return new Response(null, { status: 302, headers: { Location: "/icon.svg" } });
}
