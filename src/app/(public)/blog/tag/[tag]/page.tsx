import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getSiteSettings } from "@/lib/site-settings";
import { getPublishedPostsByTag, getAllTags } from "@/lib/blog";
import { PostCard } from "@/components/blog/post-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";

const POSTS_PER_PAGE = 12;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ tag: string }>;
}): Promise<Metadata> {
	const { tag: rawTag } = await params;
	const tag = decodeURIComponent(rawTag);
	const settings = await getSiteSettings();
	if (!settings.features.blog) {
		return {};
	}

	const title = `Posts tagged "${tag}"`;
	const description = `Browse all articles tagged "${tag}" on ${settings.name}.`;

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			url: `${siteConfig.url}/blog/tag/${encodeURIComponent(tag)}`,
			images: [{ url: "/og-default.png", width: 1200, height: 630 }],
		},
		alternates: {
			canonical: `${siteConfig.url}/blog/tag/${encodeURIComponent(tag)}`,
		},
	};
}

export default async function BlogTagPage({
	params,
	searchParams,
}: {
	params: Promise<{ tag: string }>;
	searchParams: Promise<{ page?: string }>;
}) {
	const settings = await getSiteSettings();
	if (!settings.features.blog) {
		notFound();
	}

	const { tag: rawTag } = await params;
	const tag = decodeURIComponent(rawTag);
	const resolvedSearchParams = await searchParams;
	const currentPage = Math.max(1, parseInt(resolvedSearchParams.page ?? "1", 10) || 1);

	const [{ items: posts, total }, allTags] = await Promise.all([
		getPublishedPostsByTag(tag, currentPage, POSTS_PER_PAGE),
		getAllTags(),
	]);

	if (total === 0) {
		notFound();
	}

	const totalPages = Math.ceil(total / POSTS_PER_PAGE);

	// Reject pages beyond the valid range
	if (currentPage > totalPages && currentPage > 1) {
		notFound();
	}

	const tagUrl = `/blog/tag/${encodeURIComponent(tag)}`;

	return (
		<>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "CollectionPage",
					name: `Posts tagged "${tag}"`,
					url: `${siteConfig.url}${tagUrl}`,
					description: `Browse all articles tagged "${tag}" on ${settings.name}.`,
				}}
			/>

			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Blog", href: "/blog" },
				]}
				currentPage={`Tag: ${tag}`}
			/>

			<div className="mx-auto max-w-[1128px] px-4 py-12 sm:px-6 sm:py-16">
				<div className="flex flex-col gap-12 lg:flex-row">
					{/* Main content */}
					<div className="flex-1 min-w-0">
						<h1 className="text-3xl font-normal tracking-tight sm:text-4xl md:text-5xl">
							Posts tagged &ldquo;{tag}&rdquo;
						</h1>
						<p className="mt-2 text-base text-muted-foreground sm:text-lg">
							{total} {total === 1 ? "article" : "articles"} tagged with &ldquo;{tag}&rdquo;
						</p>

						{posts.length > 0 ? (
							<div className="mt-12 grid gap-8 md:grid-cols-2">
								{posts.map((post) => (
									<PostCard key={post.slug} post={post} variant={settings.theme.postCardVariant} />
								))}
							</div>
						) : (
							<p className="mt-12 text-center text-muted-foreground">
								No posts found for this tag.
							</p>
						)}

						{/* Pagination */}
						{totalPages > 1 && (
							<nav className="mt-12 flex items-center justify-center gap-2 sm:gap-4" aria-label="Tag pagination">
								{currentPage > 1 ? (
									<Link
										href={`${tagUrl}?page=${currentPage - 1}`}
										className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-accent"
									>
										Previous
									</Link>
								) : (
									<span aria-disabled="true" className="rounded-full border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50">
										Previous
									</span>
								)}

								<span className="text-sm text-muted-foreground">
									Page {currentPage} of {totalPages}
								</span>

								{currentPage < totalPages ? (
									<Link
										href={`${tagUrl}?page=${currentPage + 1}`}
										className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-accent"
									>
										Next
									</Link>
								) : (
									<span aria-disabled="true" className="rounded-full border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50">
										Next
									</span>
								)}
							</nav>
						)}
					</div>

					{/* Tag sidebar */}
					{allTags.length > 0 && (
						<aside className="lg:w-64 shrink-0">
							<h2 className="text-lg font-semibold">All Tags</h2>
							<div className="mt-4 flex flex-wrap gap-2">
								{allTags.map((t) => {
									const isActive = t.tag.toLowerCase() === tag.toLowerCase();
									return (
										<Link
											key={t.tag}
											href={`/blog/tag/${encodeURIComponent(t.tag)}`}
											className={
												isActive
													? "inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
													: "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
											}
										>
											{t.tag}
											<span className={
												isActive
													? "text-xs text-primary-foreground/70"
													: "text-xs text-muted-foreground/70"
											}>
												{t.count}
											</span>
										</Link>
									);
								})}
							</div>
						</aside>
					)}
				</div>
			</div>
		</>
	);
}
