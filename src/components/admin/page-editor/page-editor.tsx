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
	layout: string;
	published: boolean;
	sortOrder: number;
}

export interface ExistingPageInfo {
	slug: string;
	title: string;
	description: string | null;
}

interface PageEditorProps {
	page?: PageData;
	isSystem?: boolean;
	availableParentSlugs?: string[];
	existingPages?: ExistingPageInfo[];
}

export function PageEditor({ page, isSystem, availableParentSlugs = [], existingPages = [] }: PageEditorProps) {
	const router = useRouter();
	const isEditMode = !!page;

	const [title, setTitle] = useState(page?.title ?? "");
	const [slug, setSlug] = useState(page?.slug ?? "");
	const [parentSlug, setParentSlug] = useState(page?.parentSlug ?? "");
	const [description, setDescription] = useState(page?.description ?? "");
	const [coverImage, setCoverImage] = useState(page?.coverImage ?? "");
	const [layout, setLayout] = useState(page?.layout ?? "default");
	const [published, setPublished] = useState(page?.published ?? true);
	const [sortOrder, setSortOrder] = useState(page?.sortOrder ?? 0);
	const [content, setContent] = useState<ContentBlock[]>(
		page?.content ?? [],
	);
	const [faqs, setFaqs] = useState<FAQ[]>(page?.faqs ?? []);
	const [relatedPages, setRelatedPages] = useState<RelatedPage[]>(
		page?.relatedPages ?? [],
	);
	const [seoTitle, setSeoTitle] = useState(
		(page?.metadata?.seoTitle as string) ?? "",
	);
	const [noindex, setNoindex] = useState(
		(page?.metadata?.noindex as boolean) ?? false,
	);
	const [metadataJson, setMetadataJson] = useState(() => {
		if (!page?.metadata) return "{}";
		// Strip SEO fields from raw JSON — they're managed by dedicated inputs
		const { seoTitle: _s, noindex: _n, ...rest } = page.metadata;
		return JSON.stringify(rest, null, 2);
	});
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setIsSaving(true);

		let baseMetadata: Record<string, unknown> = {};
		if (isSystem) {
			try {
				baseMetadata = JSON.parse(metadataJson);
			} catch {
				setError("Invalid JSON in metadata field.");
				setIsSaving(false);
				return;
			}
		}

		// Merge SEO fields into metadata
		const metadata: Record<string, unknown> = {
			...baseMetadata,
			...(seoTitle ? { seoTitle } : {}),
			...(noindex ? { noindex } : {}),
		};

		const body = {
			title,
			slug,
			parentSlug: parentSlug || null,
			description,
			coverImage,
			layout,
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

			{!isSystem && (
				<div className="space-y-2">
					<Label>Layout</Label>
					<Select value={layout} onValueChange={setLayout}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select layout" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="default">Default</SelectItem>
							<SelectItem value="landing">Landing</SelectItem>
							<SelectItem value="listing">Listing</SelectItem>
							<SelectItem value="pillar">Pillar</SelectItem>
						</SelectContent>
					</Select>
				</div>
			)}

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
					id="page-published"
					checked={published}
					onCheckedChange={setPublished}
					disabled={isSaving}
				/>
				<Label htmlFor="page-published">Published</Label>
			</div>

			{/* SEO Settings */}
			<fieldset className="space-y-4 rounded-lg border p-4">
				<legend className="px-2 text-sm font-medium">SEO Settings</legend>

				<div className="space-y-2">
					<Label htmlFor="page-seo-title">SEO Title (optional override)</Label>
					<Input
						id="page-seo-title"
						value={seoTitle}
						onChange={(e) => setSeoTitle(e.target.value)}
						placeholder="Leave empty to use page title"
						disabled={isSaving}
					/>
					<p className="text-xs text-muted-foreground">
						Overrides the page title in search results and social sharing.
					</p>
				</div>

				<div className="flex items-center gap-3">
					<Switch
						checked={noindex}
						onCheckedChange={setNoindex}
						disabled={isSaving}
					/>
					<div>
						<Label>Hide from search engines</Label>
						<p className="text-xs text-muted-foreground">
							Adds noindex — page won&apos;t appear in Google results.
						</p>
					</div>
				</div>
			</fieldset>

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
				<RelatedPagesEditor
					pages={relatedPages}
					onChange={setRelatedPages}
					existingPages={existingPages.filter((p) => p.slug !== slug)}
				/>
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
				<p className="text-sm text-destructive" role="alert">{error}</p>
			)}

			<Button type="submit" disabled={isSaving}>
				{isSaving ? "Saving..." : isEditMode ? "Update Page" : "Create Page"}
			</Button>
		</form>
	);
}
