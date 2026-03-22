import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { requireAdminSession } from "@/lib/admin-auth";
import { getWebhooks, createWebhook } from "@/lib/webhooks";
import { isSafeUrl } from "@/lib/utils";

const VALID_EVENTS = [
	"waitlist.signup",
	"newsletter.signup",
	"giveaway.entry",
	"contact.submission",
];

export async function GET() {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	const hooks = await getWebhooks();
	return apiSuccess(hooks);
}

export async function POST(request: NextRequest) {
	if (!(await requireAdminSession())) {
		return apiError("UNAUTHORIZED", "Not authenticated");
	}

	try {
		const body = await request.json();
		if (!body || typeof body !== "object") {
			return apiError("VALIDATION_ERROR", "Invalid body");
		}

		const { url, events } = body as { url?: string; events?: string[] };

		if (!url || typeof url !== "string") {
			return apiError("VALIDATION_ERROR", "URL is required");
		}
		if (url.length > 2000) {
			return apiError("VALIDATION_ERROR", "URL is too long");
		}
		if (!url.toLowerCase().startsWith("https://") || !isSafeUrl(url)) {
			return apiError("VALIDATION_ERROR", "URL must be a valid HTTPS URL");
		}
		if (!Array.isArray(events) || events.length === 0) {
			return apiError("VALIDATION_ERROR", "At least one event is required");
		}
		if (events.some((e) => typeof e !== "string" || !VALID_EVENTS.includes(e))) {
			return apiError("VALIDATION_ERROR", "Invalid event type");
		}

		// Generate a random secret
		const secretBytes = new Uint8Array(32);
		crypto.getRandomValues(secretBytes);
		const secret = Array.from(secretBytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		const webhook = await createWebhook({ url, events, secret });
		return apiSuccess(webhook, 201);
	} catch {
		return apiError("INTERNAL_ERROR", "Failed to create webhook");
	}
}
