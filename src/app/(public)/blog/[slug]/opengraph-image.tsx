import { ImageResponse } from "next/og";
import { getPublishedPostBySlug } from "@/lib/blog";
import { getSiteSettingsDirect } from "@/lib/site-settings";

export const alt = "Blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	let post, settings;
	try {
		const { slug } = await params;
		[post, settings] = await Promise.all([
			getPublishedPostBySlug(slug),
			getSiteSettingsDirect(),
		]);
	} catch {
		// Fallback if DB fails
		return new ImageResponse(
			(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#111", color: "#fff", fontSize: 48, fontWeight: 700 }}>Blog Post</div>),
			{ ...size },
		);
	}

	if (!post) {
		return new ImageResponse(
			(
				<div
					style={{
						width: "100%",
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: "#111",
						color: "#fff",
						fontSize: 48,
						fontWeight: 700,
					}}
				>
					{settings.name}
				</div>
			),
			{ ...size },
		);
	}

	const tags = (post.tags ?? []) as string[];
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
				{/* Top section - Site name + tags */}
				<div
					style={{ display: "flex", alignItems: "center", gap: "16px" }}
				>
					<span
						style={{
							fontSize: 24,
							fontWeight: 600,
							color: accentColor,
						}}
					>
						{settings.name}
					</span>
					{tags.length > 0 && (
						<div style={{ display: "flex", gap: "8px" }}>
							{tags.slice(0, 3).map((tag) => (
								<span
									key={tag}
									style={{
										fontSize: 16,
										padding: "4px 12px",
										borderRadius: "9999px",
										backgroundColor: "rgba(255,255,255,0.1)",
										color: "rgba(255,255,255,0.7)",
									}}
								>
									{tag}
								</span>
							))}
						</div>
					)}
				</div>

				{/* Middle section - Title + description */}
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
							fontSize: (post.title?.length ?? 0) > 60 ? 42 : 56,
							fontWeight: 700,
							lineHeight: 1.2,
							margin: 0,
							maxWidth: "90%",
						}}
					>
						{(post.title?.length ?? 0) > 100 ? post.title.slice(0, 100) + "..." : post.title}
					</h1>
					{post.description && (
						<p
							style={{
								fontSize: 24,
								color: "rgba(255,255,255,0.6)",
								lineHeight: 1.4,
								margin: 0,
								maxWidth: "80%",
							}}
						>
							{post.description.length > 120
								? post.description.slice(0, 120) + "..."
								: post.description}
						</p>
					)}
				</div>

				{/* Bottom section - Author + date */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<span
						style={{
							fontSize: 20,
							color: "rgba(255,255,255,0.5)",
						}}
					>
						By {post.author}
					</span>
					{post.publishedAt && (
						<span
							style={{
								fontSize: 20,
								color: "rgba(255,255,255,0.5)",
							}}
						>
							{new Date(post.publishedAt).toLocaleDateString(
								"en-US",
								{
									year: "numeric",
									month: "long",
									day: "numeric",
								},
							)}
						</span>
					)}
				</div>

				{/* Accent bar at bottom */}
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
