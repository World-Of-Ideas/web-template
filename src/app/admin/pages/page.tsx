import type { Metadata } from "next";
import Link from "next/link";
import { getAllPageSummaries, isSystemPage } from "@/lib/pages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
	title: "Pages | Admin",
};

interface PageRow {
	slug: string;
	parentSlug: string | null;
	title: string;
	description: string | null;
	published: boolean;
	scheduledPublishAt: string | null;
	depth: number;
}

function buildTree(
	pages: { slug: string; parentSlug: string | null; title: string; description: string | null; published: boolean; scheduledPublishAt: string | null }[],
): PageRow[] {
	const childrenMap = new Map<string | null, typeof pages>();
	for (const page of pages) {
		const key = page.parentSlug ?? null;
		if (!childrenMap.has(key)) childrenMap.set(key, []);
		childrenMap.get(key)!.push(page);
	}

	const result: PageRow[] = [];

	function walk(parentSlug: string | null, depth: number) {
		const children = childrenMap.get(parentSlug) ?? [];
		for (const child of children) {
			result.push({ ...child, depth });
			walk(child.slug, depth + 1);
		}
	}

	walk(null, 0);

	// Append any orphans (parentSlug points to a non-existent page)
	const placed = new Set(result.map((r) => r.slug));
	for (const page of pages) {
		if (!placed.has(page.slug)) {
			result.push({ ...page, depth: 0 });
		}
	}

	return result;
}

export default async function PagesPage() {
	const allPages = await getAllPageSummaries();

	const systemPages = allPages.filter((p) => isSystemPage(p.slug));
	const contentPages = buildTree(
		allPages.filter((p) => !isSystemPage(p.slug)),
	);

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Pages</h1>
				<Button asChild>
					<Link href="/admin/pages/new">New Page</Link>
				</Button>
			</div>

			{/* System Pages */}
			<section className="space-y-3">
				<h2 className="text-lg font-semibold">System Pages</h2>
				{systemPages.length === 0 ? (
					<p className="text-muted-foreground">
						No system pages found.
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Title</TableHead>
								<TableHead>Slug</TableHead>
								<TableHead>Description</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{systemPages.map((page) => (
								<TableRow key={page.slug}>
									<TableCell>
										<Link
											href={`/admin/pages/${page.slug}/edit`}
											className="font-medium hover:underline"
										>
											{page.title}
										</Link>
									</TableCell>
									<TableCell className="text-muted-foreground">
										/{page.slug}
									</TableCell>
									<TableCell className="max-w-xs truncate text-muted-foreground">
										{page.description ?? "-"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</section>

			{/* Content Pages */}
			<section className="space-y-3">
				<h2 className="text-lg font-semibold">Content Pages</h2>
				{contentPages.length === 0 ? (
					<p className="text-muted-foreground">
						No content pages yet. Create a page to get started.
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Title</TableHead>
								<TableHead>Slug</TableHead>
								<TableHead>Parent</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{contentPages.map((page) => (
								<TableRow key={page.slug}>
									<TableCell>
										<Link
											href={`/admin/pages/${page.slug}/edit`}
											className="font-medium hover:underline"
											style={{ paddingLeft: `${page.depth * 1.5}rem` }}
										>
											{page.depth > 0 ? "└ " : ""}
											{page.title}
										</Link>
									</TableCell>
									<TableCell className="text-muted-foreground">
										/{page.slug}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{page.parentSlug
											? `/${page.parentSlug}`
											: "-"}
									</TableCell>
									<TableCell>
										<div className="flex gap-1">
											<Badge
												variant={
													page.published
														? "default"
														: "secondary"
												}
											>
												{page.published
													? "Published"
													: "Draft"}
											</Badge>
											{page.scheduledPublishAt && new Date(page.scheduledPublishAt + "Z") > new Date() && (
												<Badge variant="outline">
													Scheduled
												</Badge>
											)}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</section>
		</div>
	);
}
