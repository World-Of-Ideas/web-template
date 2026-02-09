import { NextRequest, NextResponse } from "next/server";

type ErrorCode =
	| "VALIDATION_ERROR"
	| "TURNSTILE_FAILED"
	| "DUPLICATE_EMAIL"
	| "DUPLICATE_ACTION"
	| "GIVEAWAY_ENDED"
	| "NOT_FOUND"
	| "UNAUTHORIZED"
	| "RATE_LIMITED"
	| "INTERNAL_ERROR";

const STATUS_MAP: Record<ErrorCode, number> = {
	VALIDATION_ERROR: 400,
	TURNSTILE_FAILED: 400,
	DUPLICATE_EMAIL: 409,
	DUPLICATE_ACTION: 409,
	GIVEAWAY_ENDED: 410,
	NOT_FOUND: 404,
	UNAUTHORIZED: 401,
	RATE_LIMITED: 429,
	INTERNAL_ERROR: 500,
};

export function apiSuccess(data: unknown, status = 200) {
	return NextResponse.json({ ok: true, data }, { status });
}

export function apiError(code: ErrorCode, message: string) {
	return NextResponse.json(
		{ ok: false, error: { code, message } },
		{ status: STATUS_MAP[code] },
	);
}

/** Extract client IP from request headers (CF-Connecting-IP, X-Forwarded-For, or fallback). */
export function getClientIp(request: NextRequest): string {
	return (
		request.headers.get("cf-connecting-ip") ??
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		"unknown"
	);
}

/** Parse a query param as an integer, clamped to [min, max] with a fallback for NaN. */
export function clampInt(value: string | null, fallback: number, min: number, max: number): number {
	const n = Number(value ?? fallback);
	if (Number.isNaN(n)) return fallback;
	return Math.min(Math.max(Math.round(n), min), max);
}
