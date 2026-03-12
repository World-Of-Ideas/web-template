import Link from "next/link";
import { ContentRenderer } from "@/components/content/content-renderer";
import type { ContentBlock } from "@/types/content";

interface ChildPage {
	slug: string;
	title: string;
	description: string | null;
}

interface DefaultTemplateProps {
	title: string;
	description: string | null;
	content: ContentBlock[] | null;
	childPages: ChildPage[];
	features?: Record<string, boolean>;
}

export function DefaultTemplate({ title, description, content, childPages, features }: DefaultTemplateProps) {
	return (
		<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
			<h1 className="text-3xl font-normal tracking-tight sm:text-4xl md:text-5xl">
				{title}
			</h1>

			{description && (
				<p className="mt-3 text-base text-muted-foreground sm:text-lg">
					{description}
				</p>
			)}

			{content && content.length > 0 && (
				<div className="mt-8">
					<ContentRenderer blocks={content} features={features} />
				</div>
			)}

			{childPages.length > 0 && (
				<div className="mt-12">
					<h2 className="text-2xl font-normal tracking-tight">In This Section</h2>
					<div className="mt-6 grid gap-6 sm:grid-cols-2">
						{childPages.map((child) => (
							<Link
								key={child.slug}
								href={`/${child.slug}`}
								className="group rounded-xl border p-6 transition-colors hover:bg-accent"
							>
								<h3 className="font-semibold group-hover:text-primary">
									{child.title}
								</h3>
								{child.description && (
									<p className="mt-2 text-sm text-muted-foreground">
										{child.description}
									</p>
								)}
							</Link>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
