CREATE TABLE `deposit_records` (
	`id` text PRIMARY KEY NOT NULL,
	`upload_id` text NOT NULL,
	`branch_code` text NOT NULL,
	`source_key` text DEFAULT 'di319' NOT NULL,
	`period` text NOT NULL,
	`loan_account_number` text NOT NULL,
	`debtor_name` text DEFAULT '' NOT NULL,
	`mantri` text DEFAULT '' NOT NULL,
	`savings_account` text DEFAULT '' NOT NULL,
	`blocked_at_start` integer DEFAULT 0 NOT NULL,
	`current_blocked` integer DEFAULT 0 NOT NULL,
	`installment_from_blocked` integer DEFAULT 0 NOT NULL,
	`mutation_date` text DEFAULT '' NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`upload_id`) REFERENCES `upload_records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deposit_records_branch_period_account_unique` ON `deposit_records` (`branch_code`,`period`,`loan_account_number`);--> statement-breakpoint
CREATE INDEX `deposit_records_branch_period_idx` ON `deposit_records` (`branch_code`,`period`);