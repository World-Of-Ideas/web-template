import type { Metadata } from "next";
import Link from "next/link";
import { getWebhooks } from "@/lib/webhooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
	title: "Webhooks | Admin",
};

export default async function WebhooksPage() {
	const hooks = await getWebhooks();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Webhooks</h1>
				<Button asChild>
					<Link href="/admin/webhooks/new">New Webhook</Link>
				</Button>
			</div>

			{hooks.length === 0 ? (
				<p className="text-muted-foreground">
					No webhooks configured.
				</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>URL</TableHead>
							<TableHead>Events</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Created</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{hooks.map((hook) => {
							const events = hook.events as string[];
							return (
								<TableRow key={hook.id}>
									<TableCell className="max-w-xs truncate font-mono text-sm">
										{hook.url}
									</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1">
											{events.map((event) => (
												<Badge
													key={event}
													variant="outline"
												>
													{event}
												</Badge>
											))}
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant={
												hook.active
													? "default"
													: "secondary"
											}
										>
											{hook.active
												? "Active"
												: "Inactive"}
										</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{hook.createdAt}
									</TableCell>
									<TableCell>
										<Button
											asChild
											variant="ghost"
											size="sm"
										>
											<Link
												href={`/admin/webhooks/${hook.id}/edit`}
											>
												Edit
											</Link>
										</Button>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
