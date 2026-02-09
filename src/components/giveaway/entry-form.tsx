"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Turnstile } from "@/components/shared/turnstile";
import { ActionCard } from "./action-card";

const GIVEAWAY_ACTIONS = [
	{ action: "twitter_follow", label: "Follow us on Twitter", bonusEntries: 2 },
	{ action: "twitter_share", label: "Share on Twitter", bonusEntries: 3 },
	{ action: "referral", label: "Refer a friend", bonusEntries: 5 },
];

interface EntryState {
	entryId: number;
	email: string;
	completedActions: string[];
}

export function EntryForm() {
	const [email, setEmail] = useState("");
	const [turnstileToken, setTurnstileToken] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [entry, setEntry] = useState<EntryState | null>(null);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");

		if (!turnstileToken) {
			setError("Please complete the verification.");
			return;
		}

		setIsSubmitting(true);

		try {
			const res = await fetch("/api/giveaway/enter", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, turnstileToken }),
			});

			const data = (await res.json()) as {
				error?: { code: string; message: string };
				data?: { entryId: number; totalEntries: number; existing?: boolean };
			};

			if (!res.ok) {
				if (data.error?.code === "GIVEAWAY_ENDED") {
					setError("This giveaway has ended. Thanks for your interest!");
				} else {
					setError(data.error?.message ?? "Something went wrong. Please try again.");
				}
				return;
			}

			setEntry({
				entryId: data.data!.entryId,
				email,
				completedActions: [],
			});
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleActionCompleted(action: string) {
		setEntry((prev) =>
			prev
				? { ...prev, completedActions: [...prev.completedActions, action] }
				: prev,
		);
	}

	if (entry) {
		return (
			<div className="space-y-4">
				<div className="rounded-lg border bg-card p-4 text-center">
					<p className="text-lg font-semibold">You're in!</p>
					<p className="text-sm text-muted-foreground">
						Complete actions below to earn bonus entries.
					</p>
				</div>

				<div className="grid gap-3">
					{GIVEAWAY_ACTIONS.map((a) => (
						<ActionCard
							key={a.action}
							email={entry.email}
							action={a.action}
							label={a.label}
							bonusEntries={a.bonusEntries}
							completed={entry.completedActions.includes(a.action)}
							onCompleted={() => handleActionCompleted(a.action)}
						/>
					))}
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="giveaway-email">Email</Label>
				<Input
					id="giveaway-email"
					type="email"
					placeholder="you@example.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					disabled={isSubmitting}
				/>
			</div>

			<Turnstile onSuccess={setTurnstileToken} />

			{error && (
				<p className="text-sm text-destructive">{error}</p>
			)}

			<Button type="submit" className="w-full" disabled={isSubmitting}>
				{isSubmitting ? "Entering..." : "Enter Giveaway"}
			</Button>
		</form>
	);
}
