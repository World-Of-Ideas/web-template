import { NextRequest } from "next/server";
import { getEnv } from "@/db";
import { apiSuccess, apiError, getClientIp } from "@/lib/api";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createContactSubmission } from "@/lib/contact";
import { enqueueEmail } from "@/lib/queue";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendMetaConversionEvent, sendGaConversionEvent } from "@/lib/tracking";
import { isValidEmail, safeParseJson, validateLength } from "@/lib/validation";
import { fireWebhooks } from "@/lib/webhooks";

export async function POST(request: NextRequest) {
	if (!(await getSiteSettingsDirect()).features.contact) {
		return apiError("NOT_FOUND", "Resource not found");
	}

	const ip = getClientIp(request);
	if (!checkRateLimit(`contact:${ip}`, 3, 60 * 1000)) {
		return apiError("RATE_LIMITED", "Too many requests. Please try again later.");
	}

	const body = await safeParseJson(request);
	if (!body || typeof body !== "object") {
		return apiError("VALIDATION_ERROR", "Invalid JSON");
	}

	try {
		const { name, email, message, turnstileToken, source } = body as {
			name?: string;
			email?: string;
			message?: string;
			turnstileToken?: string;
			source?: string;
		};

		if (!name || !email || !message) {
			return apiError("VALIDATION_ERROR", "Name, email, and message are required");
		}

		if (!isValidEmail(email)) {
			return apiError("VALIDATION_ERROR", "Invalid email format");
		}

		const lengthErr =
			validateLength(name, "Name", 100) ??
			validateLength(message, "Message", 5000) ??
			validateLength(source, "Source", 255);
		if (lengthErr) {
			return apiError("VALIDATION_ERROR", lengthErr);
		}

		if (!turnstileToken) {
			return apiError("VALIDATION_ERROR", "Turnstile token is required");
		}

		const env = await getEnv();
		const isValid = await verifyTurnstileToken(turnstileToken, env.TURNSTILE_SECRET_KEY);
		if (!isValid) {
			return apiError("TURNSTILE_FAILED", "Turnstile verification failed");
		}

		await createContactSubmission({ name, email, message, source });

		// Queue notification email
		try {
			await enqueueEmail(env.EMAIL_QUEUE, {
				type: "contact_receipt",
				payload: { name, email, message },
			});
		} catch {
			// Queue may not be available in local dev
		}

		// Fire webhooks (fire-and-forget)
		fireWebhooks("contact.submission", { name, email, message, source: source ?? null }).catch(() => {});

		const eventId = crypto.randomUUID();

		// Fire-and-forget CAPI Lead event
		sendMetaConversionEvent({
			eventName: "Lead",
			eventId,
			email,
			sourceUrl: request.url,
			ip,
			userAgent: request.headers.get("user-agent") ?? undefined,
		}).catch(() => {});

		// Fire-and-forget GA Measurement Protocol event
		sendGaConversionEvent({
			eventName: "generate_lead",
			email,
			sourceUrl: request.url,
		}).catch(() => {});

		return apiSuccess({ success: true, eventId }, 201);
	} catch {
		return apiError("INTERNAL_ERROR", "An unexpected error occurred");
	}
}
