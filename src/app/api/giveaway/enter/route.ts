import { NextRequest } from "next/server";
import { getEnv } from "@/db";
import { siteConfig } from "@/config/site";
import { apiSuccess, apiError, getClientIp } from "@/lib/api";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createGiveawayEntry, getGiveawayEntryByEmail, isGiveawayEnded } from "@/lib/giveaway";
import { getSubscriberByEmail } from "@/lib/waitlist";
import { getPageBySlug } from "@/lib/pages";
import { enqueueEmail } from "@/lib/queue";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
	if (!siteConfig.features.giveaway) {
		return apiError("NOT_FOUND", "Giveaway is not available");
	}

	const ip = getClientIp(request);
	if (!checkRateLimit(`giveaway-enter:${ip}`, 5, 60 * 1000)) {
		return apiError("RATE_LIMITED", "Too many requests. Please try again later.");
	}

	try {
		const body = await request.json();
		const { email, turnstileToken } = body as {
			email?: string;
			turnstileToken?: string;
		};

		if (!email) {
			return apiError("VALIDATION_ERROR", "Email is required");
		}

		if (!turnstileToken) {
			return apiError("VALIDATION_ERROR", "Turnstile token is required");
		}

		// Check end date
		const giveawayPage = await getPageBySlug("giveaway");
		const endDate = (giveawayPage?.metadata as { endDate?: string } | null)?.endDate;
		if (isGiveawayEnded(endDate)) {
			return apiError("GIVEAWAY_ENDED", "The giveaway has ended");
		}

		const env = await getEnv();
		const isValid = await verifyTurnstileToken(turnstileToken, env.TURNSTILE_SECRET_KEY);
		if (!isValid) {
			return apiError("TURNSTILE_FAILED", "Turnstile verification failed");
		}

		// Check for existing entry
		const existing = await getGiveawayEntryByEmail(email);
		if (existing) {
			return apiSuccess({ entryId: existing.id, totalEntries: existing.totalEntries, existing: true });
		}

		// Link to subscriber if exists
		const subscriber = await getSubscriberByEmail(email);
		const entry = await createGiveawayEntry({
			email,
			subscriberId: subscriber?.id,
		});

		// Queue confirmation email
		try {
			await enqueueEmail(env.EMAIL_QUEUE, {
				type: "giveaway_confirmation",
				payload: { email },
			});
		} catch {
			// Queue may not be available in local dev
		}

		return apiSuccess({ entryId: entry.id, totalEntries: entry.totalEntries }, 201);
	} catch {
		return apiError("INTERNAL_ERROR", "An unexpected error occurred");
	}
}
