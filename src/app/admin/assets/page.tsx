import type { Metadata } from "next";
import { listAssets } from "@/lib/assets";
import { getEnv } from "@/db";
import { getPublicUrl } from "@/lib/r2";
import { AssetsGrid } from "@/components/admin/assets-grid";

export const metadata: Metadata = {
	title: "Assets | Admin",
};

export default async function AssetsPage() {
	let assets: { key: string; size: number; uploaded: string; url: string }[] =
		[];

	try {
		const env = await getEnv();
		const raw = await listAssets();
		assets = raw.map((a) => ({
			key: a.key,
			size: a.size,
			uploaded: a.uploaded,
			url: getPublicUrl(env.R2_PUBLIC_URL, a.key),
		}));
	} catch {
		// R2 may not be available locally
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Assets</h1>
				<p className="text-sm text-muted-foreground">
					{assets.length} file{assets.length !== 1 ? "s" : ""} in R2
				</p>
			</div>
			<AssetsGrid initialAssets={assets} />
		</div>
	);
}
