import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import { cleanTables } from "../../../test/helpers";
import { getSiteSettingsDirect, updateSiteSettings, invalidateSiteSettingsCache } from "@/lib/site-settings";

describe("site-settings", () => {
	beforeEach(async () => {
		await cleanTables("site_settings");
	});

	describe("getSiteSettingsDirect", () => {
		it("returns defaults when no row exists", async () => {
			const settings = await getSiteSettingsDirect();
			expect(settings.name).toBe("Product Name");
			expect(settings.description).toBe("");
			expect(settings.author).toBe("");
			expect(settings.social).toEqual({ twitter: "", github: "", discord: "", instagram: "" });
			expect(settings.productLinks).toEqual({ appUrl: "", appStoreUrl: "", playStoreUrl: "" });
			expect(settings.features).toEqual({ waitlist: true, giveaway: true, blog: true, contact: true, pricing: false, changelog: false, api: false, doubleOptIn: false, maintenance: false });
			expect(settings.ui).toEqual({ search: true, themeToggle: true });
			expect(settings.theme.preset).toBe("bold");
			expect(settings.theme.accentColor).toBe("#9747ff");
			expect(settings.logoUrl).toBeNull();
			expect(settings.announcement).toEqual({ enabled: false, text: "", linkUrl: "", linkText: "" });
		});

		it("reads values from DB row", async () => {
			const db = await getDb();
			await db.insert(siteSettings).values({
				id: 1,
				name: "My Site",
				description: "A test site",
				author: "Test Author",
				social: JSON.stringify({ twitter: "@test" }),
				features: JSON.stringify({ blog: false }),
				theme: JSON.stringify({ accentColor: "#ff0000" }),
			});

			const settings = await getSiteSettingsDirect();
			expect(settings.name).toBe("My Site");
			expect(settings.description).toBe("A test site");
			expect(settings.author).toBe("Test Author");
			// Merges with defaults
			expect(settings.social.twitter).toBe("@test");
			expect(settings.social.github).toBe("");
			// Features merged with defaults
			expect(settings.features.blog).toBe(false);
			expect(settings.features.waitlist).toBe(true);
			// Theme merged with defaults
			expect(settings.theme.accentColor).toBe("#ff0000");
			expect(settings.theme.preset).toBe("bold");
		});

		it("handles invalid JSON gracefully", async () => {
			const db = await getDb();
			await db.insert(siteSettings).values({
				id: 1,
				name: "Broken JSON",
				social: "not-json",
				features: "{bad",
				theme: "",
			});

			const settings = await getSiteSettingsDirect();
			expect(settings.name).toBe("Broken JSON");
			// Falls back to defaults for invalid JSON
			expect(settings.social).toEqual({ twitter: "", github: "", discord: "", instagram: "" });
			expect(settings.features).toEqual({ waitlist: true, giveaway: true, blog: true, contact: true, pricing: false, changelog: false, api: false, doubleOptIn: false, maintenance: false });
			expect(settings.theme.preset).toBe("bold");
			expect(settings.announcement).toEqual({ enabled: false, text: "", linkUrl: "", linkText: "" });
		});
	});

	describe("updateSiteSettings", () => {
		it("creates row if none exists (insert fallback)", async () => {
			await updateSiteSettings({ name: "New Site" });
			const settings = await getSiteSettingsDirect();
			expect(settings.name).toBe("New Site");
		});

		it("updates existing row", async () => {
			// Seed a row
			await updateSiteSettings({ name: "First" });
			// Update it
			await updateSiteSettings({ name: "Second" });
			const settings = await getSiteSettingsDirect();
			expect(settings.name).toBe("Second");
		});

		it("merges social links with existing values", async () => {
			await updateSiteSettings({ social: { twitter: "@hello" } });
			await updateSiteSettings({ social: { github: "gh-user" } });
			const settings = await getSiteSettingsDirect();
			expect(settings.social.twitter).toBe("@hello");
			expect(settings.social.github).toBe("gh-user");
		});

		it("merges features with existing values", async () => {
			await updateSiteSettings({ features: { blog: false } });
			await updateSiteSettings({ features: { waitlist: false } });
			const settings = await getSiteSettingsDirect();
			expect(settings.features.blog).toBe(false);
			expect(settings.features.waitlist).toBe(false);
			expect(settings.features.giveaway).toBe(true);
		});

		it("merges theme with existing values", async () => {
			await updateSiteSettings({ theme: { accentColor: "#ff0000" } });
			await updateSiteSettings({ theme: { fontFamily: "geist" } });
			const settings = await getSiteSettingsDirect();
			expect(settings.theme.accentColor).toBe("#ff0000");
			expect(settings.theme.fontFamily).toBe("geist");
			expect(settings.theme.preset).toBe("bold"); // default preserved
		});

		it("can set logoUrl", async () => {
			await updateSiteSettings({ logoUrl: "https://example.com/logo.png" });
			const settings = await getSiteSettingsDirect();
			expect(settings.logoUrl).toBe("https://example.com/logo.png");
		});

		it("can clear logoUrl to null", async () => {
			await updateSiteSettings({ logoUrl: "https://example.com/logo.png" });
			await updateSiteSettings({ logoUrl: null });
			const settings = await getSiteSettingsDirect();
			expect(settings.logoUrl).toBeNull();
		});

		it("partial update does not overwrite unmentioned fields", async () => {
			await updateSiteSettings({
				name: "Original",
				description: "Original desc",
				author: "Author",
			});
			// Only update name
			await updateSiteSettings({ name: "Updated" });
			const settings = await getSiteSettingsDirect();
			expect(settings.name).toBe("Updated");
			expect(settings.description).toBe("Original desc");
			expect(settings.author).toBe("Author");
		});

		it("merges productLinks with existing values", async () => {
			await updateSiteSettings({ productLinks: { appUrl: "https://app.example.com" } });
			await updateSiteSettings({ productLinks: { appStoreUrl: "https://apps.apple.com/test" } });
			const settings = await getSiteSettingsDirect();
			expect(settings.productLinks.appUrl).toBe("https://app.example.com");
			expect(settings.productLinks.appStoreUrl).toBe("https://apps.apple.com/test");
		});

		it("merges ui with existing values", async () => {
			await updateSiteSettings({ ui: { search: false } });
			await updateSiteSettings({ ui: { themeToggle: false } });
			const settings = await getSiteSettingsDirect();
			expect(settings.ui.search).toBe(false);
			expect(settings.ui.themeToggle).toBe(false);
		});

		it("can set announcement fields", async () => {
			await updateSiteSettings({
				announcement: { enabled: true, text: "We launched!" },
			});
			const settings = await getSiteSettingsDirect();
			expect(settings.announcement.enabled).toBe(true);
			expect(settings.announcement.text).toBe("We launched!");
			// Defaults preserved for unset fields
			expect(settings.announcement.linkUrl).toBe("");
			expect(settings.announcement.linkText).toBe("");
		});

		it("merges announcement with existing values", async () => {
			await updateSiteSettings({
				announcement: { enabled: true, text: "Hello" },
			});
			await updateSiteSettings({
				announcement: { linkUrl: "https://example.com", linkText: "Learn more" },
			});
			const settings = await getSiteSettingsDirect();
			expect(settings.announcement.enabled).toBe(true);
			expect(settings.announcement.text).toBe("Hello");
			expect(settings.announcement.linkUrl).toBe("https://example.com");
			expect(settings.announcement.linkText).toBe("Learn more");
		});

		it("returns default announcement when no row exists", async () => {
			await updateSiteSettings({ name: "Test" });
			const settings = await getSiteSettingsDirect();
			expect(settings.announcement).toEqual({
				enabled: false,
				text: "",
				linkUrl: "",
				linkText: "",
			});
		});
	});

	describe("invalidateSiteSettingsCache", () => {
		it("is exported as a function", () => {
			expect(typeof invalidateSiteSettingsCache).toBe("function");
		});
	});
});
