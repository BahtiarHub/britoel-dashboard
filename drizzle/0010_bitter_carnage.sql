CREATE TABLE `covenance_records` (
	`id` text PRIMARY KEY NOT NULL,
	`branch_code` text NOT NULL,
	`period` text NOT NULL,
	`account_number` text NOT NULL,
	`debtor_name` text DEFAULT '' NOT NULL,
	`realized_date` text NOT NULL,
	`sph_number` text DEFAULT '' NOT NULL,
	`credit_application_number` text DEFAULT '' NOT NULL,
	`ktp_number` text DEFAULT '' NOT NULL,
	`kk_number` text DEFAULT '' NOT NULL,
	`sku_nib_number` text DEFAULT '' NOT NULL,
	`slik_ojk` text DEFAULT '' NOT NULL,
	`updated_by` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `covenance_branch_account_realized_unique` ON `covenance_records` (`branch_code`,`account_number`,`realized_date`);--> statement-breakpoint
CREATE INDEX `covenance_branch_period_idx` ON `covenance_records` (`branch_code`,`period`);