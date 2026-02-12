import Link from "next/link";
import { siteConfig } from "@/config/site";
import { headerLinks, headerCtaButtons } from "@/config/navigation";
import { MobileNav } from "./mobile-nav";
import { SearchTrigger } from "./search-trigger";
import { ThemeToggle } from "./theme-toggle";
import { NavLinks } from "./nav-links";

export function Header() {
	const filteredLinks = headerLinks.filter(
		(link) => !link.feature || siteConfig.features[link.feature],
	);

	const filteredCtas = headerCtaButtons.filter(
		(btn) => !btn.feature || siteConfig.features[btn.feature],
	);

	return (
		<header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md dark:bg-black/30 dark:border-white/10">
			<div className="mx-auto flex h-14 max-w-[1440px] items-center px-4">
				<Link href="/" className="mr-3 text-lg font-semibold tracking-tight md:mr-6">
					{siteConfig.name}
				</Link>

				<nav aria-label="Main navigation" className="hidden flex-1 justify-center md:flex">
					<NavLinks links={filteredLinks} />
				</nav>

				<div className="ml-auto flex items-center gap-1 md:ml-0">
					{siteConfig.ui.search && <SearchTrigger />}
					{siteConfig.ui.themeToggle && <ThemeToggle />}

					<div className="hidden items-center gap-2 md:flex">
						{filteredCtas.map((cta) => (
							<Link
								key={cta.href}
								href={cta.href}
								className={
									cta.variant === "primary"
										? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
										: "rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
								}
							>
								{cta.label}
							</Link>
						))}
					</div>

					<MobileNav
						links={filteredLinks}
						ctaButtons={filteredCtas}
						showSearch={siteConfig.ui.search}
					/>
				</div>
			</div>
		</header>
	);
}
