"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavLink } from "@/config/navigation";

interface NavLinksProps {
	links: NavLink[];
}

export function NavLinks({ links }: NavLinksProps) {
	const pathname = usePathname();

	return (
		<div className="flex items-center gap-6">
			{links.map((link) => {
				const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
				return (
					<Link
						key={link.href}
						href={link.href}
						className={cn(
							"text-sm font-medium transition-colors hover:text-foreground",
							isActive ? "text-foreground" : "text-muted-foreground",
						)}
					>
						{link.label}
					</Link>
				);
			})}
		</div>
	);
}
