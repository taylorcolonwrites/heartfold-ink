CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`client_key` text NOT NULL,
	`reference` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	`status` text DEFAULT 'awaiting_confirmation' NOT NULL
);
