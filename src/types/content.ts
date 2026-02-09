export type ContentBlockType =
	| "paragraph"
	| "heading"
	| "list"
	| "image"
	| "callout"
	| "quote"
	| "table"
	| "cta"
	| "download";

export interface ContentBlock {
	type: ContentBlockType;
	// paragraph, heading, callout, quote, cta
	text?: string;
	// paragraph — optional inline link
	link?: string;
	linkText?: string;
	// heading — level (h2, h3, h4)
	level?: 2 | 3 | 4;
	// image — R2 URL + alt text
	image?: string;
	alt?: string;
	// list — items + ordered flag
	items?: string[];
	ordered?: boolean;
	// callout — variant
	variant?: "info" | "tip" | "warning";
	// table — headers + rows
	headers?: string[];
	rows?: string[][];
	// download — file URL + button label
	downloadUrl?: string;
	downloadLabel?: string;
}

export interface FAQ {
	question: string;
	answer: string;
}

export interface RelatedPage {
	title: string;
	description: string;
	href: string;
}
