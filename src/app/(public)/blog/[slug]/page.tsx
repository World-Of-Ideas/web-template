import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getSiteSettings } from "@/lib/site-settings";
import { getPublishedPostBySlug, getAdjacentPosts, calculateReadingTime } from "@/lib/blog";
import { ContentRenderer } from "@/components/content/content-renderer";
import { FaqSection } from "@/components/layout/faq-section";
import { RelatedPosts } from "@/components/blog/related-posts";
import { SocialShare } from "@/components/blog/social-share";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { isSafeUrl } from "@/lib/utils";
import { normalizeImageSrc } from "@/lib/r2";
import type { FAQ, ContentBlock } from "@/types/content";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const post = await getPublishedPostBySlug(slug);

	if (!post) {
		return { title: "Post Not Found" };
	}

	const tags = (post.tags ?? []) as string[];

	return {
		title: post.title,
		description: post.description,
		...(tags.length > 0 && { keywords: tags }),
		openGraph: {
			title: post.title,
			description: post.description,
			type: "article",
			url: `${siteConfig.url}/blog/${slug}`,
			publishedTime: post.publishedAt ?? undefined,
			modifiedTime: post.updatedAt ?? undefined,
			authors: [post.author],
			...(post.coverImage && {
				images: [{ url: post.coverImage }],
			}),
		},
		alternates: {
			canonical: `${siteConfig.url}/blog/${slug}`,
		},
	};
}

export default async function BlogPostPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const settings = await getSiteSettings();
	if (!settings.features.blog) {
		notFound();
	}

	const { slug } = await params;
	const post = await getPublishedPostBySlug(slug);

	if (!post) {
		notFound();
	}

	const tags = (post.tags ?? []) as string[];
	const faqs = (post.faqs ?? []) as FAQ[];
	const readingTime = calculateReadingTime(post.content as ContentBlock[]);
	const adjacent = await getAdjacentPosts(post.slug);

	return (
		<>
			{adjacent.prev && <link rel="prev" href={`${siteConfig.url}/blog/${adjacent.prev.slug}`} />}
			{adjacent.next && <link rel="next" href={`${siteConfig.url}/blog/${adjacent.next.slug}`} />}
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "BlogPosting",
					headline: post.title,
					description: post.description,
					url: `${siteConfig.url}/blog/${post.slug}`,
					datePublished: post.publishedAt,
					dateModified: post.updatedAt,
					author: {
						"@type": "Person",
						name: post.author,
					},
					publisher: {
						"@type": "Organization",
						name: settings.name,
						url: siteConfig.url,
					},
					...(post.coverImage && {
						image: post.coverImage,
					}),
				}}
			/>

			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Blog", href: "/blog" },
				]}
				currentPage={post.title}
			/>

			<article className="mx-auto max-w-[744px] px-4 py-12 sm:px-6 sm:py-16">
				<header>
					<h1 className="text-2xl font-normal tracking-tight sm:text-4xl md:text-5xl">
						{post.title}
					</h1>
					<p className="mt-3 text-base text-muted-foreground sm:text-lg">
						{post.description}
					</p>
					<div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:gap-4">
						<span>By {post.author}</span>
						{post.publishedAt && (
							<time dateTime={post.publishedAt}>
								{new Date(post.publishedAt).toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</time>
						)}
						<span>{readingTime} min read</span>
					</div>
					{tags.length > 0 && (
						<div className="mt-4 flex flex-wrap gap-2">
							{tags.map((tag) => (
								<Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
									{tag}
								</Link>
							))}
						</div>
					)}
					<SocialShare url={`${siteConfig.url}/blog/${post.slug}`} title={post.title} />
				</header>

				{post.coverImage && isSafeUrl(post.coverImage) && (
					<Image
						src={normalizeImageSrc(post.coverImage)}
						alt={post.title}
						width={1200}
						height={675}
						className="mt-8 w-full h-auto rounded-lg object-cover"
						priority
					/>
				)}

				<div className="mt-8">
					<ContentRenderer blocks={post.content} />
				</div>
			</article>

			{(adjacent.prev || adjacent.next) && (
				<nav className="mx-auto max-w-[744px] px-4 sm:px-6 mt-12 flex items-center justify-between gap-4" aria-label="Post navigation">
					{adjacent.prev ? (
						<Link href={`/blog/${adjacent.prev.slug}`} className="group flex flex-col items-start text-left">
							<span className="text-xs text-muted-foreground">Previous</span>
							<span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">{adjacent.prev.title}</span>
						</Link>
					) : <div />}
					{adjacent.next ? (
						<Link href={`/blog/${adjacent.next.slug}`} className="group flex flex-col items-end text-right">
							<span className="text-xs text-muted-foreground">Next</span>
							<span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">{adjacent.next.title}</span>
						</Link>
					) : <div />}
				</nav>
			)}

			{faqs.length > 0 && <FaqSection faqs={faqs} />}
			{tags.length > 0 && <RelatedPosts currentSlug={post.slug} tags={tags} />}
		</>
	);
}
