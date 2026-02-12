import Image from "next/image";
import type { ContentBlock } from "@/types/content";
import { isSafeUrl } from "@/lib/utils";
import { normalizeImageSrc } from "@/lib/r2";

interface ImageBlockProps {
	block: ContentBlock;
}

export function ImageBlock({ block }: ImageBlockProps) {
	if (!block.image || !isSafeUrl(block.image)) return null;

	return (
		<figure>
			<Image
				src={normalizeImageSrc(block.image)}
				alt={block.alt || ""}
				width={1200}
				height={675}
				className="w-full h-auto rounded-lg bg-muted"
				loading="lazy"
			/>
		</figure>
	);
}
