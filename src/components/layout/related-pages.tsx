import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { isSafeUrl } from "@/lib/utils";
import type { RelatedPage } from "@/types/content";

interface RelatedPagesProps {
	pages: RelatedPage[];
}

export function RelatedPages({ pages }: RelatedPagesProps) {
	if (!pages || pages.length === 0) return null;

	return (
		<section className="my-12 mx-auto max-w-3xl px-4 sm:px-6">
			<h2 className="mb-6 text-2xl font-bold">Related</h2>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{pages.filter((page) => isSafeUrl(page.href)).map((page) => (
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
