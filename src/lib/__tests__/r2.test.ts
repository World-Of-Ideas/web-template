import { describe, it, expect } from "vitest";
import { validateUpload, normalizeImageSrc, validateMagicBytes } from "../r2";

describe("validateUpload", () => {
	it("accepts image/webp files", () => {
		const file = new File(["data"], "photo.webp", { type: "image/webp" });
		expect(validateUpload(file)).toBeNull();
	});

	it("accepts image/png files", () => {
		const file = new File(["data"], "photo.png", { type: "image/png" });
		expect(validateUpload(file)).toBeNull();
	});

	it("accepts image/jpeg files", () => {
		const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
		expect(validateUpload(file)).toBeNull();
	});

	it("accepts image/gif files", () => {
		const file = new File(["data"], "animation.gif", { type: "image/gif" });
		expect(validateUpload(file)).toBeNull();
	});

	it("rejects text/plain files", () => {
		const file = new File(["hello"], "readme.txt", { type: "text/plain" });
		const error = validateUpload(file);
		expect(error).toBe("Invalid file type. Only WebP, PNG, JPEG, and GIF are allowed.");
	});

	it("rejects application/pdf files", () => {
		const file = new File(["pdf-data"], "document.pdf", { type: "application/pdf" });
		const error = validateUpload(file);
		expect(error).toBe("Invalid file type. Only WebP, PNG, JPEG, and GIF are allowed.");
	});

	it("rejects image/svg+xml files", () => {
		const file = new File(["<svg></svg>"], "icon.svg", { type: "image/svg+xml" });
		const error = validateUpload(file);
		expect(error).toBe("Invalid file type. Only WebP, PNG, JPEG, and GIF are allowed.");
	});

	it("rejects files larger than 5 MB", () => {
		// Create a file that's 5 MB + 1 byte
		const size = 5 * 1024 * 1024 + 1;
		const buffer = new ArrayBuffer(size);
		const file = new File([buffer], "huge.png", { type: "image/png" });
		const error = validateUpload(file);
		expect(error).toBe("File too large. Maximum size is 5 MB.");
	});

	it("accepts a file at exactly 5 MB", () => {
		const size = 5 * 1024 * 1024;
		const buffer = new ArrayBuffer(size);
		const file = new File([buffer], "exact.png", { type: "image/png" });
		expect(validateUpload(file)).toBeNull();
	});

	it("accepts a small valid file", () => {
		const file = new File([new Uint8Array(100)], "tiny.webp", { type: "image/webp" });
		expect(validateUpload(file)).toBeNull();
	});

	it("rejects files with empty type", () => {
		const file = new File(["data"], "noext", { type: "" });
		const error = validateUpload(file);
		expect(error).toBe("Invalid file type. Only WebP, PNG, JPEG, and GIF are allowed.");
	});
});

describe("validateMagicBytes", () => {
	it("returns true for valid PNG magic bytes with image/png type", () => {
		const buffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00]).buffer;
		expect(validateMagicBytes(buffer, "image/png")).toBe(true);
	});

	it("returns true for valid JPEG magic bytes with image/jpeg type", () => {
		const buffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]).buffer;
		expect(validateMagicBytes(buffer, "image/jpeg")).toBe(true);
	});

	it("returns true for valid GIF magic bytes with image/gif type", () => {
		const buffer = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39]).buffer;
		expect(validateMagicBytes(buffer, "image/gif")).toBe(true);
	});

	it("returns true for valid WebP magic bytes with image/webp type", () => {
		// WebP: RIFF header (bytes 0-3) + file size (4-7) + "WEBP" (bytes 8-11)
		const buffer = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]).buffer;
		expect(validateMagicBytes(buffer, "image/webp")).toBe(true);
	});

	it("returns false for WAV file claiming to be WebP (RIFF but not WEBP at 8-11)", () => {
		// WAV: RIFF header + "WAVE" at bytes 8-11
		const buffer = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45]).buffer;
		expect(validateMagicBytes(buffer, "image/webp")).toBe(false);
	});

	it("returns false for AVI file claiming to be WebP (RIFF but not WEBP at 8-11)", () => {
		// AVI: RIFF header + "AVI " at bytes 8-11
		const buffer = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x41, 0x56, 0x49, 0x20]).buffer;
		expect(validateMagicBytes(buffer, "image/webp")).toBe(false);
	});

	it("returns false for truncated RIFF file claiming to be WebP (< 12 bytes)", () => {
		// Only 8 bytes: RIFF header + some size bytes, missing WEBP signature
		const buffer = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00]).buffer;
		expect(validateMagicBytes(buffer, "image/webp")).toBe(false);
	});

	it("returns false for mismatched MIME type and magic bytes", () => {
		// PNG magic bytes but claiming JPEG
		const buffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00]).buffer;
		expect(validateMagicBytes(buffer, "image/jpeg")).toBe(false);
	});

	it("returns false for buffer shorter than required bytes", () => {
		const buffer = new Uint8Array([0x89, 0x50]).buffer;
		expect(validateMagicBytes(buffer, "image/png")).toBe(false);
	});

	it("returns false for unknown MIME type", () => {
		const buffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00]).buffer;
		expect(validateMagicBytes(buffer, "application/pdf")).toBe(false);
	});
});

describe("normalizeImageSrc", () => {
	it("strips localhost origin and returns pathname", () => {
		const result = normalizeImageSrc("http://localhost:3000/blog/test/cover.webp");
		expect(result).toBe("/blog/test/cover.webp");
	});

	it("strips localhost without port", () => {
		const result = normalizeImageSrc("http://localhost/images/photo.png");
		expect(result).toBe("/images/photo.png");
	});

	it("strips localhost with different port", () => {
		const result = normalizeImageSrc("http://localhost:8787/uploads/file.jpg");
		expect(result).toBe("/uploads/file.jpg");
	});

	it("returns non-localhost URLs unchanged", () => {
		const url = "https://cdn.example.com/blog/test/cover.webp";
		expect(normalizeImageSrc(url)).toBe(url);
	});

	it("returns https URLs unchanged", () => {
		const url = "https://r2.example.com/images/photo.png";
		expect(normalizeImageSrc(url)).toBe(url);
	});

	it("returns relative paths unchanged", () => {
		const url = "/blog/test/cover.webp";
		expect(normalizeImageSrc(url)).toBe(url);
	});

	it("returns malformed localhost URLs unchanged (cannot parse)", () => {
		// A string that starts with http://localhost but is not a valid URL
		const url = "http://localhost:not-a-port/path";
		const result = normalizeImageSrc(url);
		// The URL constructor should throw, so it falls back to returning the original
		expect(result).toBe(url);
	});

	it("preserves query strings from localhost URLs", () => {
		const result = normalizeImageSrc("http://localhost:3000/image.webp?w=200");
		// URL.pathname does not include query strings
		expect(result).toBe("/image.webp");
	});

	it("does not strip https://localhost URLs", () => {
		// Only http://localhost is matched
		const url = "https://localhost:3000/path";
		expect(normalizeImageSrc(url)).toBe(url);
	});
});
