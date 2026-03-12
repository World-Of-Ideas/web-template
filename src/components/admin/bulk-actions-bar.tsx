"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface BulkActionsBarProps {
	selectedCount: number;
	entityType: "posts" | "pages";
	selectedIds: (number | string)[];
	onClear: () => void;
}

export function BulkActionsBar({ selectedCount, entityType, selectedIds, onClear }: BulkActionsBarProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	if (selectedCount === 0) return null;

	async function handleAction(action: string) {
		if (action === "delete" && !confirm(`Delete ${selectedCount} ${entityType}? This cannot be undone.`)) return;
		setLoading(true);
		try {
			const body = entityType === "posts"
				? { action, ids: selectedIds }
				: { action, slugs: selectedIds };
			const res = await fetch(`/api/admin/${entityType}/bulk`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			if (res.ok) {
				onClear();
				router.refresh();
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex items-center gap-2 rounded-md border bg-muted/50 px-4 py-2">
			<span className="text-sm font-medium">{selectedCount} selected</span>
			<Button size="sm" variant="outline" onClick={() => handleAction("publish")} disabled={loading}>
				Publish
			</Button>
			<Button size="sm" variant="outline" onClick={() => handleAction("unpublish")} disabled={loading}>
				Unpublish
			</Button>
			<Button size="sm" variant="destructive" onClick={() => handleAction("delete")} disabled={loading}>
				Delete
			</Button>
			<Button size="sm" variant="ghost" onClick={onClear} disabled={loading}>
				Clear
			</Button>
		</div>
	);
}
