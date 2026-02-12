import { describe, it, expect } from "vitest";
import {
	isValidEmail,
	safeParseJson,
	validateLength,
	escapeLike,
	validateR2Path,
	validateSlug,
	validatePostBody,
	validatePostUpdateBody,
	validatePageBody,
} from "../validation";

describe("isValidEmail", () => {
	it("returns true for a standard valid email", () => {
		expect(isValidEmail("user@example.com")).toBe(true);
	});

	it("returns true for emails with subdomains", () => {
		expect(isValidEmail("user@mail.example.co.uk")).toBe(true);
	});

	it("returns true for emails with uppercase characters", () => {
		expect(isValidEmail("User@Example.COM")).toBe(true);
	});

	it("returns true for emails with plus addressing", () => {
		expect(isValidEmail("user+tag@example.com")).toBe(true);
	});

	it("returns true for emails with dots in local part", () => {
		expect(isValidEmail("first.last@example.com")).toBe(true);
	});

	it("returns false for email missing @ symbol", () => {
		expect(isValidEmail("userexample.com")).toBe(false);
	});

	it("returns false for email missing domain", () => {
		expect(isValidEmail("user@")).toBe(false);
	});

	it("returns false for email missing local part", () => {
		expect(isValidEmail("@example.com")).toBe(false);
	});

	it("returns false for email with spaces", () => {
		expect(isValidEmail("user @example.com")).toBe(false);
		expect(isValidEmail("user@ example.com")).toBe(false);
		expect(isValidEmail(" user@example.com")).toBe(false);
	});

	it("returns false for empty string", () => {
		expect(isValidEmail("")).toBe(false);
	});

	it("returns false for email exceeding 254 characters", () => {
		const longLocal = "a".repeat(243); // 243 + @ + example.com = 255
		expect(isValidEmail(`${longLocal}@example.com`)).toBe(false);
	});

	it("returns true for email at exactly 254 characters", () => {
		const longLocal = "a".repeat(242); // 242 + @ + example.com = 254
		expect(isValidEmail(`${longLocal}@example.com`)).toBe(true);
	});

	it("returns false for email missing TLD", () => {
		expect(isValidEmail("user@localhost")).toBe(false);
	});

	it("returns false for multiple @ symbols", () => {
		expect(isValidEmail("user@@example.com")).toBe(false);
	});
});

describe("safeParseJson", () => {
	it("parses valid JSON from a Request", async () => {
		const body = JSON.stringify({ name: "Test", value: 42 });
		const request = new Request("https://example.com", {
			method: "POST",
			body,
			headers: { "Content-Type": "application/json" },
		});

		const result = await safeParseJson(request);
		expect(result).toEqual({ name: "Test", value: 42 });
	});

	it("returns null for malformed JSON", async () => {
		const request = new Request("https://example.com", {
			method: "POST",
			body: "{ invalid json",
			headers: { "Content-Type": "application/json" },
		});

		const result = await safeParseJson(request);
		expect(result).toBeNull();
	});

	it("returns null for non-JSON body", async () => {
		const request = new Request("https://example.com", {
			method: "POST",
			body: "just plain text",
			headers: { "Content-Type": "text/plain" },
		});

		const result = await safeParseJson(request);
		expect(result).toBeNull();
	});

	it("parses JSON arrays", async () => {
		const request = new Request("https://example.com", {
			method: "POST",
			body: JSON.stringify([1, 2, 3]),
			headers: { "Content-Type": "application/json" },
		});

		const result = await safeParseJson(request);
		expect(result).toEqual([1, 2, 3]);
	});

	it("parses JSON with null value", async () => {
		const request = new Request("https://example.com", {
			method: "POST",
			body: "null",
			headers: { "Content-Type": "application/json" },
		});

		const result = await safeParseJson(request);
		expect(result).toBeNull();
	});

	it("returns null for empty body", async () => {
		const request = new Request("https://example.com", {
			method: "POST",
			body: "",
			headers: { "Content-Type": "application/json" },
		});

		const result = await safeParseJson(request);
		expect(result).toBeNull();
	});
});

