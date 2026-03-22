import { getEnv } from "@/db";
import { getOgImage, ogKeys } from "@/lib/og";

export const alt = "Site image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
	try {
		const env = await getEnv();
		const bucket = (env as unknown as Record<string, unknown>).ASSETS_BUCKET as R2Bucket;
		const cached = await getOgImage(bucket, ogKeys.site());
		if (cached) return cached;
	} catch {
		// R2 unavailable — fall through
	}
	// No pre-generated image; return a minimal dark placeholder
	return new Response(null, { status: 302, headers: { Location: "/icon.svg" } });
}
