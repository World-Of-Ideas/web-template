import Link from "next/link";
import { siteConfig } from "@/config/site";
import { footerGroups } from "@/config/navigation";
import { getPublishedContentPages, isSystemPage } from "@/lib/pages";
import { getTrackingSettings } from "@/lib/tracking";
import { CookiePreferencesButton } from "@/components/shared/cookie-preferences-button";
import { TwitterIcon, GitHubIcon, DiscordIcon, InstagramIcon } from "./social-icons";

export async function Footer() {
	const [contentPages, trackingSettings] = await Promise.all([
		getPublishedContentPages().then((pages) => pages.filter((p) => !isSystemPage(p.slug))),
		getTrackingSettings(),
	]);
	return (
		<footer className="border-t bg-muted/50 dark:bg-zinc-950">
			<div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6">
				<div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
					<div>
						<Link href="/" className="text-lg font-semibold">
							{siteConfig.name}
						</Link>
						<p className="mt-2 text-sm text-muted-foreground">
							{siteConfig.description}
						</p>
						<div className="mt-4 flex gap-3">
							{siteConfig.social.twitter && (
								<Link
									href={`https://twitter.com/${siteConfig.social.twitter.replace("@", "")}`}
									className="text-muted-foreground transition-colors hover:text-foreground"
									target="_blank"
									rel="noopener noreferrer"
								>
									<span className="sr-only">Twitter</span>
									<TwitterIcon />
								</Link>
							)}
							{siteConfig.social.github && (
								<Link
									href={siteConfig.social.github}
									className="text-muted-foreground transition-colors hover:text-foreground"
									target="_blank"
									rel="noopener noreferrer"
								>
									<span className="sr-only">GitHub</span>
									<GitHubIcon />
								</Link>
							)}
							{siteConfig.social.discord && (
								<Link
									href={siteConfig.social.discord}
									className="text-muted-foreground transition-colors hover:text-foreground"
									target="_blank"
									rel="noopener noreferrer"
								>
									<span className="sr-only">Discord</span>
									<DiscordIcon />
								</Link>
							)}
							{siteConfig.social.instagram && (
								<Link
									href={siteConfig.social.instagram}
									className="text-muted-foreground transition-colors hover:text-foreground"
									target="_blank"
									rel="noopener noreferrer"
								>
									<span className="sr-only">Instagram</span>
									<InstagramIcon />
								</Link>
							)}
						</div>
					</div>

					<nav aria-label="Footer navigation" className="col-span-1 grid gap-8 sm:col-span-1 md:col-span-3 md:grid-cols-3">
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
												className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
											className="text-sm text-muted-foreground transition-colors hover:text-foreground"
										>
											{page.title}
										</Link>
									</li>
								))}
							</ul>
						</div>
					)}
				</nav>
				</div>

				<div className="mt-8 flex flex-col items-center gap-2 border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
					<span>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</span>
					{trackingSettings?.cookieConsentEnabled && <CookiePreferencesButton />}
				</div>
			</div>
		</footer>
	);
}
