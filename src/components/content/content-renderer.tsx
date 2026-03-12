import type { ContentBlock } from "@/types/content";
import { ParagraphBlock } from "./blocks/paragraph-block";
import { HeadingBlock } from "./blocks/heading-block";
import { ListBlock } from "./blocks/list-block";
import { ImageBlock } from "./blocks/image-block";
import { CalloutBlock } from "./blocks/callout-block";
import { QuoteBlock } from "./blocks/quote-block";
import { TableBlock } from "./blocks/table-block";
import { CtaBlock } from "./blocks/cta-block";
import { DownloadBlock } from "./blocks/download-block";
import { VideoBlock } from "./blocks/video-block";
import { TestimonialBlock } from "./blocks/testimonial-block";
import { CodeBlock } from "./blocks/code-block";
import { ButtonGroupBlock } from "./blocks/button-group-block";
import { FeatureGridBlock } from "./blocks/feature-grid-block";
import { LogoGridBlock } from "./blocks/logo-grid-block";
import { StatsCounterBlock } from "./blocks/stats-counter-block";
import { DividerBlock } from "./blocks/divider-block";
import { AccordionBlock } from "./blocks/accordion-block";
import { ImageGalleryBlock } from "./blocks/image-gallery-block";
import { EmbedBlock } from "./blocks/embed-block";
import { BannerBlock } from "./blocks/banner-block";
import { ComparisonTableBlock } from "./blocks/comparison-table-block";
import { TimelineBlock } from "./blocks/timeline-block";
import { SpacerBlock } from "./blocks/spacer-block";
import { TabsBlock } from "./blocks/tabs-block";
import { ReviewBlock } from "./blocks/review-block";
import { EmailCaptureBlock } from "./blocks/email-capture-block";
import { TocBlock } from "./blocks/toc-block";

interface ContentRendererProps {
	blocks: ContentBlock[];
	features?: Record<string, boolean>;
}

export function ContentRenderer({ blocks, features }: ContentRendererProps) {
	return (
		<div className="space-y-4 sm:space-y-6">
			{blocks.map((block, index) => {
				// Content blocks are read-only once rendered, so type+index is a stable key
				const key = `${block.type}-${index}`;
				switch (block.type) {
					case "paragraph":
						return <ParagraphBlock key={key} block={block} />;
					case "heading":
						return <HeadingBlock key={key} block={block} />;
					case "list":
						return <ListBlock key={key} block={block} />;
					case "image":
						return <ImageBlock key={key} block={block} />;
					case "callout":
						return <CalloutBlock key={key} block={block} />;
					case "quote":
						return <QuoteBlock key={key} block={block} />;
					case "table":
						return <TableBlock key={key} block={block} />;
					case "cta":
						return <CtaBlock key={key} block={block} />;
					case "download":
						return <DownloadBlock key={key} block={block} />;
					case "video":
						return <VideoBlock key={key} block={block} />;
					case "testimonial":
						return <TestimonialBlock key={key} block={block} />;
					case "code":
						return <CodeBlock key={key} block={block} />;
					case "buttonGroup":
						return <ButtonGroupBlock key={key} block={block} />;
					case "featureGrid":
						return <FeatureGridBlock key={key} block={block} />;
					case "logoGrid":
						return <LogoGridBlock key={key} block={block} />;
					case "statsCounter":
						return <StatsCounterBlock key={key} block={block} />;
					case "divider":
						return <DividerBlock key={key} block={block} />;
					case "accordion":
						return <AccordionBlock key={key} block={block} />;
					case "imageGallery":
						return <ImageGalleryBlock key={key} block={block} />;
					case "embed":
						return <EmbedBlock key={key} block={block} />;
					case "banner":
						return <BannerBlock key={key} block={block} />;
					case "comparisonTable":
						return <ComparisonTableBlock key={key} block={block} />;
					case "timeline":
						return <TimelineBlock key={key} block={block} />;
					case "spacer":
						return <SpacerBlock key={key} block={block} />;
					case "tabs":
						return <TabsBlock key={key} block={block} />;
					case "review":
						return <ReviewBlock key={key} block={block} />;
					case "emailCapture":
						if (features && !features.waitlist) return null;
						return <EmailCaptureBlock key={key} block={block} />;
					case "tableOfContents":
						return <TocBlock key={key} block={block} allBlocks={blocks} />;
					default:
						return null;
				}
			})}
		</div>
	);
}
