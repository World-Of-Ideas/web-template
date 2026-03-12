/**
 * Client-side CSV generation and download.
 * Runs in the browser to avoid consuming Cloudflare Workers CPU time.
 */

function escapeCsvValue(value: unknown): string {
	if (value === null || value === undefined) return "";
	const str = String(value);
	if (str.includes(",") || str.includes("\n") || str.includes("\r") || str.includes('"')) {
		return '"' + str.replace(/"/g, '""') + '"';
	}
	return str;
}

export function downloadCsv(
	headers: string[],
	rows: Record<string, unknown>[],
	keys: string[],
	filename: string,
) {
	const headerLine = headers.map(escapeCsvValue).join(",");
	const dataLines = rows.map((row) =>
		keys.map((key) => escapeCsvValue(row[key])).join(","),
	);
	const csv = [headerLine, ...dataLines].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}
