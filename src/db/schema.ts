import { bigint, boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const money = (name: string) => bigint(name, { mode: "number" });
const dateTime = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("Mantri"),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  branchCode: text("branch_code").notNull().default("8014"),
  active: boolean("active").notNull().default(true),
  lastActiveAt: dateTime("last_active_at"),
  createdBy: text("created_by"),
  createdAt: dateTime("created_at").notNull(),
  updatedAt: dateTime("updated_at").notNull(),
}, (table) => [index("user_branch_role_idx").on(table.branchCode, table.role)]);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: dateTime("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: dateTime("created_at").notNull(),
  updatedAt: dateTime("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (table) => [index("session_user_idx").on(table.userId)]);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: dateTime("access_token_expires_at"),
  refreshTokenExpiresAt: dateTime("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: dateTime("created_at").notNull(),
  updatedAt: dateTime("updated_at").notNull(),
}, (table) => [index("account_user_idx").on(table.userId)]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: dateTime("expires_at").notNull(),
  createdAt: dateTime("created_at"),
  updatedAt: dateTime("updated_at"),
});

export const whatsappContacts = pgTable("whatsapp_contacts", {
  accountNumber: text("account_number").notNull(),
  phone: text("phone").notNull(),
  branchCode: text("branch_code").notNull().default("8014"),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: dateTime("updated_at").notNull(),
}, (table) => [
  uniqueIndex("whatsapp_contacts_branch_account_unique").on(table.branchCode, table.accountNumber),
  index("whatsapp_contacts_branch_idx").on(table.branchCode),
]);

export const uploadRecords = pgTable("upload_records", {
  id: text("id").primaryKey(), sourceKey: text("source_key").notNull(), sourceName: text("source_name").notNull(),
  fileName: text("file_name").notNull(), format: text("format").notNull(), rowCount: integer("row_count").notNull().default(0),
  status: text("status").notNull().default("Berhasil"), branchCode: text("branch_code").notNull().default("8014"),
  uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }), createdAt: dateTime("created_at").notNull(),
}, (table) => [index("upload_records_branch_created_idx").on(table.branchCode, table.createdAt)]);

export const branchProfiles = pgTable("branch_profiles", {
  branchCode: text("branch_code").primaryKey(),
  branchName: text("branch_name").notNull().default(""),
  sourceUploadId: text("source_upload_id").references(() => uploadRecords.id, { onDelete: "set null" }),
  updatedAt: dateTime("updated_at").notNull(),
});

export const loanRecords = pgTable("loan_records", {
  id: text("id").primaryKey(), uploadId: text("upload_id").notNull().references(() => uploadRecords.id, { onDelete: "cascade" }),
  branchCode: text("branch_code").notNull(), sourceKey: text("source_key").notNull(), period: text("period").notNull(),
  cif: text("cif").notNull().default(""), loanType: text("loan_type").notNull().default(""), accountNumber: text("account_number").notNull(),
  debtorName: text("debtor_name").notNull(), nextPaymentDate: text("next_payment_date").notNull(), outstanding: money("outstanding").notNull().default(0),
  plafond: money("plafond").notNull().default(0), collectibility: text("collectibility").notNull(), restructureFlag: text("restructure_flag").notNull().default("N"),
  mantri: text("mantri").notNull(), pnPengelola: text("pn_pengelola").notNull(), description: text("description").notNull(),
  realizedDate: text("realized_date").notNull(), realizedAmount: money("realized_amount").notNull().default(0),
  principalArrears: money("principal_arrears").notNull().default(0), interestArrears: money("interest_arrears").notNull().default(0), createdAt: dateTime("created_at").notNull(),
}, (table) => [
  uniqueIndex("loan_records_branch_period_account_unique").on(table.branchCode, table.period, table.accountNumber),
  index("loan_records_branch_period_idx").on(table.branchCode, table.period), index("loan_records_branch_mantri_idx").on(table.branchCode, table.mantri),
  index("loan_records_branch_cif_idx").on(table.branchCode, table.cif),
  index("loan_records_branch_period_cif_idx").on(table.branchCode, table.period, table.cif),
  index("loan_records_branch_period_mantri_idx").on(table.branchCode, table.period, table.mantri),
  index("loan_records_branch_period_collectibility_idx").on(table.branchCode, table.period, table.collectibility),
  index("loan_records_branch_period_npd_idx").on(table.branchCode, table.period, table.nextPaymentDate),
]);

export const loanMantriAssignments = pgTable("loan_mantri_assignments", {
  id: text("id").primaryKey(),
  branchCode: text("branch_code").notNull(),
  accountNumber: text("account_number").notNull(),
  mantri: text("mantri").notNull(),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: dateTime("updated_at").notNull(),
}, (table) => [
  uniqueIndex("loan_mantri_assignments_branch_account_unique").on(table.branchCode, table.accountNumber),
  index("loan_mantri_assignments_branch_idx").on(table.branchCode),
]);

