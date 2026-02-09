import { siteConfig } from "@/config/site";
import { getRecentPosts } from "@/lib/blog";

export async function GET() {
	if (!siteConfig.features.blog) {
		return new Response("Not Found", { status: 404 });
	}

	const posts = await getRecentPosts(20);
	const baseUrl = siteConfig.url;
	const updated = posts[0]?.publishedAt ?? new Date().toISOString();

	const escapeXml = (str: string) =>
		str
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&apos;");

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(siteConfig.name)}</title>
  <subtitle>${escapeXml(siteConfig.description)}</subtitle>
  <link href="${baseUrl}/feed.xml" rel="self" type="application/atom+xml"/>
  <link href="${baseUrl}" rel="alternate" type="text/html"/>
  <id>${baseUrl}/</id>
  <updated>${updated}</updated>
${posts
	.map(
		(post) => `  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${baseUrl}/blog/${post.slug}" rel="alternate" type="text/html"/>
    <id>${baseUrl}/blog/${post.slug}</id>
    <published>${post.publishedAt ?? post.createdAt}</published>
    <updated>${post.updatedAt}</updated>
    <summary>${escapeXml(post.description)}</summary>
    <author>
      <name>${escapeXml(post.author)}</name>
    </author>
  </entry>`,
	)
	.join("\n")}
</feed>`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/atom+xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=3600",
		},
	});
}
