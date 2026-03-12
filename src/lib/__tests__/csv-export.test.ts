import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";

/**
 * Tests for csv-export.ts.
 *
 * Since escapeCsvValue is not exported, we test it indirectly via downloadCsv
 * by capturing the Blob content through mocked DOM APIs.
 */

let capturedCsv: string;
let capturedBlobOptions: unknown;
let mockLink: { href: string; download: string; click: Mock };
let createObjectURL: Mock;
let revokeObjectURL: Mock;

const OriginalBlob = globalThis.Blob;
const originalURL = globalThis.URL;
const originalDocument = globalThis.document;

beforeEach(() => {
	capturedCsv = "";
	capturedBlobOptions = undefined;
	mockLink = { href: "", download: "", click: vi.fn() };
	createObjectURL = vi.fn(() => "blob:fake-url");
	revokeObjectURL = vi.fn();

	// Mock Blob to capture CSV content
	vi.stubGlobal(
		"Blob",
		class MockBlob {
			constructor(parts: string[], opts?: unknown) {
				capturedCsv = parts.join("");
				capturedBlobOptions = opts;
			}
		},
	);

	// Preserve the URL constructor but override the static methods
	const MockURL = function (this: URL, ...args: ConstructorParameters<typeof URL>) {
		return new originalURL(...args);
	} as unknown as typeof URL;
	MockURL.prototype = originalURL.prototype;
	MockURL.createObjectURL = createObjectURL;
	MockURL.revokeObjectURL = revokeObjectURL;
	MockURL.canParse = originalURL.canParse;
	MockURL.parse = originalURL.parse;
	vi.stubGlobal("URL", MockURL);

	// Mock document.createElement to return a fake anchor element
	vi.stubGlobal("document", {
		createElement: (tag: string) => {
			if (tag === "a") return mockLink;
			return {};
		},
	});
});

afterEach(() => {
	// Restore original globals so other tests and teardown are unaffected
	vi.stubGlobal("Blob", OriginalBlob);
	vi.stubGlobal("URL", originalURL);
	vi.stubGlobal("document", originalDocument);
	vi.restoreAllMocks();
});

async function getDownloadCsv() {
	vi.resetModules();
	const mod = await import("../csv-export");
	return mod.downloadCsv;
}

describe("escapeCsvValue (tested indirectly via downloadCsv)", () => {
	it("passes normal string through unchanged", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(["Name"], [{ name: "Alice" }], ["name"], "test.csv");
		expect(capturedCsv).toBe("Name\nAlice");
	});

	it("quotes value containing a comma", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(["Val"], [{ v: "a,b" }], ["v"], "test.csv");
		expect(capturedCsv).toBe('Val\n"a,b"');
	});

	it("quotes value containing a newline", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(["Val"], [{ v: "line1\nline2" }], ["v"], "test.csv");
		expect(capturedCsv).toBe('Val\n"line1\nline2"');
	});

	it("quotes value containing a carriage return", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(["Val"], [{ v: "a\rb" }], ["v"], "test.csv");
		expect(capturedCsv).toBe('Val\n"a\rb"');
	});

	it("escapes double quotes by doubling them", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(["Val"], [{ v: 'say "hi"' }], ["v"], "test.csv");
		expect(capturedCsv).toBe('Val\n"say ""hi"""');
	});

	it("converts null to empty string", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(["Val"], [{ v: null }], ["v"], "test.csv");
		expect(capturedCsv).toBe("Val\n");
	});

	it("converts undefined to empty string", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(["Val"], [{ v: undefined }], ["v"], "test.csv");
		expect(capturedCsv).toBe("Val\n");
	});

	it("converts numbers to string", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(["Val"], [{ v: 42 }], ["v"], "test.csv");
		expect(capturedCsv).toBe("Val\n42");
	});

	it("converts zero to string", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(["Val"], [{ v: 0 }], ["v"], "test.csv");
		expect(capturedCsv).toBe("Val\n0");
	});

	it("converts boolean to string", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(["Val"], [{ v: true }], ["v"], "test.csv");
		expect(capturedCsv).toBe("Val\ntrue");
	});

	it("quotes header values that contain special characters", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(["Name, First"], [{ n: "Alice" }], ["n"], "test.csv");
		expect(capturedCsv).toBe('"Name, First"\nAlice');
	});
});

describe("downloadCsv", () => {
	it("generates correct CSV with multiple headers and rows", async () => {
		const downloadCsv = await getDownloadCsv();
		const headers = ["Name", "Email", "Age"];
		const rows = [
			{ name: "Alice", email: "alice@example.com", age: 30 },
			{ name: "Bob", email: "bob@example.com", age: 25 },
		];
		const keys = ["name", "email", "age"];

		downloadCsv(headers, rows, keys, "users.csv");

		expect(capturedCsv).toBe(
			"Name,Email,Age\nAlice,alice@example.com,30\nBob,bob@example.com,25",
		);
	});

	it("handles empty rows array", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(["Name", "Email"], [], ["name", "email"], "empty.csv");
		expect(capturedCsv).toBe("Name,Email");
	});

	it("produces empty values for missing keys", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(
			["Name", "Phone"],
			[{ name: "Alice" }],
			["name", "phone"],
			"test.csv",
		);
		expect(capturedCsv).toBe("Name,Phone\nAlice,");
	});

	it("creates a Blob with text/csv content type", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(["H"], [{ h: "v" }], ["h"], "test.csv");
		expect(capturedBlobOptions).toEqual({ type: "text/csv;charset=utf-8;" });
	});

	it("creates object URL, sets it on link, and triggers download", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(["H"], [{ h: "v" }], ["h"], "report.csv");

		expect(createObjectURL).toHaveBeenCalled();
		expect(mockLink.href).toBe("blob:fake-url");
		expect(mockLink.download).toBe("report.csv");
		expect(mockLink.click).toHaveBeenCalledOnce();
	});

	it("revokes the object URL after triggering download", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(["H"], [{ h: "v" }], ["h"], "test.csv");

		expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
	});

	it("handles rows with special characters in multiple columns", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(
			["Desc", "Note"],
			[{ desc: 'He said "yes"', note: "a,b,c" }],
			["desc", "note"],
			"test.csv",
		);

		expect(capturedCsv).toBe('Desc,Note\n"He said ""yes""","a,b,c"');
	});

	it("uses keys order, not object property order", async () => {
		const downloadCsv = await getDownloadCsv();
		downloadCsv(
			["B", "A"],
			[{ a: "first", b: "second" }],
			["b", "a"],
			"test.csv",
		);

		expect(capturedCsv).toBe("B,A\nsecond,first");
	});
});
