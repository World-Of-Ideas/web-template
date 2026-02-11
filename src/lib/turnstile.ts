const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(token: string, secretKey: string): Promise<boolean> {
	try {
		if (!token || token.trim().length < 20 || token.length > 2048) return false;

		const response = await fetch(VERIFY_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				secret: secretKey,
				response: token,
			}),
		});

		if (!response.ok) return false;

		const data = (await response.json()) as {
			success: boolean;
			challenge_ts?: string;
			"error-codes"?: string[];
		};

		if (!data.success) return false;

		// Reject stale challenges (older than 5 minutes)
		if (data.challenge_ts) {
			const challengeAge = Date.now() - new Date(data.challenge_ts).getTime();
			if (challengeAge > 5 * 60 * 1000) return false;
		}

		return true;
	} catch {
		return false;
	}
}
