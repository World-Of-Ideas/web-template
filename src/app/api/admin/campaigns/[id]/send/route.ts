import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import {
	getCampaignById,
	getActiveSubscriberEmails,
	markCampaignSending,
	markCampaignSent,
	markCampaignFailed,
} from "@/lib/campaigns";
import { getEnv } from "@/db";
import { enqueueEmailBatch } from "@/lib/queue";
import type { EmailJob } from "@/lib/queue";

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	const { id } = await params;
	const numId = Number(id);
	if (!Number.isInteger(numId) || numId <= 0) return apiError("VALIDATION_ERROR", "Invalid campaign ID");

	const campaign = await getCampaignById(numId);
	if (!campaign) return apiError("NOT_FOUND", "Campaign not found");
	if (campaign.status !== "draft") {
		return apiError("VALIDATION_ERROR", "Campaign has already been sent or is sending");
	}

	try {
		const emails = await getActiveSubscriberEmails();
		if (emails.length === 0) {
			return apiError("VALIDATION_ERROR", "No active subscribers to send to");
		}

		await markCampaignSending(numId, emails.length);

		const env = await getEnv();
		const jobs: EmailJob[] = emails.map((email) => ({
			type: "campaign_email" as const,
			payload: {
				to: email,
				subject: campaign.subject,
				html: campaign.body,
			},
		}));

		await enqueueEmailBatch(env.EMAIL_QUEUE, jobs);
		await markCampaignSent(numId);

		return apiSuccess({ sent: emails.length, total: emails.length });
	} catch {
		await markCampaignFailed(numId);
		return apiError("INTERNAL_ERROR", "Failed to send campaign");
	}
}
