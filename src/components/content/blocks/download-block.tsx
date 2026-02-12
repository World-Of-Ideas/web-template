import type { ContentBlock } from "@/types/content";
import { isSafeUrl } from "@/lib/utils";

interface DownloadBlockProps {
	block: ContentBlock;
}

export function DownloadBlock({ block }: DownloadBlockProps) {
	if (!block.downloadUrl || !isSafeUrl(block.downloadUrl)) return null;

	return (
		<div className="my-8 flex justify-center">
			<a href={block.downloadUrl} download className="inline-flex items-center rounded-full gradient-purple px-6 py-2.5 text-sm font-medium text-white hover:opacity-90">
				<svg
					className="mr-2 h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
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
		</div>
	);
}
