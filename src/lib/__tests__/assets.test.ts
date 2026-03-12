import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock R2 bucket and env — vi.hoisted runs before vi.mock hoisting
// ---------------------------------------------------------------------------
const { mockBucket, mockEnv } = vi.hoisted(() => {
	const mockBucket = {
		list: vi.fn(),
		delete: vi.fn(),
	};
	const mockEnv = {
		ASSETS_BUCKET: mockBucket,
		R2_PUBLIC_URL: "https://assets.example.com",
	};
	return { mockBucket, mockEnv };
});

vi.mock("@/db", () => ({
	getEnv: vi.fn().mockResolvedValue(mockEnv),
	getDb: vi.fn(),
}));

// Let the real getPublicUrl run — it's a simple string concat
// vi.mock("@/lib/r2") is intentionally NOT called

import { listAssets, deleteAsset, getAssetPublicUrl } from "../assets";

beforeEach(() => {
	vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// listAssets
// ---------------------------------------------------------------------------
describe("listAssets", () => {
	it("returns mapped assets from R2 list", async () => {
		mockBucket.list.mockResolvedValue({
			objects: [
				{
					key: "blog/post-1/cover.webp",
					size: 12345,
					uploaded: new Date("2026-01-15T10:30:00Z"),
					httpMetadata: { contentType: "image/webp" },
				},
				{
					key: "uploads/abc/photo.png",
					size: 67890,
					uploaded: new Date("2026-02-20T14:00:00Z"),
					httpMetadata: { contentType: "image/png" },
				},
			],
		});

		const result = await listAssets();

		expect(result).toEqual([
			{
				key: "blog/post-1/cover.webp",
				size: 12345,
				uploaded: "2026-01-15T10:30:00.000Z",
				contentType: "image/webp",
			},
			{
				key: "uploads/abc/photo.png",
				size: 67890,
				uploaded: "2026-02-20T14:00:00.000Z",
				contentType: "image/png",
			},
		]);
	});

	it("passes prefix to R2 list call", async () => {
		mockBucket.list.mockResolvedValue({ objects: [] });

		await listAssets("blog/");

		expect(mockBucket.list).toHaveBeenCalledWith({
			prefix: "blog/",
			limit: 500,
		});
	});

	it("passes undefined prefix when no argument is provided", async () => {
		mockBucket.list.mockResolvedValue({ objects: [] });

		await listAssets();

		expect(mockBucket.list).toHaveBeenCalledWith({
			prefix: undefined,
			limit: 500,
		});
	});

	it("coerces empty string prefix to undefined", async () => {
		mockBucket.list.mockResolvedValue({ objects: [] });

		await listAssets("");

		expect(mockBucket.list).toHaveBeenCalledWith({
			prefix: undefined,
			limit: 500,
		});
	});

	it("sets limit to 500", async () => {
		mockBucket.list.mockResolvedValue({ objects: [] });

		await listAssets("uploads/");

		expect(mockBucket.list).toHaveBeenCalledWith(
			expect.objectContaining({ limit: 500 }),
		);
	});

	it("maps uploaded date to ISO string", async () => {
		const date = new Date("2026-03-01T08:15:30.123Z");
		mockBucket.list.mockResolvedValue({
			objects: [
				{
					key: "test.webp",
					size: 100,
					uploaded: date,
					httpMetadata: { contentType: "image/webp" },
				},
			],
		});

		const result = await listAssets();

		expect(result[0].uploaded).toBe("2026-03-01T08:15:30.123Z");
	});

	it("handles objects without httpMetadata (contentType is undefined)", async () => {
		mockBucket.list.mockResolvedValue({
			objects: [
				{
					key: "unknown-file",
					size: 500,
					uploaded: new Date("2026-01-01T00:00:00Z"),
					// no httpMetadata at all
				},
			],
		});

		const result = await listAssets();

		expect(result).toEqual([
			{
				key: "unknown-file",
				size: 500,
				uploaded: "2026-01-01T00:00:00.000Z",
				contentType: undefined,
			},
		]);
	});

	it("handles objects with httpMetadata but no contentType", async () => {
		mockBucket.list.mockResolvedValue({
			objects: [
				{
					key: "no-ct",
					size: 200,
					uploaded: new Date("2026-02-01T00:00:00Z"),
					httpMetadata: {},
				},
			],
		});

		const result = await listAssets();

		expect(result[0].contentType).toBeUndefined();
	});

	it("returns empty array when no objects exist", async () => {
		mockBucket.list.mockResolvedValue({ objects: [] });

		const result = await listAssets();

		expect(result).toEqual([]);
	});

	it("returns empty array when no objects match prefix", async () => {
		mockBucket.list.mockResolvedValue({ objects: [] });

		const result = await listAssets("nonexistent/");

		expect(result).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// deleteAsset
// ---------------------------------------------------------------------------
describe("deleteAsset", () => {
	it("calls ASSETS_BUCKET.delete with the given key", async () => {
		mockBucket.delete.mockResolvedValue(undefined);

		await deleteAsset("blog/post-1/cover.webp");

		expect(mockBucket.delete).toHaveBeenCalledOnce();
		expect(mockBucket.delete).toHaveBeenCalledWith("blog/post-1/cover.webp");
	});

	it("passes the correct key for different asset paths", async () => {
		mockBucket.delete.mockResolvedValue(undefined);

		await deleteAsset("uploads/abc-123/photo.png");

		expect(mockBucket.delete).toHaveBeenCalledWith("uploads/abc-123/photo.png");
	});

	it("handles keys with special characters", async () => {
		mockBucket.delete.mockResolvedValue(undefined);

		await deleteAsset("og/my-post-slug.png");

		expect(mockBucket.delete).toHaveBeenCalledWith("og/my-post-slug.png");
	});
});

// ---------------------------------------------------------------------------
// getAssetPublicUrl
// ---------------------------------------------------------------------------
describe("getAssetPublicUrl", () => {
	it("returns the correct public URL for a key", async () => {
		const url = await getAssetPublicUrl("blog/post-1/cover.webp");

		expect(url).toBe("https://assets.example.com/blog/post-1/cover.webp");
	});

	it("works with keys containing multiple path segments", async () => {
		const url = await getAssetPublicUrl("uploads/abc-123/images/photo.png");

		expect(url).toBe("https://assets.example.com/uploads/abc-123/images/photo.png");
	});

	it("works with a simple filename key", async () => {
		const url = await getAssetPublicUrl("favicon.ico");

		expect(url).toBe("https://assets.example.com/favicon.ico");
	});

	it("works with og image keys", async () => {
		const url = await getAssetPublicUrl("og/my-page.png");

		expect(url).toBe("https://assets.example.com/og/my-page.png");
	});
});
