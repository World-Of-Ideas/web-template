const ALLOWED_TYPES = new Set(["image/webp", "image/png", "image/jpeg", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateUpload(file: File): string | null {
	if (!ALLOWED_TYPES.has(file.type)) {
		return "Invalid file type. Only WebP, PNG, JPEG, and GIF are allowed.";
	}
	if (file.size > MAX_SIZE) {
		return "File too large. Maximum size is 5 MB.";
	}
	return null;
}

export async function uploadToR2(
	bucket: R2Bucket,
	key: string,
	file: File,
): Promise<void> {
	const arrayBuffer = await file.arrayBuffer();
	await bucket.put(key, arrayBuffer, {
		httpMetadata: { contentType: file.type },
	});
}

export function getPublicUrl(r2PublicUrl: string, key: string): string {
	return `${r2PublicUrl}/${key}`;
}

/** Strip localhost origin from image URLs so next/image treats them as local paths */
export function normalizeImageSrc(url: string): string {
	if (url.startsWith("http://localhost")) {
		try {
			return new URL(url).pathname;
		} catch {
			return url;
		}
	}
	return url;
}

export async function deleteFromR2(bucket: R2Bucket, key: string): Promise<void> {
	await bucket.delete(key);
}
