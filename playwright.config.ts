import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	timeout: 30_000,
	retries: 0,
	workers: 1,
	globalSetup: "./e2e/global-setup.ts",
	use: {
		baseURL: "http://localhost:3000",
		headless: true,
		screenshot: "only-on-failure",
	},
	webServer: {
		command: "npm run dev",
		url: "http://localhost:3000",
		reuseExistingServer: true,
		timeout: 60_000,
	},
	projects: [
		{
			name: "setup",
			testMatch: /auth\.setup\.ts/,
		},
		{
			name: "chromium",
			use: {
				browserName: "chromium",
				storageState: "e2e/.auth/admin.json",
			},
			dependencies: ["setup"],
			testIgnore: /auth\.setup\.ts/,
		},
	],
});
