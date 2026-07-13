PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_deposit_records` (
	`id` text PRIMARY KEY NOT NULL,
	`upload_id` text NOT NULL,
	`branch_code` text NOT NULL,
	`source_key` text DEFAULT 'di319' NOT NULL,
	`period` text NOT NULL,
	`cif` text DEFAULT '' NOT NULL,
	`loan_account_number` text DEFAULT '' NOT NULL,
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
INSERT INTO `__new_deposit_records`("id", "upload_id", "branch_code", "source_key", "period", "cif", "loan_account_number", "debtor_name", "mantri", "savings_account", "blocked_at_start", "current_blocked", "installment_from_blocked", "mutation_date", "status", "created_at") SELECT "id", "upload_id", "branch_code", "source_key", "period", '', "loan_account_number", "debtor_name", "mantri", "savings_account", "blocked_at_start", "current_blocked", "installment_from_blocked", "mutation_date", "status", "created_at" FROM `deposit_records`;--> statement-breakpoint
DROP TABLE `deposit_records`;--> statement-breakpoint
ALTER TABLE `__new_deposit_records` RENAME TO `deposit_records`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `deposit_records_branch_period_savings_unique` ON `deposit_records` (`branch_code`,`period`,`cif`,`savings_account`);--> statement-breakpoint
CREATE INDEX `deposit_records_branch_period_idx` ON `deposit_records` (`branch_code`,`period`);--> statement-breakpoint
ALTER TABLE `loan_records` ADD `cif` text DEFAULT '' NOT NULL;
