import { ImageResponse } from "next/og";
import { getSiteSettingsDirect } from "@/lib/site-settings";

export const alt = "Site image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
	let settings;
	try {
		settings = await getSiteSettingsDirect();
	} catch {
		return new ImageResponse(
			(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#111", color: "#fff", fontSize: 48, fontWeight: 700 }}>Welcome</div>),
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
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#0a0a0a",
					color: "#ffffff",
					padding: "60px 80px",
				}}
			>
				<h1 style={{ fontSize: 72, fontWeight: 700, margin: 0 }}>
					{settings.name}
				</h1>
				{settings.description && (
					<p
						style={{
							fontSize: 28,
							color: "rgba(255,255,255,0.6)",
							marginTop: "20px",
							textAlign: "center",
							maxWidth: "80%",
						}}
					>
						{settings.description.length > 150
							? settings.description.slice(0, 150) + "..."
							: settings.description}
					</p>
				)}
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
