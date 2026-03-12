import { ImageResponse } from "next/og";
import { getSiteSettingsDirect } from "@/lib/site-settings";

export const alt = "Blog tag";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
	params,
}: {
	params: Promise<{ tag: string }>;
}) {
	let tag, settings;
	try {
		const p = await params;
		tag = decodeURIComponent(p.tag);
		settings = await getSiteSettingsDirect();
	} catch {
		return new ImageResponse(
			(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#111", color: "#fff", fontSize: 48, fontWeight: 700 }}>Blog</div>),
			{ ...size },
		);
	}

	const accentColor = settings.theme.accentColor || "#9747ff";

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: "60px 80px",
					backgroundColor: "#0a0a0a",
					color: "#ffffff",
				}}
			>
				{/* Top - Site name */}
				<span
					style={{
						fontSize: 24,
						fontWeight: 600,
						color: accentColor,
					}}
				>
					{settings.name}
				</span>

				{/* Center - Tag label */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "20px",
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<span
						style={{
							fontSize: 22,
							color: "rgba(255,255,255,0.5)",
							textTransform: "uppercase",
							letterSpacing: "2px",
						}}
					>
						Tagged
					</span>
					<h1
						style={{
							fontSize: 64,
							fontWeight: 700,
							margin: 0,
							color: accentColor,
						}}
					>
						{tag.length > 40 ? tag.slice(0, 40) + "..." : tag}
					</h1>
				</div>

				{/* Accent bar */}
				<div
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						height: "6px",
						background: `linear-gradient(to right, ${accentColor}, ${accentColor}88)`,
					}}
				/>
			</div>
		),
		{ ...size },
	);
}
