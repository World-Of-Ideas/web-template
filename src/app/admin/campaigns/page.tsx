import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import { getCampaigns } from "@/lib/campaigns";
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
import { CampaignActions } from "@/components/admin/campaign-actions";

export const metadata: Metadata = {
	title: "Campaigns | Admin",
};

const statusVariant: Record<string, "secondary" | "outline" | "default" | "destructive"> = {
	draft: "secondary",
	sending: "outline",
	sent: "default",
	failed: "destructive",
};

export default async function CampaignsPage() {
	const settings = await getSiteSettings();
	if (!settings.features.waitlist) notFound();

	const campaigns = await getCampaigns();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Campaigns</h1>
				<Button asChild>
					<Link href="/admin/campaigns/new">New Campaign</Link>
				</Button>
			</div>

			{campaigns.length === 0 ? (
				<p className="text-muted-foreground">
					No campaigns yet. Create your first campaign to get started.
				</p>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Subject</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Recipients</TableHead>
							<TableHead>Sent</TableHead>
							<TableHead>Created</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{campaigns.map((campaign) => (
							<TableRow key={campaign.id}>
								<TableCell className="font-medium max-w-xs truncate">
									{campaign.subject}
								</TableCell>
								<TableCell>
									<Badge variant={statusVariant[campaign.status] ?? "secondary"}>
										{campaign.status}
									</Badge>
								</TableCell>
								<TableCell>{campaign.totalCount}</TableCell>
								<TableCell>{campaign.sentCount}</TableCell>
								<TableCell className="text-muted-foreground">
									{new Date(campaign.createdAt).toLocaleDateString()}
								</TableCell>
								<TableCell>
									<CampaignActions
										id={campaign.id}
										status={campaign.status}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
