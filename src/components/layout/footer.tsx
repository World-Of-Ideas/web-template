import Link from "next/link";
import { siteConfig } from "@/config/site";
import { footerGroups } from "@/config/navigation";
import { getPublishedContentPages, isSystemPage } from "@/lib/pages";

export async function Footer() {
	const contentPages = (await getPublishedContentPages()).filter(
		(p) => !isSystemPage(p.slug),
	);
	return (
		<footer className="border-t">
			<div className="container mx-auto px-4 py-12">
				<div className="grid gap-8 md:grid-cols-4">
					<div>
						<Link href="/" className="text-lg font-bold">
							{siteConfig.name}
						</Link>
						<p className="mt-2 text-sm text-muted-foreground">
							{siteConfig.description}
						</p>
						<div className="mt-4 flex gap-3">
							{siteConfig.social.twitter && (
								<Link
									href={`https://twitter.com/${siteConfig.social.twitter.replace("@", "")}`}
									className="text-muted-foreground hover:text-foreground"
									target="_blank"
									rel="noopener noreferrer"
								>
									<span className="sr-only">Twitter</span>
									𝕏
								</Link>
							)}
							{siteConfig.social.github && (
								<Link
									href={siteConfig.social.github}
									className="text-muted-foreground hover:text-foreground"
									target="_blank"
									rel="noopener noreferrer"
								>
									<span className="sr-only">GitHub</span>
									GH
								</Link>
							)}
						</div>
					</div>

					{footerGroups.map((group) => {
						const filteredLinks = group.links.filter(
							(link) => !link.feature || siteConfig.features[link.feature],
						);
						if (filteredLinks.length === 0) return null;

						return (
							<div key={group.title}>
								<h3 className="mb-3 text-sm font-semibold">{group.title}</h3>
								<ul className="space-y-2">
									{filteredLinks.map((link) => (
										<li key={link.href}>
											<Link
												href={link.href}
												className="text-sm text-muted-foreground hover:text-foreground"
											>
												{link.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						);
					})}

					{contentPages.length > 0 && (
						<div>
							<h3 className="mb-3 text-sm font-semibold">Pages</h3>
							<ul className="space-y-2">
								{contentPages.map((page) => (
									<li key={page.slug}>
										<Link
											href={`/${page.slug}`}
											className="text-sm text-muted-foreground hover:text-foreground"
										>
											{page.title}
										</Link>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>

				<div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
					&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
				</div>
			</div>
		</footer>
	);
}
