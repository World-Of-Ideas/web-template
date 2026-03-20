import { execSync } from "child_process";
import { rmSync } from "fs";
import { resolve } from "path";

/**
 * Global setup for E2E tests — resets and seeds the local D1 database.
 * Runs once before all test projects.
 */
export default function globalSetup() {
	const cwd = process.cwd();
	const run = (sql: string) =>
		execSync(`npx wrangler d1 execute DB --local --command "${sql}"`, {
			cwd,
			stdio: "pipe",
		});

	// Clear Next.js ISR/fetch cache so stale unstable_cache entries
	// (e.g. site-settings) don't survive across test runs.
	rmSync(resolve(cwd, ".next/cache"), { recursive: true, force: true });

	// Clear all tables (order matters for FK constraints) and reset auto-increment
	run("DELETE FROM giveaway_actions");
	run("DELETE FROM giveaway_entries");
	run("DELETE FROM contact_submissions");
	run("DELETE FROM subscribers");
	run("DELETE FROM posts");
	run("DELETE FROM pages");
	run("DELETE FROM admin_sessions");
	run("DELETE FROM tracking_settings");
	run("DELETE FROM site_settings");
	run("DELETE FROM sqlite_sequence");

	// Run the full seed script to populate system pages, sample data, etc.
	const seedPath = resolve(cwd, "src/db/seed.sql");
	execSync(`npx wrangler d1 execute DB --local --file "${seedPath}"`, {
		cwd,
		stdio: "pipe",
	});
}
