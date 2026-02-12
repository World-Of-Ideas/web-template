-- Consolidated initial migration
-- All tables + indexes for the webapp schema

CREATE TABLE `admin_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`expires_at` text NOT NULL
);

CREATE TABLE `contact_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`source` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE `giveaway_actions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entry_id` integer NOT NULL REFERENCES `giveaway_entries`(`id`),
	`action` text NOT NULL,
	`bonus_entries` integer NOT NULL,
	`metadata` text,
	`completed_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE `giveaway_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`subscriber_id` integer REFERENCES `subscribers`(`id`),
	`total_entries` integer DEFAULT 1 NOT NULL,
	`source` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE `pages` (
	`slug` text PRIMARY KEY NOT NULL,
	`parent_slug` text,
	`title` text NOT NULL,
	`description` text,
	`content` text,
	`faqs` text,
	`related_pages` text,
	`cover_image` text,
	`metadata` text,
	`layout` text DEFAULT 'default' NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`content` text NOT NULL,
	`faqs` text,
	`cover_image` text,
	`author` text DEFAULT 'Admin' NOT NULL,
	`tags` text,
	`published` integer DEFAULT false NOT NULL,
	`published_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE `subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`referral_code` text NOT NULL,
	`referred_by` text,
	`referral_count` integer DEFAULT 0 NOT NULL,
	`position` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`source` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE `tracking_settings` (
	`id` integer PRIMARY KEY DEFAULT 1,
	`meta_pixel_enabled` integer DEFAULT false NOT NULL,
	`meta_pixel_id` text,
	`meta_capi_enabled` integer DEFAULT false NOT NULL,
	`meta_capi_token` text,
	`ga_enabled` integer DEFAULT false NOT NULL,
	`ga_measurement_id` text,
	`ga_mp_enabled` integer DEFAULT false NOT NULL,
	`ga_mp_api_secret` text,
	`gtm_enabled` integer DEFAULT false NOT NULL,
	`gtm_container_id` text,
	`utm_tracking_enabled` integer DEFAULT true NOT NULL,
	`cookie_consent_enabled` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);

-- Unique indexes
CREATE UNIQUE INDEX `subscribers_email_unique` ON `subscribers` (`email`);
CREATE UNIQUE INDEX `subscribers_referral_code_unique` ON `subscribers` (`referral_code`);
CREATE UNIQUE INDEX `posts_slug_unique` ON `posts` (`slug`);
CREATE UNIQUE INDEX `giveaway_entries_email_unique` ON `giveaway_entries` (`email`);
CREATE UNIQUE INDEX `uq_entry_action` ON `giveaway_actions` (`entry_id`, `action`);

-- Performance indexes
CREATE INDEX `idx_sessions_expires` ON `admin_sessions` (`expires_at`);
CREATE INDEX `idx_contact_created` ON `contact_submissions` (`created_at`);
CREATE INDEX `idx_actions_entry` ON `giveaway_actions` (`entry_id`);
CREATE INDEX `idx_pages_parent` ON `pages` (`parent_slug`);
CREATE INDEX `idx_posts_listing` ON `posts` (`published`, `created_at`);
CREATE INDEX `idx_posts_published_at` ON `posts` (`published_at`);
CREATE INDEX `idx_subscribers_status` ON `subscribers` (`status`);
CREATE INDEX `idx_subscribers_position` ON `subscribers` (`position`);