export const nominativeCkpnRecords = pgTable("nominative_ckpn_records", {
  id: text("id").primaryKey(), uploadId: text("upload_id").notNull().references(() => uploadRecords.id, { onDelete: "cascade" }), branchCode: text("branch_code").notNull(),
  period: text("period").notNull(), accountNumber: text("account_number").notNull(), debtorName: text("debtor_name").notNull().default(""),
  outstanding: money("outstanding").notNull().default(0), collectibility: text("collectibility").notNull().default(""), formedCkpn: money("formed_ckpn").notNull().default(0), createdAt: dateTime("created_at").notNull(),
}, (table) => [uniqueIndex("nominative_ckpn_branch_period_account_unique").on(table.branchCode, table.period, table.accountNumber), index("nominative_ckpn_branch_period_idx").on(table.branchCode, table.period)]);

export const missingLoanResolutions = pgTable("missing_loan_resolutions", {
  id: text("id").primaryKey(), branchCode: text("branch_code").notNull(), period: text("period").notNull(), accountNumber: text("account_number").notNull(),
  status: text("status").notNull(), updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }), updatedAt: dateTime("updated_at").notNull(),
}, (table) => [uniqueIndex("missing_loan_resolution_branch_period_account_unique").on(table.branchCode, table.period, table.accountNumber), index("missing_loan_resolution_branch_period_idx").on(table.branchCode, table.period)]);

export const ckpnForecasts = pgTable("ckpn_forecasts", {
  id: text("id").primaryKey(), branchCode: text("branch_code").notNull(), period: text("period").notNull(), accountNumber: text("account_number").notNull(),
  targetCollectibility: text("target_collectibility").notNull(), updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }), updatedAt: dateTime("updated_at").notNull(),
}, (table) => [uniqueIndex("ckpn_forecast_branch_period_account_unique").on(table.branchCode, table.period, table.accountNumber), index("ckpn_forecast_branch_period_idx").on(table.branchCode, table.period)]);

export const depositRecords = pgTable("deposit_records", {
  id: text("id").primaryKey(), uploadId: text("upload_id").notNull().references(() => uploadRecords.id, { onDelete: "cascade" }), branchCode: text("branch_code").notNull(),
  sourceKey: text("source_key").notNull().default("di319"), period: text("period").notNull(), cif: text("cif").notNull().default(""),
  loanAccountNumber: text("loan_account_number").notNull().default(""), debtorName: text("debtor_name").notNull().default(""), mantri: text("mantri").notNull().default(""),
  savingsAccount: text("savings_account").notNull().default(""), balance: money("balance").notNull().default(0), availableBalance: money("available_balance").notNull().default(0),
  blockedAtStart: money("blocked_at_start").notNull().default(0), currentBlocked: money("current_blocked").notNull().default(0),
  installmentFromBlocked: money("installment_from_blocked").notNull().default(0), mutationDate: text("mutation_date").notNull().default(""), status: text("status").notNull(), createdAt: dateTime("created_at").notNull(),
}, (table) => [
  uniqueIndex("deposit_records_branch_period_savings_unique").on(table.branchCode, table.period, table.cif, table.savingsAccount),
  index("deposit_records_branch_period_idx").on(table.branchCode, table.period),
  index("deposit_records_branch_period_cif_idx").on(table.branchCode, table.period, table.cif),
]);

export const quickCountResults = pgTable("quick_count_results", {
  id: text("id").primaryKey(),
  branchCode: text("branch_code").notNull(),
  period: text("period").notNull(),
  workDate: text("work_date").notNull(),
  accountNumber: text("account_number").notNull(),
  debtorName: text("debtor_name").notNull().default(""),
  quality: text("quality").notNull().default(""),
  billing: money("billing").notNull().default(0),
  actToday: money("act_today").notNull().default(0),
  remaining: money("remaining").notNull().default(0),
  address: text("address").notNull().default(""),
  forecastCollectibility: text("forecast_collectibility").notNull().default(""),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: dateTime("updated_at").notNull(),
}, (table) => [
  uniqueIndex("quick_count_branch_period_date_account_unique").on(table.branchCode, table.period, table.workDate, table.accountNumber),
  index("quick_count_branch_date_idx").on(table.branchCode, table.workDate),
  index("quick_count_branch_period_date_idx").on(table.branchCode, table.period, table.workDate),
]);

export const whatsappCampaigns = pgTable("whatsapp_campaigns", {
  id: text("id").primaryKey(), campaignType: text("campaign_type").notNull(), templateName: text("template_name").notNull(), mode: text("mode").notNull(), status: text("status").notNull(),
  recipientCount: integer("recipient_count").notNull().default(0), branchCode: text("branch_code").notNull().default("8014"), createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }), createdAt: dateTime("created_at").notNull(),
});

export const whatsappCampaignRecipients = pgTable("whatsapp_campaign_recipients", {
  id: text("id").primaryKey(), campaignId: text("campaign_id").notNull().references(() => whatsappCampaigns.id, { onDelete: "cascade" }), accountNumber: text("account_number").notNull(),
  name: text("name").notNull(), phone: text("phone").notNull(), status: text("status").notNull(), messageId: text("message_id"), error: text("error"), createdAt: dateTime("created_at").notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(), actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }), action: text("action").notNull(), entity: text("entity").notNull(),
  entityId: text("entity_id"), detail: text("detail"), branchCode: text("branch_code").notNull().default("8014"), createdAt: dateTime("created_at").notNull(),
}, (table) => [index("audit_logs_branch_created_idx").on(table.branchCode, table.createdAt)]);

