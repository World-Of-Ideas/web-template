import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { breadcrumbLabels } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/components/shared/json-ld";

interface BreadcrumbItem {
	label: string;
	href: string;
}

interface BreadcrumbsProps {
	items?: BreadcrumbItem[];
	currentPage?: string;
}

export function Breadcrumbs({ items, currentPage }: BreadcrumbsProps) {
	const breadcrumbs: BreadcrumbItem[] = [
		{ label: "Home", href: "/" },
		...(items ?? []),
	];

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: breadcrumbs.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.label,
			item: `${siteConfig.url}${item.href}`,
		})),
	};

	// Add current page as the last non-linked item
	if (currentPage) {
		jsonLd.itemListElement.push({
			"@type": "ListItem",
			position: breadcrumbs.length + 1,
			name: currentPage,
			item: "",
		});
	}

	return (
		<>
			<JsonLd data={jsonLd} />
			<nav aria-label="Breadcrumb" className="mb-6">
				<ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
					{breadcrumbs.map((item, index) => (
						<li key={`${index}-${item.href}`} className="flex items-center gap-1">
							{index > 0 && <ChevronRight className="h-3 w-3" />}
							<Link href={item.href} className="hover:text-foreground">
								{item.label}
							</Link>
						</li>
					))}
					{currentPage && (
						<li className="flex items-center gap-1">
							<ChevronRight className="h-3 w-3" />
							<span className="text-foreground">{currentPage}</span>
						</li>
					)}
				</ol>
			</nav>
		</>
	);
}

export function buildBreadcrumbItems(pathname: string): BreadcrumbItem[] {
	const segments = pathname.split("/").filter(Boolean);
	const items: BreadcrumbItem[] = [];

	for (let i = 0; i < segments.length - 1; i++) {
		const segment = segments[i];
		const href = `/${segments.slice(0, i + 1).join("/")}`;
		items.push({
			label: breadcrumbLabels[segment] ?? segment,
			href,
		});
	}

	return items;
}
