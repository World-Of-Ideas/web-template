import { describe, it, expect, vi, beforeEach } from "vitest";
import type { EmailJob } from "@/lib/queue";

// Mock resend module
vi.mock("@/lib/resend", () => ({
	sendEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock waitlist module (for generateUnsubscribeToken)
vi.mock("@/lib/waitlist", () => ({
	generateUnsubscribeToken: vi.fn().mockResolvedValue("mock-unsub-token-abc123"),
}));

import { handleEmailQueue } from "@/lib/queue-consumer";
import { sendEmail } from "@/lib/resend";
import { generateUnsubscribeToken } from "@/lib/waitlist";

// Helper to create a mock Message
function createMockMessage<T>(body: T) {
	return {
		body,
		ack: vi.fn(),
		retry: vi.fn(),
		id: crypto.randomUUID(),
		timestamp: new Date(),
		attempts: 1,
	};
}

// Helper to create a mock MessageBatch
function createMockBatch<T>(messages: ReturnType<typeof createMockMessage<T>>[]) {
	return {
		messages,
		queue: "test-queue",
		ackAll: vi.fn(),
		retryAll: vi.fn(),
	} as unknown as MessageBatch<T>;
}

const mockEnv = {
	SITE_URL: "https://example.com",
	RESEND_API_KEY: "re_test_key",
	FROM_EMAIL: "noreply@example.com",
	CONTACT_EMAIL: "admin@example.com",
	UNSUBSCRIBE_SECRET: "test-secret-123",
} as unknown as CloudflareEnv;

describe("queue-consumer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// --- HTML escaping ---

	describe("HTML escaping", () => {
		it("escapes script tags in waitlist confirmation name", async () => {
			const message = createMockMessage<EmailJob>({
				type: "waitlist_confirmation",
				payload: {
					email: "test@example.com",
					name: '<script>alert("xss")</script>',
					position: 5,
					referralCode: "abc123",
				},
			});

			const batch = createMockBatch([message]);
			await handleEmailQueue(batch, mockEnv);

			expect(sendEmail).toHaveBeenCalledOnce();
			const callArgs = vi.mocked(sendEmail).mock.calls[0];
			const html = callArgs[1].html;

			expect(html).toContain("&lt;script&gt;");
			expect(html).toContain("&lt;/script&gt;");
			expect(html).not.toContain("<script>");
		});

		it("escapes HTML in contact receipt fields", async () => {
			const message = createMockMessage<EmailJob>({
				type: "contact_receipt",
				payload: {
					name: "Bob <b>Bold</b>",
					email: 'test@"evil.com',
					message: "Hello & <goodbye>",
				},
			});

			const batch = createMockBatch([message]);
			await handleEmailQueue(batch, mockEnv);

			expect(sendEmail).toHaveBeenCalledOnce();
			const html = vi.mocked(sendEmail).mock.calls[0][1].html;

			expect(html).toContain("Bob &lt;b&gt;Bold&lt;/b&gt;");
			expect(html).toContain("test@&quot;evil.com");
			expect(html).toContain("Hello &amp; &lt;goodbye&gt;");
		});
	});

	// --- Unsubscribe URL ---

	describe("unsubscribe headers", () => {
		it("includes properly encoded email and token in unsubscribe URL", async () => {
			const message = createMockMessage<EmailJob>({
				type: "waitlist_confirmation",
				payload: {
					email: "user+special@example.com",
					name: "Test User",
					position: 1,
					referralCode: "ref123",
				},
			});

			const batch = createMockBatch([message]);
			await handleEmailQueue(batch, mockEnv);

			expect(sendEmail).toHaveBeenCalledOnce();
			const headers = vi.mocked(sendEmail).mock.calls[0][1].headers;

			expect(headers).toBeDefined();
			expect(headers!["List-Unsubscribe"]).toContain(
				encodeURIComponent("user+special@example.com"),
			);
			expect(headers!["List-Unsubscribe"]).toContain(
				encodeURIComponent("mock-unsub-token-abc123"),
			);
			expect(headers!["List-Unsubscribe"]).toContain("https://example.com/api/unsubscribe");
			expect(headers!["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
		});

		it("calls generateUnsubscribeToken with correct email and secret", async () => {
			const message = createMockMessage<EmailJob>({
				type: "referral_notification",
				payload: {
					email: "referrer@example.com",
					name: "Referrer",
					newPosition: 2,
				},
			});

			const batch = createMockBatch([message]);
			await handleEmailQueue(batch, mockEnv);

			expect(generateUnsubscribeToken).toHaveBeenCalledWith(
				"referrer@example.com",
				"test-secret-123",
			);
		});
	});

	// --- Email types and subject lines ---

	describe("email types", () => {
		it("waitlist_confirmation has correct subject", async () => {
			const message = createMockMessage<EmailJob>({
				type: "waitlist_confirmation",
				payload: {
					email: "test@example.com",
					name: "Alice",
					position: 42,
					referralCode: "alice42",
				},
			});

			const batch = createMockBatch([message]);
			await handleEmailQueue(batch, mockEnv);

			const callArgs = vi.mocked(sendEmail).mock.calls[0][1];
			expect(callArgs.subject).toBe("You're on the waitlist!");
			expect(callArgs.from).toBe("noreply@example.com");
			expect(callArgs.to).toBe("test@example.com");
			expect(callArgs.html).toContain("#42");
		});

		it("referral_notification has correct subject and content", async () => {
			const message = createMockMessage<EmailJob>({
				type: "referral_notification",
				payload: {
					email: "referrer@example.com",
					name: "Bob",
					newPosition: 3,
				},
			});

			const batch = createMockBatch([message]);
			await handleEmailQueue(batch, mockEnv);

			const callArgs = vi.mocked(sendEmail).mock.calls[0][1];
			expect(callArgs.subject).toBe("A friend joined via your referral!");
			expect(callArgs.html).toContain("#3");
			expect(callArgs.html).toContain("Hi Bob");
		});

		it("giveaway_confirmation has correct subject", async () => {
			const message = createMockMessage<EmailJob>({
				type: "giveaway_confirmation",
				payload: { email: "winner@example.com" },
			});

			const batch = createMockBatch([message]);
			await handleEmailQueue(batch, mockEnv);

			const callArgs = vi.mocked(sendEmail).mock.calls[0][1];
			expect(callArgs.subject).toBe("You're entered in the giveaway!");
			expect(callArgs.to).toBe("winner@example.com");
			// Giveaway emails have no unsubscribe headers
			expect(callArgs.headers).toBeUndefined();
		});

		it("contact_receipt sends to CONTACT_EMAIL with correct subject", async () => {
			const message = createMockMessage<EmailJob>({
				type: "contact_receipt",
				payload: {
					name: "Charlie",
					email: "charlie@example.com",
					message: "Hello, I have a question.",
				},
			});

			const batch = createMockBatch([message]);
			await handleEmailQueue(batch, mockEnv);

			const callArgs = vi.mocked(sendEmail).mock.calls[0][1];
			expect(callArgs.subject).toBe("New contact form submission from Charlie");
			expect(callArgs.to).toBe("admin@example.com"); // CONTACT_EMAIL
			expect(callArgs.html).toContain("Hello, I have a question.");
		});
	});

	// --- Unknown email types ---

	describe("unknown email types", () => {
		it("retries unknown job types without sending email", async () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			const message = createMockMessage({
				type: "unknown_type",
				payload: {},
			} as unknown as EmailJob);

			const batch = createMockBatch([message]);
			await handleEmailQueue(batch, mockEnv);

			expect(sendEmail).not.toHaveBeenCalled();
			expect(message.retry).toHaveBeenCalled();
			// Verify generic log message without leaking the type value
			expect(consoleSpy).toHaveBeenCalledWith("Unknown email job type encountered");
			consoleSpy.mockRestore();
		});
	});

	// --- Error handling ---

	describe("error handling", () => {
		it("retries message when sendEmail throws", async () => {
			vi.mocked(sendEmail).mockRejectedValueOnce(new Error("API failure"));

			const message = createMockMessage<EmailJob>({
				type: "giveaway_confirmation",
				payload: { email: "test@example.com" },
			});

			const batch = createMockBatch([message]);
			await handleEmailQueue(batch, mockEnv);

			expect(message.retry).toHaveBeenCalled();
			expect(message.ack).not.toHaveBeenCalled();
		});
	});

	// --- Multiple messages in batch ---

	describe("batch processing", () => {
		it("processes multiple messages in a batch", async () => {
			const msg1 = createMockMessage<EmailJob>({
				type: "giveaway_confirmation",
				payload: { email: "a@example.com" },
			});
			const msg2 = createMockMessage<EmailJob>({
				type: "giveaway_confirmation",
				payload: { email: "b@example.com" },
			});

			const batch = createMockBatch([msg1, msg2]);
			await handleEmailQueue(batch, mockEnv);

			expect(sendEmail).toHaveBeenCalledTimes(2);
			expect(msg1.ack).toHaveBeenCalled();
			expect(msg2.ack).toHaveBeenCalled();
		});
	});
});
