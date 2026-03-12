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

interface PillarTemplateProps {
	title: string;
	description: string | null;
	content: ContentBlock[] | null;
	childPages: ChildPage[];
	cardVariant?: ThemeSettings["postCardVariant"];
	features?: Record<string, boolean>;
}

export function PillarTemplate({ title, description, content, childPages, cardVariant = "bordered", features }: PillarTemplateProps) {
	return (
		<div className="mx-auto max-w-[1128px] px-4 py-12 sm:px-6 sm:py-16">
			<div className="max-w-3xl">
				<h1 className="text-3xl font-normal tracking-tight sm:text-4xl md:text-5xl">
					{title}
				</h1>

				{description && (
					<p className="mt-3 text-base text-muted-foreground sm:text-lg">
						{description}
					</p>
				)}
			</div>

			<div className="mt-8 grid gap-8 sm:mt-12 lg:gap-12 lg:grid-cols-[1fr_300px]">
				{/* Main content */}
				<div>
					{content && content.length > 0 && (
						<div className="max-w-3xl">
							<ContentRenderer blocks={content} features={features} />
						</div>
					)}

					{/* Child pages grid */}
					{childPages.length > 0 && (
						<div className="mt-12">
							<h2 className="text-2xl font-normal tracking-tight">In This Section</h2>
							<div className="mt-6 grid gap-6 sm:grid-cols-2">
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
										<span className="mt-3 flex items-center gap-1 text-sm font-medium text-primary">
											Read Guide
											<ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
										</span>
									</Link>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Sidebar TOC */}
				{childPages.length > 0 && (
					<aside className="hidden lg:block">
						<div className="sticky top-20">
							<h3 className="text-sm font-semibold text-muted-foreground">Contents</h3>
							<nav className="mt-3 space-y-2" aria-label="Table of contents">
								{childPages.map((child) => (
									<Link
										key={child.slug}
										href={`/${child.slug}`}
										className="block text-sm text-muted-foreground transition-colors hover:text-primary"
									>
										{child.title}
									</Link>
								))}
							</nav>
						</div>
					</aside>
				)}
			</div>
		</div>
	);
}
