import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SearchDialog } from "@/components/shared/search-dialog";

export default function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<Header />
			<main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
			<Footer />
			<SearchDialog />
		</>
	);
}
