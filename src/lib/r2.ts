const ALLOWED_TYPES = new Set(["image/webp", "image/png", "image/jpeg", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Magic byte signatures for allowed image types
const MAGIC_BYTES: [string, number[]][] = [
	["image/png", [0x89, 0x50, 0x4e, 0x47]],
	["image/jpeg", [0xff, 0xd8, 0xff]],
	["image/gif", [0x47, 0x49, 0x46, 0x38]],
	["image/webp", [0x52, 0x49, 0x46, 0x46]], // RIFF header (first 4 bytes; "WEBP" at 8-11 checked separately)
];

export function validateUpload(file: File): string | null {
	if (!ALLOWED_TYPES.has(file.type)) {
		return "Invalid file type. Only WebP, PNG, JPEG, and GIF are allowed.";
	}
	if (file.size > MAX_SIZE) {
		return "File too large. Maximum size is 5 MB.";
	}
	return null;
}

/** Validate file content matches claimed MIME type by checking magic bytes. */
export function validateMagicBytes(buffer: ArrayBuffer, claimedType: string): boolean {
	const bytes = new Uint8Array(buffer);
	if (bytes.length < 4) return false;

	for (const [mimeType, signature] of MAGIC_BYTES) {
		if (claimedType === mimeType) {
			const primaryMatch = signature.every((byte, i) => bytes[i] === byte);
			if (!primaryMatch) return false;
			// WebP: additionally verify "WEBP" at bytes 8-11
			if (mimeType === "image/webp") {
				if (bytes.length < 12) return false;
				return bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
			}
			return true;
		}
	}
	return false;
}

export async function uploadToR2(
	bucket: R2Bucket,
	key: string,
	file: File,
	preReadBuffer?: ArrayBuffer,
): Promise<void> {
	const arrayBuffer = preReadBuffer ?? await file.arrayBuffer();
	await bucket.put(key, arrayBuffer, {
		httpMetadata: { contentType: file.type },
	});
}

export function getPublicUrl(r2PublicUrl: string, key: string): string {
	return `${r2PublicUrl.replace(/\/$/, "")}/${key}`;
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
