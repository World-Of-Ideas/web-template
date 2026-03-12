import type { Metadata } from "next";
import { getAllPageSummaries } from "@/lib/pages";
import { PageEditor } from "@/components/admin/page-editor/page-editor";

export const metadata: Metadata = {
	title: "New Page | Admin",
};

export default async function NewPagePage() {
	const allPages = await getAllPageSummaries();
	const parentSlugs = allPages.map((p) => p.slug);

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">New Page</h1>
			<PageEditor
				availableParentSlugs={parentSlugs}
				existingPages={allPages.map((p) => ({
					slug: p.slug,
					title: p.title,
					description: p.description,
				}))}
			/>
		</div>
	);
}
