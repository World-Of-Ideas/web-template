import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ctaConfig } from "@/config/navigation";
import { getRecentPosts } from "@/lib/blog";
import { getPageBySlug } from "@/lib/pages";
import { ContentRenderer } from "@/components/content/content-renderer";
import { JsonLd } from "@/components/shared/json-ld";
import { PostCard } from "@/components/blog/post-card";
import { SubscriberCount } from "@/components/waitlist/subscriber-count";
import { FaqSection } from "@/components/layout/faq-section";
import { RelatedPages } from "@/components/layout/related-pages";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import type { FAQ, RelatedPage } from "@/types/content";

export const metadata: Metadata = {
	title: siteConfig.name,
	description: siteConfig.description,
	openGraph: {
		title: siteConfig.name,
		description: siteConfig.description,
		url: siteConfig.url,
	},
};

export default async function HomePage() {
	const homePage = await getPageBySlug("home");
	const recentPosts = siteConfig.features.blog ? await getRecentPosts(3) : [];

	const isPreLaunch = siteConfig.features.waitlist;
	const cta = isPreLaunch ? ctaConfig.preLaunch : ctaConfig.postLaunch;

	const faqs = (homePage?.faqs ?? []) as FAQ[];
	const relatedPages = (homePage?.relatedPages ?? []) as RelatedPage[];

	return (
		<>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "WebSite",
					name: siteConfig.name,
					url: siteConfig.url,
					description: siteConfig.description,
				}}
			/>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "Organization",
					name: siteConfig.name,
					url: siteConfig.url,
					...(siteConfig.social.twitter && {
						sameAs: [`https://twitter.com/${siteConfig.social.twitter.replace("@", "")}`],
					}),
				}}
			/>

			<Breadcrumbs items={[{ label: "Home", href: "/" }]} />

			{/* Hero Section */}
			<section className="px-6 py-24 text-center">
				<div className="mx-auto max-w-3xl">
					<h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
						{siteConfig.name}
					</h1>
					<p className="mt-6 text-lg text-muted-foreground">
						{siteConfig.description}
					</p>
					<div className="mt-10 flex items-center justify-center gap-4">
						{isPreLaunch ? (
							<Link
								href="/waitlist"
								className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
							>
								{cta.buttonText}
							</Link>
						) : (
							<>
								{siteConfig.productLinks.appUrl && (
									<a
										href={siteConfig.productLinks.appUrl}
										className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
									>
										{cta.buttonText}
									</a>
								)}
								{siteConfig.productLinks.appStoreUrl && (
									<a
										href={siteConfig.productLinks.appStoreUrl}
										className="rounded-md border border-input px-6 py-3 text-sm font-semibold hover:bg-accent"
									>
										App Store
									</a>
								)}
								{siteConfig.productLinks.playStoreUrl && (
									<a
										href={siteConfig.productLinks.playStoreUrl}
										className="rounded-md border border-input px-6 py-3 text-sm font-semibold hover:bg-accent"
									>
										Play Store
									</a>
								)}
							</>
						)}
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="px-6 py-16">
				<div className="mx-auto max-w-5xl">
					<h2 className="text-center text-3xl font-bold tracking-tight">
						Why Choose {siteConfig.name}
					</h2>
					<div className="mt-12 grid gap-8 md:grid-cols-3">
						<div className="rounded-lg border p-6">
							<h3 className="text-lg font-semibold">Feature One</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								A brief description of the first key feature and the value it
								provides to users.
							</p>
						</div>
						<div className="rounded-lg border p-6">
							<h3 className="text-lg font-semibold">Feature Two</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								A brief description of the second key feature and the value it
								provides to users.
							</p>
						</div>
						<div className="rounded-lg border p-6">
							<h3 className="text-lg font-semibold">Feature Three</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								A brief description of the third key feature and the value it
								provides to users.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Subscriber Count */}
			{siteConfig.features.waitlist && (
				<section className="px-6 py-8 text-center">
					<SubscriberCount />
				</section>
			)}

			{/* Latest Posts */}
			{siteConfig.features.blog && recentPosts.length > 0 && (
				<section className="px-6 py-16">
					<div className="mx-auto max-w-5xl">
						<h2 className="text-center text-3xl font-bold tracking-tight">
							Latest Posts
						</h2>
						<div className="mt-12 grid gap-8 md:grid-cols-3">
							{recentPosts.map((post) => (
								<PostCard key={post.slug} post={post} />
							))}
						</div>
						<div className="mt-8 text-center">
							<Link
								href="/blog"
								className="text-sm font-medium text-primary hover:underline"
							>
								View all posts
							</Link>
						</div>
					</div>
				</section>
			)}

			{/* FAQs */}
			{faqs.length > 0 && <FaqSection faqs={faqs} />}

			{/* Related Pages */}
			{relatedPages.length > 0 && <RelatedPages pages={relatedPages} />}
		</>
	);
}
