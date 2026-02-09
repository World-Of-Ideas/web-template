import { NextRequest } from "next/server";
import { getEnv } from "@/db";
import { siteConfig } from "@/config/site";
import { apiSuccess, apiError, getClientIp } from "@/lib/api";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { recordGiveawayAction, getGiveawayEntryByEmail, isGiveawayEnded } from "@/lib/giveaway";
import { getPageBySlug } from "@/lib/pages";
import { checkRateLimit } from "@/lib/rate-limit";

const ALLOWED_ACTIONS = [
	"twitter_follow",
	"twitter_retweet",
	"discord_join",
	"instagram_follow",
	"newsletter_signup",
];

const REFERRAL_CODE_PATTERN = /^referral:[a-z0-9]{6,12}$/;

function isValidAction(action: string): boolean {
	if (REFERRAL_CODE_PATTERN.test(action)) return true;
	return ALLOWED_ACTIONS.includes(action);
}

export async function POST(request: NextRequest) {
	if (!siteConfig.features.giveaway) {
		return apiError("NOT_FOUND", "Giveaway is not available");
	}

	const ip = getClientIp(request);
	if (!checkRateLimit(`giveaway-action:${ip}`, 10, 60 * 1000)) {
		return apiError("RATE_LIMITED", "Too many requests. Please try again later.");
	}

	try {
		const body = await request.json();
		const { email, action, metadata, turnstileToken } = body as {
			email?: string;
			action?: string;
			metadata?: string;
			turnstileToken?: string;
		};

		if (!email || !action) {
			return apiError("VALIDATION_ERROR", "Email and action are required");
		}

		if (!turnstileToken) {
			return apiError("VALIDATION_ERROR", "Turnstile token is required");
		}

		if (!isValidAction(action)) {
			return apiError("VALIDATION_ERROR", "Unknown action type");
		}

		const env = await getEnv();
		const isValid = await verifyTurnstileToken(turnstileToken, env.TURNSTILE_SECRET_KEY);
		if (!isValid) {
			return apiError("TURNSTILE_FAILED", "Turnstile verification failed");
		}

		// Check end date
		const giveawayPage = await getPageBySlug("giveaway");
		const giveawayMeta = giveawayPage?.metadata as {
			endDate?: string;
			bonusEntries?: Record<string, number>;
		} | null;

		if (isGiveawayEnded(giveawayMeta?.endDate)) {
			return apiError("GIVEAWAY_ENDED", "The giveaway has ended");
		}

		const entry = await getGiveawayEntryByEmail(email);
		if (!entry) {
			return apiError("NOT_FOUND", "No giveaway entry found for this email");
		}

		// Determine bonus entries from giveaway page metadata
		const actionType = action.startsWith("referral:") ? "referral" : action.replace("twitter_", "");
		const bonusEntries = giveawayMeta?.bonusEntries?.[actionType] ?? 1;

		await recordGiveawayAction({
			entryId: entry.id,
			action,
			bonusEntries,
			metadata,
		});

		return apiSuccess({ success: true });
	} catch (err) {
		// Handle unique constraint violation (duplicate action)
		if (err instanceof Error && err.message.includes("UNIQUE")) {
			return apiError("DUPLICATE_ACTION", "This action has already been completed");
		}
		return apiError("INTERNAL_ERROR", "An unexpected error occurred");
	}
}
