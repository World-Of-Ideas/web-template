import { ImageResponse } from "next/og";

const OG_SIZE = { width: 1200, height: 630 };

/** R2 key helpers */
export const ogKeys = {
	site: () => "og/site.png",
	post: (slug: string) => `og/blog/${slug}.png`,
	tag: (tag: string) => `og/tag/${encodeURIComponent(tag)}.png`,
	page: (slug: string) => `og/page/${slug}.png`,
};

// ---------------------------------------------------------------------------
// Serving
// ---------------------------------------------------------------------------

/** Fetch a pre-generated OG image from R2. Returns null if not found. */
export async function getOgImage(bucket: R2Bucket, key: string): Promise<Response | null> {
	const object = await bucket.get(key);
	if (!object) return null;
	return new Response(object.body, {
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=3600, s-maxage=86400",
		},
	});
}

// ---------------------------------------------------------------------------
// Generation helpers (shared JSX fragments)
// ---------------------------------------------------------------------------

function accentBar(color: string) {
	return {
		position: "absolute" as const,
		bottom: 0,
		left: 0,
		right: 0,
		height: "6px",
		background: `linear-gradient(to right, ${color}, ${color}88)`,
	};
}

function baseContainer(): Record<string, unknown> {
	return {
		width: "100%",
		height: "100%",
		display: "flex",
		flexDirection: "column",
		justifyContent: "space-between",
		padding: "60px 80px",
		backgroundColor: "#0a0a0a",
		color: "#ffffff",
	};
}

// ---------------------------------------------------------------------------
// Site OG
// ---------------------------------------------------------------------------

export async function generateSiteOg(
	settings: { name: string; description?: string | null; theme: { accentColor?: string | null } },
	bucket: R2Bucket,
): Promise<void> {
	const accent = settings.theme.accentColor || "#9747ff";
	const res = new ImageResponse(
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
				<h1 style={{ fontSize: 72, fontWeight: 700, margin: 0 }}>{settings.name}</h1>
				{settings.description && (
					<p style={{ fontSize: 28, color: "rgba(255,255,255,0.6)", marginTop: "20px", textAlign: "center", maxWidth: "80%" }}>
						{settings.description.length > 150 ? settings.description.slice(0, 150) + "..." : settings.description}
					</p>
				)}
				<div style={accentBar(accent)} />
			</div>
		),
		{ ...OG_SIZE },
	);
	const buf = await res.arrayBuffer();
	await bucket.put(ogKeys.site(), buf, { httpMetadata: { contentType: "image/png" } });
}

// ---------------------------------------------------------------------------
// Blog post OG
// ---------------------------------------------------------------------------

export async function generatePostOg(
	post: { slug: string; title: string; description?: string | null; author?: string | null; publishedAt?: string | null; tags?: unknown },
	settings: { name: string; theme: { accentColor?: string | null } },
	bucket: R2Bucket,
): Promise<void> {
	const accent = settings.theme.accentColor || "#9747ff";
	const tags = (post.tags ?? []) as string[];

	const res = new ImageResponse(
		(
			<div style={baseContainer()}>
				<div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
					<span style={{ fontSize: 24, fontWeight: 600, color: accent }}>{settings.name}</span>
					{tags.length > 0 && (
						<div style={{ display: "flex", gap: "8px" }}>
							{tags.slice(0, 3).map((tag) => (
								<span key={tag} style={{ fontSize: 16, padding: "4px 12px", borderRadius: "9999px", backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
									{tag}
								</span>
							))}
						</div>
					)}
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, justifyContent: "center" }}>
					<h1 style={{ fontSize: (post.title?.length ?? 0) > 60 ? 42 : 56, fontWeight: 700, lineHeight: 1.2, margin: 0, maxWidth: "90%" }}>
						{(post.title?.length ?? 0) > 100 ? post.title.slice(0, 100) + "..." : post.title}
					</h1>
					{post.description && (
						<p style={{ fontSize: 24, color: "rgba(255,255,255,0.6)", lineHeight: 1.4, margin: 0, maxWidth: "80%" }}>
							{post.description.length > 120 ? post.description.slice(0, 120) + "..." : post.description}
						</p>
					)}
				</div>

				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
					<span style={{ fontSize: 20, color: "rgba(255,255,255,0.5)" }}>By {post.author}</span>
					{post.publishedAt && (
						<span style={{ fontSize: 20, color: "rgba(255,255,255,0.5)" }}>
							{new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
						</span>
					)}
				</div>

				<div style={accentBar(accent)} />
			</div>
		),
		{ ...OG_SIZE },
	);
	const buf = await res.arrayBuffer();
	await bucket.put(ogKeys.post(post.slug), buf, { httpMetadata: { contentType: "image/png" } });
}

// ---------------------------------------------------------------------------
// Tag OG
// ---------------------------------------------------------------------------

export async function generateTagOg(
	tag: string,
	settings: { name: string; theme: { accentColor?: string | null } },
	bucket: R2Bucket,
): Promise<void> {
	const accent = settings.theme.accentColor || "#9747ff";

	const res = new ImageResponse(
		(
			<div style={baseContainer()}>
				<span style={{ fontSize: 24, fontWeight: 600, color: accent }}>{settings.name}</span>
				<div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1, justifyContent: "center", alignItems: "center" }}>
					<span style={{ fontSize: 22, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "2px" }}>Tagged</span>
					<h1 style={{ fontSize: 64, fontWeight: 700, margin: 0, color: accent }}>
						{tag.length > 40 ? tag.slice(0, 40) + "..." : tag}
					</h1>
				</div>
				<div style={accentBar(accent)} />
			</div>
		),
		{ ...OG_SIZE },
	);
	const buf = await res.arrayBuffer();
	await bucket.put(ogKeys.tag(tag), buf, { httpMetadata: { contentType: "image/png" } });
}

// ---------------------------------------------------------------------------
// Content page OG
// ---------------------------------------------------------------------------

export async function generatePageOg(
	page: { slug: string; title: string; description?: string | null },
	settings: { name: string; theme: { accentColor?: string | null } },
	bucket: R2Bucket,
): Promise<void> {
	const accent = settings.theme.accentColor || "#9747ff";

	const res = new ImageResponse(
		(
			<div style={baseContainer()}>
				<span style={{ fontSize: 24, fontWeight: 600, color: accent }}>{settings.name}</span>
				<div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, justifyContent: "center" }}>
					<h1 style={{ fontSize: (page.title?.length ?? 0) > 60 ? 42 : 56, fontWeight: 700, lineHeight: 1.2, margin: 0, maxWidth: "90%" }}>
						{(page.title?.length ?? 0) > 100 ? page.title.slice(0, 100) + "..." : page.title}
					</h1>
					{page.description && (
						<p style={{ fontSize: 24, color: "rgba(255,255,255,0.6)", lineHeight: 1.4, margin: 0, maxWidth: "80%" }}>
							{page.description.length > 120 ? page.description.slice(0, 120) + "..." : page.description}
						</p>
					)}
				</div>
				<div style={accentBar(accent)} />
			</div>
		),
		{ ...OG_SIZE },
	);
	const buf = await res.arrayBuffer();
	await bucket.put(ogKeys.page(page.slug), buf, { httpMetadata: { contentType: "image/png" } });
}
