import Image from "next/image";
import Link from "next/link";
import { normalizeImageSrc } from "@/lib/r2";
import { isSafeUrl } from "@/lib/utils";
import { ArrowIcon } from "@/components/shared/arrow-icon";

interface PostCardProps {
	post: {
		slug: string;
		title: string;
		description: string;
		coverImage?: string | null;
		publishedAt?: string | null;
		tags?: string[] | null;
	};
}

export function PostCard({ post }: PostCardProps) {
	const formattedDate = post.publishedAt
		? new Date(post.publishedAt).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: null;

	return (
		<Link href={`/blog/${post.slug}`} className="group">
			<article className="h-full overflow-hidden rounded-xl border bg-card transition-colors hover:bg-accent/50">
				{post.coverImage && isSafeUrl(post.coverImage) ? (
					<div className="relative aspect-[2/1] overflow-hidden">
						<Image
							src={normalizeImageSrc(post.coverImage)}
							alt={post.title}
							fill
							className="object-cover transition-transform group-hover:scale-105"
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						/>
						{post.tags && post.tags.length > 0 && (
							<div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
								{post.tags.slice(0, 2).map((tag) => (
									<span key={tag} className="rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
										{tag}
									</span>
								))}
							</div>
						)}
					</div>
				) : (
					post.tags && post.tags.length > 0 && (
						<div className="flex flex-wrap gap-1.5 px-5 pt-5">
							{post.tags.slice(0, 2).map((tag) => (
								<span key={tag} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
									{tag}
								</span>
							))}
						</div>
					)
				)}
				<div className="p-5">
					<h3 className="line-clamp-2 text-lg font-semibold group-hover:text-primary">
						{post.title}
					</h3>
					<p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
						{post.description}
					</p>
					<div className="mt-4 flex items-center justify-between">
						{formattedDate && (
							<time
								dateTime={post.publishedAt!}
								className="text-xs text-muted-foreground"
							>
								{formattedDate}
							</time>
						)}
						<span className="flex items-center gap-1 text-sm font-medium text-primary">
							Read More
							<ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
						</span>
					</div>
				</div>
			</article>
		</Link>
	);
}
