import type { ContentBlock } from "@/types/content";
import Link from "next/link";
import { siteConfig } from "@/config/site";

interface CtaBlockProps {
	block: ContentBlock;
}

export function CtaBlock({ block }: CtaBlockProps) {
	const text = block.text ?? "Get started today!";

	// Adaptive CTA: waitlist form (pre-launch) or product links (post-launch)
	if (siteConfig.features.waitlist) {
		return (
			<div className="my-6 rounded-lg gradient-purple p-4 text-center sm:my-8 sm:p-6">
				<p className="mb-4 text-base font-medium text-white sm:text-lg">{text}</p>
				<Link href="/waitlist" className="inline-block rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:bg-white/90 sm:px-6 sm:py-2.5">
					Join the Waitlist
				</Link>
			</div>
		);
	}

	// Post-launch: show product links
	const { appUrl, appStoreUrl, playStoreUrl } = siteConfig.productLinks;
	const hasLinks = appUrl || appStoreUrl || playStoreUrl;

	if (!hasLinks) return null;

	return (
		<div className="my-6 rounded-lg gradient-purple p-4 text-center sm:my-8 sm:p-6">
			<p className="mb-4 text-base font-medium text-white sm:text-lg">{text}</p>
			<div className="flex flex-wrap justify-center gap-2 sm:gap-3">
				{appUrl && (
					<a href={appUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black hover:bg-white/90">
						Try {siteConfig.name}
					</a>
				)}
				{appStoreUrl && (
					<a href={appStoreUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black hover:bg-white/90">
						App Store
					</a>
				)}
				{playStoreUrl && (
					<a href={playStoreUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black hover:bg-white/90">
						Google Play
					</a>
				)}
			</div>
		</div>
	);
}
