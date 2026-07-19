CREATE TABLE "quick_count_results" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_code" text NOT NULL,
	"period" text NOT NULL,
	"work_date" text NOT NULL,
	"account_number" text NOT NULL,
	"debtor_name" text DEFAULT '' NOT NULL,
	"quality" text DEFAULT '' NOT NULL,
	"billing" bigint DEFAULT 0 NOT NULL,
	"act_today" bigint DEFAULT 0 NOT NULL,
	"remaining" bigint DEFAULT 0 NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"forecast_collectibility" text DEFAULT '' NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quick_count_results" ADD CONSTRAINT "quick_count_results_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quick_count_branch_period_date_account_unique" ON "quick_count_results" USING btree ("branch_code","period","work_date","account_number");--> statement-breakpoint
CREATE INDEX "quick_count_branch_date_idx" ON "quick_count_results" USING btree ("branch_code","work_date");--> statement-breakpoint
CREATE INDEX "quick_count_branch_period_date_idx" ON "quick_count_results" USING btree ("branch_code","period","work_date");--> statement-breakpoint
CREATE INDEX "deposit_records_branch_period_cif_idx" ON "deposit_records" USING btree ("branch_code","period","cif");--> statement-breakpoint
CREATE INDEX "loan_records_branch_period_collectibility_idx" ON "loan_records" USING btree ("branch_code","period","collectibility");--> statement-breakpoint
CREATE INDEX "loan_records_branch_period_npd_idx" ON "loan_records" USING btree ("branch_code","period","next_payment_date");