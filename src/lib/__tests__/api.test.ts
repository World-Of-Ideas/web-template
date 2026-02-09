import { describe, it, expect } from "vitest";
import { apiSuccess, apiError, clampInt } from "../api";

describe("apiSuccess", () => {
	it("returns JSON with ok: true and data", async () => {
		const response = apiSuccess({ foo: 1 });
		const body = await response.json();
		expect(body).toEqual({ ok: true, data: { foo: 1 } });
		expect(response.status).toBe(200);
	});

	it("supports custom status codes", async () => {
		const response = apiSuccess({}, 201);
		expect(response.status).toBe(201);
	});
});

describe("apiError", () => {
	it("returns NOT_FOUND with 404 status", async () => {
		const response = apiError("NOT_FOUND", "not found");
		const body = await response.json();
		expect(body).toEqual({ ok: false, error: { code: "NOT_FOUND", message: "not found" } });
		expect(response.status).toBe(404);
	});

	it("returns VALIDATION_ERROR with 400 status", async () => {
		const response = apiError("VALIDATION_ERROR", "bad input");
		expect(response.status).toBe(400);
	});

	it("returns DUPLICATE_ACTION with 409 status", async () => {
		const response = apiError("DUPLICATE_ACTION", "already done");
		const body = (await response.json()) as { error: { code: string } };
		expect(body.error.code).toBe("DUPLICATE_ACTION");
		expect(response.status).toBe(409);
	});

	it("returns DUPLICATE_EMAIL with 409 status", async () => {
		const response = apiError("DUPLICATE_EMAIL", "exists");
		expect(response.status).toBe(409);
	});

	it("returns INTERNAL_ERROR with 500 status", async () => {
		const response = apiError("INTERNAL_ERROR", "oops");
		expect(response.status).toBe(500);
	});
});

describe("clampInt", () => {
	it("parses a valid number", () => {
		expect(clampInt("5", 1, 1, 100)).toBe(5);
	});

	it("returns fallback for null", () => {
		expect(clampInt(null, 12, 1, 100)).toBe(12);
	});

	it("returns fallback for NaN", () => {
		expect(clampInt("abc", 12, 1, 100)).toBe(12);
	});

	it("clamps to min", () => {
		expect(clampInt("0", 1, 1, 100)).toBe(1);
		expect(clampInt("-5", 1, 1, 100)).toBe(1);
	});

	it("clamps to max", () => {
		expect(clampInt("999", 1, 1, 100)).toBe(100);
	});

	it("rounds floats", () => {
		expect(clampInt("2.7", 1, 1, 100)).toBe(3);
	});
});
