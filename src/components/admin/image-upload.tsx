"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface ImageUploadProps {
	value?: string;
	onChange: (url: string) => void;
	path?: string;
}

export function ImageUpload({ value, onChange, path }: ImageUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		setError("");

		if (!ALLOWED_TYPES.includes(file.type)) {
			setError("Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.");
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			setError("File too large. Maximum size is 5 MB.");
			return;
		}

		setIsUploading(true);

		try {
			const formData = new FormData();
			formData.append("file", file);
			if (path) {
				formData.append("path", path);
			}

			const res = await fetch("/api/admin/upload", {
				method: "POST",
				body: formData,
			});

			const data = (await res.json()) as { data?: { url: string }; error?: { code: string; message: string } };

			if (!res.ok) {
				setError(data.error?.message ?? "Upload failed. Please try again.");
				return;
			}

			if (data.data?.url) {
				onChange(data.data.url);
			}
		} catch {
			setError("Upload failed. Please try again.");
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	}

	return (
		<div className="space-y-3">
			{value && (
				<div className="relative overflow-hidden rounded-md border">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={value}
						alt="Uploaded image"
						className="h-40 w-full object-cover"
					/>
				</div>
			)}

			<div className="flex items-center gap-2">
				<Input
					ref={fileInputRef}
					type="file"
					accept={ALLOWED_TYPES.join(",")}
					onChange={handleFileChange}
					disabled={isUploading}
					className="flex-1"
				/>
				{isUploading && (
					<span className="text-sm text-muted-foreground">Uploading...</span>
				)}
			</div>

			{error && (
				<p className="text-sm text-destructive">{error}</p>
			)}
		</div>
	);
}
