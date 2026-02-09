import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getPageBySlug } from "@/lib/pages";
import { ContentRenderer } from "@/components/content/content-renderer";
import { SignupForm } from "@/components/waitlist/signup-form";
import { FaqSection } from "@/components/layout/faq-section";
import { RelatedPages } from "@/components/layout/related-pages";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import type { FAQ, RelatedPage } from "@/types/content";

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: `Join the Waitlist | ${siteConfig.name}`,
		description: `Sign up for early access to ${siteConfig.name}. Be the first to know when we launch.`,
		openGraph: {
			title: `Join the Waitlist | ${siteConfig.name}`,
			description: `Sign up for early access to ${siteConfig.name}.`,
			url: `${siteConfig.url}/waitlist`,
		},
		alternates: {
			canonical: `${siteConfig.url}/waitlist`,
		},
	};
}

export default async function WaitlistPage({
	searchParams,
}: {
	searchParams: Promise<{ ref?: string }>;
}) {
	if (!siteConfig.features.waitlist) {
		notFound();
	}

	const params = await searchParams;
	const page = await getPageBySlug("waitlist");

	const faqs = (page?.faqs ?? []) as FAQ[];
	const relatedPages = (page?.relatedPages ?? []) as RelatedPage[];

	return (
		<>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "WebPage",
					name: `Join the Waitlist | ${siteConfig.name}`,
					url: `${siteConfig.url}/waitlist`,
				}}
			/>

			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Waitlist", href: "/waitlist" },
				]}
			/>

			<div className="mx-auto max-w-3xl px-6 py-16">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Join the Waitlist
				</h1>

				{page?.content && (
					<div className="mt-8">
						<ContentRenderer blocks={page.content} />
					</div>
				)}

				<div className="mt-8">
					<SignupForm referralCode={params.ref} />
				</div>
			</div>

			{faqs.length > 0 && <FaqSection faqs={faqs} />}
			{relatedPages.length > 0 && <RelatedPages pages={relatedPages} />}
		</>
	);
}
