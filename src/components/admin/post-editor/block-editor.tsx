"use client";

import type { ContentBlock } from "@/types/content";
import { ParagraphEditor } from "./paragraph-editor";
import { HeadingEditor } from "./heading-editor";
import { ListEditor } from "./list-editor";
import { ImageEditor } from "./image-editor";
import { CalloutEditor } from "./callout-editor";
import { QuoteEditor } from "./quote-editor";
import { TableEditor } from "./table-editor";
import { CtaEditor } from "./cta-editor";
import { DownloadEditor } from "./download-editor";

interface BlockEditorProps {
	block: ContentBlock;
	onChange: (block: ContentBlock) => void;
}

export function BlockEditor({ block, onChange }: BlockEditorProps) {
	switch (block.type) {
		case "paragraph":
			return <ParagraphEditor block={block} onChange={onChange} />;
		case "heading":
			return <HeadingEditor block={block} onChange={onChange} />;
		case "list":
			return <ListEditor block={block} onChange={onChange} />;
		case "image":
			return <ImageEditor block={block} onChange={onChange} />;
		case "callout":
			return <CalloutEditor block={block} onChange={onChange} />;
		case "quote":
			return <QuoteEditor block={block} onChange={onChange} />;
		case "table":
			return <TableEditor block={block} onChange={onChange} />;
		case "cta":
			return <CtaEditor block={block} onChange={onChange} />;
		case "download":
			return <DownloadEditor block={block} onChange={onChange} />;
		default:
			return (
				<p className="text-sm text-muted-foreground">
					Unknown block type: {(block as ContentBlock).type}
				</p>
			);
	}
}
