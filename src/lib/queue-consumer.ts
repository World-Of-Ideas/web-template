import type { EmailJob } from "./queue";
import { sendEmail } from "./resend";
import { generateUnsubscribeToken } from "./subscribers";
import { generateSiteOg, generatePostOg, generatePageOg } from "./og";
import { getSiteSettingsDirect } from "./site-settings";
import { getPublishedPostBySlug } from "./blog";
import { getPublishedPageBySlug } from "./pages";

/** Escape HTML special characters to prevent injection in email templates. */
function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

async function buildUnsubscribeHeaders(email: string, env: CloudflareEnv) {
	const secret = (env as unknown as Record<string, unknown>).UNSUBSCRIBE_SECRET as string;
	const token = await generateUnsubscribeToken(email, secret);
	const url = `${env.SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
	return {
		"List-Unsubscribe": `<${url}>`,
		"List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
	};
}

export async function handleEmailQueue(
	batch: MessageBatch<EmailJob>,
	env: CloudflareEnv,
): Promise<void> {
	for (const message of batch.messages) {
		try {
			const job = message.body;

			switch (job.type) {
				case "waitlist_confirmation": {
					const headers = await buildUnsubscribeHeaders(job.payload.email, env);
					const name = escapeHtml(job.payload.name);
					const referralUrl = `${env.SITE_URL}/waitlist/${encodeURIComponent(job.payload.referralCode)}`;
					await sendEmail(env.RESEND_API_KEY, {
						from: env.FROM_EMAIL,
						to: job.payload.email,
						subject: "You're on the waitlist!",
						html: `<p>Hi ${name},</p>
<p>You're #${job.payload.position} on the waiting list!</p>
<p>Share your referral link to move up: <a href="${referralUrl}">${escapeHtml(referralUrl)}</a></p>`,
						headers,
					});
					break;
				}

				case "referral_notification": {
					const headers = await buildUnsubscribeHeaders(job.payload.email, env);
					const name = escapeHtml(job.payload.name);
					await sendEmail(env.RESEND_API_KEY, {
						from: env.FROM_EMAIL,
						to: job.payload.email,
						subject: "A friend joined via your referral!",
						html: `<p>Hi ${name},</p>
<p>Someone just joined using your referral link! Your effective position is now #${job.payload.newPosition}.</p>`,
						headers,
					});
					break;
				}

				case "giveaway_confirmation": {
					const giveawayHeaders = await buildUnsubscribeHeaders(job.payload.email, env);
					await sendEmail(env.RESEND_API_KEY, {
						from: env.FROM_EMAIL,
						to: job.payload.email,
						subject: "You're entered in the giveaway!",
						html: `<p>You've been entered into the giveaway. Complete bonus actions to increase your chances!</p>`,
						headers: giveawayHeaders,
					});
					break;
				}

				case "contact_receipt": {
					const rawName = job.payload.name.replace(/[\r\n\t]/g, " ");
					const name = escapeHtml(job.payload.name);
					const email = escapeHtml(job.payload.email);
					const msg = escapeHtml(job.payload.message);
					await sendEmail(env.RESEND_API_KEY, {
						from: env.FROM_EMAIL,
						to: env.CONTACT_EMAIL,
						subject: `New contact form submission from ${rawName}`,
						html: `<p><strong>From:</strong> ${name} (${email})</p>
<p><strong>Message:</strong></p>
<p>${msg}</p>`,
					});
					break;
				}

				case "waitlist_admin_notification": {
					const name = escapeHtml(job.payload.name);
					const email = escapeHtml(job.payload.email);
					const sourceLine = job.payload.source
						? `<p><strong>Source:</strong> ${escapeHtml(job.payload.source)}</p>`
						: "";
					await sendEmail(env.RESEND_API_KEY, {
						from: env.FROM_EMAIL,
						to: env.CONTACT_EMAIL,
						subject: `New waitlist signup: ${escapeHtml(job.payload.name)}`,
						html: `<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Position:</strong> #${job.payload.position}</p>
${sourceLine}`,
					});
					break;
				}

				case "campaign_email": {
					const headers = await buildUnsubscribeHeaders(job.payload.to, env);
					await sendEmail(env.RESEND_API_KEY, {
						from: env.FROM_EMAIL,
						to: job.payload.to,
						subject: job.payload.subject,
						html: job.payload.html,
						headers,
					});
					break;
				}

				case "email_verification": {
					const name = escapeHtml(job.payload.name);
					const secret = (env as unknown as Record<string, unknown>).UNSUBSCRIBE_SECRET as string;
					// Prefix email with "verify:" to produce a different HMAC than unsubscribe tokens
					const verifyToken = await generateUnsubscribeToken("verify:" + job.payload.email, secret);
					const verifyUrl = `${env.SITE_URL}/api/verify-email?email=${encodeURIComponent(job.payload.email)}&token=${encodeURIComponent(verifyToken)}`;
					await sendEmail(env.RESEND_API_KEY, {
						from: env.FROM_EMAIL,
						to: job.payload.email,
						subject: "Verify your email to complete your signup",
						html: `<p>Hi ${name},</p>
<p>Please verify your email to complete your signup:</p>
<p><a href="${escapeHtml(verifyUrl)}">Verify Email</a></p>
<p>If you didn't sign up, you can safely ignore this email.</p>`,
					});
					break;
				}

				case "newsletter_confirmation": {
					const headers = await buildUnsubscribeHeaders(job.payload.email, env);
					const name = escapeHtml(job.payload.name);
					await sendEmail(env.RESEND_API_KEY, {
						from: env.FROM_EMAIL,
						to: job.payload.email,
						subject: "Thanks for subscribing!",
						html: `<p>Hi ${name},</p>
<p>Thanks for subscribing to our newsletter! You'll receive our latest updates and news directly in your inbox.</p>`,
						headers,
					});
					break;
				}

				case "newsletter_admin_notification": {
					const name = escapeHtml(job.payload.name);
					const email = escapeHtml(job.payload.email);
					const sourceLine = job.payload.source
						? `<p><strong>Source:</strong> ${escapeHtml(job.payload.source)}</p>`
						: "";
					await sendEmail(env.RESEND_API_KEY, {
						from: env.FROM_EMAIL,
						to: env.CONTACT_EMAIL,
						subject: `New newsletter subscriber: ${escapeHtml(job.payload.name)}`,
						html: `<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
${sourceLine}`,
					});
					break;
				}

				case "og_site": {
					const bucket = (env as unknown as Record<string, unknown>).ASSETS_BUCKET as R2Bucket;
					const settings = await getSiteSettingsDirect();
					await generateSiteOg(settings, bucket);
					break;
				}

				case "og_post": {
					const bucket = (env as unknown as Record<string, unknown>).ASSETS_BUCKET as R2Bucket;
					const [post, settings] = await Promise.all([
						getPublishedPostBySlug(job.payload.slug),
						getSiteSettingsDirect(),
					]);
					if (post) {
						await generatePostOg(post, settings, bucket);
					}
					break;
				}

				case "og_page": {
					const bucket = (env as unknown as Record<string, unknown>).ASSETS_BUCKET as R2Bucket;
					const [page, settings] = await Promise.all([
						getPublishedPageBySlug(job.payload.slug),
						getSiteSettingsDirect(),
					]);
					if (page) {
						await generatePageOg(page, settings, bucket);
					}
					break;
				}

				default:
					console.error("Unknown email job type encountered");
					message.retry();
					continue;
			}

			message.ack();
		} catch {
			message.retry();
		}
	}
}
