import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getSiteSettings } from "@/lib/site-settings";
import { getPageBySlug } from "@/lib/pages";
import { ContentRenderer } from "@/components/content/content-renderer";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { FaqSection } from "@/components/layout/faq-section";
import { RelatedPages } from "@/components/layout/related-pages";
import type { FAQ, RelatedPage } from "@/types/content";

export async function generateMetadata(): Promise<Metadata> {
	const settings = await getSiteSettings();
	return {
		title: "Privacy Policy",
		description: `Privacy policy for ${settings.name}.`,
		openGraph: {
			title: "Privacy Policy",
			description: `Privacy policy for ${settings.name}.`,
			url: `${siteConfig.url}/privacy`,
		},
		alternates: {
			canonical: `${siteConfig.url}/privacy`,
		},
	};
}

export default async function PrivacyPage() {
	const settings = await getSiteSettings();
	const page = await getPageBySlug("privacy");
	const faqs = (page?.faqs as FAQ[] | null) ?? [];
	const relatedPages = (page?.relatedPages as RelatedPage[] | null) ?? [];

	return (
		<>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "WebPage",
					name: `Privacy Policy | ${settings.name}`,
					url: `${siteConfig.url}/privacy`,
					description: `Privacy policy for ${settings.name}.`,
				}}
			/>

			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
				]}
				currentPage="Privacy Policy"
			/>

			<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Privacy Policy
				</h1>

				{page?.content ? (
					<div className="mt-8">
						<ContentRenderer blocks={page.content} features={settings.features} />
					</div>
				) : (
					<p className="mt-8 text-muted-foreground">
						Privacy policy content is being prepared.
					</p>
				)}
			</div>

			{faqs.length > 0 && <FaqSection faqs={faqs} />}
			{relatedPages.length > 0 && <RelatedPages pages={relatedPages} features={settings.features} />}
		</>
	);
}
