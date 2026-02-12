import { NextRequest } from "next/server";
import { getEnv } from "@/db";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { validateUpload, validateMagicBytes, uploadToR2, getPublicUrl } from "@/lib/r2";
import { validateR2Path } from "@/lib/validation";

export async function POST(request: NextRequest) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	try {
		const contentLength = request.headers.get("content-length");
		if (contentLength && Number(contentLength) > 6 * 1024 * 1024) {
			return apiError("VALIDATION_ERROR", "Request too large");
		}

		const formData = await request.formData();
		const file = formData.get("file") as File | null;
		const path = formData.get("path") as string | null;

		if (!file) {
			return apiError("VALIDATION_ERROR", "File is required");
		}

		const validationError = validateUpload(file);
		if (validationError) {
			return apiError("VALIDATION_ERROR", validationError);
		}

		// Verify file content matches claimed MIME type
		const buffer = await file.arrayBuffer();
		if (!validateMagicBytes(buffer, file.type)) {
			return apiError("VALIDATION_ERROR", "File content does not match declared type");
		}

		const ALLOWED_UPLOAD_PREFIXES = ["blog/", "uploads/", "og/"];

		let key: string;
		if (path) {
			const pathError = validateR2Path(path);
			if (pathError) {
				return apiError("VALIDATION_ERROR", pathError);
			}
			if (!ALLOWED_UPLOAD_PREFIXES.some((p) => path.startsWith(p))) {
				return apiError("VALIDATION_ERROR", "Upload path must start with blog/, uploads/, or og/");
			}
			key = path;
		} else {
			// Sanitize filename: allow only alphanumeric, dots, hyphens, underscores
			const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
			key = `uploads/${crypto.randomUUID()}/${safeName}`;
		}

		const env = await getEnv();

		await uploadToR2(env.ASSETS_BUCKET, key, file, buffer);
		const url = getPublicUrl(env.R2_PUBLIC_URL, key);

		return apiSuccess({ url, key }, 201);
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to upload file");
	}
}
