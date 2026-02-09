"use client";

import type { ContentBlock, ContentBlockType } from "@/types/content";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BlockEditor } from "./block-editor";

interface BlockListProps {
	blocks: ContentBlock[];
	onChange: (blocks: ContentBlock[]) => void;
}

const BLOCK_TYPES: { type: ContentBlockType; label: string }[] = [
	{ type: "paragraph", label: "Paragraph" },
	{ type: "heading", label: "Heading" },
	{ type: "list", label: "List" },
	{ type: "image", label: "Image" },
	{ type: "callout", label: "Callout" },
	{ type: "quote", label: "Quote" },
	{ type: "table", label: "Table" },
	{ type: "cta", label: "CTA" },
	{ type: "download", label: "Download" },
];

function getDefaultBlock(type: ContentBlockType): ContentBlock {
	switch (type) {
		case "paragraph":
			return { type: "paragraph", text: "" };
		case "heading":
			return { type: "heading", text: "", level: 2 };
		case "list":
			return { type: "list", items: [""], ordered: false };
		case "image":
			return { type: "image", image: "", alt: "" };
		case "callout":
			return { type: "callout", text: "", variant: "info" };
		case "quote":
			return { type: "quote", text: "" };
		case "table":
			return { type: "table", headers: ["Column 1"], rows: [[""] ] };
		case "cta":
			return { type: "cta", text: "" };
		case "download":
			return { type: "download", downloadUrl: "", downloadLabel: "" };
	}
}

export function BlockList({ blocks, onChange }: BlockListProps) {
	function updateBlock(index: number, block: ContentBlock) {
		const updated = [...blocks];
		updated[index] = block;
		onChange(updated);
	}

	function moveBlock(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= blocks.length) return;
		const updated = [...blocks];
		[updated[index], updated[target]] = [updated[target], updated[index]];
		onChange(updated);
	}

	function deleteBlock(index: number) {
		const updated = blocks.filter((_, i) => i !== index);
		onChange(updated);
	}

	function addBlock(type: ContentBlockType) {
		onChange([...blocks, getDefaultBlock(type)]);
	}

	return (
		<div className="space-y-4">
			{blocks.map((block, i) => (
				<div key={i} className="rounded-lg border p-4 space-y-3">
					<div className="flex items-center justify-between">
						<Badge variant="secondary">{block.type}</Badge>
						<div className="flex items-center gap-1">
							<Button
								type="button"
								variant="ghost"
								size="icon-xs"
								onClick={() => moveBlock(i, -1)}
								disabled={i === 0}
								title="Move up"
							>
								&#8593;
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon-xs"
								onClick={() => moveBlock(i, 1)}
								disabled={i === blocks.length - 1}
								title="Move down"
							>
								&#8595;
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon-xs"
								onClick={() => deleteBlock(i)}
								title="Delete block"
							>
								&times;
							</Button>
						</div>
					</div>
					<BlockEditor
						block={block}
						onChange={(updated) => updateBlock(i, updated)}
					/>
				</div>
			))}

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button type="button" variant="outline" className="w-full">
						Add Block
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="center">
					{BLOCK_TYPES.map((bt) => (
						<DropdownMenuItem
							key={bt.type}
							onClick={() => addBlock(bt.type)}
						>
							{bt.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
