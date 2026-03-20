import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/admin";
import { getSiteSettingsDirect } from "@/lib/site-settings";
import { getPostById } from "@/lib/blog";
import { ContentRenderer } from "@/components/content/content-renderer";
import { FaqSection } from "@/components/layout/faq-section";
import { isSafeUrl } from "@/lib/utils";
import { normalizeImageSrc } from "@/lib/r2";
import type { FAQ } from "@/types/content";

export const metadata: Metadata = {
	title: "Post Preview | Admin",
	robots: { index: false },
};

export default async function PostPreviewPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const cookieStore = await cookies();
	const sessionId = cookieStore.get("admin_session")?.value;
	if (!sessionId || !(await validateSession(sessionId))) redirect("/admin");

	const settings = await getSiteSettingsDirect();
	if (!settings.features.blog) notFound();

	const { id } = await params;
	const numId = Number(id);
	if (isNaN(numId)) notFound();

	const post = await getPostById(numId);
	if (!post) notFound();

	const tags = (post.tags ?? []) as string[];
	const faqs = (post.faqs ?? []) as FAQ[];

	return (
		<>
			{!post.published && (
				<div className="border-b bg-yellow-50 px-4 py-2 text-center text-sm font-medium text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
					Preview Mode — This post is not published
				</div>
			)}

			<article className="mx-auto max-w-[744px] px-4 py-12 sm:px-6 sm:py-16">
				<header>
					<h1 className="text-2xl font-normal tracking-tight sm:text-4xl md:text-5xl">
						{post.title}
					</h1>
					<p className="mt-3 text-base text-muted-foreground sm:text-lg">
						{post.description}
					</p>
					<div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:gap-4">
						<span>By {post.author}</span>
						{post.publishedAt && (
							<time dateTime={post.publishedAt}>
								{new Date(post.publishedAt).toLocaleDateString("en-US", {
									year: "numeric", month: "long", day: "numeric",
								})}
							</time>
						)}
					</div>
					{tags.length > 0 && (
						<div className="mt-4 flex flex-wrap gap-2">
							{tags.map((tag) => (
								<span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
									{tag}
								</span>
							))}
						</div>
					)}
				</header>

				{post.coverImage && isSafeUrl(post.coverImage) && (
					<Image
						src={normalizeImageSrc(post.coverImage)}
						alt={post.title}
						width={1200}
						height={675}
						className="mt-8 w-full h-auto rounded-lg object-cover"
						priority
					/>
				)}

				<div className="mt-8">
					<ContentRenderer blocks={post.content} />
				</div>
			</article>

			{faqs.length > 0 && <FaqSection faqs={faqs} />}
		</>
	);
}
