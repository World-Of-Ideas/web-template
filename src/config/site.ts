export const siteConfig = {
	name: "Product Name",
	description: "One-line value proposition for your product.",
	url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
	author: "Company Name", // Used in meta authors/creator tags

	// Product links — used by CTAs when waitlist is disabled (post-launch)
	productLinks: {
		appUrl: "", // Web app URL (e.g. "https://app.example.com")
		appStoreUrl: "", // iOS App Store URL
		playStoreUrl: "", // Google Play Store URL
	},

	// Social links — shown in footer + share buttons
	social: {
		twitter: "", // e.g. "@productname"
		github: "",
		discord: "",
		instagram: "",
	},

	// Turnstile site key (public, not a secret)
	// Set NEXT_PUBLIC_TURNSTILE_SITE_KEY in production; falls back to always-pass test key for dev
	turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA",

	// Page/route features — disabling hides routes, nav links, sitemap entries
	features: {
		waitlist: true,
		giveaway: true,
		blog: true,
		contact: true,
	},

	// UI features — toggle header/layout UI elements
	ui: {
		search: true,       // Cmd+K search dialog + header search icon
		themeToggle: true,  // Light/dark mode toggle in header
	},
} satisfies {
	name: string;
	description: string;
	url: string;
	author: string;
	productLinks: { appUrl: string; appStoreUrl: string; playStoreUrl: string };
	social: { twitter: string; github: string; discord: string; instagram: string };
	turnstileSiteKey: string;
	features: Record<string, boolean>;
	ui: Record<string, boolean>;
};

export type SiteConfig = typeof siteConfig;
export type FeatureKey = keyof typeof siteConfig.features;
