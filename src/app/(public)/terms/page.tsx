import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getPageBySlug } from "@/lib/pages";
import { ContentRenderer } from "@/components/content/content-renderer";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: `Terms of Use | ${siteConfig.name}`,
		description: `Terms of use for ${siteConfig.name}.`,
	};
}

export default async function TermsPage() {
	const page = await getPageBySlug("terms");

	return (
		<>
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Terms of Use", href: "/terms" },
				]}
			/>

			<div className="mx-auto max-w-3xl px-6 py-16">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Terms of Use
				</h1>

				{page?.content ? (
					<div className="mt-8">
						<ContentRenderer blocks={page.content} />
					</div>
				) : (
					<p className="mt-8 text-muted-foreground">
						Terms of use content is being prepared.
					</p>
				)}
			</div>
		</>
	);
}
