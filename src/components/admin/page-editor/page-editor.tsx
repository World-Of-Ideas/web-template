"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ContentBlock, FAQ, RelatedPage } from "@/types/content";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/image-upload";
import { BlockList } from "@/components/admin/post-editor/block-list";
import { FaqEditor } from "./faq-editor";
import { RelatedPagesEditor } from "./related-pages-editor";

interface PageData {
	slug: string;
	parentSlug: string | null;
	title: string;
	description: string | null;
	content: ContentBlock[] | null;
	faqs: FAQ[] | null;
	relatedPages: RelatedPage[] | null;
	coverImage: string | null;
	metadata: Record<string, unknown> | null;
	published: boolean;
	sortOrder: number;
}

interface PageEditorProps {
	page?: PageData;
	isSystem?: boolean;
	availableParentSlugs?: string[];
}

export function PageEditor({ page, isSystem, availableParentSlugs = [] }: PageEditorProps) {
	const router = useRouter();
	const isEditMode = !!page;

	const [title, setTitle] = useState(page?.title ?? "");
	const [slug, setSlug] = useState(page?.slug ?? "");
	const [parentSlug, setParentSlug] = useState(page?.parentSlug ?? "");
	const [description, setDescription] = useState(page?.description ?? "");
	const [coverImage, setCoverImage] = useState(page?.coverImage ?? "");
	const [published, setPublished] = useState(page?.published ?? true);
	const [sortOrder, setSortOrder] = useState(page?.sortOrder ?? 0);
	const [content, setContent] = useState<ContentBlock[]>(
		page?.content ?? [],
	);
	const [faqs, setFaqs] = useState<FAQ[]>(page?.faqs ?? []);
	const [relatedPages, setRelatedPages] = useState<RelatedPage[]>(
		page?.relatedPages ?? [],
	);
	const [metadataJson, setMetadataJson] = useState(
		page?.metadata ? JSON.stringify(page.metadata, null, 2) : "{}",
	);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setIsSaving(true);

		let metadata: Record<string, unknown> | null = null;
		if (isSystem) {
			try {
				metadata = JSON.parse(metadataJson);
			} catch {
				setError("Invalid JSON in metadata field.");
				setIsSaving(false);
				return;
			}
		}

		const body = {
			title,
			slug,
			parentSlug: parentSlug || null,
			description,
			coverImage,
			published,
			sortOrder,
			content,
			faqs,
			relatedPages,
			metadata,
		};

		try {
			const url = isEditMode
				? `/api/admin/pages/${page.slug}`
				: "/api/admin/pages";
			const method = isEditMode ? "PUT" : "POST";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const data = (await res.json()) as { error?: { code: string; message: string } };

			if (!res.ok) {
				setError(data.error?.message ?? "Failed to save page.");
				return;
			}

			router.push("/admin/pages");
		} catch {
			setError("Failed to save page. Please try again.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			<div className="grid gap-6 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="page-title">Title</Label>
					<Input
						id="page-title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Page title"
						required
						disabled={isSaving}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="page-slug">Slug</Label>
					<Input
						id="page-slug"
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
						placeholder="page-slug"
						required
						disabled={isSaving || isSystem}
					/>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="space-y-2">
					<Label>Parent Page</Label>
					<Select
						value={parentSlug || "__none__"}
						onValueChange={(val) =>
							setParentSlug(val === "__none__" ? "" : val)
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="No parent" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__none__">No parent</SelectItem>
							{availableParentSlugs
								.filter((s) => s !== slug)
								.map((s) => (
									<SelectItem key={s} value={s}>
										{s}
									</SelectItem>
								))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="page-sort-order">Sort Order</Label>
					<Input
						id="page-sort-order"
						type="number"
						value={sortOrder}
						onChange={(e) => setSortOrder(Number(e.target.value))}
						disabled={isSaving}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="page-description">Description</Label>
				<Textarea
					id="page-description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Brief description for SEO and previews..."
					disabled={isSaving}
				/>
			</div>

			<div className="space-y-2">
				<Label>Cover Image</Label>
				<ImageUpload value={coverImage} onChange={setCoverImage} />
			</div>

			<div className="flex items-center gap-3">
				<Switch
					checked={published}
					onCheckedChange={setPublished}
					disabled={isSaving}
				/>
				<Label>Published</Label>
			</div>

			<div className="space-y-2">
				<Label>Content Blocks</Label>
				<BlockList blocks={content} onChange={setContent} />
			</div>

			<div className="space-y-2">
				<Label>FAQs</Label>
				<FaqEditor faqs={faqs} onChange={setFaqs} />
			</div>

			<div className="space-y-2">
				<Label>Related Pages</Label>
				<RelatedPagesEditor pages={relatedPages} onChange={setRelatedPages} />
			</div>

			{isSystem && (
				<div className="space-y-2">
					<Label htmlFor="page-metadata">Metadata (JSON)</Label>
					<Textarea
						id="page-metadata"
						value={metadataJson}
						onChange={(e) => setMetadataJson(e.target.value)}
						placeholder="{}"
						disabled={isSaving}
						className="min-h-[120px] font-mono text-xs"
					/>
				</div>
			)}

			{error && (
				<p className="text-sm text-destructive">{error}</p>
			)}

			<Button type="submit" disabled={isSaving}>
				{isSaving ? "Saving..." : isEditMode ? "Update Page" : "Create Page"}
			</Button>
		</form>
	);
}
