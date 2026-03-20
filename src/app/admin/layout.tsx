import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { validateSession } from "@/lib/admin";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { LogoutButton } from "@/components/admin/logout-button";
import { cn } from "@/lib/utils";

interface AdminSidebarLink {
	label: string;
	href: string;
	feature?: string;
}

const sidebarLinks: AdminSidebarLink[] = [
	{ label: "Dashboard", href: "/admin/dashboard" },
	{ label: "Posts", href: "/admin/posts", feature: "blog" },
	{ label: "Pages", href: "/admin/pages" },
	{ label: "Subscribers", href: "/admin/subscribers", feature: "waitlist" },
	{ label: "Contacts", href: "/admin/contacts", feature: "contact" },
	{ label: "Campaigns", href: "/admin/campaigns", feature: "waitlist" },
	{ label: "Giveaway", href: "/admin/giveaway", feature: "giveaway" },
	{ label: "Assets", href: "/admin/assets" },
	{ label: "Webhooks", href: "/admin/webhooks" },
	{ label: "Tracking", href: "/admin/tracking" },
	{ label: "Redirects", href: "/admin/redirects" },
	{ label: "Settings", href: "/admin/settings" },
	{ label: "SEO Audit", href: "/admin/seo" },
	{ label: "Audit Log", href: "/admin/audit-log" },
	{ label: "Error Log", href: "/admin/errors" },
];

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const headerList = await headers();
	const pathname = headerList.get("x-pathname") ?? "";

	// Determine if we are on the login page
	// The login page is exactly /admin with no sub-path
	const isLoginPage = pathname === "/admin" || pathname === "/admin/";

	if (!isLoginPage) {
		const cookieStore = await cookies();
		const sessionId = cookieStore.get("admin_session")?.value;

		if (!sessionId || !(await validateSession(sessionId))) {
			redirect("/admin");
		}
	}

	// Login page renders without sidebar
	if (isLoginPage) {
		return <>{children}</>;
	}

	const settings = await getSiteSettingsDirect();

	const visibleLinks = sidebarLinks.filter(
		(link) => !link.feature || settings.features[link.feature],
	);

	return (
		<div className="flex min-h-screen">
			{/* Sidebar */}
			<aside className="flex w-64 flex-col border-r bg-muted/30">
				<div className="flex h-14 items-center border-b px-4">
					<Link
						href="/admin/dashboard"
						className="text-lg font-semibold"
					>
						{settings.name} Admin
					</Link>
				</div>

				<nav aria-label="Admin navigation" className="flex-1 space-y-1 px-3 py-4">
					{visibleLinks.map((link) => {
						const isActive = pathname === link.href;
						return (
							<Link
								key={link.href}
								href={link.href}
								aria-current={isActive ? "page" : undefined}
								className={cn(
									"block rounded-md px-3 py-2 text-sm font-medium transition-colors",
									isActive
										? "bg-accent text-accent-foreground"
										: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
								)}
							>
								{link.label}
							</Link>
						);
					})}
				</nav>

				<div className="border-t px-3 py-3">
					<LogoutButton />
				</div>
			</aside>

			{/* Main content */}
			<main className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
			</main>
		</div>
	);
}
