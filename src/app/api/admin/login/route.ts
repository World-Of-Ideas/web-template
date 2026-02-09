import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getEnv } from "@/db";
import { apiSuccess, apiError, getClientIp } from "@/lib/api";
import { createSession, cleanupExpiredSessions, verifyPassword } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
	try {
		const ip = getClientIp(request);
		if (!checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000)) {
			return apiError("RATE_LIMITED", "Too many login attempts. Try again later.");
		}

		const body = await request.json();
		const { password } = body as { password?: string };

		if (!password) {
			return apiError("VALIDATION_ERROR", "Password is required");
		}

		const env = await getEnv();

		// Cleanup expired sessions on each login attempt
		await cleanupExpiredSessions();

		const isValid = await verifyPassword(password, env.ADMIN_PASSWORD);
		if (!isValid) {
			return apiError("UNAUTHORIZED", "Invalid password");
		}

		const sessionId = await createSession();

		const cookieStore = await cookies();
		cookieStore.set("admin_session", sessionId, {
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			path: "/admin",
			maxAge: 60 * 60 * 24, // 24 hours
		});

		return apiSuccess({ success: true });
	} catch {
		return apiError("INTERNAL_ERROR", "An unexpected error occurred");
	}
}