export const warningLetters = pgTable("warning_letters", {
  id: text("id").primaryKey(), branchCode: text("branch_code").notNull(), period: text("period").notNull(), accountNumber: text("account_number").notNull(), debtorName: text("debtor_name").notNull(),
  level: text("level").notNull(), letterNumber: text("letter_number").notNull(), issuedAt: text("issued_at").notNull(), dueDate: text("due_date").notNull(), recipientAddress: text("recipient_address").notNull().default(""),
  penalty: money("penalty").notNull().default(0), signerName: text("signer_name").notNull().default(""), signerTitle: text("signer_title").notNull().default("Kepala Unit"), status: text("status").notNull().default("Dibuat"),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }), createdAt: dateTime("created_at").notNull(),
}, (table) => [uniqueIndex("warning_letters_branch_period_account_level_unique").on(table.branchCode, table.period, table.accountNumber, table.level), index("warning_letters_branch_period_idx").on(table.branchCode, table.period)]);

export const covenanceRecords = pgTable("covenance_records", {
  id: text("id").primaryKey(), branchCode: text("branch_code").notNull(), period: text("period").notNull(), accountNumber: text("account_number").notNull(), debtorName: text("debtor_name").notNull().default(""),
  realizedDate: text("realized_date").notNull(), sphNumber: text("sph_number").notNull().default(""), creditApplicationNumber: text("credit_application_number").notNull().default(""),
  ktpNumber: text("ktp_number").notNull().default(""), kkNumber: text("kk_number").notNull().default(""), skuNibNumber: text("sku_nib_number").notNull().default(""), slikOjk: text("slik_ojk").notNull().default(""),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }), updatedAt: dateTime("updated_at").notNull(),
}, (table) => [uniqueIndex("covenance_branch_account_realized_unique").on(table.branchCode, table.accountNumber, table.realizedDate), index("covenance_branch_period_idx").on(table.branchCode, table.period)]);

export const brimenCustomers = pgTable("brimen_customers", {
  id: text("id").primaryKey(), accountNumber: text("account_number").notNull(), name: text("name").notNull(), plafond: money("plafond").notNull().default(0),
  realizationDate: text("realization_date").notNull().default(""), address: text("address").notNull().default(""), mantri: text("mantri").notNull().default(""),
  brimenBerkas: text("brimen_berkas").notNull().default(""), brimenJaminan: text("brimen_jaminan").notNull().default(""), guarantee: text("guarantee").notNull().default(""),
  status: text("status").notNull().default("Disimpan"), branchCode: text("branch_code").notNull(), createdAt: dateTime("created_at").notNull(), updatedAt: dateTime("updated_at").notNull(),
}, (table) => [uniqueIndex("brimen_customers_branch_account_unique").on(table.branchCode, table.accountNumber), index("brimen_customers_branch_status_idx").on(table.branchCode, table.status)]);

export const brimenFileLoans = pgTable("brimen_file_loans", {
  id: text("id").primaryKey(), customerId: text("customer_id").notNull().references(() => brimenCustomers.id, { onDelete: "cascade" }), borrowerName: text("borrower_name").notNull(),
  borrowerUsername: text("borrower_username").notNull(), loanDate: text("loan_date").notNull(), returnedDate: text("returned_date"), status: text("status").notNull().default("Pengajuan Pinjam Berkas"),
  purpose: text("purpose").notNull().default(""), handoverPhoto: text("handover_photo").notNull().default(""), handoverBy: text("handover_by").notNull().default(""),
  handoverAt: text("handover_at"), receivedAt: text("received_at"), returnReason: text("return_reason").notNull().default(""), returnPhoto: text("return_photo").notNull().default(""),
  returnRequestedAt: text("return_requested_at"), returnConfirmedBy: text("return_confirmed_by").notNull().default(""), createdAt: dateTime("created_at").notNull(), updatedAt: dateTime("updated_at").notNull(),
}, (table) => [index("brimen_file_loans_customer_status_idx").on(table.customerId, table.status)]);

export const brimenFileLoanLogs = pgTable("brimen_file_loan_logs", {
  id: text("id").primaryKey(), loanId: text("loan_id").notNull().references(() => brimenFileLoans.id, { onDelete: "cascade" }), actor: text("actor").notNull(), message: text("message").notNull(), createdAt: dateTime("created_at").notNull(),
}, (table) => [index("brimen_file_loan_logs_loan_idx").on(table.loanId)]);

export const schema = { user, session, account, verification, whatsappContacts, uploadRecords, branchProfiles, loanRecords, loanMantriAssignments, nominativeCkpnRecords, missingLoanResolutions, ckpnForecasts, depositRecords, quickCountResults, whatsappCampaigns, whatsappCampaignRecipients, warningLetters, covenanceRecords, auditLogs, brimenCustomers, brimenFileLoans, brimenFileLoanLogs };
