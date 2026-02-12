import type { ContentBlock } from "@/types/content";

interface HeadingBlockProps {
	block: ContentBlock;
}

export function HeadingBlock({ block }: HeadingBlockProps) {
	if (!block.text) return null;

	switch (block.level) {
		case 3:
			return <h3 className="text-xl font-normal tracking-tight sm:text-[26px]">{block.text}</h3>;
		case 4:
			return <h4 className="text-lg font-medium sm:text-[22px]">{block.text}</h4>;
		default:
			return <h2 className="text-2xl font-normal tracking-tight sm:text-[32px]">{block.text}</h2>;
	}
}