describe("validateLength", () => {
	it("returns null for null value", () => {
		expect(validateLength(null, "Name", 100)).toBeNull();
	});

	it("returns null for undefined value", () => {
		expect(validateLength(undefined, "Name", 100)).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(validateLength("", "Name", 100)).toBeNull();
	});

	it("returns null for value within limit", () => {
		expect(validateLength("hello", "Name", 100)).toBeNull();
	});

	it("returns null for value at exactly the limit", () => {
		expect(validateLength("abcde", "Name", 5)).toBeNull();
	});

	it("returns error message for value over limit", () => {
		const result = validateLength("abcdef", "Name", 5);
		expect(result).toBe("Name is too long (max 5 characters)");
	});

	it("includes the field name in the error message", () => {
		const result = validateLength("toolong", "Email", 3);
		expect(result).toContain("Email");
	});

	it("includes the max length in the error message", () => {
		const result = validateLength("toolong", "Field", 3);
		expect(result).toContain("3");
	});
});

describe("escapeLike", () => {
	it("returns normal strings unchanged", () => {
		expect(escapeLike("hello world")).toBe("hello world");
	});

	it("escapes % characters", () => {
		expect(escapeLike("100%")).toBe("100\\%");
	});

	it("escapes _ characters", () => {
		expect(escapeLike("user_name")).toBe("user\\_name");
	});

	it("escapes both % and _ characters", () => {
		expect(escapeLike("50%_off")).toBe("50\\%\\_off");
	});

	it("escapes multiple occurrences", () => {
		expect(escapeLike("%%__")).toBe("\\%\\%\\_\\_");
	});

	it("returns empty string unchanged", () => {
		expect(escapeLike("")).toBe("");
	});

	it("does not escape other special characters", () => {
		expect(escapeLike("hello!@#$^&*()")).toBe("hello!@#$^&*()");
	});
});

describe("validateR2Path", () => {
	it("returns null for a valid simple path", () => {
		expect(validateR2Path("blog/cover.webp")).toBeNull();
	});

	it("returns null for a valid nested path", () => {
		expect(validateR2Path("blog/my-post/images/photo.webp")).toBeNull();
	});

	it("returns null for a path with dots in filename", () => {
		expect(validateR2Path("uploads/file.name.webp")).toBeNull();
	});

	it("returns null for a path with underscores and hyphens", () => {
		expect(validateR2Path("uploads/my_file-name/image.webp")).toBeNull();
	});

	it("returns error for path containing '..'", () => {
		const result = validateR2Path("blog/../secret/file.txt");
		expect(result).toBe("Path must not contain '..'");
	});

	it("returns error for path starting with '/'", () => {
		const result = validateR2Path("/blog/cover.webp");
		expect(result).toBe("Path must not start with '/'");
	});

	it("returns error for path with spaces", () => {
		const result = validateR2Path("blog/my file.webp");
		expect(result).toBe("Path contains invalid characters");
	});

	it("returns error for path with special characters", () => {
		expect(validateR2Path("blog/file@name.webp")).toBe(
			"Path contains invalid characters",
		);
		expect(validateR2Path("blog/file#name.webp")).toBe(
			"Path contains invalid characters",
		);
		expect(validateR2Path("blog/file?query.webp")).toBe(
			"Path contains invalid characters",
		);
	});

	it("returns error for path exceeding 200 characters", () => {
		const longPath = "a/".repeat(100) + "b"; // 201 characters
		const result = validateR2Path(longPath);
		expect(result).toBe("Path is too long (max 200 characters)");
	});

	it("returns null for path at exactly 200 characters", () => {
		const path = "a".repeat(200);
		expect(validateR2Path(path)).toBeNull();
	});

	it("checks '..' before leading '/'", () => {
		// Path with both issues — ".." check comes first
		const result = validateR2Path("/../etc/passwd");
		expect(result).toBe("Path must not contain '..'");
	});
});

