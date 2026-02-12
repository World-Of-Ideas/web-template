import type { ContentBlock } from "@/types/content";

interface QuoteBlockProps {
	block: ContentBlock;
}

export function QuoteBlock({ block }: QuoteBlockProps) {
	if (!block.text) return null;

	return <blockquote className="border-l-4 border-[#9747ff] pl-4 italic text-base text-muted-foreground sm:text-lg">{block.text}</blockquote>;
}
