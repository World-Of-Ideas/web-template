/** Shared validation helpers for API routes. */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
	return EMAIL_REGEX.test(email) && email.length <= 254;
}

/** Safely parse JSON from a Request, returning null on failure instead of throwing. */
export async function safeParseJson(request: Request): Promise<unknown | null> {
	try {
		return await request.json();
	} catch {
		return null;
	}
}

/** Validate a string field length. Returns error message or null. */
export function validateLength(
	value: string | undefined | null,
	fieldName: string,
	max: number,
): string | null {
	if (value && value.length > max) {
		return `${fieldName} is too long (max ${max} characters)`;
	}
	return null;
}

/** Escape LIKE wildcard characters to prevent pattern injection. */
export function escapeLike(query: string): string {
	return query.replace(/[%_]/g, "\\$&");
}

/** Validate a URL slug format. Returns error message or null. */
export function validateSlug(slug: string): string | null {
	if (!slug) return "Slug is required";
	if (slug.length > 200) return "Slug is too long (max 200 characters)";
	if (!/^[a-z0-9]+(?:[/-][a-z0-9]+)*$/.test(slug)) {
		return "Slug must contain only lowercase letters, numbers, hyphens, and forward slashes";
	}
	return null;
}

/** Validate a blog post creation body. Returns error message or null. */
export function validatePostBody(body: unknown): string | null {
	if (!body || typeof body !== "object") return "Invalid request body";
	const b = body as Record<string, unknown>;
	if (typeof b.slug !== "string" || !b.slug) return "Slug is required";
	const slugErr = validateSlug(b.slug);
	if (slugErr) return slugErr;
	if (typeof b.title !== "string" || !b.title) return "Title is required";
	if (b.title.length > 200) return "Title is too long (max 200 characters)";
	if (typeof b.description !== "string" || !b.description) return "Description is required";
	if (b.description.length > 500) return "Description is too long (max 500 characters)";
	if (b.content !== undefined && !Array.isArray(b.content)) return "Content must be an array";
	if (b.faqs !== undefined && b.faqs !== null && !Array.isArray(b.faqs)) return "FAQs must be an array";
	if (b.tags !== undefined && b.tags !== null && !Array.isArray(b.tags)) return "Tags must be an array";
	if (b.coverImage !== undefined && b.coverImage !== null && typeof b.coverImage !== "string") return "Cover image must be a string";
	if (b.author !== undefined && typeof b.author !== "string") return "Author must be a string";
	if (b.published !== undefined && typeof b.published !== "boolean") return "Published must be a boolean";
	return null;
}

/** Validate a blog post update body. Returns error message or null. */
export function validatePostUpdateBody(body: unknown): string | null {
	if (!body || typeof body !== "object") return "Invalid request body";
	const b = body as Record<string, unknown>;
	if (b.slug !== undefined) {
		if (typeof b.slug !== "string" || !b.slug) return "Slug must be a non-empty string";
		const slugErr = validateSlug(b.slug);
		if (slugErr) return slugErr;
	}
	if (b.title !== undefined && (typeof b.title !== "string" || !b.title)) return "Title must be a non-empty string";
	if (b.title !== undefined && (b.title as string).length > 200) return "Title is too long (max 200 characters)";
	if (b.description !== undefined && (typeof b.description !== "string" || !b.description)) return "Description must be a non-empty string";
	if (b.description !== undefined && (b.description as string).length > 500) return "Description is too long (max 500 characters)";
	if (b.content !== undefined && !Array.isArray(b.content)) return "Content must be an array";
	if (b.faqs !== undefined && b.faqs !== null && !Array.isArray(b.faqs)) return "FAQs must be an array";
	if (b.tags !== undefined && b.tags !== null && !Array.isArray(b.tags)) return "Tags must be an array";
	if (b.published !== undefined && typeof b.published !== "boolean") return "Published must be a boolean";
	return null;
}

/** Validate a page creation/update body. Returns error message or null. */
export function validatePageBody(body: unknown, requireSlug = true): string | null {
	if (!body || typeof body !== "object") return "Invalid request body";
	const b = body as Record<string, unknown>;
	if (requireSlug) {
		if (typeof b.slug !== "string" || !b.slug) return "Slug is required";
		const slugErr = validateSlug(b.slug);
		if (slugErr) return slugErr;
	}
	if (typeof b.title !== "string" || !b.title) return "Title is required";
	if (b.title.length > 200) return "Title is too long (max 200 characters)";
	if (b.description !== undefined && b.description !== null && typeof b.description !== "string") return "Description must be a string";
	if (b.content !== undefined && b.content !== null && !Array.isArray(b.content)) return "Content must be an array";
	if (b.faqs !== undefined && b.faqs !== null && !Array.isArray(b.faqs)) return "FAQs must be an array";
	if (b.relatedPages !== undefined && b.relatedPages !== null && !Array.isArray(b.relatedPages)) return "Related pages must be an array";
	if (b.published !== undefined && typeof b.published !== "boolean") return "Published must be a boolean";
	if (b.sortOrder !== undefined && typeof b.sortOrder !== "number") return "Sort order must be a number";
	return null;
}

/** Validate an R2 upload path. Returns error message or null. */
export function validateR2Path(path: string): string | null {
	if (path.includes("..")) {
		return "Path must not contain '..'";
	}
	if (path.startsWith("/")) {
		return "Path must not start with '/'";
	}
	if (!/^[a-zA-Z0-9._\/-]+$/.test(path)) {
		return "Path contains invalid characters";
	}
	if (path.length > 200) {
		return "Path is too long (max 200 characters)";
	}
	return null;
}
