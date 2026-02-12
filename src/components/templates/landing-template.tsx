import { ContentRenderer } from "@/components/content/content-renderer";
import { GradientBackground } from "@/components/shared/gradient-background";
import type { ContentBlock } from "@/types/content";

interface LandingTemplateProps {
	title: string;
	description: string | null;
	content: ContentBlock[] | null;
}

export function LandingTemplate({ title, description, content }: LandingTemplateProps) {
	return (
		<>
			{/* Hero */}
			<section className="relative overflow-hidden px-4 py-20 text-center sm:px-6 sm:py-28 md:py-36">
				<GradientBackground />
				<div className="relative mx-auto max-w-4xl">
					<h1 className="text-3xl font-normal tracking-tight sm:text-5xl md:text-7xl">
						{title}
					</h1>
					{description && (
						<p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg md:text-xl">
							{description}
						</p>
					)}
				</div>
			</section>

			{/* Content — full-width sections */}
			{content && content.length > 0 && (
				<section className="px-4 py-12 sm:px-6 sm:py-16">
					<div className="mx-auto max-w-3xl">
						<ContentRenderer blocks={content} />
					</div>
				</section>
			)}
		</>
	);
}
