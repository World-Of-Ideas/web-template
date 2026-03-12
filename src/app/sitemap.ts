import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getPublishedPostSlugs, getAllTags } from "@/lib/blog";
import { getPublishedContentPages, isSystemPage } from "@/lib/pages";
import { getSiteSettingsDirect } from "@/lib/site-settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = siteConfig.url;

	const [settings, contentPages] = await Promise.all([
		getSiteSettingsDirect(),
		getPublishedContentPages(),
	]);

	const entries: MetadataRoute.Sitemap = [];

	// Home page — always included
	entries.push({
		url: baseUrl,
		lastModified: new Date(),
		changeFrequency: "weekly",
		priority: 1,
	});

	// Static feature-guarded pages
	if (settings.features.waitlist) {
		entries.push({
			url: `${baseUrl}/waitlist`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		});
	}

	if (settings.features.giveaway) {
		entries.push({
			url: `${baseUrl}/giveaway`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		});
	}

	if (settings.features.contact) {
		entries.push({
			url: `${baseUrl}/contact`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.6,
		});
	}

	if (settings.features.blog) {
		entries.push({
			url: `${baseUrl}/blog`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.9,
		});
	}

	if (settings.features.pricing) {
		entries.push({
			url: `${baseUrl}/pricing`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		});
	}

	if (settings.features.changelog) {
		entries.push({
			url: `${baseUrl}/changelog`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.6,
		});
	}

	// Terms and Privacy — always included
	entries.push({
		url: `${baseUrl}/terms`,
		lastModified: new Date(),
		changeFrequency: "monthly",
		priority: 0.3,
	});

	entries.push({
		url: `${baseUrl}/privacy`,
		lastModified: new Date(),
		changeFrequency: "monthly",
		priority: 0.3,
	});

	// Published blog posts
	if (settings.features.blog) {
		const posts = await getPublishedPostSlugs(1000);
		for (const post of posts) {
			entries.push({
				url: `${baseUrl}/blog/${post.slug}`,
				lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
				changeFrequency: "weekly",
				priority: 0.7,
			});
		}

		// Tag archive pages
		const tags = await getAllTags();
		for (const { tag } of tags) {
			entries.push({
				url: `${baseUrl}/blog/tag/${encodeURIComponent(tag)}`,
				lastModified: new Date(),
				changeFrequency: "weekly",
				priority: 0.5,
			});
		}
	}

	// Published content pages (exclude system pages — they have dedicated routes above)
	for (const page of contentPages) {
		if (isSystemPage(page.slug)) continue;
		if ((page.metadata as Record<string, unknown> | null)?.noindex) continue;
		entries.push({
			url: `${baseUrl}/${page.slug}`,
			lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
			changeFrequency: "weekly",
			priority: 0.6,
		});
	}

	return entries;
}
