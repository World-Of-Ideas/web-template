import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { getCampaignById, updateCampaign, deleteCampaign } from "@/lib/campaigns";
import { validateCampaignUpdateBody } from "@/lib/validation";

async function requireWaitlistFeature() {
	return (await getSiteSettingsDirect()).features.waitlist;
}

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}
	if (!(await requireWaitlistFeature())) {
		return apiError("NOT_FOUND", "Feature not available");
	}

	const { id } = await params;
	const numId = Number(id);
	if (!Number.isInteger(numId) || numId <= 0) return apiError("VALIDATION_ERROR", "Invalid campaign ID");

	const campaign = await getCampaignById(numId);
	if (!campaign) return apiError("NOT_FOUND", "Campaign not found");

	return apiSuccess(campaign);
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}
	if (!(await requireWaitlistFeature())) {
		return apiError("NOT_FOUND", "Feature not available");
	}

	try {
		const { id } = await params;
		const numId = Number(id);
		if (!Number.isInteger(numId) || numId <= 0) return apiError("VALIDATION_ERROR", "Invalid campaign ID");

		const campaign = await getCampaignById(numId);
		if (!campaign) return apiError("NOT_FOUND", "Campaign not found");
		if (campaign.status !== "draft") return apiError("VALIDATION_ERROR", "Only draft campaigns can be edited");

		const body = await request.json();
		const bodyError = validateCampaignUpdateBody(body);
		if (bodyError) return apiError("VALIDATION_ERROR", bodyError);

		const b = body as Record<string, unknown>;
		const updateData: { subject?: string; body?: string } = {};
		if (typeof b.subject === "string") updateData.subject = b.subject;
		if (typeof b.body === "string") updateData.body = b.body;

		await updateCampaign(numId, updateData);
		return apiSuccess({ success: true });
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to update campaign");
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}
	if (!(await requireWaitlistFeature())) {
		return apiError("NOT_FOUND", "Feature not available");
	}

	try {
		const { id } = await params;
		const numId = Number(id);
		if (!Number.isInteger(numId) || numId <= 0) return apiError("VALIDATION_ERROR", "Invalid campaign ID");

		const campaign = await getCampaignById(numId);
		if (!campaign) return apiError("NOT_FOUND", "Campaign not found");
		if (campaign.status !== "draft") return apiError("VALIDATION_ERROR", "Only draft campaigns can be deleted");

		await deleteCampaign(numId);
		return apiSuccess({ success: true });
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to delete campaign");
	}
}
