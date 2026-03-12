import { describe, it, expect, vi } from "vitest";
import { enqueueEmail, enqueueEmailBatch, type EmailJob } from "../queue";

function createMockQueue() {
	return {
		send: vi.fn(),
		sendBatch: vi.fn(),
	} as unknown as Queue;
}

function makeJob(i: number): EmailJob {
	return { type: "campaign_email", payload: { to: `user${i}@test.com`, subject: "Test", html: "<p>Hi</p>" } };
}

describe("enqueueEmail", () => {
	it("calls queue.send with the job", async () => {
		const queue = createMockQueue();
		const job: EmailJob = {
			type: "waitlist_confirmation",
			payload: { email: "a@b.com", name: "Alice", position: 1, referralCode: "ABC123" },
		};

		await enqueueEmail(queue, job);

		expect(queue.send).toHaveBeenCalledOnce();
		expect(queue.send).toHaveBeenCalledWith(job);
	});

	it("works with contact_receipt job type", async () => {
		const queue = createMockQueue();
		const job: EmailJob = {
			type: "contact_receipt",
			payload: { name: "Bob", email: "bob@test.com", message: "Hello" },
		};

		await enqueueEmail(queue, job);

		expect(queue.send).toHaveBeenCalledOnce();
		expect(queue.send).toHaveBeenCalledWith(job);
	});

	it("works with giveaway_confirmation job type", async () => {
		const queue = createMockQueue();
		const job: EmailJob = {
			type: "giveaway_confirmation",
			payload: { email: "winner@test.com" },
		};

		await enqueueEmail(queue, job);

		expect(queue.send).toHaveBeenCalledOnce();
		expect(queue.send).toHaveBeenCalledWith(job);
	});

	it("works with email_verification job type", async () => {
		const queue = createMockQueue();
		const job: EmailJob = {
			type: "email_verification",
			payload: { email: "verify@test.com", name: "Carol" },
		};

		await enqueueEmail(queue, job);

		expect(queue.send).toHaveBeenCalledOnce();
		expect(queue.send).toHaveBeenCalledWith(job);
	});
});

describe("enqueueEmailBatch", () => {
	it("makes no sendBatch calls for empty array", async () => {
		const queue = createMockQueue();

		await enqueueEmailBatch(queue, []);

		expect(queue.sendBatch).not.toHaveBeenCalled();
	});

	it("makes one sendBatch call for a single job", async () => {
		const queue = createMockQueue();
		const jobs = [makeJob(0)];

		await enqueueEmailBatch(queue, jobs);

		expect(queue.sendBatch).toHaveBeenCalledOnce();
		expect(queue.sendBatch).toHaveBeenCalledWith([{ body: jobs[0] }]);
	});

	it("makes one sendBatch call for exactly 100 jobs", async () => {
		const queue = createMockQueue();
		const jobs = Array.from({ length: 100 }, (_, i) => makeJob(i));

		await enqueueEmailBatch(queue, jobs);

		expect(queue.sendBatch).toHaveBeenCalledOnce();
		expect((queue.sendBatch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toHaveLength(100);
	});

	it("makes two sendBatch calls for 101 jobs (100 + 1)", async () => {
		const queue = createMockQueue();
		const jobs = Array.from({ length: 101 }, (_, i) => makeJob(i));

		await enqueueEmailBatch(queue, jobs);

		expect(queue.sendBatch).toHaveBeenCalledTimes(2);
		const calls = (queue.sendBatch as ReturnType<typeof vi.fn>).mock.calls;
		expect(calls[0][0]).toHaveLength(100);
		expect(calls[1][0]).toHaveLength(1);
	});

	it("makes three sendBatch calls for 250 jobs (100 + 100 + 50)", async () => {
		const queue = createMockQueue();
		const jobs = Array.from({ length: 250 }, (_, i) => makeJob(i));

		await enqueueEmailBatch(queue, jobs);

		expect(queue.sendBatch).toHaveBeenCalledTimes(3);
		const calls = (queue.sendBatch as ReturnType<typeof vi.fn>).mock.calls;
		expect(calls[0][0]).toHaveLength(100);
		expect(calls[1][0]).toHaveLength(100);
		expect(calls[2][0]).toHaveLength(50);
	});

	it("wraps each job in { body: job } format", async () => {
		const queue = createMockQueue();
		const jobs = [makeJob(0), makeJob(1), makeJob(2)];

		await enqueueEmailBatch(queue, jobs);

		expect(queue.sendBatch).toHaveBeenCalledWith([
			{ body: jobs[0] },
			{ body: jobs[1] },
			{ body: jobs[2] },
		]);
	});
});
