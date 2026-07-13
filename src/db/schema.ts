import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("Mantri"),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  branchCode: text("branch_code").notNull().default("8014"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  lastActiveAt: integer("last_active_at", { mode: "timestamp" }),
  createdBy: text("created_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const whatsappContacts = sqliteTable("whatsapp_contacts", {
  accountNumber: text("account_number").primaryKey(),
  phone: text("phone").notNull(),
  branchCode: text("branch_code").notNull().default("8014"),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const uploadRecords = sqliteTable("upload_records", {
  id: text("id").primaryKey(),
  sourceKey: text("source_key").notNull(),
  sourceName: text("source_name").notNull(),
  fileName: text("file_name").notNull(),
  format: text("format").notNull(),
  rowCount: integer("row_count").notNull().default(0),
  status: text("status").notNull().default("Berhasil"),
  branchCode: text("branch_code").notNull().default("8014"),
  uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const whatsappCampaigns = sqliteTable("whatsapp_campaigns", {
  id: text("id").primaryKey(),
  campaignType: text("campaign_type").notNull(),
  templateName: text("template_name").notNull(),
  mode: text("mode").notNull(),
  status: text("status").notNull(),
  recipientCount: integer("recipient_count").notNull().default(0),
  branchCode: text("branch_code").notNull().default("8014"),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const whatsappCampaignRecipients = sqliteTable("whatsapp_campaign_recipients", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").notNull().references(() => whatsappCampaigns.id, { onDelete: "cascade" }),
  accountNumber: text("account_number").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull(),
  messageId: text("message_id"),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  detail: text("detail"),
  branchCode: text("branch_code").notNull().default("8014"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const schema = {
  user,
  session,
  account,
  verification,
  whatsappContacts,
  uploadRecords,
  whatsappCampaigns,
  whatsappCampaignRecipients,
  auditLogs,
};
