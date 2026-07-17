CREATE TABLE "branch_profiles" (
	"branch_code" text PRIMARY KEY NOT NULL,
	"branch_name" text DEFAULT '' NOT NULL,
	"source_upload_id" text,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "branch_profiles" ADD CONSTRAINT "branch_profiles_source_upload_id_upload_records_id_fk" FOREIGN KEY ("source_upload_id") REFERENCES "public"."upload_records"("id") ON DELETE set null ON UPDATE no action;