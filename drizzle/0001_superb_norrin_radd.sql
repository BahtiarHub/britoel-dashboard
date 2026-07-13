ALTER TABLE `audit_logs` ADD `branch_code` text DEFAULT '8014' NOT NULL;--> statement-breakpoint
ALTER TABLE `upload_records` ADD `branch_code` text DEFAULT '8014' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `username` text;--> statement-breakpoint
ALTER TABLE `user` ADD `display_username` text;--> statement-breakpoint
ALTER TABLE `user` ADD `branch_code` text DEFAULT '8014' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `last_active_at` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `created_by` text;--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
ALTER TABLE `whatsapp_campaigns` ADD `branch_code` text DEFAULT '8014' NOT NULL;--> statement-breakpoint
ALTER TABLE `whatsapp_contacts` ADD `branch_code` text DEFAULT '8014' NOT NULL;