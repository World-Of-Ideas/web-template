import { NextRequest } from "next/server";
import { getEnv } from "@/db";
import { siteConfig } from "@/config/site";
import { apiSuccess, apiError, getClientIp } from "@/lib/api";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { generateReferralCode } from "@/lib/referral";
import { createSubscriber, getSubscriberByEmail, incrementReferralCount } from "@/lib/waitlist";
import { enqueueEmail } from "@/lib/queue";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
	if (!siteConfig.features.waitlist) {
		return apiError("NOT_FOUND", "Waitlist is not available");
	}

	const ip = getClientIp(request);
	if (!checkRateLimit(`waitlist:${ip}`, 5, 60 * 1000)) {
		return apiError("RATE_LIMITED", "Too many requests. Please try again later.");
	}

	try {
		const body = await request.json();
		const { email, name, turnstileToken, ref } = body as {
			email?: string;
			name?: string;
			turnstileToken?: string;
			ref?: string;
		};

		if (!email || !name) {
			return apiError("VALIDATION_ERROR", "Email and name are required");
		}

		if (!turnstileToken) {
			return apiError("VALIDATION_ERROR", "Turnstile token is required");
		}

		const env = await getEnv();
		const isValid = await verifyTurnstileToken(turnstileToken, env.TURNSTILE_SECRET_KEY);
		if (!isValid) {
			return apiError("TURNSTILE_FAILED", "Turnstile verification failed");
		}

		// Check for existing subscriber
		const existing = await getSubscriberByEmail(email);
		if (existing) {
			return apiSuccess({ referralCode: existing.referralCode, existing: true });
		}

		const referralCode = await generateReferralCode();
		const subscriber = await createSubscriber({
			email,
			name,
			referralCode,
			referredBy: ref ?? undefined,
		});

		// If referred, increment referrer's count
		if (ref) {
			await incrementReferralCount(ref);
		}

		// Queue confirmation email
		try {
			await enqueueEmail(env.EMAIL_QUEUE, {
				type: "waitlist_confirmation",
				payload: {
					email,
					name,
					position: subscriber.position,
					referralCode,
				},
			});
		} catch {
			// Queue may not be available in local dev — don't fail the signup
		}

		return apiSuccess({ referralCode, position: subscriber.position }, 201);
	} catch {
		return apiError("INTERNAL_ERROR", "An unexpected error occurred");
	}
}
