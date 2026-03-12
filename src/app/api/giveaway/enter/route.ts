import { NextRequest } from "next/server";
import { getEnv } from "@/db";
import { apiSuccess, apiError, getClientIp } from "@/lib/api";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createGiveawayEntry, getGiveawayEntryByEmail, isGiveawayEnded } from "@/lib/giveaway";
import { getSubscriberByEmail } from "@/lib/waitlist";
import { getPageBySlug } from "@/lib/pages";
import { enqueueEmail } from "@/lib/queue";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendMetaConversionEvent, sendGaConversionEvent } from "@/lib/tracking";
import { isValidEmail, safeParseJson, validateLength } from "@/lib/validation";
import { fireWebhooks } from "@/lib/webhooks";

export async function POST(request: NextRequest) {
	if (!(await getSiteSettingsDirect()).features.giveaway) {
		return apiError("NOT_FOUND", "Resource not found");
	}

	const ip = getClientIp(request);
	if (!checkRateLimit(`giveaway-enter:${ip}`, 5, 60 * 1000)) {
		return apiError("RATE_LIMITED", "Too many requests. Please try again later.");
	}

	const body = await safeParseJson(request);
	if (!body || typeof body !== "object") {
		return apiError("VALIDATION_ERROR", "Invalid JSON");
	}

	try {
		const { email, turnstileToken, source } = body as {
			email?: string;
			turnstileToken?: string;
			source?: string;
		};

		if (!email) {
			return apiError("VALIDATION_ERROR", "Email is required");
		}

		if (!isValidEmail(email)) {
			return apiError("VALIDATION_ERROR", "Invalid email format");
		}

		const lengthErr = validateLength(source, "Source", 255);
		if (lengthErr) {
			return apiError("VALIDATION_ERROR", lengthErr);
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
		let entry;
		try {
			entry = await createGiveawayEntry({
				email,
				subscriberId: subscriber?.id,
				source,
			});
		} catch (err) {
			// Catch unique constraint violation (concurrent duplicate entry)
			if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
				const existingEntry = await getGiveawayEntryByEmail(email);
				if (existingEntry) {
					return apiSuccess({ entryId: existingEntry.id, totalEntries: existingEntry.totalEntries, existing: true });
				}
			}
			throw err;
		}

		// Queue confirmation email
		try {
			await enqueueEmail(env.EMAIL_QUEUE, {
				type: "giveaway_confirmation",
				payload: { email },
			});
		} catch {
			// Queue may not be available in local dev
		}

		// Fire webhooks (fire-and-forget)
		fireWebhooks("giveaway.entry", { email, entryId: entry.id, source: source ?? null }).catch(() => {});

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

		return apiSuccess({ entryId: entry.id, totalEntries: entry.totalEntries, eventId }, 201);
	} catch {
		return apiError("INTERNAL_ERROR", "An unexpected error occurred");
	}
}
