import type { Metadata } from "next";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { SettingsEditor } from "@/components/admin/settings-editor";

export const metadata: Metadata = {
	title: "Settings | Admin",
};

export default async function SettingsPage() {
	const settings = await getSiteSettingsDirect();

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Settings</h1>
			<SettingsEditor settings={settings} />
		</div>
	);
}
