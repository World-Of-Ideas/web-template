import { getEnv } from "@/db";
import { getPublicUrl } from "@/lib/r2";

export interface R2Asset {
	key: string;
	size: number;
	uploaded: string;
	contentType?: string;
}

/** List R2 assets with optional prefix. Returns up to 500 objects. */
export async function listAssets(prefix?: string): Promise<R2Asset[]> {
	const env = await getEnv();
	const listed = await env.ASSETS_BUCKET.list({
		prefix: prefix || undefined,
		limit: 500,
	});
	return listed.objects.map((obj) => ({
		key: obj.key,
		size: obj.size,
		uploaded: obj.uploaded.toISOString(),
		contentType: obj.httpMetadata?.contentType ?? undefined,
	}));
}

/** Delete an asset from R2. */
export async function deleteAsset(key: string): Promise<void> {
	const env = await getEnv();
	await env.ASSETS_BUCKET.delete(key);
}

/** Get the public URL for an R2 asset. */
export async function getAssetPublicUrl(key: string): Promise<string> {
	const env = await getEnv();
	return getPublicUrl(env.R2_PUBLIC_URL, key);
}
