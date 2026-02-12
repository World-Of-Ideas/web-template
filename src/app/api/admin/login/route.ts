import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getEnv } from "@/db";
import { apiSuccess, apiError, getClientIp } from "@/lib/api";
import { createSession, cleanupExpiredSessions, verifyPassword } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
	try {
		const ip = getClientIp(request);
		if (!checkRateLimit(`login:${ip}`, 20, 15 * 60 * 1000)) {
			return apiError("RATE_LIMITED", "Too many login attempts. Try again later.");
		}

		let body;
		try { body = await request.json(); } catch { return apiError("VALIDATION_ERROR", "Invalid JSON"); }
		const { password } = body as { password?: string };

		if (!password || typeof password !== "string" || password.length > 1000) {
			return apiError("VALIDATION_ERROR", "Invalid credentials");
		}

		const env = await getEnv();

		const adminPw = env.ADMIN_PASSWORD;
		if (!adminPw || typeof adminPw !== "string") {
			return apiError("INTERNAL_ERROR", "Server configuration error");
		}

		// Cleanup expired sessions on each login attempt
		await cleanupExpiredSessions();

		const isValid = await verifyPassword(password, adminPw);
		if (!isValid) {
			return apiError("UNAUTHORIZED", "Invalid password");
		}

		const sessionId = await createSession();

		const cookieStore = await cookies();
		cookieStore.set("admin_session", sessionId, {
			httpOnly: true,
			secure: process.env.NODE_ENV !== "development",
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60 * 24, // 24 hours
		});

		return apiSuccess({ success: true });
	} catch {
		return apiError("INTERNAL_ERROR", "An unexpected error occurred");
	}
}
