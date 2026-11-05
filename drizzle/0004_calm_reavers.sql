CREATE TABLE `business_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mail_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_files` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`name` text NOT NULL,
	`object_key` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `amount_minor` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_currency` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_session` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_intent` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `start_after` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `customer_note` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `internal_note` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `tracking` text DEFAULT '' NOT NULL;