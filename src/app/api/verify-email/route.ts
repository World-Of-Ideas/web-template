import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { apiSuccess, apiError, getClientIp } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { getSubscriberByEmail, verifyUnsubscribeToken, verifySubscriberEmail } from "@/lib/waitlist";

export async function GET(request: NextRequest) {
	if (!(await getSiteSettingsDirect()).features.waitlist) {
		return apiError("NOT_FOUND", "Feature not available");
	}

	const ip = getClientIp(request);
	if (!checkRateLimit(`verify-email:${ip}`, 10, 60_000)) {
		return apiError("RATE_LIMITED", "Too many requests. Please try again later.");
	}

	const email = request.nextUrl.searchParams.get("email");
	const token = request.nextUrl.searchParams.get("token");

	if (!email || !token) {
		return apiError("VALIDATION_ERROR", "Email and token are required");
	}

	const { env } = await getCloudflareContext();
	const secret = (env as unknown as Record<string, unknown>).UNSUBSCRIBE_SECRET as string;

	// Verify token with "verify:" prefix to differentiate from unsubscribe tokens
	const valid = await verifyUnsubscribeToken("verify:" + email, token, secret);
	const subscriber = valid ? await getSubscriberByEmail(email) : null;
	if (!valid || !subscriber) {
		return apiError("VALIDATION_ERROR", "Invalid verification link");
	}

	if (subscriber.status === "active") {
		return apiSuccess({ message: "Email already verified" });
	}

	await verifySubscriberEmail(email);

	return apiSuccess({ message: "Email verified successfully. Welcome to the waitlist!" });
}
