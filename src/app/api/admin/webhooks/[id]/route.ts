import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getWebhookById, updateWebhook, deleteWebhook } from "@/lib/webhooks";
import { isSafeUrl } from "@/lib/utils";

const VALID_EVENTS = [
	"waitlist.signup",
	"newsletter.signup",
	"giveaway.entry",
	"contact.submission",
];

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	try {
		const { id } = await params;
		const numId = Number(id);
		if (!Number.isInteger(numId) || numId <= 0) {
			return apiError("VALIDATION_ERROR", "Invalid webhook ID");
		}

		const existing = await getWebhookById(numId);
		if (!existing) {
			return apiError("NOT_FOUND", "Webhook not found");
		}

		const body = await request.json();
		if (!body || typeof body !== "object") {
			return apiError("VALIDATION_ERROR", "Invalid body");
		}

		const { url, events, active } = body as {
			url?: string;
			events?: string[];
			active?: boolean;
		};

		const updates: Record<string, unknown> = {};

		if (url !== undefined) {
			if (typeof url !== "string" || !url) {
				return apiError("VALIDATION_ERROR", "URL must be a non-empty string");
			}
			if (url.length > 2000) {
				return apiError("VALIDATION_ERROR", "URL is too long");
			}
			if (!url.toLowerCase().startsWith("https://") || !isSafeUrl(url)) {
				return apiError("VALIDATION_ERROR", "URL must be a valid HTTPS URL");
			}
			updates.url = url;
		}

		if (events !== undefined) {
			if (!Array.isArray(events) || events.length === 0) {
				return apiError("VALIDATION_ERROR", "At least one event is required");
			}
			if (events.some((e: string) => typeof e !== "string" || !VALID_EVENTS.includes(e))) {
				return apiError("VALIDATION_ERROR", "Invalid event type");
			}
			updates.events = events;
		}

		if (active !== undefined) {
			if (typeof active !== "boolean") {
				return apiError("VALIDATION_ERROR", "Active must be a boolean");
			}
			updates.active = active;
		}

		const webhook = await updateWebhook(
			numId,
			updates as Parameters<typeof updateWebhook>[1],
		);
		if (!webhook) {
			return apiError("NOT_FOUND", "Webhook not found");
		}
		return apiSuccess(webhook);
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to update webhook");
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	try {
		const { id } = await params;
		const numId = Number(id);
		if (!Number.isInteger(numId) || numId <= 0) {
			return apiError("VALIDATION_ERROR", "Invalid webhook ID");
		}
		await deleteWebhook(numId);
		return apiSuccess({ success: true });
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to delete webhook");
	}
}
