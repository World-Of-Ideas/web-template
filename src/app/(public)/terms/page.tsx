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
		title: "Terms of Use",
		description: `Terms of use for ${settings.name}.`,
		openGraph: {
			title: "Terms of Use",
			description: `Terms of use for ${settings.name}.`,
			url: `${siteConfig.url}/terms`,
		},
		alternates: {
			canonical: `${siteConfig.url}/terms`,
		},
	};
}

export default async function TermsPage() {
	const settings = await getSiteSettings();
	const page = await getPageBySlug("terms");
	const faqs = (page?.faqs as FAQ[] | null) ?? [];
	const relatedPages = (page?.relatedPages as RelatedPage[] | null) ?? [];

	return (
		<>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "WebPage",
					name: `Terms of Use | ${settings.name}`,
					url: `${siteConfig.url}/terms`,
					description: `Terms of use for ${settings.name}.`,
				}}
			/>

			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
				]}
				currentPage="Terms of Use"
			/>

			<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Terms of Use
				</h1>

				{page?.content ? (
					<div className="mt-8">
						<ContentRenderer blocks={page.content} features={settings.features} />
					</div>
				) : (
					<p className="mt-8 text-muted-foreground">
						Terms of use content is being prepared.
					</p>
				)}
			</div>

			{faqs.length > 0 && <FaqSection faqs={faqs} />}
			{relatedPages.length > 0 && <RelatedPages pages={relatedPages} features={settings.features} />}
		</>
	);
}
