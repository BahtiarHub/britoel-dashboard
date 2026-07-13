CREATE TABLE `missing_loan_resolutions` (
	`id` text PRIMARY KEY NOT NULL,
	`branch_code` text NOT NULL,
	`period` text NOT NULL,
	`account_number` text NOT NULL,
	`status` text NOT NULL,
	`updated_by` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `missing_loan_resolution_branch_period_account_unique` ON `missing_loan_resolutions` (`branch_code`,`period`,`account_number`);--> statement-breakpoint
CREATE INDEX `missing_loan_resolution_branch_period_idx` ON `missing_loan_resolutions` (`branch_code`,`period`);--> statement-breakpoint
CREATE TABLE `nominative_ckpn_records` (
	`id` text PRIMARY KEY NOT NULL,
	`upload_id` text NOT NULL,
	`branch_code` text NOT NULL,
	`period` text NOT NULL,
	`account_number` text NOT NULL,
	`debtor_name` text DEFAULT '' NOT NULL,
	`outstanding` integer DEFAULT 0 NOT NULL,
	`collectibility` text DEFAULT '' NOT NULL,
	`formed_ckpn` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`upload_id`) REFERENCES `upload_records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nominative_ckpn_branch_period_account_unique` ON `nominative_ckpn_records` (`branch_code`,`period`,`account_number`);--> statement-breakpoint
CREATE INDEX `nominative_ckpn_branch_period_idx` ON `nominative_ckpn_records` (`branch_code`,`period`);