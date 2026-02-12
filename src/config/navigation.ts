import type { FeatureKey } from "./site";

export interface NavLink {
	label: string;
	href: string;
	feature?: FeatureKey;
}

export interface FooterGroup {
	title: string;
	links: NavLink[];
}

export interface HeaderCtaButton {
	label: string;
	href: string;
	variant: "primary" | "outline";
	feature?: FeatureKey;
}

export const headerLinks: NavLink[] = [
	{ label: "Waitlist", href: "/waitlist", feature: "waitlist" },
	{ label: "Giveaway", href: "/giveaway", feature: "giveaway" },
	{ label: "Blog", href: "/blog", feature: "blog" },
	{ label: "Contact", href: "/contact", feature: "contact" },
];

export const headerCtaButtons: HeaderCtaButton[] = [
	{ label: "Enter Giveaway", href: "/giveaway", variant: "primary", feature: "giveaway" },
	{ label: "Contact", href: "/contact", variant: "outline", feature: "contact" },
];

export const footerGroups: FooterGroup[] = [
	{
		title: "Product",
		links: [
			{ label: "Waitlist", href: "/waitlist", feature: "waitlist" },
			{ label: "Giveaway", href: "/giveaway", feature: "giveaway" },
		],
	},
	{
		title: "Resources",
		links: [
			{ label: "Blog", href: "/blog", feature: "blog" },
			{ label: "Contact", href: "/contact", feature: "contact" },
		],
	},
	{
		title: "Legal",
		links: [
			{ label: "Terms of Use", href: "/terms" },
			{ label: "Privacy Policy", href: "/privacy" },
		],
	},
];

export const breadcrumbLabels: Record<string, string> = {
	"": "Home",
	waitlist: "Waitlist",
	giveaway: "Giveaway",
	blog: "Blog",
	contact: "Contact",
	terms: "Terms of Use",
	privacy: "Privacy Policy",
	admin: "Admin",
};

export const ctaConfig = {
	preLaunch: {
		heading: "Join the Waitlist",
		description: "Be the first to know when we launch.",
		buttonText: "Join Waitlist",
	},
	postLaunch: {
		heading: "Get Started",
		description: "Try the product today.",
		buttonText: "Get Started",
	},
} as const;
