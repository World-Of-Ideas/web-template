import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getPublishedPosts } from "@/lib/blog";
import { PostCard } from "@/components/blog/post-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: `Blog | ${siteConfig.name}`,
		description: `Read the latest articles and updates from ${siteConfig.name}.`,
		openGraph: {
			title: `Blog | ${siteConfig.name}`,
			description: `Read the latest articles and updates from ${siteConfig.name}.`,
			url: `${siteConfig.url}/blog`,
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
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Blog", href: "/blog" },
				]}
			/>

			<div className="mx-auto max-w-5xl px-6 py-16">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>
				<p className="mt-2 text-muted-foreground">
					The latest articles and updates from {siteConfig.name}.
				</p>

				{posts.length > 0 ? (
					<div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
					<nav className="mt-12 flex items-center justify-center gap-4" aria-label="Blog pagination">
						{currentPage > 1 ? (
							<Link
								href={`/blog?page=${currentPage - 1}`}
								className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
							>
								Previous
							</Link>
						) : (
							<span className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50">
								Previous
							</span>
						)}

						<span className="text-sm text-muted-foreground">
							Page {currentPage} of {totalPages}
						</span>

						{currentPage < totalPages ? (
							<Link
								href={`/blog?page=${currentPage + 1}`}
								className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
							>
								Next
							</Link>
						) : (
							<span className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground opacity-50">
								Next
							</span>
						)}
					</nav>
				)}
			</div>
		</>
	);
}
