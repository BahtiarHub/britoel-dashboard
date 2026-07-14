CREATE TABLE `warning_letters` (
	`id` text PRIMARY KEY NOT NULL,
	`branch_code` text NOT NULL,
	`period` text NOT NULL,
	`account_number` text NOT NULL,
	`debtor_name` text NOT NULL,
	`level` text NOT NULL,
	`letter_number` text NOT NULL,
	`issued_at` text NOT NULL,
	`due_date` text NOT NULL,
	`recipient_address` text DEFAULT '' NOT NULL,
	`penalty` integer DEFAULT 0 NOT NULL,
	`signer_name` text DEFAULT '' NOT NULL,
	`signer_title` text DEFAULT 'Kepala Unit' NOT NULL,
	`status` text DEFAULT 'Dibuat' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `warning_letters_branch_period_account_level_unique` ON `warning_letters` (`branch_code`,`period`,`account_number`,`level`);--> statement-breakpoint
CREATE INDEX `warning_letters_branch_period_idx` ON `warning_letters` (`branch_code`,`period`);