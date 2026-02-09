import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getPublishedPageBySlug, getChildPages } from "@/lib/pages";
import { ContentRenderer } from "@/components/content/content-renderer";
import { FaqSection } from "@/components/layout/faq-section";
import { RelatedPages } from "@/components/layout/related-pages";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import type { FAQ, RelatedPage } from "@/types/content";

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

	return {
		title: page.title,
		description: page.description ?? undefined,
		openGraph: {
			title: page.title,
			description: page.description ?? undefined,
			...(page.coverImage && {
				images: [{ url: page.coverImage }],
			}),
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

	const faqs = (page.faqs ?? []) as FAQ[];
	const relatedPages = (page.relatedPages ?? []) as RelatedPage[];
	const children = await getChildPages(page.slug);

	// Build breadcrumbs from slug hierarchy
	const breadcrumbItems = [{ label: "Home", href: "/" }];
	const slugParts = slug;
	for (let i = 0; i < slugParts.length; i++) {
		const href = `/${slugParts.slice(0, i + 1).join("/")}`;
		const label = i === slugParts.length - 1 ? page.title : slugParts[i];
		breadcrumbItems.push({ label, href });
	}

	return (
		<>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "WebPage",
					name: page.title,
					description: page.description,
					url: `${siteConfig.url}/${fullSlug}`,
				}}
			/>

			<Breadcrumbs items={breadcrumbItems} />

			<div className="mx-auto max-w-3xl px-6 py-16">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					{page.title}
				</h1>

				{page.description && (
					<p className="mt-2 text-lg text-muted-foreground">
						{page.description}
					</p>
				)}

				{page.content && (
					<div className="mt-8">
						<ContentRenderer blocks={page.content} />
					</div>
				)}

				{/* Child pages grid */}
				{children.length > 0 && (
					<div className="mt-12">
						<h2 className="text-2xl font-bold tracking-tight">In This Section</h2>
						<div className="mt-6 grid gap-6 sm:grid-cols-2">
							{children.map((child) => (
								<Link
									key={child.slug}
									href={`/${child.slug}`}
									className="group rounded-lg border p-6 transition-colors hover:bg-accent"
								>
									<h3 className="font-semibold group-hover:text-primary">
										{child.title}
									</h3>
									{child.description && (
										<p className="mt-2 text-sm text-muted-foreground">
											{child.description}
										</p>
									)}
								</Link>
							))}
						</div>
					</div>
				)}
			</div>

			{faqs.length > 0 && <FaqSection faqs={faqs} />}
			{relatedPages.length > 0 && <RelatedPages pages={relatedPages} />}
		</>
	);
}
