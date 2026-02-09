"use client";

import type { RelatedPage } from "@/types/content";
import type { ExistingPageInfo } from "./page-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface RelatedPagesEditorProps {
	pages: RelatedPage[];
	onChange: (pages: RelatedPage[]) => void;
	existingPages?: ExistingPageInfo[];
}

export function RelatedPagesEditor({ pages, onChange, existingPages = [] }: RelatedPagesEditorProps) {
	function updatePage(index: number, field: keyof RelatedPage, value: string) {
		const updated = [...pages];
		updated[index] = { ...updated[index], [field]: value };
		onChange(updated);
	}

	function addPage() {
		onChange([...pages, { title: "", description: "", href: "" }]);
	}

	function addFromExisting(slug: string) {
		const existing = existingPages.find((p) => p.slug === slug);
		if (!existing) return;
		onChange([
			...pages,
			{
				title: existing.title,
				description: existing.description ?? "",
				href: `/${existing.slug}`,
			},
		]);
	}

	function removePage(index: number) {
		onChange(pages.filter((_, i) => i !== index));
	}

	// Filter out pages already added as related
	const addedHrefs = new Set(pages.map((p) => p.href));
	const availablePages = existingPages.filter(
		(p) => !addedHrefs.has(`/${p.slug}`),
	);

	return (
		<div className="space-y-4">
			{pages.map((page, i) => (
				<div key={i} className="rounded-lg border p-4 space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium text-muted-foreground">
							Related Page {i + 1}
						</span>
						<Button
							type="button"
							variant="ghost"
							size="icon-xs"
							onClick={() => removePage(i)}
							title="Remove related page"
						>
							&times;
						</Button>
					</div>

					<div className="space-y-2">
						<Label>Title</Label>
						<Input
							value={page.title}
							onChange={(e) => updatePage(i, "title", e.target.value)}
							placeholder="Page title"
						/>
					</div>

					<div className="space-y-2">
						<Label>Description</Label>
						<Input
							value={page.description}
							onChange={(e) => updatePage(i, "description", e.target.value)}
							placeholder="Brief description"
						/>
					</div>

					<div className="space-y-2">
						<Label>Link (href)</Label>
						<Input
							value={page.href}
							onChange={(e) => updatePage(i, "href", e.target.value)}
							placeholder="/path/to/page"
						/>
					</div>
				</div>
			))}

			<div className="flex gap-2">
				{availablePages.length > 0 && (
					<Select onValueChange={addFromExisting}>
						<SelectTrigger className="flex-1">
							<SelectValue placeholder="Pick an existing page..." />
						</SelectTrigger>
						<SelectContent>
							{availablePages.map((p) => (
								<SelectItem key={p.slug} value={p.slug}>
									{p.title} (/{p.slug})
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
				<Button type="button" variant="outline" onClick={addPage}>
					Add Custom
				</Button>
			</div>
		</div>
	);
}
