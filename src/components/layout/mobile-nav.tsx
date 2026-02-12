"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import type { NavLink, HeaderCtaButton } from "@/config/navigation";

interface MobileNavProps {
	links: NavLink[];
	ctaButtons?: HeaderCtaButton[];
	showSearch?: boolean;
}

export function MobileNav({ links, ctaButtons = [], showSearch = true }: MobileNavProps) {
	const [open, setOpen] = useState(false);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
					<Menu className="h-5 w-5" />
				</Button>
			</SheetTrigger>
			<SheetContent side="right">
				<SheetTitle className="font-bold">{siteConfig.name}</SheetTitle>
				<nav aria-label="Main navigation" className="mt-6 flex flex-col gap-4">
					{showSearch && (
						<button
							type="button"
							onClick={() => {
								setOpen(false);
								document.dispatchEvent(new CustomEvent("open-search"));
							}}
							className="flex items-center gap-2 text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							<Search className="h-4 w-4" />
							Search
						</button>
					)}
					{links.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							onClick={() => setOpen(false)}
							className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							{link.label}
						</Link>
					))}
				</nav>

				{ctaButtons.length > 0 && (
					<div className="mt-8 flex flex-col gap-3">
						{ctaButtons.map((cta) => (
							<Link
								key={cta.href}
								href={cta.href}
								onClick={() => setOpen(false)}
								className={
									cta.variant === "primary"
										? "rounded-full bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
										: "rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-accent"
								}
							>
								{cta.label}
							</Link>
						))}
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
