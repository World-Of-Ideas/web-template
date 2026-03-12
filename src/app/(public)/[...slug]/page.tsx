import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getSiteSettings } from "@/lib/site-settings";
import { getPublishedPageBySlug, getChildPages } from "@/lib/pages";
import { FaqSection } from "@/components/layout/faq-section";
import { RelatedPages } from "@/components/layout/related-pages";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { DefaultTemplate } from "@/components/templates/default-template";
import { LandingTemplate } from "@/components/templates/landing-template";
import { ListingTemplate } from "@/components/templates/listing-template";
import { PillarTemplate } from "@/components/templates/pillar-template";
import type { FAQ, RelatedPage, PageLayout } from "@/types/content";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const fullSlug = slug.join("/");
	const page = await getPublishedPageBySlug(fullSlug);

	if (!page) {
		return { title: "Page Not Found" };
	}

	const metadata = page.metadata as Record<string, unknown> | null;
	const seoTitle = (metadata?.seoTitle as string) || page.title;
	const noindex = metadata?.noindex as boolean | undefined;

	return {
		title: seoTitle,
		description: page.description ?? undefined,
		...(noindex && { robots: { index: false } }),
		openGraph: {
			title: seoTitle,
			description: page.description ?? undefined,
			url: `${siteConfig.url}/${fullSlug}`,
			images: page.coverImage
				? [{ url: page.coverImage }]
				: [{ url: `${siteConfig.url}/api/og?slug=${encodeURIComponent(fullSlug)}`, width: 1200, height: 630 }],
		},
		alternates: {
			canonical: `${siteConfig.url}/${fullSlug}`,
		},
	};
}

export default async function CatchAllPage({
	params,
}: {
	params: Promise<{ slug: string[] }>;
}) {
	const { slug } = await params;
	const fullSlug = slug.join("/");
	const page = await getPublishedPageBySlug(fullSlug);

	if (!page) {
		notFound();
	}

	const { title, description, content, faqs: rawFaqs, relatedPages: rawRelated, layout: rawLayout } = page;
	const faqs = (rawFaqs ?? []) as FAQ[];
	const relatedPages = (rawRelated ?? []) as RelatedPage[];
	const [children, settings] = await Promise.all([
		getChildPages(page.slug),
		getSiteSettings(),
	]);
	const layout = (rawLayout ?? "default") as PageLayout;
	const cardVariant = settings.theme.postCardVariant;

	// Build breadcrumbs from slug hierarchy (all except current page)
	const breadcrumbItems = [{ label: "Home", href: "/" }];
	const slugParts = slug;
	for (let i = 0; i < slugParts.length - 1; i++) {
		const href = `/${slugParts.slice(0, i + 1).join("/")}`;
		breadcrumbItems.push({ label: slugParts[i], href });
	}

	function renderTemplate() {
		switch (layout) {
			case "landing":
				return (
					<LandingTemplate
						title={title}
						description={description}
						content={content}
						features={settings.features}
					/>
				);
			case "listing":
				return (
					<ListingTemplate
						title={title}
						description={description}
						content={content}
						childPages={children}
						cardVariant={cardVariant}
						features={settings.features}
					/>
				);
			case "pillar":
				return (
					<PillarTemplate
						title={title}
						description={description}
						content={content}
						childPages={children}
						cardVariant={cardVariant}
						features={settings.features}
					/>
				);
			default:
				return (
					<DefaultTemplate
						title={title}
						description={description}
						content={content}
						childPages={children}
						features={settings.features}
					/>
				);
		}
	}

	return (
		<>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "WebPage",
					name: title,
					description,
					url: `${siteConfig.url}/${fullSlug}`,
				}}
			/>

			<Breadcrumbs items={breadcrumbItems} currentPage={title} />

			{renderTemplate()}

			{faqs.length > 0 && <FaqSection faqs={faqs} />}
			{relatedPages.length > 0 && <RelatedPages pages={relatedPages} features={settings.features} />}
		</>
	);
}
