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
import { ChangelogEntries } from "@/components/changelog/changelog-entries";
import type { FAQ, RelatedPage, ChangelogEntry } from "@/types/content";

export async function generateMetadata(): Promise<Metadata> {
	const settings = await getSiteSettings();
	return {
		title: "Changelog",
		description: `Latest updates and improvements to ${settings.name}.`,
		openGraph: {
			title: "Changelog",
			description: `Latest updates and improvements to ${settings.name}.`,
			url: `${siteConfig.url}/changelog`,
		},
		alternates: {
			canonical: `${siteConfig.url}/changelog`,
		},
	};
}

export default async function ChangelogPage() {
	const settings = await getSiteSettings();
	if (!settings.features.changelog) {
		notFound();
	}

	const page = await getPublishedPageBySlug("changelog");
	const faqs = (page?.faqs ?? []) as FAQ[];
	const relatedPages = (page?.relatedPages ?? []) as RelatedPage[];
	const metadata = page?.metadata as Record<string, unknown> | null;
	const entries = (metadata?.entries ?? []) as ChangelogEntry[];

	return (
		<>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "WebPage",
					name: "Changelog",
					url: `${siteConfig.url}/changelog`,
					description: `Latest updates and improvements to ${settings.name}.`,
				}}
			/>

			<Breadcrumbs
				items={[{ label: "Home", href: "/" }]}
				currentPage="Changelog"
			/>

			<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
					Changelog
				</h1>
				<p className="mt-3 text-base text-muted-foreground sm:text-lg">
					Stay up to date with the latest product updates and improvements.
				</p>

				{page?.content && (
					<div className="mt-8">
						<ContentRenderer blocks={page.content} features={settings.features} />
					</div>
				)}

				{entries.length > 0 && (
					<div className="mt-12">
						<ChangelogEntries entries={entries} />
					</div>
				)}
			</div>

			{faqs.length > 0 && <FaqSection faqs={faqs} />}
			{relatedPages.length > 0 && <RelatedPages pages={relatedPages} features={settings.features} />}
		</>
	);
}
