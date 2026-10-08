CREATE TABLE `waitlist_rate_windows` (
	`rate_key` text NOT NULL,
	`window_start` integer NOT NULL,
	`attempts` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_rate_window` ON `waitlist_rate_windows` (`rate_key`,`window_start`);--> statement-breakpoint
CREATE INDEX `waitlist_rate_expiry` ON `waitlist_rate_windows` (`expires_at`);--> statement-breakpoint
CREATE TABLE `waitlist_requests` (
	`request_key` text PRIMARY KEY NOT NULL,
	`request_hash` text NOT NULL,
	`signup_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`signup_id`) REFERENCES `waitlist_signups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `waitlist_request_signup` ON `waitlist_requests` (`signup_id`);--> statement-breakpoint
CREATE TABLE `waitlist_signups` (
	`id` text PRIMARY KEY NOT NULL,
	`product` text NOT NULL,
	`email` text NOT NULL,
	`purpose` text NOT NULL,
	`consent_version` text NOT NULL,
	`consent` integer NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	CONSTRAINT "waitlist_product_check" CHECK("waitlist_signups"."product" IN ('ateles','neotoma')),
	CONSTRAINT "waitlist_consent_check" CHECK("waitlist_signups"."consent"=1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_product_email` ON `waitlist_signups` (`product`,`email`);--> statement-breakpoint
CREATE INDEX `waitlist_signup_expiry` ON `waitlist_signups` (`expires_at`);
