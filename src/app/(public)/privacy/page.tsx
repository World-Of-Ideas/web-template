import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getPageBySlug } from "@/lib/pages";
import { ContentRenderer } from "@/components/content/content-renderer";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: `Privacy Policy | ${siteConfig.name}`,
		description: `Privacy policy for ${siteConfig.name}.`,
		openGraph: {
			title: `Privacy Policy | ${siteConfig.name}`,
			description: `Privacy policy for ${siteConfig.name}.`,
			url: `${siteConfig.url}/privacy`,
		},
		alternates: {
			canonical: `${siteConfig.url}/privacy`,
		},
	};
}

export default async function PrivacyPage() {
	const page = await getPageBySlug("privacy");

	return (
		<>
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Privacy Policy", href: "/privacy" },
				]}
			/>

			<div className="mx-auto max-w-3xl px-6 py-16">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Privacy Policy
				</h1>

				{page?.content ? (
					<div className="mt-8">
						<ContentRenderer blocks={page.content} />
					</div>
				) : (
					<p className="mt-8 text-muted-foreground">
						Privacy policy content is being prepared.
					</p>
				)}
			</div>
		</>
	);
}
