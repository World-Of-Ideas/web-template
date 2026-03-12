"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function CampaignEditor() {
	const router = useRouter();

	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setIsSaving(true);

		try {
			const res = await fetch("/api/admin/campaigns", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subject, body }),
			});

			const data = (await res.json()) as { error?: { message: string } };

			if (!res.ok) {
				setError(data.error?.message ?? "Failed to create campaign.");
				return;
			}

			router.push("/admin/campaigns");
		} catch {
			setError("Failed to create campaign. Please try again.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="campaign-subject">Subject</Label>
				<Input
					id="campaign-subject"
					value={subject}
					onChange={(e) => setSubject(e.target.value)}
					placeholder="Email subject line"
					maxLength={200}
					required
					disabled={isSaving}
				/>
				<p className="text-xs text-muted-foreground">
					Max 200 characters.
				</p>
			</div>

			<div className="space-y-2">
				<Label htmlFor="campaign-body">Body (HTML)</Label>
				<Textarea
					id="campaign-body"
					value={body}
					onChange={(e) => setBody(e.target.value)}
					placeholder="<h1>Hello!</h1><p>Your email content here...</p>"
					rows={12}
					maxLength={50000}
					required
					disabled={isSaving}
				/>
				<p className="text-xs text-muted-foreground">
					HTML email content. Max 50,000 characters.
				</p>
			</div>

			{error && (
				<p className="text-sm text-destructive" role="alert">{error}</p>
			)}

			<div className="flex gap-3">
				<Button type="submit" disabled={isSaving}>
					{isSaving ? "Creating..." : "Create Campaign"}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => router.push("/admin/campaigns")}
					disabled={isSaving}
				>
					Cancel
				</Button>
			</div>
		</form>
	);
}
