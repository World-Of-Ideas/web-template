import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { getGiveawayEntries, getGiveawayStats } from "@/lib/giveaway";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
	title: "Giveaway | Admin",
};

export default async function GiveawayPage() {
	const settings = await getSiteSettingsDirect();
	if (!settings.features.giveaway) notFound();

	const [{ items: entries, total }, stats] = await Promise.all([
		getGiveawayEntries(1, 50),
		getGiveawayStats(),
	]);

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Giveaway</h1>

			{/* Stats cards */}
			<div className="grid gap-4 sm:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total Entries
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold">
							{stats.totalEntries}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total Actions
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-bold">
							{stats.totalActions}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Entries table */}
			{entries.length === 0 ? (
				<p className="text-muted-foreground">
					No giveaway entries yet.
				</p>
			) : (
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">
						Showing {entries.length} of {total} entries
					</p>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Email</TableHead>
								<TableHead>Total Entries</TableHead>
								<TableHead>Source</TableHead>
								<TableHead>Date</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{entries.map((entry) => (
								<TableRow key={entry.id}>
									<TableCell className="font-medium">
										{entry.email}
									</TableCell>
									<TableCell>
										{entry.totalEntries}
									</TableCell>
									<TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
										{entry.source ?? "—"}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{new Date(
											entry.createdAt,
										).toLocaleDateString()}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
