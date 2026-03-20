import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { getSubscribers } from "@/lib/waitlist";
import { Badge } from "@/components/ui/badge";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
	title: "Subscribers | Admin",
};

export default async function SubscribersPage() {
	const settings = await getSiteSettingsDirect();
	if (!settings.features.waitlist) notFound();

	const { items: subscribers, total } = await getSubscribers(1, 50);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Subscribers</h1>
				<div className="flex items-center gap-4">
					<p className="text-sm text-muted-foreground">
						{total} total subscriber{total !== 1 ? "s" : ""}
					</p>
					<ExportCsvButton
						endpoint="/api/admin/subscribers/export"
						headers={["Name", "Email", "Referral Code", "Referred By", "Referrals", "Position", "Status", "Source", "Date"]}
						keys={["name", "email", "referralCode", "referredBy", "referralCount", "position", "status", "source", "createdAt"]}
						filename="subscribers.csv"
					/>
				</div>
			</div>

			{subscribers.length === 0 ? (
				<p className="text-muted-foreground">No subscribers yet.</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Referral Code</TableHead>
							<TableHead>Referrals</TableHead>
							<TableHead>Position</TableHead>
							<TableHead>Source</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Date</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{subscribers.map((subscriber) => (
							<TableRow key={subscriber.id}>
								<TableCell className="font-medium">
									{subscriber.name}
								</TableCell>
								<TableCell>{subscriber.email}</TableCell>
								<TableCell className="font-mono text-xs">
									{subscriber.referralCode}
								</TableCell>
								<TableCell>
									{subscriber.referralCount}
								</TableCell>
								<TableCell>#{subscriber.position}</TableCell>
								<TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
									{subscriber.source ?? "—"}
								</TableCell>
								<TableCell>
									<Badge
										variant={
											subscriber.status === "active"
												? "default"
												: subscriber.status ===
													  "unsubscribed"
													? "destructive"
													: "secondary"
										}
									>
										{subscriber.status}
									</Badge>
								</TableCell>
								<TableCell className="text-muted-foreground">
									{new Date(
										subscriber.createdAt,
									).toLocaleDateString()}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
