"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface CampaignActionsProps {
	id: number;
	status: string;
}

export function CampaignActions({ id, status }: CampaignActionsProps) {
	const router = useRouter();
	const [isSending, setIsSending] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState("");

	async function handleSend() {
		if (!confirm("Are you sure you want to send this campaign to all active subscribers?")) return;
		setError("");
		setIsSending(true);

		try {
			const res = await fetch(`/api/admin/campaigns/${id}/send`, {
				method: "POST",
			});

			const data = (await res.json()) as { ok: boolean; data?: { sent: number; total: number }; error?: { message: string } };

			if (!res.ok) {
				setError(data.error?.message ?? "Failed to send campaign.");
				return;
			}

			router.refresh();
		} catch {
			setError("Failed to send campaign. Please try again.");
		} finally {
			setIsSending(false);
		}
	}

	async function handleDelete() {
		if (!confirm("Are you sure you want to delete this campaign?")) return;
		setError("");
		setIsDeleting(true);

		try {
			const res = await fetch(`/api/admin/campaigns/${id}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const data = (await res.json()) as { error?: { message: string } };
				setError(data.error?.message ?? "Failed to delete campaign.");
				return;
			}

			router.refresh();
		} catch {
			setError("Failed to delete campaign. Please try again.");
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<div className="flex items-center gap-2">
			{status === "draft" && (
				<>
					<Button
						variant="outline"
						size="sm"
						onClick={handleSend}
						disabled={isSending || isDeleting}
					>
						{isSending ? "Sending..." : "Send"}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleDelete}
						disabled={isSending || isDeleting}
					>
						{isDeleting ? "Deleting..." : "Delete"}
					</Button>
				</>
			)}
			{error && (
				<span className="text-xs text-destructive" role="alert">{error}</span>
			)}
		</div>
	);
}
