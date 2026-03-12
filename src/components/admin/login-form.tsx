"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Turnstile } from "@/components/shared/turnstile";

export function LoginForm() {
	const [password, setPassword] = useState("");
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
			const res = await fetch("/api/admin/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password, turnstileToken }),
			});

			const data = (await res.json()) as { error?: { code: string; message: string } };

			if (!res.ok) {
				setError(data.error?.message ?? "Incorrect password.");
				return;
			}

			// Full page navigation to force server re-render of admin layout
			// (client-side router.push would reuse the cached login layout without sidebar)
			window.location.href = "/admin/dashboard";
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="admin-password">Password</Label>
				<Input
					id="admin-password"
					type="password"
					placeholder="Enter admin password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					disabled={isSubmitting}
					autoFocus
				/>
			</div>

			<Turnstile onSuccess={setTurnstileToken} />

			{error && (
				<p className="text-sm text-destructive" role="alert">{error}</p>
			)}

			<Button type="submit" className="w-full" disabled={isSubmitting || !turnstileToken}>
				{isSubmitting ? "Signing in..." : "Sign In"}
			</Button>
		</form>
	);
}
