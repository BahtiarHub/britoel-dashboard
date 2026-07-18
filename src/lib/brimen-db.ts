import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { brimenCustomers } from "@/db/schema";
import type { ImportedBrimenRow } from "@/lib/import-data";

export type BrimenCustomerStatus = "Disimpan" | "Dipinjam" | "Diambil" | "Lunas";
export type BrimenCustomerRow = typeof brimenCustomers.$inferSelect;

export type BrimenLoanRow = {
  id: string;
  customerId: string;
  borrowerName: string;
  borrowerUsername: string;
  loanDate: string;
  returnedDate: string | null;
  status: "Pengajuan Pinjam Berkas" | "Menunggu Konfirmasi Mantri" | "Dipinjam" | "Pengajuan Pengembalian" | "Sudah Dikembalikan";
  purpose: string;
  handoverPhoto: string;
  handoverBy: string;
  handoverAt: string | null;
  receivedAt: string | null;
  returnReason: string;
  returnPhoto: string;
  returnRequestedAt: string | null;
  returnConfirmedBy: string;
  createdAt: Date;
  updatedAt: Date;
  accountNumber?: string;
  customerName?: string;
  plafond?: number;
  mantri?: string;
  brimenBerkas?: string;
  brimenJaminan?: string;
  guarantee?: string;
};

export function nowIso() {
  return new Date().toISOString();
}

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
}

export function parsePlafond(value: unknown) {
  if (typeof value === "number") return Math.round(value);
  if (typeof value !== "string") return 0;
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

export function normalizeCustomer(row: BrimenCustomerRow) {
  return {
    id: row.id,
    accountNumber: row.accountNumber,
    name: row.name,
    plafond: row.plafond,
    realizationDate: row.realizationDate,
    address: row.address,
    mantri: row.mantri,
    brimenBerkas: row.brimenBerkas,
    brimenJaminan: row.brimenJaminan,
    guarantee: row.guarantee,
    status: row.status as BrimenCustomerStatus,
    branchCode: row.branchCode,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function normalizeLoan(row: BrimenLoanRow) {
  return {
    id: row.id,
    customerId: row.customerId,
    borrowerName: row.borrowerName,
    borrowerUsername: row.borrowerUsername,
    loanDate: row.loanDate,
    returnedDate: row.returnedDate,
    status: row.status,
    purpose: row.purpose,
    handoverPhoto: row.handoverPhoto,
    handoverBy: row.handoverBy,
    handoverAt: row.handoverAt,
    receivedAt: row.receivedAt,
    returnReason: row.returnReason,
    returnPhoto: row.returnPhoto,
    returnRequestedAt: row.returnRequestedAt,
    returnConfirmedBy: row.returnConfirmedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    accountNumber: row.accountNumber,
    customerName: row.customerName,
    plafond: row.plafond,
    mantri: row.mantri,
    brimenBerkas: row.brimenBerkas,
    brimenJaminan: row.brimenJaminan,
    guarantee: row.guarantee,
  };
}

export async function upsertImportedBrimenCustomers(rows: ImportedBrimenRow[], branchCode: string) {
  const existingRows = await db.select().from(brimenCustomers).where(eq(brimenCustomers.branchCode, branchCode));
  const existingByAccount = new Map(existingRows.map((row) => [row.accountNumber.replace(/\D/g, ""), row]));
  const now = new Date();
  const values = rows.map((item) => {
    const existing = existingByAccount.get(item.accountNumber.replace(/\D/g, ""));
    return {
      id: existing?.id ?? newId("cus"),
      accountNumber: item.accountNumber.replace(/\D/g, ""),
      name: item.name || existing?.name || "",
      plafond: item.plafond || existing?.plafond || 0,
      realizationDate: item.realizationDate || existing?.realizationDate || "",
      address: item.address || existing?.address || "",
      mantri: item.mantri || existing?.mantri || "",
      brimenBerkas: item.brimenBerkas || existing?.brimenBerkas || "",
      brimenJaminan: item.brimenJaminan || existing?.brimenJaminan || "",
      guarantee: item.guarantee || existing?.guarantee || "",
      // Status workflow dan isian manual yang sudah tersimpan tidak boleh direset oleh file impor.
      status: existing?.status ?? item.status,
      branchCode,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
  });

  await db.transaction(async (tx) => {
    for (let index = 0; index < values.length; index += 200) {
      const batch = values.slice(index, index + 200);
      if (!batch.length) continue;
      await tx.insert(brimenCustomers).values(batch).onConflictDoUpdate({
        target: [brimenCustomers.branchCode, brimenCustomers.accountNumber],
        set: {
          name: sql`excluded.name`,
          plafond: sql`excluded.plafond`,
          realizationDate: sql`excluded.realization_date`,
          address: sql`excluded.address`,
          mantri: sql`excluded.mantri`,
          brimenBerkas: sql`excluded.brimen_berkas`,
          brimenJaminan: sql`excluded.brimen_jaminan`,
          guarantee: sql`excluded.guarantee`,
          status: sql`excluded.status`,
          updatedAt: now,
        },
      });
    }
  });
  return { inserted: values.filter((item) => !existingByAccount.has(item.accountNumber)).length, updated: values.filter((item) => existingByAccount.has(item.accountNumber)).length };
}
