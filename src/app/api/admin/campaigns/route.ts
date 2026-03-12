import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { getCampaigns, createCampaign } from "@/lib/campaigns";
import { validateCampaignBody } from "@/lib/validation";

export async function GET() {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}
	if (!(await getSiteSettingsDirect()).features.waitlist) {
		return apiError("NOT_FOUND", "Feature not available");
	}

	const campaigns = await getCampaigns();
	return apiSuccess(campaigns);
}

export async function POST(request: NextRequest) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}
	if (!(await getSiteSettingsDirect()).features.waitlist) {
		return apiError("NOT_FOUND", "Feature not available");
	}

	try {
		const body = await request.json();
		const bodyError = validateCampaignBody(body);
		if (bodyError) return apiError("VALIDATION_ERROR", bodyError);
		const campaign = await createCampaign(body as { subject: string; body: string });
		return apiSuccess(campaign, 201);
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to create campaign");
	}
}
