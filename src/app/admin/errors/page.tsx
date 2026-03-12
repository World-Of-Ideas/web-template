import type { Metadata } from "next";
import { getErrorLog } from "@/lib/error-tracking";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
	title: "Error Log | Admin",
};

function levelVariant(level: string) {
	switch (level) {
		case "error":
			return "destructive" as const;
		case "warning":
			return "outline" as const;
		default:
			return "secondary" as const;
	}
}

export default async function ErrorLogPage() {
	const { items, total } = await getErrorLog(1, 100);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Error Log</h1>
				<p className="text-sm text-muted-foreground">
					{total} event{total !== 1 ? "s" : ""}
				</p>
			</div>

			{items.length === 0 ? (
				<p className="text-muted-foreground">No errors recorded.</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Time</TableHead>
							<TableHead>Level</TableHead>
							<TableHead>Source</TableHead>
							<TableHead>Message</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.map((entry) => (
							<TableRow key={entry.id}>
								<TableCell className="whitespace-nowrap text-muted-foreground">
									{new Date(entry.createdAt + "Z").toLocaleString()}
								</TableCell>
								<TableCell>
									<Badge variant={levelVariant(entry.level)}>
										{entry.level}
									</Badge>
								</TableCell>
								<TableCell className="text-muted-foreground">
									{entry.source ?? "—"}
								</TableCell>
								<TableCell className="max-w-md truncate">
									{entry.message}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
