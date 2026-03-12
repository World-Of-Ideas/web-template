"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface Asset {
	key: string;
	size: number;
	uploaded: string;
	url: string;
}

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssetsGrid({
	initialAssets,
}: {
	initialAssets: Asset[];
}) {
	const [assets, setAssets] = useState<Asset[]>(initialAssets);
	const [filter, setFilter] = useState<string>("");
	const [deleting, setDeleting] = useState<string | null>(null);

	const filtered = filter
		? assets.filter((a) => a.key.startsWith(filter))
		: assets;

	async function handleDelete(key: string) {
		if (!confirm(`Delete ${key}? This cannot be undone.`)) return;
		setDeleting(key);
		try {
			const res = await fetch("/api/admin/assets", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ key }),
			});
			if (res.ok) {
				setAssets((prev) => prev.filter((a) => a.key !== key));
			}
		} finally {
			setDeleting(null);
		}
	}

	const prefixes = ["blog/", "og/", "uploads/"];

	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				<Button
					size="sm"
					variant={filter === "" ? "default" : "outline"}
					onClick={() => setFilter("")}
				>
					All
				</Button>
				{prefixes.map((p) => (
					<Button
						key={p}
						size="sm"
						variant={filter === p ? "default" : "outline"}
						onClick={() => setFilter(p)}
					>
						{p.replace("/", "")}
					</Button>
				))}
			</div>

			{filtered.length === 0 ? (
				<p className="text-muted-foreground">No assets found.</p>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
					{filtered.map((asset) => (
						<div
							key={asset.key}
							className="group relative overflow-hidden rounded-lg border"
						>
							<div className="aspect-square bg-muted">
								{asset.key.match(/\.(webp|png|jpg|jpeg|gif)$/i) ? (
									<Image
										src={asset.url}
										alt={asset.key}
										width={300}
										height={300}
										className="h-full w-full object-cover"
										unoptimized
									/>
								) : (
									<div className="flex h-full items-center justify-center text-xs text-muted-foreground">
										{asset.key.split(".").pop()?.toUpperCase()}
									</div>
								)}
							</div>
							<div className="p-2">
								<p
									className="truncate text-xs font-medium"
									title={asset.key}
								>
									{asset.key.split("/").pop()}
								</p>
								<p className="text-xs text-muted-foreground">
									{formatSize(asset.size)} &middot;{" "}
									{new Date(asset.uploaded).toLocaleDateString()}
								</p>
							</div>
							<div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
								<Button
									size="sm"
									variant="destructive"
									onClick={() => handleDelete(asset.key)}
									disabled={deleting === asset.key}
								>
									{deleting === asset.key ? "Deleting..." : "Delete"}
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			<p className="text-sm text-muted-foreground">
				{filtered.length} asset{filtered.length !== 1 ? "s" : ""}
				{filter && ` in ${filter}`}
			</p>
		</div>
	);
}
