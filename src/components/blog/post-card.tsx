import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { normalizeImageSrc } from "@/lib/r2";

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
			<Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
				{post.coverImage && (
					<div className="relative aspect-[16/9] overflow-hidden">
						<Image
							src={normalizeImageSrc(post.coverImage)}
							alt={post.title}
							fill
							className="object-cover transition-transform group-hover:scale-105"
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						/>
					</div>
				)}
				<CardHeader>
					<h3 className="line-clamp-2 text-lg font-semibold group-hover:text-primary">
						{post.title}
					</h3>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="line-clamp-2 text-sm text-muted-foreground">
						{post.description}
					</p>
					<div className="flex flex-wrap items-center gap-2">
						{formattedDate && (
							<time
								dateTime={post.publishedAt!}
								className="text-xs text-muted-foreground"
							>
								{formattedDate}
							</time>
						)}
						{post.tags?.map((tag) => (
							<Badge key={tag} variant="secondary">
								{tag}
							</Badge>
						))}
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
