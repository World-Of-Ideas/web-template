import { describe, it, expect, beforeEach } from "vitest";
import { cleanTables } from "../../../test/helpers";
import {
	createSubscriber,
	verifySubscriberEmail,
	getSubscriberStatus,
	getSubscriberByEmail,
	unsubscribe,
} from "../waitlist";

describe("waitlist extended (integration)", () => {
	beforeEach(async () => {
		await cleanTables("giveaway_actions", "giveaway_entries", "subscribers");
	});

	describe("verifySubscriberEmail", () => {
		it("transitions a pending subscriber to active", async () => {
			await createSubscriber({
				email: "pending@test.com",
				name: "Pending User",
				referralCode: "REF001",
				status: "pending",
			});

			const before = await getSubscriberByEmail("pending@test.com");
			expect(before?.status).toBe("pending");

			await verifySubscriberEmail("pending@test.com");

			const after = await getSubscriberByEmail("pending@test.com");
			expect(after?.status).toBe("active");
		});

		it("is idempotent when called on an already active subscriber", async () => {
			await createSubscriber({
				email: "active@test.com",
				name: "Active User",
				referralCode: "REF002",
				status: "active",
			});

			await verifySubscriberEmail("active@test.com");

			const sub = await getSubscriberByEmail("active@test.com");
			expect(sub?.status).toBe("active");
		});

		it("does not throw when called with a non-existent email", async () => {
			await expect(
				verifySubscriberEmail("nonexistent@test.com"),
			).resolves.not.toThrow();
		});

		it("does not affect other subscribers", async () => {
			await createSubscriber({
				email: "pending1@test.com",
				name: "Pending One",
				referralCode: "REF003",
				status: "pending",
			});
			await createSubscriber({
				email: "pending2@test.com",
				name: "Pending Two",
				referralCode: "REF004",
				status: "pending",
			});

			await verifySubscriberEmail("pending1@test.com");

			const verified = await getSubscriberByEmail("pending1@test.com");
			const untouched = await getSubscriberByEmail("pending2@test.com");
			expect(verified?.status).toBe("active");
			expect(untouched?.status).toBe("pending");
		});
	});

	describe("getSubscriberStatus", () => {
		it("returns 'active' for an active subscriber", async () => {
			await createSubscriber({
				email: "active@test.com",
				name: "Active User",
				referralCode: "REF010",
				status: "active",
			});

			const status = await getSubscriberStatus("active@test.com");
			expect(status).toBe("active");
		});

		it("returns 'pending' for a pending subscriber", async () => {
			await createSubscriber({
				email: "pending@test.com",
				name: "Pending User",
				referralCode: "REF011",
				status: "pending",
			});

			const status = await getSubscriberStatus("pending@test.com");
			expect(status).toBe("pending");
		});

		it("returns 'unsubscribed' for an unsubscribed subscriber", async () => {
			await createSubscriber({
				email: "unsub@test.com",
				name: "Unsub User",
				referralCode: "REF012",
				status: "active",
			});
			await unsubscribe("unsub@test.com");

			const status = await getSubscriberStatus("unsub@test.com");
			expect(status).toBe("unsubscribed");
		});

		it("returns null for a non-existent email", async () => {
			const status = await getSubscriberStatus("ghost@test.com");
			expect(status).toBeNull();
		});

		it("returns the correct status after verification changes it", async () => {
			await createSubscriber({
				email: "flow@test.com",
				name: "Flow User",
				referralCode: "REF013",
				status: "pending",
			});

			expect(await getSubscriberStatus("flow@test.com")).toBe("pending");

			await verifySubscriberEmail("flow@test.com");

			expect(await getSubscriberStatus("flow@test.com")).toBe("active");
		});

		it("returns the correct status after unsubscribe changes it", async () => {
			await createSubscriber({
				email: "lifecycle@test.com",
				name: "Lifecycle User",
				referralCode: "REF014",
				status: "active",
			});

			expect(await getSubscriberStatus("lifecycle@test.com")).toBe("active");

			await unsubscribe("lifecycle@test.com");

			expect(await getSubscriberStatus("lifecycle@test.com")).toBe(
				"unsubscribed",
			);
		});
	});
});
