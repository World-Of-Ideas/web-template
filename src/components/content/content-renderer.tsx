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
		<div className="prose prose-neutral max-w-none dark:prose-invert">
			{blocks.map((block, index) => {
				switch (block.type) {
					case "paragraph":
						return <ParagraphBlock key={index} block={block} />;
					case "heading":
						return <HeadingBlock key={index} block={block} />;
					case "list":
						return <ListBlock key={index} block={block} />;
					case "image":
						return <ImageBlock key={index} block={block} />;
					case "callout":
						return <CalloutBlock key={index} block={block} />;
					case "quote":
						return <QuoteBlock key={index} block={block} />;
					case "table":
						return <TableBlock key={index} block={block} />;
					case "cta":
						return <CtaBlock key={index} block={block} />;
					case "download":
						return <DownloadBlock key={index} block={block} />;
					default:
						return null;
				}
			})}
		</div>
	);
}
