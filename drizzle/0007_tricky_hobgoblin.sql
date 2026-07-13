CREATE TABLE `ckpn_forecasts` (
	`id` text PRIMARY KEY NOT NULL,
	`branch_code` text NOT NULL,
	`period` text NOT NULL,
	`account_number` text NOT NULL,
	`target_collectibility` text NOT NULL,
	`updated_by` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ckpn_forecast_branch_period_account_unique` ON `ckpn_forecasts` (`branch_code`,`period`,`account_number`);--> statement-breakpoint
CREATE INDEX `ckpn_forecast_branch_period_idx` ON `ckpn_forecasts` (`branch_code`,`period`);