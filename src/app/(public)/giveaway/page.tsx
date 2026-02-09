import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
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
	return {
		title: `Giveaway | ${siteConfig.name}`,
		description: `Enter the ${siteConfig.name} giveaway for a chance to win.`,
		openGraph: {
			title: `Giveaway | ${siteConfig.name}`,
			description: `Enter the ${siteConfig.name} giveaway for a chance to win.`,
			url: `${siteConfig.url}/giveaway`,
		},
		alternates: {
			canonical: `${siteConfig.url}/giveaway`,
		},
	};
}

export default async function GiveawayPage() {
	if (!siteConfig.features.giveaway) {
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
					name: `${siteConfig.name} Giveaway`,
					url: `${siteConfig.url}/giveaway`,
					description: `Enter the ${siteConfig.name} giveaway for a chance to win.`,
					...(endDate && { endDate }),
					organizer: {
						"@type": "Organization",
						name: siteConfig.name,
						url: siteConfig.url,
					},
				}}
			/>

			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Giveaway", href: "/giveaway" },
				]}
			/>

			<div className="mx-auto max-w-3xl px-6 py-16">
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
						<ContentRenderer blocks={page.content} />
					</div>
				)}

				<div className="mt-8">
					<EntryForm />
				</div>
			</div>

			{faqs.length > 0 && <FaqSection faqs={faqs} />}
			{relatedPages.length > 0 && <RelatedPages pages={relatedPages} />}
		</>
	);
}
