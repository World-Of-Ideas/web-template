"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Turnstile } from "@/components/shared/turnstile";
import { getUtmParams } from "@/lib/utm";

interface SignupFormProps {
	referralCode?: string;
}

export function SignupForm({ referralCode }: SignupFormProps) {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [turnstileToken, setTurnstileToken] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

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
			const source = utm ? `waitlist-form|${utm}` : "waitlist-form";

			const res = await fetch("/api/waitlist", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, name, turnstileToken, ref: referralCode, source }),
			});

			const data = (await res.json()) as { error?: { code: string; message: string }; data?: { referralCode: string; eventId?: string } };

			if (!res.ok) {
				setError(data.error?.message ?? "Something went wrong. Please try again.");
				return;
			}

			if (data.data?.eventId) {
				window.fbq?.("track", "Lead", {}, { eventID: data.data.eventId });
				window.gtag?.("event", "generate_lead", { event_category: "form", event_label: "waitlist" });
			}

			router.push(`/waitlist/${data.data?.referralCode}`);
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
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
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					type="email"
					placeholder="you@example.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					disabled={isSubmitting}
					className="rounded-full"
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
				{isSubmitting ? "Joining..." : "Join the Waitlist"}
			</button>
		</form>
	);
}
