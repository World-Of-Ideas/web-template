import { siteConfig } from "@/config/site";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SearchDialog } from "@/components/shared/search-dialog";
import { MetaPixel } from "@/components/shared/meta-pixel";
import { GoogleAnalytics } from "@/components/shared/google-analytics";
import { GoogleTagManager } from "@/components/shared/google-tag-manager";
import { CookieConsent } from "@/components/shared/cookie-consent";

export default function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:bg-background focus:px-4 focus:py-2 focus:text-foreground">Skip to content</a>
			<Header />
			<main id="main-content" className="min-h-[calc(100vh-3.5rem)] pt-14">{children}</main>
			<Footer />
			<MetaPixel />
			<GoogleAnalytics />
			<GoogleTagManager />
			<CookieConsent />
			{siteConfig.ui.search && <SearchDialog />}
		</>
	);
}
