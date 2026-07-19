ALTER TABLE "deposit_records" ADD COLUMN "balance" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "deposit_records" ADD COLUMN "available_balance" bigint DEFAULT 0 NOT NULL;