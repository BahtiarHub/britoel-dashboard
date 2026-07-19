CREATE TABLE "loan_mantri_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_code" text NOT NULL,
	"account_number" text NOT NULL,
	"mantri" text NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loan_mantri_assignments" ADD CONSTRAINT "loan_mantri_assignments_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "loan_mantri_assignments_branch_account_unique" ON "loan_mantri_assignments" USING btree ("branch_code","account_number");--> statement-breakpoint
CREATE INDEX "loan_mantri_assignments_branch_idx" ON "loan_mantri_assignments" USING btree ("branch_code");