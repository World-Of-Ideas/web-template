import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteSettings } from "@/lib/site-settings";
import { CampaignEditor } from "@/components/admin/campaign-editor";

export const metadata: Metadata = {
	title: "New Campaign | Admin",
};

export default async function NewCampaignPage() {
	const settings = await getSiteSettings();
	if (!settings.features.waitlist) notFound();

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">New Campaign</h1>
			<CampaignEditor />
		</div>
	);
}
