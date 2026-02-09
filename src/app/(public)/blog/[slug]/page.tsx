import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getPublishedPostBySlug } from "@/lib/blog";
import { ContentRenderer } from "@/components/content/content-renderer";
import { FaqSection } from "@/components/layout/faq-section";
import { RelatedPosts } from "@/components/blog/related-posts";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { Badge } from "@/components/ui/badge";
import { isSafeUrl } from "@/lib/utils";
import { normalizeImageSrc } from "@/lib/r2";
import type { FAQ } from "@/types/content";

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
	if (!siteConfig.features.blog) {
		notFound();
	}

	const { slug } = await params;
	const post = await getPublishedPostBySlug(slug);

	if (!post) {
		notFound();
	}

	const tags = (post.tags ?? []) as string[];
	const faqs = (post.faqs ?? []) as FAQ[];

	return (
		<>
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
						name: siteConfig.name,
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
					{ label: post.title, href: `/blog/${post.slug}` },
				]}
			/>

			<article className="mx-auto max-w-3xl px-6 py-16">
				<header>
					<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
						{post.title}
					</h1>
					<p className="mt-2 text-lg text-muted-foreground">
						{post.description}
					</p>
					<div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
					</div>
					{tags.length > 0 && (
						<div className="mt-4 flex flex-wrap gap-2">
							{tags.map((tag) => (
								<Badge key={tag} variant="secondary">
									{tag}
								</Badge>
							))}
						</div>
					)}
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

			{faqs.length > 0 && <FaqSection faqs={faqs} />}
			{tags.length > 0 && <RelatedPosts currentSlug={post.slug} tags={tags} />}
		</>
	);
}
