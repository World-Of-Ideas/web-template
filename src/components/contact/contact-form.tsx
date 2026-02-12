"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Turnstile } from "@/components/shared/turnstile";
import { getUtmParams } from "@/lib/utm";

export function ContactForm() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [turnstileToken, setTurnstileToken] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [isSuccess, setIsSuccess] = useState(false);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");

		if (!turnstileToken) {
			setError("Please complete the verification.");
			return;
		}

		setIsSubmitting(true);

		try {
			const utm = getUtmParams();
			const source = utm ? `contact-form|${utm}` : "contact-form";

			const res = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, message, turnstileToken, source }),
			});

			const data = (await res.json()) as { error?: { code: string; message: string }; data?: { eventId?: string } };

			if (!res.ok) {
				setError(data.error?.message ?? "Something went wrong. Please try again.");
				return;
			}

			if (data.data?.eventId) {
				window.fbq?.("track", "Lead", {}, { eventID: data.data.eventId });
				window.gtag?.("event", "generate_lead", { event_category: "form", event_label: "contact" });
			}

			setIsSuccess(true);
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	if (isSuccess) {
		return (
			<div className="rounded-xl border bg-card p-6 text-center">
				<h3 className="text-lg font-semibold">Message Sent</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					Thanks for reaching out! We&apos;ll get back to you as soon as possible.
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="contact-name">Name</Label>
				<Input
					id="contact-name"
					type="text"
					placeholder="Your name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
					disabled={isSubmitting}
					className="rounded-full"
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="contact-email">Email</Label>
				<Input
					id="contact-email"
					type="email"
					placeholder="you@example.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					disabled={isSubmitting}
					className="rounded-full"
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="contact-message">Message</Label>
				<Textarea
					id="contact-message"
					placeholder="How can we help?"
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					required
					disabled={isSubmitting}
					className="min-h-[120px] rounded-xl"
				/>
			</div>

			<Turnstile onSuccess={setTurnstileToken} />

			{error && (
				<p className="text-sm text-destructive" role="alert">{error}</p>
			)}

			<button
				type="submit"
				className="w-full rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
				disabled={isSubmitting}
			>
				{isSubmitting ? "Sending..." : "Send Message"}
			</button>
		</form>
	);
}
