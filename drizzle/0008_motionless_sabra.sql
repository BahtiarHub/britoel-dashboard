ALTER TABLE `loan_records` ADD `principal_arrears` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `loan_records` ADD `interest_arrears` integer DEFAULT 0 NOT NULL;