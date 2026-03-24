CREATE TABLE `applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`company` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`applied_date` text,
	`notes` text,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `job_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`target_roles` text,
	`industries` text,
	`job_types` text,
	`locations` text,
	`remote_preference` text,
	`start_date` text,
	`urgency` text,
	`dream_companies` text,
	`avoid_companies` text,
	`networking_preference` text,
	`digest_day` text,
	`digest_time` text,
	`timezone` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `networking_leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`report_id` text NOT NULL,
	`name` text,
	`company` text,
	`role` text,
	`connection_basis` text,
	`intensity` text,
	`outreach_snippet` text,
	FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`digest_day` text DEFAULT 'Tuesday',
	`digest_time` text DEFAULT '07:00',
	`timezone` text DEFAULT 'America/New_York',
	`email_enabled` integer DEFAULT 1,
	`sms_enabled` integer DEFAULT 1,
	`pdf_enabled` integer DEFAULT 1,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`university` text,
	`major` text,
	`minor` text,
	`gpa` real,
	`graduation` text,
	`degree_level` text,
	`resume_url` text,
	`linkedin` text,
	`portfolio` text,
	`github` text,
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `report_recommendations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`report_id` text NOT NULL,
	`company` text NOT NULL,
	`role` text NOT NULL,
	`reasoning` text,
	`alumni` text,
	`referral_path` text,
	`resume_focus` text,
	FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`generated_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`summary` text,
	`pdf_url` text,
	`status` text DEFAULT 'ready',
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `resume_recommendations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`report_id` text NOT NULL,
	`company` text,
	`bullets` text,
	FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'trial',
	`trial_ends_at` integer,
	`current_period_end` integer,
	`price` real DEFAULT 9.99,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`first_name` text,
	`last_name` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);