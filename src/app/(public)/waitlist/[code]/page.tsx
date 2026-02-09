import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { ReferralDashboard } from "@/components/waitlist/referral-dashboard";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: `Your Waitlist Position | ${siteConfig.name}`,
		description: `Track your waitlist position and share your referral link for ${siteConfig.name}.`,
		openGraph: {
			title: `Your Waitlist Position | ${siteConfig.name}`,
			description: `Track your waitlist position and share your referral link for ${siteConfig.name}.`,
		},
		robots: { index: false },
	};
}

export default async function ReferralPage({
	params,
}: {
	params: Promise<{ code: string }>;
}) {
	if (!siteConfig.features.waitlist) {
		notFound();
	}

	const { code } = await params;

	return (
		<>
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Waitlist", href: "/waitlist" },
					{ label: "Your Position", href: `/waitlist/${code}` },
				]}
			/>

			<div className="mx-auto max-w-3xl px-6 py-16">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Your Waitlist Position
				</h1>

				<div className="mt-8">
					<ReferralDashboard code={code} />
				</div>
			</div>
		</>
	);
}
