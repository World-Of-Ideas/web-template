"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function LoginForm() {
	const router = useRouter();
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setIsSubmitting(true);

		try {
			const res = await fetch("/api/admin/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			});

			const data = (await res.json()) as { error?: { code: string; message: string } };

			if (!res.ok) {
				setError(data.error?.message ?? "Incorrect password.");
				return;
			}

			router.push("/admin/dashboard");
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

			{error && (
				<p className="text-sm text-destructive">{error}</p>
			)}

			<Button type="submit" className="w-full" disabled={isSubmitting}>
				{isSubmitting ? "Signing in..." : "Sign In"}
			</Button>
		</form>
	);
}
