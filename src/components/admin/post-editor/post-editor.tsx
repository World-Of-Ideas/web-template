"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ContentBlock, FAQ } from "@/types/content";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/image-upload";
import { BlockList } from "./block-list";
import { FaqEditor } from "@/components/admin/page-editor/faq-editor";

interface PostData {
	id?: number;
	slug: string;
	title: string;
	description: string;
	content: ContentBlock[];
	faqs: FAQ[] | null;
	coverImage: string | null;
	author: string;
	tags: string[] | null;
	published: boolean;
}

interface PostEditorProps {
	post?: PostData;
}

function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

export function PostEditor({ post }: PostEditorProps) {
	const router = useRouter();
	const isEditMode = !!post?.id;

	const [title, setTitle] = useState(post?.title ?? "");
	const [slug, setSlug] = useState(post?.slug ?? "");
	const [description, setDescription] = useState(post?.description ?? "");
	const [author, setAuthor] = useState(post?.author ?? "Admin");
	const [tagsInput, setTagsInput] = useState(
		post?.tags?.join(", ") ?? "",
	);
	const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
	const [published, setPublished] = useState(post?.published ?? false);
	const [content, setContent] = useState<ContentBlock[]>(
		post?.content ?? [],
	);
	const [faqs, setFaqs] = useState<FAQ[]>(post?.faqs ?? []);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");

	function handleTitleChange(value: string) {
		setTitle(value);
		if (!isEditMode) {
			setSlug(generateSlug(value));
		}
	}

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError("");
		setIsSaving(true);

		const tags = tagsInput
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);

		const body = {
			title,
			slug,
			description,
			author,
			tags,
			coverImage,
			published,
			content,
			faqs,
		};

		try {
			const url = isEditMode
				? `/api/admin/posts/${post.id}`
				: "/api/admin/posts";
			const method = isEditMode ? "PUT" : "POST";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const data = (await res.json()) as { error?: { code: string; message: string } };

			if (!res.ok) {
				setError(data.error?.message ?? "Failed to save post.");
				return;
			}

			router.push("/admin/posts");
		} catch {
			setError("Failed to save post. Please try again.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			<div className="grid gap-6 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="post-title">Title</Label>
					<Input
						id="post-title"
						value={title}
						onChange={(e) => handleTitleChange(e.target.value)}
						placeholder="Post title"
						required
						disabled={isSaving}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="post-slug">Slug</Label>
					<Input
						id="post-slug"
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
						placeholder="post-slug"
						required
						disabled={isSaving}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="post-description">Description</Label>
				<Textarea
					id="post-description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Brief description for SEO and previews..."
					required
					disabled={isSaving}
				/>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="post-author">Author</Label>
					<Input
						id="post-author"
						value={author}
						onChange={(e) => setAuthor(e.target.value)}
						placeholder="Author name"
						disabled={isSaving}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="post-tags">Tags (comma-separated)</Label>
					<Input
						id="post-tags"
						value={tagsInput}
						onChange={(e) => setTagsInput(e.target.value)}
						placeholder="marketing, seo, tips"
						disabled={isSaving}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label>Cover Image</Label>
				<ImageUpload
					value={coverImage}
					onChange={setCoverImage}
					path={slug ? `blog/${slug}` : undefined}
				/>
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

			{error && (
				<p className="text-sm text-destructive">{error}</p>
			)}

			<Button type="submit" disabled={isSaving}>
				{isSaving ? "Saving..." : isEditMode ? "Update Post" : "Create Post"}
			</Button>
		</form>
	);
}
