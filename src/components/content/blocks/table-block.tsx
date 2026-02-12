import type { ContentBlock } from "@/types/content";

interface TableBlockProps {
	block: ContentBlock;
}

export function TableBlock({ block }: TableBlockProps) {
	if (!block.headers || !block.rows) return null;

	return (
		<div className="not-prose my-6 overflow-x-auto">
			<table className="w-full border-collapse text-sm" aria-label="Data table">
				<thead>
					<tr className="border-b border-border dark:border-white/20">
						{block.headers.map((header, i) => (
							<th key={i} className="px-4 py-2 text-left font-semibold">
								{header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{block.rows.map((row, i) => (
						<tr key={i} className="border-b border-border dark:border-white/20">
							{row.map((cell, j) => (
								<td key={j} className="px-4 py-2">
									{cell}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
