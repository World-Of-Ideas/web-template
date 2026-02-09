import type { ContentBlock } from "@/types/content";
import Link from "next/link";
import { isSafeUrl } from "@/lib/utils";

interface ParagraphBlockProps {
	block: ContentBlock;
}

export function ParagraphBlock({ block }: ParagraphBlockProps) {
	if (!block.text) return null;

	const hasLink = block.link && block.linkText && isSafeUrl(block.link);

	return (
		<p>
			{block.text}
			{hasLink && (
				<>
					{" "}
					<Link href={block.link!} className="text-primary underline underline-offset-4 hover:text-primary/80">
						{block.linkText}
					</Link>
				</>
			)}
		</p>
	);
}
