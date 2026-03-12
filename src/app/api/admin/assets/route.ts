import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { listAssets, deleteAsset } from "@/lib/assets";

export async function GET(request: NextRequest) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	const { searchParams } = new URL(request.url);
	const prefix = searchParams.get("prefix") || undefined;

	// Validate prefix if provided
	if (prefix !== undefined) {
		if (prefix.length > 200) {
			return apiError("VALIDATION_ERROR", "Prefix is too long");
		}
		if (prefix.includes("..")) {
			return apiError("VALIDATION_ERROR", "Invalid prefix");
		}
	}

	try {
		const assets = await listAssets(prefix);
		return apiSuccess(assets);
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to list assets");
	}
}

export async function DELETE(request: NextRequest) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	try {
		const body = await request.json();
		if (!body || typeof body !== "object") {
			return apiError("VALIDATION_ERROR", "Invalid body");
		}
		const { key } = body as { key?: string };
		if (!key || typeof key !== "string") {
			return apiError("VALIDATION_ERROR", "Key is required");
		}
		if (key.length > 500) {
			return apiError("VALIDATION_ERROR", "Key is too long");
		}
		if (key.includes("..")) {
			return apiError("VALIDATION_ERROR", "Invalid key");
		}

		await deleteAsset(key);
		return apiSuccess({ deleted: true });
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to delete asset");
	}
}
