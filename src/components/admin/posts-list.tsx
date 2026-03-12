"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BulkActionsBar } from "./bulk-actions-bar";

interface Post {
	id: number;
	title: string;
	slug: string;
	published: boolean;
	scheduledPublishAt: string | null;
	publishedAt: string | null;
	createdAt: string;
}

export function PostsList({ posts }: { posts: Post[] }) {
	const [selected, setSelected] = useState<Set<number>>(new Set());

	function toggleAll() {
		if (selected.size === posts.length) {
			setSelected(new Set());
		} else {
			setSelected(new Set(posts.map((p) => p.id)));
		}
	}

	function toggle(id: number) {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		setSelected(next);
	}

	return (
		<>
			<BulkActionsBar
				selectedCount={selected.size}
				entityType="posts"
				selectedIds={Array.from(selected)}
				onClear={() => setSelected(new Set())}
			/>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-10">
							<Checkbox
								checked={selected.size === posts.length && posts.length > 0}
								onCheckedChange={toggleAll}
								aria-label="Select all posts"
							/>
						</TableHead>
						<TableHead>Title</TableHead>
						<TableHead>Slug</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Date</TableHead>
						<TableHead className="w-20">Preview</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{posts.map((post) => (
						<TableRow key={post.id}>
							<TableCell>
								<Checkbox
									checked={selected.has(post.id)}
									onCheckedChange={() => toggle(post.id)}
									aria-label={`Select ${post.title}`}
								/>
							</TableCell>
							<TableCell>
								<Link href={`/admin/posts/${post.id}/edit`} className="font-medium hover:underline">
									{post.title}
								</Link>
							</TableCell>
							<TableCell className="text-muted-foreground">{post.slug}</TableCell>
							<TableCell>
								<div className="flex gap-1">
									<Badge variant={post.published ? "default" : "secondary"}>
										{post.published ? "Published" : "Draft"}
									</Badge>
									{post.scheduledPublishAt && new Date(post.scheduledPublishAt + "Z") > new Date() && (
										<Badge variant="outline">Scheduled</Badge>
									)}
								</div>
							</TableCell>
							<TableCell className="text-muted-foreground">
								{post.publishedAt
									? new Date(post.publishedAt).toLocaleDateString()
									: new Date(post.createdAt).toLocaleDateString()}
							</TableCell>
							<TableCell>
								<Link href={`/admin/posts/${post.id}/preview`} className="text-sm text-primary hover:underline">
									Preview
								</Link>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</>
	);
}
