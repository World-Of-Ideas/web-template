import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getSiteSettings } from "@/lib/site-settings";
import { getPageBySlug } from "@/lib/pages";
import { ContentRenderer } from "@/components/content/content-renderer";
import { ContactForm } from "@/components/contact/contact-form";
import { FaqSection } from "@/components/layout/faq-section";
import { RelatedPages } from "@/components/layout/related-pages";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import type { FAQ, RelatedPage } from "@/types/content";

export async function generateMetadata(): Promise<Metadata> {
	const settings = await getSiteSettings();
	return {
		title: "Contact",
		description: `Get in touch with the ${settings.name} team. We'd love to hear from you.`,
		openGraph: {
			title: "Contact",
			description: `Get in touch with the ${settings.name} team.`,
			url: `${siteConfig.url}/contact`,
		},
		alternates: {
			canonical: `${siteConfig.url}/contact`,
		},
	};
}

export default async function ContactPage() {
	const settings = await getSiteSettings();
	if (!settings.features.contact) {
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
					name: `Contact | ${settings.name}`,
					url: `${siteConfig.url}/contact`,
				}}
			/>

			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
				]}
				currentPage="Contact"
			/>

			<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Contact Us
				</h1>

				{page?.content && (
					<div className="mt-8">
						<ContentRenderer blocks={page.content} features={settings.features} />
					</div>
				)}

				<div className="mt-8">
					<ContactForm />
				</div>
			</div>

			{faqs.length > 0 && <FaqSection faqs={faqs} />}
			{relatedPages.length > 0 && <RelatedPages pages={relatedPages} features={settings.features} />}
		</>
	);
}
