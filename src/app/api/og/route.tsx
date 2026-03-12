import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getPublishedPageBySlug } from "@/lib/pages";
import { getSiteSettingsDirect } from "@/lib/site-settings";

const size = { width: 1200, height: 630 };

function fallback(text: string) {
	return new ImageResponse(
		(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#111", color: "#fff", fontSize: 48, fontWeight: 700 }}>{text}</div>),
		{ ...size },
	);
}

export async function GET(request: NextRequest) {
	const slug = request.nextUrl.searchParams.get("slug");
	if (!slug) return fallback("Page");

	let page, settings;
	try {
		[page, settings] = await Promise.all([
			getPublishedPageBySlug(slug),
			getSiteSettingsDirect(),
		]);
	} catch {
		return fallback("Page");
	}

	if (!page) {
		return fallback(settings?.name ?? "Page");
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

				{/* Center - Title + description */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "16px",
						flex: 1,
						justifyContent: "center",
					}}
				>
					<h1
						style={{
							fontSize: (page.title?.length ?? 0) > 60 ? 42 : 56,
							fontWeight: 700,
							lineHeight: 1.2,
							margin: 0,
							maxWidth: "90%",
						}}
					>
						{(page.title?.length ?? 0) > 100
							? page.title.slice(0, 100) + "..."
							: page.title}
					</h1>
					{page.description && (
						<p
							style={{
								fontSize: 24,
								color: "rgba(255,255,255,0.6)",
								lineHeight: 1.4,
								margin: 0,
								maxWidth: "80%",
							}}
						>
							{page.description.length > 120
								? page.description.slice(0, 120) + "..."
								: page.description}
						</p>
					)}
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
