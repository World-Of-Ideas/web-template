import { getRelatedPosts } from "@/lib/blog";
import { PostCard } from "./post-card";

interface RelatedPostsProps {
	currentSlug: string;
	tags: string[];
}

export async function RelatedPosts({ currentSlug, tags }: RelatedPostsProps) {
	const relatedPosts = await getRelatedPosts(currentSlug, tags);

	if (!relatedPosts || relatedPosts.length === 0) {
		return null;
	}

	return (
		<section className="mx-auto max-w-[1128px] px-4 py-12 sm:px-6">
			<h2 className="text-2xl font-normal tracking-tight">Related Posts</h2>
			<div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{relatedPosts.map((post) => (
					<PostCard
						key={post.slug}
						post={{
							slug: post.slug,
							title: post.title,
							description: post.description,
							coverImage: post.cover_image,
							publishedAt: post.published_at,
							tags: post.tags ? (() => { try { return JSON.parse(post.tags as string); } catch { return null; } })() : null,
						}}
					/>
				))}
			</div>
		</section>
	);
}
