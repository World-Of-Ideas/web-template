import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getSiteSettings } from "@/lib/site-settings";
import { getPageBySlug } from "@/lib/pages";
import { ContentRenderer } from "@/components/content/content-renderer";
import { CountdownTimer } from "@/components/giveaway/countdown-timer";
import { EntryForm } from "@/components/giveaway/entry-form";
import { FaqSection } from "@/components/layout/faq-section";
import { RelatedPages } from "@/components/layout/related-pages";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import type { FAQ, RelatedPage } from "@/types/content";

export async function generateMetadata(): Promise<Metadata> {
	const settings = await getSiteSettings();
	return {
		title: "Giveaway",
		description: `Enter the ${settings.name} giveaway for a chance to win.`,
		openGraph: {
			title: "Giveaway",
			description: `Enter the ${settings.name} giveaway for a chance to win.`,
			url: `${siteConfig.url}/giveaway`,
		},
		alternates: {
			canonical: `${siteConfig.url}/giveaway`,
		},
	};
}

export default async function GiveawayPage() {
	const settings = await getSiteSettings();
	if (!settings.features.giveaway) {
		notFound();
	}

	const page = await getPageBySlug("giveaway");

	const faqs = (page?.faqs ?? []) as FAQ[];
	const relatedPages = (page?.relatedPages ?? []) as RelatedPage[];
	const metadata = page?.metadata as Record<string, unknown> | null;
	const endDate = metadata?.endDate as string | undefined;

	return (
		<>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "Event",
					name: `${settings.name} Giveaway`,
					url: `${siteConfig.url}/giveaway`,
					description: `Enter the ${settings.name} giveaway for a chance to win.`,
					startDate: (metadata as Record<string, unknown> | null)?.startDate as string ?? page?.updatedAt ?? new Date().toISOString(),
					...(endDate && { endDate }),
					organizer: {
						"@type": "Organization",
						name: settings.name,
						url: siteConfig.url,
					},
				}}
			/>

			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
				]}
				currentPage="Giveaway"
			/>

			<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Giveaway
				</h1>

				{endDate && (
					<div className="mt-6">
						<CountdownTimer endDate={endDate} />
					</div>
				)}

				{page?.content && (
					<div className="mt-8">
						<ContentRenderer blocks={page.content} features={settings.features} />
					</div>
				)}

				<div className="mt-8">
					<EntryForm />
				</div>
			</div>

			{faqs.length > 0 && <FaqSection faqs={faqs} />}
			{relatedPages.length > 0 && <RelatedPages pages={relatedPages} features={settings.features} />}
		</>
	);
}
