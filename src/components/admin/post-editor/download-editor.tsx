"use client";

import type { ContentBlock } from "@/types/content";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DownloadEditorProps {
	block: ContentBlock;
	onChange: (block: ContentBlock) => void;
}

export function DownloadEditor({ block, onChange }: DownloadEditorProps) {
	return (
		<div className="space-y-2">
			<div>
				<Label>Download URL</Label>
				<Input
					value={block.downloadUrl ?? ""}
					onChange={(e) => onChange({ ...block, downloadUrl: e.target.value })}
					placeholder="https://example.com/file.pdf"
				/>
			</div>
			<div>
				<Label>Button Label</Label>
				<Input
					value={block.downloadLabel ?? ""}
					onChange={(e) => onChange({ ...block, downloadLabel: e.target.value })}
					placeholder="Download (default)"
				/>
			</div>
		</div>
	);
}
