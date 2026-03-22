export type EmailJob =
	| { type: "waitlist_confirmation"; payload: { email: string; name: string; position: number; referralCode: string } }
	| { type: "referral_notification"; payload: { email: string; name: string; newPosition: number } }
	| { type: "giveaway_confirmation"; payload: { email: string } }
	| { type: "contact_receipt"; payload: { name: string; email: string; message: string } }
	| { type: "waitlist_admin_notification"; payload: { email: string; name: string; position: number; source?: string } }
	| { type: "campaign_email"; payload: { to: string; subject: string; html: string } }
	| { type: "email_verification"; payload: { email: string; name: string } }
	| { type: "newsletter_confirmation"; payload: { email: string; name: string } }
	| { type: "newsletter_admin_notification"; payload: { email: string; name: string; source?: string } }
	| { type: "og_site"; payload: Record<string, never> }
	| { type: "og_post"; payload: { slug: string } }
	| { type: "og_page"; payload: { slug: string } };

export async function enqueueEmail(queue: Queue, job: EmailJob): Promise<void> {
	await queue.send(job);
}

/** Send up to 100 messages per batch (Cloudflare Queues limit). */
export async function enqueueEmailBatch(queue: Queue, jobs: EmailJob[]): Promise<void> {
	const BATCH_SIZE = 100;
	for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
		const batch = jobs.slice(i, i + BATCH_SIZE);
		await queue.sendBatch(batch.map((job) => ({ body: job })));
	}
}
