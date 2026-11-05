ALTER TABLE `orders` ADD `estimated_minutes` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `complexity` text DEFAULT 'standard' NOT NULL;