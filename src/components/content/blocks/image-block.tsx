import Image from "next/image";
import type { ContentBlock } from "@/types/content";
import { isSafeUrl } from "@/lib/utils";

interface ImageBlockProps {
	block: ContentBlock;
}

export function ImageBlock({ block }: ImageBlockProps) {
	if (!block.image || !isSafeUrl(block.image)) return null;

	return (
		<figure>
			<Image
				src={block.image}
				alt={block.alt ?? ""}
				width={1200}
				height={675}
				className="w-full h-auto rounded-lg"
				loading="lazy"
			/>
		</figure>
	);
}
