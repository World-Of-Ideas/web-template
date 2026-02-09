import { NextRequest } from "next/server";
import { getEnv } from "@/db";
import { siteConfig } from "@/config/site";
import { apiSuccess, apiError, getClientIp } from "@/lib/api";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createContactSubmission } from "@/lib/contact";
import { enqueueEmail } from "@/lib/queue";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
	if (!siteConfig.features.contact) {
		return apiError("NOT_FOUND", "Contact form is not available");
	}

	const ip = getClientIp(request);
	if (!checkRateLimit(`contact:${ip}`, 3, 60 * 1000)) {
		return apiError("RATE_LIMITED", "Too many requests. Please try again later.");
	}

	try {
		const body = await request.json();
		const { name, email, message, turnstileToken } = body as {
			name?: string;
			email?: string;
			message?: string;
			turnstileToken?: string;
		};

		if (!name || !email || !message) {
			return apiError("VALIDATION_ERROR", "Name, email, and message are required");
		}

		if (!turnstileToken) {
			return apiError("VALIDATION_ERROR", "Turnstile token is required");
		}

		const env = await getEnv();
		const isValid = await verifyTurnstileToken(turnstileToken, env.TURNSTILE_SECRET_KEY);
		if (!isValid) {
			return apiError("TURNSTILE_FAILED", "Turnstile verification failed");
		}

		await createContactSubmission({ name, email, message });

		// Queue notification email
		try {
			await enqueueEmail(env.EMAIL_QUEUE, {
				type: "contact_receipt",
				payload: { name, email, message },
			});
		} catch {
			// Queue may not be available in local dev
		}

		return apiSuccess({ success: true }, 201);
	} catch {
		return apiError("INTERNAL_ERROR", "An unexpected error occurred");
	}
}