describe("validateSlug", () => {
	it("returns null for a simple valid slug", () => {
		expect(validateSlug("hello")).toBeNull();
	});

	it("returns null for a hyphenated slug", () => {
		expect(validateSlug("hello-world")).toBeNull();
	});

	it("returns null for a slug with a single slash", () => {
		expect(validateSlug("a/b")).toBeNull();
	});

	it("returns null for a nested slug with hyphens", () => {
		expect(validateSlug("a/b/c-d")).toBeNull();
	});

	it("returns error for empty string", () => {
		expect(validateSlug("")).toBe("Slug is required");
	});

	it("returns error for slug exceeding 200 characters", () => {
		const longSlug = "a".repeat(201);
		expect(validateSlug(longSlug)).toBe("Slug is too long (max 200 characters)");
	});

	it("returns error for uppercase characters", () => {
		expect(validateSlug("Hello")).toBeTruthy();
		expect(validateSlug("Hello")).toContain("lowercase");
	});

	it("returns error for consecutive hyphens", () => {
		expect(validateSlug("hello--world")).toBeTruthy();
	});

	it("returns error for leading hyphen", () => {
		expect(validateSlug("-hello")).toBeTruthy();
	});

	it("returns error for trailing hyphen", () => {
		expect(validateSlug("hello-")).toBeTruthy();
	});

	it("returns error for leading slash", () => {
		expect(validateSlug("/hello")).toBeTruthy();
	});

	it("returns error for trailing slash", () => {
		expect(validateSlug("hello/")).toBeTruthy();
	});
});

describe("validatePostBody", () => {
	it("returns null for a valid minimal post body", () => {
		expect(
			validatePostBody({
				slug: "test",
				title: "Test",
				description: "Desc",
				content: [],
			}),
		).toBeNull();
	});

	it("returns error when slug is missing", () => {
		expect(
			validatePostBody({ title: "Test", description: "Desc" }),
		).toBe("Slug is required");
	});

	it("returns error when title is missing", () => {
		expect(
			validatePostBody({ slug: "test", description: "Desc" }),
		).toBe("Title is required");
	});

	it("returns error when description is missing", () => {
		expect(
			validatePostBody({ slug: "test", title: "Test" }),
		).toBe("Description is required");
	});

	it("returns error when description is empty string", () => {
		expect(
			validatePostBody({ slug: "test", title: "Test", description: "" }),
		).toBe("Description is required");
	});

	it("returns error when slug is too long", () => {
		expect(
			validatePostBody({
				slug: "a".repeat(201),
				title: "Test",
				description: "Desc",
			}),
		).toContain("too long");
	});

	it("returns error when title is too long (201 chars)", () => {
		expect(
			validatePostBody({
				slug: "test",
				title: "a".repeat(201),
				description: "Desc",
			}),
		).toBe("Title is too long (max 200 characters)");
	});

	it("returns error when description is too long (501 chars)", () => {
		expect(
			validatePostBody({
				slug: "test",
				title: "Test",
				description: "a".repeat(501),
			}),
		).toBe("Description is too long (max 500 characters)");
	});

	it("returns error when content is not an array", () => {
		expect(
			validatePostBody({
				slug: "test",
				title: "Test",
				description: "Desc",
				content: "not-array",
			}),
		).toBe("Content must be an array");
	});

	it("returns error when faqs is not an array and not null", () => {
		expect(
			validatePostBody({
				slug: "test",
				title: "Test",
				description: "Desc",
				faqs: "not-array",
			}),
		).toBe("FAQs must be an array");
	});

	it("returns null when faqs is null", () => {
		expect(
			validatePostBody({
				slug: "test",
				title: "Test",
				description: "Desc",
				faqs: null,
			}),
		).toBeNull();
	});

	it("returns error when tags is not an array and not null", () => {
		expect(
			validatePostBody({
				slug: "test",
				title: "Test",
				description: "Desc",
				tags: "not-array",
			}),
		).toBe("Tags must be an array");
	});

	it("returns null when tags is null", () => {
		expect(
			validatePostBody({
				slug: "test",
				title: "Test",
				description: "Desc",
				tags: null,
			}),
		).toBeNull();
	});

	it("returns error when published is not a boolean", () => {
		expect(
			validatePostBody({
				slug: "test",
				title: "Test",
				description: "Desc",
				published: "yes",
			}),
		).toBe("Published must be a boolean");
	});

	it("does not error on extra unknown fields", () => {
		expect(
			validatePostBody({
				slug: "test",
				title: "Test",
				description: "Desc",
				extraField: 123,
				anotherExtra: "abc",
			}),
		).toBeNull();
	});
});

