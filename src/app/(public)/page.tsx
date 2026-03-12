import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getSiteSettings } from "@/lib/site-settings";
import { ctaConfig } from "@/config/navigation";
import { getRecentPosts } from "@/lib/blog";
import { getPageBySlug } from "@/lib/pages";
import { ContentRenderer } from "@/components/content/content-renderer";
import { JsonLd } from "@/components/shared/json-ld";
import { PostCard } from "@/components/blog/post-card";
import { SubscriberCount } from "@/components/waitlist/subscriber-count";
import { FaqSection } from "@/components/layout/faq-section";
import { RelatedPages } from "@/components/layout/related-pages";
import { GradientBackground } from "@/components/shared/gradient-background";
import { CtaSection } from "@/components/shared/cta-section";
import type { FAQ, RelatedPage } from "@/types/content";

export async function generateMetadata(): Promise<Metadata> {
	const settings = await getSiteSettings();
	return {
		title: { absolute: settings.name },
		description: settings.description,
		openGraph: {
			title: settings.name,
			description: settings.description,
			type: "website",
			url: siteConfig.url,
			images: [{ url: "/og-default.png", width: 1200, height: 630 }],
		},
		alternates: {
			canonical: siteConfig.url,
		},
	};
}

export default async function HomePage() {
	const settings = await getSiteSettings();
	const homePage = await getPageBySlug("home");
	const recentPosts = settings.features.blog ? await getRecentPosts(3) : [];

	const isPreLaunch = settings.features.waitlist;
	const cta = isPreLaunch ? ctaConfig.preLaunch : ctaConfig.postLaunch;
	const hasProductLink = !!(settings.productLinks.appUrl || settings.productLinks.appStoreUrl || settings.productLinks.playStoreUrl);
	const showCta = isPreLaunch || hasProductLink;

	const faqs = (homePage?.faqs ?? []) as FAQ[];
	const relatedPages = (homePage?.relatedPages ?? []) as RelatedPage[];

	const heroButtons = (
		<>
			{isPreLaunch ? (
				<Link
					href="/waitlist"
					className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
				>
					{cta.buttonText}
				</Link>
			) : (
				<>
					{settings.productLinks.appUrl && (
						<a href={settings.productLinks.appUrl} className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
							{cta.buttonText}
						</a>
					)}
					{settings.productLinks.appStoreUrl && (
						<a href={settings.productLinks.appStoreUrl} className="rounded-full border border-border px-8 py-3 text-sm font-medium transition-colors hover:bg-accent">
							App Store
						</a>
					)}
					{settings.productLinks.playStoreUrl && (
						<a href={settings.productLinks.playStoreUrl} className="rounded-full border border-border px-8 py-3 text-sm font-medium transition-colors hover:bg-accent">
							Play Store
						</a>
					)}
				</>
			)}
		</>
	);

	return (
		<>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "WebSite",
					name: settings.name,
					url: siteConfig.url,
					description: settings.description,
				}}
			/>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "Organization",
					name: settings.name,
					url: siteConfig.url,
					...(settings.social.twitter && {
						sameAs: [`https://twitter.com/${settings.social.twitter.replace("@", "")}`],
					}),
				}}
			/>

			{/* Hero Section */}
			{settings.theme.heroVariant === "split" ? (
				<section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-32 md:py-40">
					<div className="relative mx-auto grid max-w-[1128px] items-center gap-8 md:grid-cols-2">
						<div>
							<h1 className="text-3xl font-normal tracking-tight sm:text-5xl md:text-6xl">
								{settings.name}
							</h1>
							<p className="mt-4 max-w-xl text-base text-muted-foreground sm:mt-6 sm:text-lg md:text-xl">
								{settings.description}
							</p>
							{showCta && (
								<div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
									{heroButtons}
								</div>
							)}
						</div>
						<div className="relative hidden md:block">
							<GradientBackground />
						</div>
					</div>
				</section>
			) : (
				<section className="relative overflow-hidden px-4 py-20 text-center sm:px-6 sm:py-32 md:py-40">
					{settings.theme.heroVariant === "gradient" && <GradientBackground />}
					<div className="relative mx-auto max-w-4xl">
						<h1 className="text-3xl font-normal tracking-tight sm:text-5xl md:text-7xl">
							{settings.name}
						</h1>
						<p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg md:text-xl">
							{settings.description}
						</p>
						{showCta && (
							<div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
								{heroButtons}
							</div>
						)}
					</div>
				</section>
			)}

			{/* Page Content (editable via admin) */}
			{homePage?.content && homePage.content.length > 0 && (
				<section className="px-4 py-12 sm:px-6 sm:py-16">
					<div className="mx-auto max-w-3xl">
						<ContentRenderer blocks={homePage.content} features={settings.features} />
					</div>
				</section>
			)}

			{/* Subscriber Count */}
			{settings.features.waitlist && (
				<section className="px-6 py-8 text-center">
					<SubscriberCount />
				</section>
			)}

			{/* Latest Posts */}
			{settings.features.blog && recentPosts.length > 0 && (
				<section className="px-4 py-12 sm:px-6 sm:py-16">
					<div className="mx-auto max-w-[1128px]">
						<h2 className="text-center text-2xl font-normal tracking-tight sm:text-3xl">
							Latest Posts
						</h2>
						<div className="mt-8 grid gap-6 sm:mt-12 sm:gap-8 md:grid-cols-3">
							{recentPosts.map((post) => (
								<PostCard key={post.slug} post={post} variant={settings.theme.postCardVariant} />
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

			{/* CTA Section */}
			{showCta && (
				<CtaSection
					title={cta.heading}
					description={cta.description}
					buttonText={cta.buttonText}
					buttonHref={isPreLaunch ? "/waitlist" : (settings.productLinks.appUrl || settings.productLinks.appStoreUrl || settings.productLinks.playStoreUrl || "/")}
					variant={settings.theme.ctaSectionVariant}
				/>
			)}

			{/* FAQs */}
			{faqs.length > 0 && <FaqSection faqs={faqs} />}

			{/* Related Pages */}
			{relatedPages.length > 0 && <RelatedPages pages={relatedPages} features={settings.features} />}
		</>
	);
}
