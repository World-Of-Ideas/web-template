import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getSiteSettings } from "@/lib/site-settings";
import { getPublishedPageBySlug } from "@/lib/pages";
import { ContentRenderer } from "@/components/content/content-renderer";
import { FaqSection } from "@/components/layout/faq-section";
import { RelatedPages } from "@/components/layout/related-pages";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { PricingTiers } from "@/components/pricing/pricing-tiers";
import type { FAQ, RelatedPage, PricingTier } from "@/types/content";

export async function generateMetadata(): Promise<Metadata> {
	const settings = await getSiteSettings();
	return {
		title: "Pricing",
		description: `Simple, transparent pricing for ${settings.name}.`,
		openGraph: {
			title: "Pricing",
			description: `Simple, transparent pricing for ${settings.name}.`,
			url: `${siteConfig.url}/pricing`,
		},
		alternates: {
			canonical: `${siteConfig.url}/pricing`,
		},
	};
}

export default async function PricingPage() {
	const settings = await getSiteSettings();
	if (!settings.features.pricing) {
		notFound();
	}

	const page = await getPublishedPageBySlug("pricing");
	const faqs = (page?.faqs ?? []) as FAQ[];
	const relatedPages = (page?.relatedPages ?? []) as RelatedPage[];
	const metadata = page?.metadata as Record<string, unknown> | null;
	const tiers = (metadata?.tiers ?? []) as PricingTier[];

	return (
		<>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "WebPage",
					name: "Pricing",
					url: `${siteConfig.url}/pricing`,
					description: `Simple, transparent pricing for ${settings.name}.`,
				}}
			/>

			<Breadcrumbs
				items={[{ label: "Home", href: "/" }]}
				currentPage="Pricing"
			/>

			<div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
						Pricing
					</h1>
					<p className="mt-3 text-base text-muted-foreground sm:text-lg">
						Simple, transparent pricing for every stage of growth.
					</p>
				</div>

				{page?.content && (
					<div className="mt-8">
						<ContentRenderer blocks={page.content} features={settings.features} />
					</div>
				)}

				{tiers.length > 0 && (
					<div className="mt-12">
						<PricingTiers tiers={tiers} />
					</div>
				)}
			</div>

			{faqs.length > 0 && <FaqSection faqs={faqs} />}
			{relatedPages.length > 0 && <RelatedPages pages={relatedPages} features={settings.features} />}
		</>
	);
}
