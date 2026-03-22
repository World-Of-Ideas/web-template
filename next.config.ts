import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["http://localhost", "http://127.0.0.1", "http://192.168.*.*"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "*.r2.dev",
			},
		],
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
					{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
					// unsafe-inline required: Next.js 16 inline scripts + Tailwind styles
					// unsafe-eval required in dev only: React 19 uses eval() for dev tooling (stack traces, error overlays)
					{
						key: "Content-Security-Policy",
						value: [
							"default-src 'self'",
							`script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net`,
							"style-src 'self' 'unsafe-inline'",
							"img-src 'self' data: https://*.r2.dev https://www.facebook.com",
							"font-src 'self'",
							"connect-src 'self' https://challenges.cloudflare.com https://www.google-analytics.com https://www.facebook.com https://connect.facebook.net https://www.googletagmanager.com",
							"frame-src https://challenges.cloudflare.com https://www.googletagmanager.com https://www.youtube-nocookie.com https://player.vimeo.com",
							"object-src 'none'",
							"base-uri 'self'",
							"upgrade-insecure-requests",
						"form-action 'self'",
						].join("; "),
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload",
					},
				],
			},
		];
	},
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
