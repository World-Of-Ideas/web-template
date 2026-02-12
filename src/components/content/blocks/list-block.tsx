import type { ContentBlock } from "@/types/content";

interface ListBlockProps {
	block: ContentBlock;
}

export function ListBlock({ block }: ListBlockProps) {
	if (!block.items || block.items.length === 0) return null;

	const Tag = block.ordered ? "ol" : "ul";

	return (
		<Tag className={`text-base leading-relaxed space-y-2 sm:text-lg sm:leading-[27px] ${block.ordered ? "list-decimal pl-6" : "list-disc pl-6"}`}>
			{block.items.map((item, i) => (
				<li key={i}>{item}</li>
			))}
		</Tag>
	);
}
