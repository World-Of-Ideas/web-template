import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getPageBySlug } from "@/lib/pages";
import { ContentRenderer } from "@/components/content/content-renderer";
import { ContactForm } from "@/components/contact/contact-form";
import { FaqSection } from "@/components/layout/faq-section";
import { RelatedPages } from "@/components/layout/related-pages";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import type { FAQ, RelatedPage } from "@/types/content";

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: `Contact | ${siteConfig.name}`,
		description: `Get in touch with the ${siteConfig.name} team. We'd love to hear from you.`,
		openGraph: {
			title: `Contact | ${siteConfig.name}`,
			description: `Get in touch with the ${siteConfig.name} team.`,
			url: `${siteConfig.url}/contact`,
		},
		alternates: {
			canonical: `${siteConfig.url}/contact`,
		},
	};
}

export default async function ContactPage() {
	if (!siteConfig.features.contact) {
		notFound();
	}

	const page = await getPageBySlug("contact");

	const faqs = (page?.faqs ?? []) as FAQ[];
	const relatedPages = (page?.relatedPages ?? []) as RelatedPage[];

	return (
		<>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "ContactPage",
					name: `Contact | ${siteConfig.name}`,
					url: `${siteConfig.url}/contact`,
				}}
			/>

			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Contact", href: "/contact" },
				]}
			/>

			<div className="mx-auto max-w-3xl px-6 py-16">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Contact Us
				</h1>

				{page?.content && (
					<div className="mt-8">
						<ContentRenderer blocks={page.content} />
					</div>
				)}

				<div className="mt-8">
					<ContactForm />
				</div>
			</div>

			{faqs.length > 0 && <FaqSection faqs={faqs} />}
			{relatedPages.length > 0 && <RelatedPages pages={relatedPages} />}
		</>
	);
}
