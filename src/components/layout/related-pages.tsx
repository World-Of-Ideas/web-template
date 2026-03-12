import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { isSafeUrl } from "@/lib/utils";
import type { RelatedPage } from "@/types/content";

/** Maps route prefixes to their feature flag key */
const ROUTE_FEATURE_MAP: Record<string, string> = {
	"/waitlist": "waitlist",
	"/giveaway": "giveaway",
	"/blog": "blog",
	"/contact": "contact",
	"/pricing": "pricing",
	"/changelog": "changelog",
};

interface RelatedPagesProps {
	pages: RelatedPage[];
	features?: Record<string, boolean>;
}

export function RelatedPages({ pages, features }: RelatedPagesProps) {
	if (!pages || pages.length === 0) return null;

	const visiblePages = pages.filter((page) => {
		if (!isSafeUrl(page.href)) return false;
		if (!features) return true;
		const featureKey = Object.entries(ROUTE_FEATURE_MAP).find(
			([prefix]) => page.href === prefix || page.href.startsWith(prefix + "/"),
		)?.[1];
		return !featureKey || features[featureKey];
	});

	if (visiblePages.length === 0) return null;

	return (
		<section className="my-12 mx-auto max-w-3xl px-4 sm:px-6">
			<h2 className="mb-6 text-2xl font-bold">Related</h2>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{visiblePages.map((page) => (
					<Link key={page.href} href={page.href}>
						<Card className="h-full transition-colors hover:bg-muted/50">
							<CardHeader>
								<CardTitle className="text-lg">{page.title}</CardTitle>
								<CardDescription>{page.description}</CardDescription>
							</CardHeader>
						</Card>
					</Link>
				))}
			</div>
		</section>
	);
}
