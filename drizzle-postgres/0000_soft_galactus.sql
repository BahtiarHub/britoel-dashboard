CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"detail" text,
	"branch_code" text DEFAULT '8014' NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brimen_customers" (
	"id" text PRIMARY KEY NOT NULL,
	"account_number" text NOT NULL,
	"name" text NOT NULL,
	"plafond" bigint DEFAULT 0 NOT NULL,
	"realization_date" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"mantri" text DEFAULT '' NOT NULL,
	"brimen_berkas" text DEFAULT '' NOT NULL,
	"brimen_jaminan" text DEFAULT '' NOT NULL,
	"guarantee" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'Disimpan' NOT NULL,
	"branch_code" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brimen_file_loan_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"loan_id" text NOT NULL,
	"actor" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brimen_file_loans" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"borrower_name" text NOT NULL,
	"borrower_username" text NOT NULL,
	"loan_date" text NOT NULL,
	"returned_date" text,
	"status" text DEFAULT 'Dipinjam' NOT NULL,
	"purpose" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ckpn_forecasts" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_code" text NOT NULL,
	"period" text NOT NULL,
	"account_number" text NOT NULL,
	"target_collectibility" text NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "covenance_records" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_code" text NOT NULL,
	"period" text NOT NULL,
	"account_number" text NOT NULL,
	"debtor_name" text DEFAULT '' NOT NULL,
	"realized_date" text NOT NULL,
	"sph_number" text DEFAULT '' NOT NULL,
	"credit_application_number" text DEFAULT '' NOT NULL,
	"ktp_number" text DEFAULT '' NOT NULL,
	"kk_number" text DEFAULT '' NOT NULL,
	"sku_nib_number" text DEFAULT '' NOT NULL,
	"slik_ojk" text DEFAULT '' NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposit_records" (
	"id" text PRIMARY KEY NOT NULL,
	"upload_id" text NOT NULL,
	"branch_code" text NOT NULL,
	"source_key" text DEFAULT 'di319' NOT NULL,
	"period" text NOT NULL,
	"cif" text DEFAULT '' NOT NULL,
	"loan_account_number" text DEFAULT '' NOT NULL,
	"debtor_name" text DEFAULT '' NOT NULL,
	"mantri" text DEFAULT '' NOT NULL,
	"savings_account" text DEFAULT '' NOT NULL,
	"blocked_at_start" bigint DEFAULT 0 NOT NULL,
	"current_blocked" bigint DEFAULT 0 NOT NULL,
	"installment_from_blocked" bigint DEFAULT 0 NOT NULL,
	"mutation_date" text DEFAULT '' NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_records" (
	"id" text PRIMARY KEY NOT NULL,
	"upload_id" text NOT NULL,
	"branch_code" text NOT NULL,
	"source_key" text NOT NULL,
	"period" text NOT NULL,
	"cif" text DEFAULT '' NOT NULL,
	"loan_type" text DEFAULT '' NOT NULL,
	"account_number" text NOT NULL,
	"debtor_name" text NOT NULL,
	"next_payment_date" text NOT NULL,
	"outstanding" bigint DEFAULT 0 NOT NULL,
	"plafond" bigint DEFAULT 0 NOT NULL,
	"collectibility" text NOT NULL,
	"restructure_flag" text DEFAULT 'N' NOT NULL,
	"mantri" text NOT NULL,
	"pn_pengelola" text NOT NULL,
	"description" text NOT NULL,
	"realized_date" text NOT NULL,
	"realized_amount" bigint DEFAULT 0 NOT NULL,
	"principal_arrears" bigint DEFAULT 0 NOT NULL,
	"interest_arrears" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "missing_loan_resolutions" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_code" text NOT NULL,
	"period" text NOT NULL,
	"account_number" text NOT NULL,
	"status" text NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nominative_ckpn_records" (
	"id" text PRIMARY KEY NOT NULL,
	"upload_id" text NOT NULL,
	"branch_code" text NOT NULL,
	"period" text NOT NULL,
	"account_number" text NOT NULL,
	"debtor_name" text DEFAULT '' NOT NULL,
	"outstanding" bigint DEFAULT 0 NOT NULL,
	"collectibility" text DEFAULT '' NOT NULL,
	"formed_ckpn" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "upload_records" (
	"id" text PRIMARY KEY NOT NULL,
	"source_key" text NOT NULL,
	"source_name" text NOT NULL,
	"file_name" text NOT NULL,
	"format" text NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'Berhasil' NOT NULL,
	"branch_code" text DEFAULT '8014' NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'Mantri' NOT NULL,
	"username" text,
	"display_username" text,
	"branch_code" text DEFAULT '8014' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warning_letters" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_code" text NOT NULL,
	"period" text NOT NULL,
	"account_number" text NOT NULL,
	"debtor_name" text NOT NULL,
	"level" text NOT NULL,
	"letter_number" text NOT NULL,
	"issued_at" text NOT NULL,
	"due_date" text NOT NULL,
	"recipient_address" text DEFAULT '' NOT NULL,
	"penalty" bigint DEFAULT 0 NOT NULL,
	"signer_name" text DEFAULT '' NOT NULL,
	"signer_title" text DEFAULT 'Kepala Unit' NOT NULL,
	"status" text DEFAULT 'Dibuat' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_campaign_recipients" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"account_number" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"status" text NOT NULL,
	"message_id" text,
	"error" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_type" text NOT NULL,
	"template_name" text NOT NULL,
	"mode" text NOT NULL,
	"status" text NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"branch_code" text DEFAULT '8014' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_contacts" (
	"account_number" text NOT NULL,
	"phone" text NOT NULL,
	"branch_code" text DEFAULT '8014' NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brimen_file_loan_logs" ADD CONSTRAINT "brimen_file_loan_logs_loan_id_brimen_file_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."brimen_file_loans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brimen_file_loans" ADD CONSTRAINT "brimen_file_loans_customer_id_brimen_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."brimen_customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ckpn_forecasts" ADD CONSTRAINT "ckpn_forecasts_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "covenance_records" ADD CONSTRAINT "covenance_records_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_records" ADD CONSTRAINT "deposit_records_upload_id_upload_records_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."upload_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_records" ADD CONSTRAINT "loan_records_upload_id_upload_records_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."upload_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missing_loan_resolutions" ADD CONSTRAINT "missing_loan_resolutions_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nominative_ckpn_records" ADD CONSTRAINT "nominative_ckpn_records_upload_id_upload_records_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."upload_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_records" ADD CONSTRAINT "upload_records_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warning_letters" ADD CONSTRAINT "warning_letters_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_campaign_recipients" ADD CONSTRAINT "whatsapp_campaign_recipients_campaign_id_whatsapp_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."whatsapp_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_campaigns" ADD CONSTRAINT "whatsapp_campaigns_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_branch_created_idx" ON "audit_logs" USING btree ("branch_code","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "brimen_customers_branch_account_unique" ON "brimen_customers" USING btree ("branch_code","account_number");--> statement-breakpoint
CREATE INDEX "brimen_customers_branch_status_idx" ON "brimen_customers" USING btree ("branch_code","status");--> statement-breakpoint
CREATE INDEX "brimen_file_loan_logs_loan_idx" ON "brimen_file_loan_logs" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX "brimen_file_loans_customer_status_idx" ON "brimen_file_loans" USING btree ("customer_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "ckpn_forecast_branch_period_account_unique" ON "ckpn_forecasts" USING btree ("branch_code","period","account_number");--> statement-breakpoint
CREATE INDEX "ckpn_forecast_branch_period_idx" ON "ckpn_forecasts" USING btree ("branch_code","period");--> statement-breakpoint
CREATE UNIQUE INDEX "covenance_branch_account_realized_unique" ON "covenance_records" USING btree ("branch_code","account_number","realized_date");--> statement-breakpoint
CREATE INDEX "covenance_branch_period_idx" ON "covenance_records" USING btree ("branch_code","period");--> statement-breakpoint
CREATE UNIQUE INDEX "deposit_records_branch_period_savings_unique" ON "deposit_records" USING btree ("branch_code","period","cif","savings_account");--> statement-breakpoint
CREATE INDEX "deposit_records_branch_period_idx" ON "deposit_records" USING btree ("branch_code","period");--> statement-breakpoint
CREATE UNIQUE INDEX "loan_records_branch_period_account_unique" ON "loan_records" USING btree ("branch_code","period","account_number");--> statement-breakpoint
CREATE INDEX "loan_records_branch_period_idx" ON "loan_records" USING btree ("branch_code","period");--> statement-breakpoint
CREATE INDEX "loan_records_branch_mantri_idx" ON "loan_records" USING btree ("branch_code","mantri");--> statement-breakpoint
CREATE INDEX "loan_records_branch_cif_idx" ON "loan_records" USING btree ("branch_code","cif");--> statement-breakpoint
CREATE UNIQUE INDEX "missing_loan_resolution_branch_period_account_unique" ON "missing_loan_resolutions" USING btree ("branch_code","period","account_number");--> statement-breakpoint
CREATE INDEX "missing_loan_resolution_branch_period_idx" ON "missing_loan_resolutions" USING btree ("branch_code","period");--> statement-breakpoint
CREATE UNIQUE INDEX "nominative_ckpn_branch_period_account_unique" ON "nominative_ckpn_records" USING btree ("branch_code","period","account_number");--> statement-breakpoint
CREATE INDEX "nominative_ckpn_branch_period_idx" ON "nominative_ckpn_records" USING btree ("branch_code","period");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "upload_records_branch_created_idx" ON "upload_records" USING btree ("branch_code","created_at");--> statement-breakpoint
CREATE INDEX "user_branch_role_idx" ON "user" USING btree ("branch_code","role");--> statement-breakpoint
CREATE UNIQUE INDEX "warning_letters_branch_period_account_level_unique" ON "warning_letters" USING btree ("branch_code","period","account_number","level");--> statement-breakpoint
CREATE INDEX "warning_letters_branch_period_idx" ON "warning_letters" USING btree ("branch_code","period");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_contacts_branch_account_unique" ON "whatsapp_contacts" USING btree ("branch_code","account_number");--> statement-breakpoint
CREATE INDEX "whatsapp_contacts_branch_idx" ON "whatsapp_contacts" USING btree ("branch_code");