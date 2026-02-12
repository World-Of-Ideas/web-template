import type { ContentBlock } from "@/types/content";
import { ParagraphBlock } from "./blocks/paragraph-block";
import { HeadingBlock } from "./blocks/heading-block";
import { ListBlock } from "./blocks/list-block";
import { ImageBlock } from "./blocks/image-block";
import { CalloutBlock } from "./blocks/callout-block";
import { QuoteBlock } from "./blocks/quote-block";
import { TableBlock } from "./blocks/table-block";
import { CtaBlock } from "./blocks/cta-block";
import { DownloadBlock } from "./blocks/download-block";

interface ContentRendererProps {
	blocks: ContentBlock[];
}

export function ContentRenderer({ blocks }: ContentRendererProps) {
	return (
		<div className="space-y-4 sm:space-y-6">
			{blocks.map((block, index) => {
				// Content blocks are read-only once rendered, so type+index is a stable key
				const key = `${block.type}-${index}`;
				switch (block.type) {
					case "paragraph":
						return <ParagraphBlock key={key} block={block} />;
					case "heading":
						return <HeadingBlock key={key} block={block} />;
					case "list":
						return <ListBlock key={key} block={block} />;
					case "image":
						return <ImageBlock key={key} block={block} />;
					case "callout":
						return <CalloutBlock key={key} block={block} />;
					case "quote":
						return <QuoteBlock key={key} block={block} />;
					case "table":
						return <TableBlock key={key} block={block} />;
					case "cta":
						return <CtaBlock key={key} block={block} />;
					case "download":
						return <DownloadBlock key={key} block={block} />;
					default:
						return null;
				}
			})}
		</div>
	);
}
