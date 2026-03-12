import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPostSummaries } from "@/lib/blog";
import { getSiteSettings } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { PostsList } from "@/components/admin/posts-list";

export const metadata: Metadata = {
	title: "Posts | Admin",
};

export default async function PostsPage() {
	const settings = await getSiteSettings();
	if (!settings.features.blog) notFound();

	const posts = await getAllPostSummaries();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Posts</h1>
				<Button asChild>
					<Link href="/admin/posts/new">New Post</Link>
				</Button>
			</div>

			{posts.length === 0 ? (
				<p className="text-muted-foreground">
					No posts yet. Create your first post to get started.
				</p>
			) : (
				<PostsList posts={posts} />
			)}
		</div>
	);
}
