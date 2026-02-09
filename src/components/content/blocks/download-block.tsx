import type { ContentBlock } from "@/types/content";
import { isSafeUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DownloadBlockProps {
	block: ContentBlock;
}

export function DownloadBlock({ block }: DownloadBlockProps) {
	if (!block.downloadUrl || !isSafeUrl(block.downloadUrl)) return null;

	return (
		<div className="not-prose my-8 flex justify-center">
			<Button asChild>
				<a href={block.downloadUrl} download>
					<svg
						className="mr-2 h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
						/>
					</svg>
					{block.downloadLabel || "Download"}
				</a>
			</Button>
		</div>
	);
}
