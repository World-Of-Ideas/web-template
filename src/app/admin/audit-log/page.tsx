import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getAuditLog } from "@/lib/audit";

export const metadata: Metadata = {
	title: "Audit Log | Admin",
};

function getActionBadgeVariant(
	action: string,
): "default" | "secondary" | "destructive" | "outline" {
	if (action.endsWith(".create")) return "default";
	if (action.endsWith(".update")) return "secondary";
	if (action.endsWith(".delete")) return "destructive";
	if (action === "login" || action === "logout") return "outline";
	return "default";
}

function formatDetails(details: string | null): string {
	if (!details) return "";
	try {
		const parsed = JSON.parse(details);
		const str = JSON.stringify(parsed);
		return str.length > 100 ? str.slice(0, 100) + "..." : str;
	} catch {
		return details.length > 100 ? details.slice(0, 100) + "..." : details;
	}
}

export default async function AuditLogPage() {
	const { items, total } = await getAuditLog(1, 100);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Audit Log</h1>
				<p className="text-sm text-muted-foreground">
					{total} event{total !== 1 ? "s" : ""}
				</p>
			</div>

			{items.length === 0 ? (
				<p className="text-muted-foreground">No audit events recorded.</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Time</TableHead>
							<TableHead>Action</TableHead>
							<TableHead>Entity</TableHead>
							<TableHead>Details</TableHead>
							<TableHead>IP Address</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.map((event) => (
							<TableRow key={event.id}>
								<TableCell className="whitespace-nowrap text-muted-foreground">
									{new Date(event.createdAt + "Z").toLocaleString()}
								</TableCell>
								<TableCell>
									<Badge variant={getActionBadgeVariant(event.action)}>
										{event.action}
									</Badge>
								</TableCell>
								<TableCell className="font-mono text-xs">
									{event.entityType
										? `${event.entityType}${event.entityId ? ` #${event.entityId}` : ""}`
										: "—"}
								</TableCell>
								<TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
									{formatDetails(event.details) || "—"}
								</TableCell>
								<TableCell className="font-mono text-xs text-muted-foreground">
									{event.ipAddress ?? "—"}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
