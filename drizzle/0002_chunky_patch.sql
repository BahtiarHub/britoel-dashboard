CREATE TABLE `loan_records` (
	`id` text PRIMARY KEY NOT NULL,
	`upload_id` text NOT NULL,
	`branch_code` text NOT NULL,
	`source_key` text NOT NULL,
	`period` text NOT NULL,
	`account_number` text NOT NULL,
	`debtor_name` text NOT NULL,
	`next_payment_date` text NOT NULL,
	`outstanding` integer DEFAULT 0 NOT NULL,
	`plafond` integer DEFAULT 0 NOT NULL,
	`collectibility` text NOT NULL,
	`restructure_flag` text DEFAULT 'N' NOT NULL,
	`mantri` text NOT NULL,
	`pn_pengelola` text NOT NULL,
	`description` text NOT NULL,
	`realized_date` text NOT NULL,
	`realized_amount` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`upload_id`) REFERENCES `upload_records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `loan_records_branch_period_account_unique` ON `loan_records` (`branch_code`,`period`,`account_number`);--> statement-breakpoint
CREATE INDEX `loan_records_branch_period_idx` ON `loan_records` (`branch_code`,`period`);--> statement-breakpoint
CREATE INDEX `loan_records_branch_mantri_idx` ON `loan_records` (`branch_code`,`mantri`);