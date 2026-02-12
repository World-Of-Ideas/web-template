import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getPublishedPosts } from "@/lib/blog";
import { PostCard } from "@/components/blog/post-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: "Blog",
		description: `Read the latest articles and updates from ${siteConfig.name}.`,
		openGraph: {
			title: "Blog",
			description: `Read the latest articles and updates from ${siteConfig.name}.`,
			url: `${siteConfig.url}/blog`,
			images: [{ url: "/og-default.png", width: 1200, height: 630 }],
		},
		alternates: {
			canonical: `${siteConfig.url}/blog`,
		},
	};
}

const POSTS_PER_PAGE = 12;

export default async function BlogPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	if (!siteConfig.features.blog) {
		notFound();
	}

	const params = await searchParams;
	const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
	const { items: posts, total } = await getPublishedPosts(currentPage, POSTS_PER_PAGE);
	const totalPages = Math.ceil(total / POSTS_PER_PAGE);

	return (
		<>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "Blog",
					name: "Blog",
					url: `${siteConfig.url}/blog`,
					description: `Read the latest articles and updates from ${siteConfig.name}.`,
				}}
			/>

			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
				]}
				currentPage="Blog"
			/>

			<div className="mx-auto max-w-[1128px] px-4 py-12 sm:px-6 sm:py-16">
				<h1 className="text-3xl font-normal tracking-tight sm:text-4xl md:text-5xl">Blog</h1>
				<p className="mt-2 text-base text-muted-foreground sm:text-lg">
					The latest articles and updates from {siteConfig.name}.
				</p>

				{posts.length > 0 ? (
					<div className="mt-12 grid gap-8 md:grid-cols-2">
						{posts.map((post) => (
							<PostCard key={post.slug} post={post} />
						))}
					</div>
				) : (
					<p className="mt-12 text-center text-muted-foreground">
						No posts yet. Check back soon.
					</p>
				)}

				{/* Pagination */}
				{totalPages > 1 && (
					<nav className="mt-12 flex items-center justify-center gap-2 sm:gap-4" aria-label="Blog pagination">
						{currentPage > 1 ? (
							<Link
								href={`/blog?page=${currentPage - 1}`}
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
								href={`/blog?page=${currentPage + 1}`}
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
		</>
	);
}
