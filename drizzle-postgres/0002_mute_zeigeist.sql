ALTER TABLE "brimen_file_loans" ALTER COLUMN "status" SET DEFAULT 'Pengajuan Pinjam Berkas';--> statement-breakpoint
ALTER TABLE "brimen_file_loans" ADD COLUMN "handover_photo" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "brimen_file_loans" ADD COLUMN "handover_by" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "brimen_file_loans" ADD COLUMN "handover_at" text;--> statement-breakpoint
ALTER TABLE "brimen_file_loans" ADD COLUMN "received_at" text;--> statement-breakpoint
ALTER TABLE "brimen_file_loans" ADD COLUMN "return_reason" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "brimen_file_loans" ADD COLUMN "return_photo" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "brimen_file_loans" ADD COLUMN "return_requested_at" text;--> statement-breakpoint
ALTER TABLE "brimen_file_loans" ADD COLUMN "return_confirmed_by" text DEFAULT '' NOT NULL;