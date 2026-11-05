CREATE TABLE `chat_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customer_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`continuations` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `saved_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
