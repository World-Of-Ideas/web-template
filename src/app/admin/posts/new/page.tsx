import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { PostEditor } from "@/components/admin/post-editor/post-editor";

export const metadata: Metadata = {
	title: "New Post | Admin",
};

export default async function NewPostPage() {
	const settings = await getSiteSettingsDirect();
	if (!settings.features.blog) notFound();

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">New Post</h1>
			<PostEditor />
		</div>
	);
}
