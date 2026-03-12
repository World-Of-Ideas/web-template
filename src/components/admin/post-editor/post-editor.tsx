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
	scheduledPublishAt: string | null;
}

interface PostEditorProps {
	post?: PostData;
}

function validatePostJson(json: string): { data: PostData | null; error: string | null } {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		return { data: null, error: "Invalid JSON syntax." };
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		return { data: null, error: "JSON must be an object." };
	}
	const p = parsed as Record<string, unknown>;
	if (typeof p.title !== "string" || !p.title) return { data: null, error: "\"title\" (string) is required." };
	if (typeof p.slug !== "string" || !p.slug) return { data: null, error: "\"slug\" (string) is required." };
	if (typeof p.description !== "string" || !p.description) return { data: null, error: "\"description\" (string) is required." };
	if (p.content !== undefined && !Array.isArray(p.content)) return { data: null, error: "\"content\" must be an array." };
	if (p.faqs !== undefined && p.faqs !== null && !Array.isArray(p.faqs)) return { data: null, error: "\"faqs\" must be an array or null." };
	if (p.tags !== undefined && p.tags !== null && !Array.isArray(p.tags)) return { data: null, error: "\"tags\" must be an array or null." };
	return {
		data: {
			slug: p.slug as string,
			title: p.title as string,
			description: p.description as string,
			content: (p.content as ContentBlock[]) ?? [],
			faqs: (p.faqs as FAQ[] | null) ?? null,
			coverImage: (typeof p.coverImage === "string" ? p.coverImage : null),
			author: (typeof p.author === "string" ? p.author : "Admin"),
			tags: (p.tags as string[] | null) ?? null,
			published: typeof p.published === "boolean" ? p.published : false,
			scheduledPublishAt: typeof p.scheduledPublishAt === "string" ? p.scheduledPublishAt : null,
		},
		error: null,
	};
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

	const [jsonMode, setJsonMode] = useState(false);
	const [jsonInput, setJsonInput] = useState("");
	const [jsonError, setJsonError] = useState("");

	const [title, setTitle] = useState(post?.title ?? "");
	const [slug, setSlug] = useState(post?.slug ?? "");
	const [description, setDescription] = useState(post?.description ?? "");
	const [author, setAuthor] = useState(post?.author ?? "Admin");
	const [tagsInput, setTagsInput] = useState(
		post?.tags?.join(", ") ?? "",
	);
	const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
	const [published, setPublished] = useState(post?.published ?? false);
	const [scheduledPublishAt, setScheduledPublishAt] = useState(() => {
		if (!post?.scheduledPublishAt) return "";
		const raw = post.scheduledPublishAt;
		// Handle both ISO (2026-03-12T14:27:00.000Z) and D1 (2026-03-12 14:27:00) formats
		const d = new Date(raw.includes("T") ? raw : raw.replace(" ", "T") + "Z");
		return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
	});
	const [content, setContent] = useState<ContentBlock[]>(
		post?.content ?? [],
	);
	const [faqs, setFaqs] = useState<FAQ[]>(post?.faqs ?? []);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");

	function handleImportJson() {
		setJsonError("");
		const { data, error: parseError } = validatePostJson(jsonInput);
		if (parseError || !data) {
			setJsonError(parseError ?? "Invalid JSON");
			return;
		}
		setTitle(data.title);
		setSlug(data.slug);
		setDescription(data.description);
		setAuthor(data.author);
		setTagsInput(data.tags?.join(", ") ?? "");
		setCoverImage(data.coverImage ?? "");
		setPublished(data.published);
		setScheduledPublishAt(
			data.scheduledPublishAt
				? new Date(data.scheduledPublishAt).toISOString().slice(0, 16)
				: "",
		);
		setContent(data.content);
		setFaqs(data.faqs ?? []);
		setJsonMode(false);
		setJsonInput("");
	}

	function handleExportJson() {
		const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
		const data = {
			title,
			slug,
			description,
			author,
			tags: tags.length > 0 ? tags : null,
			coverImage: coverImage || null,
			published,
			scheduledPublishAt: scheduledPublishAt
				? new Date(scheduledPublishAt).toISOString()
				: null,
			content,
			faqs: faqs.length > 0 ? faqs : null,
		};
		navigator.clipboard.writeText(JSON.stringify(data, null, 2));
	}

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
			scheduledPublishAt: scheduledPublishAt
				? new Date(scheduledPublishAt).toISOString()
				: null,
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

	if (jsonMode) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						Paste a full post JSON object. Required fields: title, slug, description.
					</p>
					<Button type="button" variant="ghost" onClick={() => { setJsonMode(false); setJsonInput(""); setJsonError(""); }}>
						Back to form
					</Button>
				</div>
				<Textarea
					value={jsonInput}
					onChange={(e) => { setJsonInput(e.target.value); setJsonError(""); }}
					placeholder={'{\n  "title": "My Post",\n  "slug": "my-post",\n  "description": "A brief description",\n  "author": "Admin",\n  "tags": ["tag1", "tag2"],\n  "published": false,\n  "content": [\n    {"type": "paragraph", "text": "Hello world"}\n  ]\n}'}
					className="min-h-[400px] font-mono text-xs"
				/>
				{jsonError && (
					<p className="text-sm text-destructive" role="alert">{jsonError}</p>
				)}
				<div className="flex gap-2">
					<Button type="button" onClick={handleImportJson} disabled={!jsonInput.trim()}>
						Load into editor
					</Button>
					<Button type="button" variant="outline" onClick={() => { setJsonMode(false); setJsonInput(""); setJsonError(""); }}>
						Cancel
					</Button>
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			<div className="flex gap-2 justify-end">
				{!isEditMode && (
					<Button type="button" variant="outline" size="sm" onClick={() => setJsonMode(true)}>
						Import from JSON
					</Button>
				)}
				<Button type="button" variant="outline" size="sm" onClick={handleExportJson}>
					Export as JSON
				</Button>
			</div>

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
					id="post-published"
					checked={published}
					onCheckedChange={setPublished}
					disabled={isSaving}
				/>
				<Label htmlFor="post-published">Published</Label>
			</div>

			<div className="space-y-2">
				<Label htmlFor="post-scheduled">Scheduled Publish Date (optional)</Label>
				<Input
					id="post-scheduled"
					type="datetime-local"
					value={scheduledPublishAt}
					onChange={(e) => setScheduledPublishAt(e.target.value)}
					disabled={isSaving}
					className="max-w-xs"
				/>
				<p className="text-xs text-muted-foreground">
					If set, the post will not be visible until this date, even if published.
				</p>
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
				<p className="text-sm text-destructive" role="alert">{error}</p>
			)}

			<Button type="submit" disabled={isSaving}>
				{isSaving ? "Saving..." : isEditMode ? "Update Post" : "Create Post"}
			</Button>
		</form>
	);
}
