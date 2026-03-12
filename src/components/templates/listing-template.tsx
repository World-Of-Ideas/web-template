import Link from "next/link";
import { ContentRenderer } from "@/components/content/content-renderer";
import { ArrowIcon } from "@/components/shared/arrow-icon";
import { cn } from "@/lib/utils";
import type { ContentBlock } from "@/types/content";
import type { ThemeSettings } from "@/types/site-settings";

const cardVariantStyles: Record<ThemeSettings["postCardVariant"], string> = {
	bordered: "rounded-xl border bg-card hover:bg-accent/50",
	filled: "rounded-xl bg-muted hover:bg-muted/80 border-0",
	minimal: "border-b rounded-none bg-transparent",
};

interface ChildPage {
	slug: string;
	title: string;
	description: string | null;
}

interface ListingTemplateProps {
	title: string;
	description: string | null;
	content: ContentBlock[] | null;
	childPages: ChildPage[];
	cardVariant?: ThemeSettings["postCardVariant"];
	features?: Record<string, boolean>;
}

export function ListingTemplate({ title, description, content, childPages, cardVariant = "bordered", features }: ListingTemplateProps) {
	return (
		<div className="mx-auto max-w-[1128px] px-4 py-12 sm:px-6 sm:py-16">
			<h1 className="text-3xl font-normal tracking-tight sm:text-4xl md:text-5xl">
				{title}
			</h1>

			{description && (
				<p className="mt-3 text-base text-muted-foreground sm:text-lg">
					{description}
				</p>
			)}

			{content && content.length > 0 && (
				<div className="mt-8 max-w-3xl">
					<ContentRenderer blocks={content} features={features} />
				</div>
			)}

			{childPages.length > 0 && (
				<div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{childPages.map((child) => (
						<Link
							key={child.slug}
							href={`/${child.slug}`}
							className={cn("group overflow-hidden p-6 transition-colors", cardVariantStyles[cardVariant] ?? cardVariantStyles.bordered)}
						>
							<h3 className="font-semibold group-hover:text-primary">
								{child.title}
							</h3>
							{child.description && (
								<p className="mt-2 text-sm text-muted-foreground line-clamp-2">
									{child.description}
								</p>
							)}
							<span className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
								View
								<ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
							</span>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
