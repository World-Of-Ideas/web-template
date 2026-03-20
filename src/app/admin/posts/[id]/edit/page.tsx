import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { posts } from "@/db/schema";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { PostEditor } from "@/components/admin/post-editor/post-editor";

export const metadata: Metadata = {
	title: "Edit Post | Admin",
};

export default async function EditPostPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const settings = await getSiteSettingsDirect();
	if (!settings.features.blog) notFound();

	const { id } = await params;
	const postId = parseInt(id, 10);

	if (isNaN(postId)) {
		notFound();
	}

	const db = await getDb();
	const post = await db.query.posts.findFirst({
		where: eq(posts.id, postId),
	});

	if (!post) {
		notFound();
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Edit Post</h1>
			<PostEditor post={post} />
		</div>
	);
}
