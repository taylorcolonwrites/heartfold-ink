CREATE TABLE `support_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reference` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`topic` text NOT NULL,
	`order_reference` text NOT NULL,
	`message` text NOT NULL,
	`reply` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
