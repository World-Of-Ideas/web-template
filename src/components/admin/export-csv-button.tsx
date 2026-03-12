"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv-export";

interface ExportCsvButtonProps {
	endpoint: string;
	headers: string[];
	keys: string[];
	filename: string;
}

export function ExportCsvButton({ endpoint, headers, keys, filename }: ExportCsvButtonProps) {
	const [loading, setLoading] = useState(false);

	async function handleExport() {
		setLoading(true);
		try {
			const res = await fetch(endpoint);
			if (!res.ok) return;
			const json = (await res.json()) as { data?: { rows?: Record<string, unknown>[] } };
			const rows = json.data?.rows ?? [];
			downloadCsv(headers, rows, keys, filename);
		} finally {
			setLoading(false);
		}
	}

	return (
		<Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
			{loading ? "Exporting..." : "Export CSV"}
		</Button>
	);
}
