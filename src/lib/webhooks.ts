import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { webhooks } from "@/db/schema";

export async function getWebhooks() {
	const db = await getDb();
	return db.query.webhooks.findMany({
		orderBy: (w, { desc }) => [desc(w.createdAt)],
		limit: 500,
	});
}

export async function getWebhookById(id: number) {
	const db = await getDb();
	return db.query.webhooks.findFirst({
		where: eq(webhooks.id, id),
	});
}

export async function createWebhook(data: {
	url: string;
	events: string[];
	secret: string;
}) {
	const db = await getDb();
	const [webhook] = await db
		.insert(webhooks)
		.values({
			url: data.url,
			events: data.events,
			secret: data.secret,
		})
		.returning();
	return webhook;
}

export async function updateWebhook(
	id: number,
	data: Partial<{
		url: string;
		events: string[];
		secret: string;
		active: boolean;
	}>,
) {
	const db = await getDb();
	const now = new Date().toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");

	const updateData: Record<string, unknown> = { updatedAt: now };
	if (data.url !== undefined) updateData.url = data.url;
	if (data.events !== undefined) updateData.events = data.events;
	if (data.secret !== undefined) updateData.secret = data.secret;
	if (data.active !== undefined) updateData.active = data.active;

	const [webhook] = await db
		.update(webhooks)
		.set(updateData as typeof webhooks.$inferInsert)
		.where(eq(webhooks.id, id))
		.returning();
	return webhook;
}

export async function deleteWebhook(id: number) {
	const db = await getDb();
	await db.delete(webhooks).where(eq(webhooks.id, id));
}

/** Fire webhooks for a given event. Fire-and-forget, never throws. */
export async function fireWebhooks(
	event: string,
	payload: Record<string, unknown>,
): Promise<void> {
	try {
		const db = await getDb();
		const activeWebhooks = await db.query.webhooks.findMany({
			where: eq(webhooks.active, true),
			limit: 50,
		});

		const matching = activeWebhooks.filter((w) => {
			const events = w.events as string[];
			return events.includes(event);
		}).slice(0, 20);

		await Promise.allSettled(
			matching.map(async (webhook) => {
				const body = JSON.stringify({
					event,
					data: payload,
					timestamp: new Date().toISOString(),
				});
				const encoder = new TextEncoder();
				const key = await crypto.subtle.importKey(
					"raw",
					encoder.encode(webhook.secret),
					{ name: "HMAC", hash: "SHA-256" },
					false,
					["sign"],
				);
				const signature = await crypto.subtle.sign(
					"HMAC",
					key,
					encoder.encode(body),
				);
				const sigHex = Array.from(new Uint8Array(signature))
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("");

				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), 5000);
				try {
					await fetch(webhook.url, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"X-Webhook-Signature": sigHex,
							"X-Webhook-Event": event,
						},
						body,
						signal: controller.signal,
					});
				} finally {
					clearTimeout(timeout);
				}
			}),
		);
	} catch {
		// Fire-and-forget — never fail the parent operation
	}
}
