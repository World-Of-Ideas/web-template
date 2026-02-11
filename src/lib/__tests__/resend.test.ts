import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendEmail } from "@/lib/resend";

describe("resend", () => {
	let originalFetch: typeof globalThis.fetch;

	beforeEach(() => {
		originalFetch = globalThis.fetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it("sends email via Resend API with correct request", async () => {
		const mockFetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ id: "email-id-123" }), { status: 200 }),
		);
		globalThis.fetch = mockFetch;

		await sendEmail("re_test_api_key", {
			from: "noreply@example.com",
			to: "user@example.com",
			subject: "Test Subject",
			html: "<p>Hello!</p>",
		});

		expect(mockFetch).toHaveBeenCalledOnce();
		const [url, options] = mockFetch.mock.calls[0];

		expect(url).toBe("https://api.resend.com/emails");
		expect(options.method).toBe("POST");
		expect(options.headers.Authorization).toBe("Bearer re_test_api_key");
		expect(options.headers["Content-Type"]).toBe("application/json");

		const body = JSON.parse(options.body);
		expect(body.from).toBe("noreply@example.com");
		expect(body.to).toEqual(["user@example.com"]);
		expect(body.subject).toBe("Test Subject");
		expect(body.html).toBe("<p>Hello!</p>");
	});

	it("passes headers when provided", async () => {
		const mockFetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ id: "email-id-456" }), { status: 200 }),
		);
		globalThis.fetch = mockFetch;

		await sendEmail("re_test_api_key", {
			from: "noreply@example.com",
			to: "user@example.com",
			subject: "Test",
			html: "<p>Hello</p>",
			headers: {
				"List-Unsubscribe": "<https://example.com/unsub>",
				"List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
			},
		});

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.headers).toEqual({
			"List-Unsubscribe": "<https://example.com/unsub>",
			"List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
		});
	});

	it("does not include headers key when none provided", async () => {
		const mockFetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ id: "email-id-789" }), { status: 200 }),
		);
		globalThis.fetch = mockFetch;

		await sendEmail("re_test_api_key", {
			from: "noreply@example.com",
			to: "user@example.com",
			subject: "Test",
			html: "<p>Hello</p>",
		});

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		// headers should be undefined (not passed in options)
		expect(body.headers).toBeUndefined();
	});

	it("throws on non-ok response with status and body", async () => {
		const mockFetch = vi.fn().mockResolvedValue(
			new Response("Invalid API key", { status: 401 }),
		);
		globalThis.fetch = mockFetch;

		await expect(
			sendEmail("bad-key", {
				from: "noreply@example.com",
				to: "user@example.com",
				subject: "Test",
				html: "<p>Hello</p>",
			}),
		).rejects.toThrow("Resend API error (401): Invalid API key");
	});

	it("throws on 500 server error", async () => {
		const mockFetch = vi.fn().mockResolvedValue(
			new Response("Internal Server Error", { status: 500 }),
		);
		globalThis.fetch = mockFetch;

		await expect(
			sendEmail("re_key", {
				from: "noreply@example.com",
				to: "user@example.com",
				subject: "Test",
				html: "<p>Hello</p>",
			}),
		).rejects.toThrow("Resend API error (500): Internal Server Error");
	});

	it("passes AbortSignal for 5s timeout", async () => {
		const mockFetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ id: "ok" }), { status: 200 }),
		);
		globalThis.fetch = mockFetch;

		await sendEmail("re_key", {
			from: "a@b.com",
			to: "c@d.com",
			subject: "S",
			html: "H",
		});

		const options = mockFetch.mock.calls[0][1];
		expect(options.signal).toBeInstanceOf(AbortSignal);
	});

	it("wraps to field as single-element array", async () => {
		const mockFetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ id: "ok" }), { status: 200 }),
		);
		globalThis.fetch = mockFetch;

		await sendEmail("re_key", {
			from: "a@b.com",
			to: "c@d.com",
			subject: "S",
			html: "H",
		});

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(Array.isArray(body.to)).toBe(true);
		expect(body.to).toHaveLength(1);
		expect(body.to[0]).toBe("c@d.com");
	});
});