describe("validatePostUpdateBody", () => {
	it("returns null for an empty update body", () => {
		expect(validatePostUpdateBody({})).toBeNull();
	});

	it("returns null when only title is provided", () => {
		expect(validatePostUpdateBody({ title: "New" })).toBeNull();
	});

	it("returns null when only slug is provided with valid format", () => {
		expect(validatePostUpdateBody({ slug: "new-slug" })).toBeNull();
	});

	it("returns error when slug has invalid format", () => {
		expect(validatePostUpdateBody({ slug: "INVALID" })).toBeTruthy();
	});

	it("returns error when slug is empty string", () => {
		expect(validatePostUpdateBody({ slug: "" })).toBe(
			"Slug must be a non-empty string",
		);
	});

	it("returns error when title is empty string", () => {
		expect(validatePostUpdateBody({ title: "" })).toBe(
			"Title must be a non-empty string",
		);
	});

	it("returns error when content is not an array", () => {
		expect(validatePostUpdateBody({ content: "not-array" })).toBe(
			"Content must be an array",
		);
	});

	it("returns error when published is not a boolean", () => {
		expect(validatePostUpdateBody({ published: 1 })).toBe(
			"Published must be a boolean",
		);
	});

	it("returns error when description is empty string", () => {
		expect(validatePostUpdateBody({ description: "" })).toBe(
			"Description must be a non-empty string",
		);
	});

	it("returns error when description is too long", () => {
		expect(validatePostUpdateBody({ description: "a".repeat(501) })).toBe(
			"Description is too long (max 500 characters)",
		);
	});

	it("returns null when description is valid", () => {
		expect(validatePostUpdateBody({ description: "Valid desc" })).toBeNull();
	});
});

describe("validatePageBody", () => {
	it("returns null for a valid page body with requireSlug=true (default)", () => {
		expect(validatePageBody({ slug: "test", title: "Test" })).toBeNull();
	});

	it("returns null for a valid page body with requireSlug=false", () => {
		expect(validatePageBody({ title: "Test" }, false)).toBeNull();
	});

	it("returns error when title is missing", () => {
		expect(validatePageBody({ slug: "test" })).toBe("Title is required");
	});

	it("returns error when slug is missing and requireSlug=true", () => {
		expect(validatePageBody({ title: "Test" })).toBe("Slug is required");
	});

	it("returns error when content is not an array", () => {
		expect(
			validatePageBody({ slug: "test", title: "Test", content: "not-array" }),
		).toBe("Content must be an array");
	});

	it("returns null when content is null", () => {
		expect(
			validatePageBody({ slug: "test", title: "Test", content: null }),
		).toBeNull();
	});

	it("returns error when published is not a boolean", () => {
		expect(
			validatePageBody({ slug: "test", title: "Test", published: "yes" }),
		).toBe("Published must be a boolean");
	});

	it("returns error when sortOrder is not a number", () => {
		expect(
			validatePageBody({ slug: "test", title: "Test", sortOrder: "abc" }),
		).toBe("Sort order must be a number");
	});

	it("returns null when sortOrder is a valid number", () => {
		expect(
			validatePageBody({ slug: "test", title: "Test", sortOrder: 5 }),
		).toBeNull();
	});
});
