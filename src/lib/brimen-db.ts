import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

export type BrimenCustomerStatus = "Disimpan" | "Dipinjam" | "Diambil" | "Lunas";

export type BrimenCustomerRow = {
  id: string;
  account_number: string;
  name: string;
  plafond: number;
  realization_date: string;
  address: string;
  mantri: string;
  brimen_berkas: string;
  brimen_jaminan: string;
  guarantee: string;
  status: BrimenCustomerStatus;
  branch_code: string;
  created_at?: string;
  updated_at: string;
};

export type BrimenLoanRow = {
  id: string;
  customer_id: string;
  borrower_name: string;
  borrower_username: string;
  loan_date: string;
  returned_date: string | null;
  status: "Dipinjam" | "Sudah Dikembalikan";
  purpose: string;
  created_at: string;
  updated_at: string;
  account_number?: string;
  customer_name?: string;
  plafond?: number;
  mantri?: string;
  brimen_berkas?: string;
  brimen_jaminan?: string;
  guarantee?: string;
};

export function nowIso() {
  return new Date().toISOString();
}

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
}

export function parsePlafond(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

export function getBrimenDbPath() {
  const brimenRoot = process.env.BRIMEN_ROOT ?? path.resolve(process.cwd(), "..", "DATA BRIMEN");
  return process.env.BRIMEN_DB_PATH ?? path.join(brimenRoot, "data", "brimen.db");
}

export function openBrimenDb(readonly = false) {
  const dbPath = getBrimenDbPath();
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database BRIMEN tidak ditemukan: ${dbPath}`);
  }
  return new Database(dbPath, { readonly, fileMustExist: true });
}

export function normalizeCustomer(row: BrimenCustomerRow) {
  return {
    id: row.id,
    accountNumber: row.account_number,
    name: row.name,
    plafond: row.plafond,
    realizationDate: row.realization_date,
    address: row.address,
    mantri: row.mantri,
    brimenBerkas: row.brimen_berkas,
    brimenJaminan: row.brimen_jaminan,
    guarantee: row.guarantee,
    status: row.status,
    branchCode: row.branch_code,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at,
  };
}

export function normalizeLoan(row: BrimenLoanRow) {
  return {
    id: row.id,
    customerId: row.customer_id,
    borrowerName: row.borrower_name,
    borrowerUsername: row.borrower_username,
    loanDate: row.loan_date,
    returnedDate: row.returned_date,
    status: row.status,
    purpose: row.purpose,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    accountNumber: row.account_number,
    customerName: row.customer_name,
    plafond: row.plafond,
    mantri: row.mantri,
    brimenBerkas: row.brimen_berkas,
    brimenJaminan: row.brimen_jaminan,
    guarantee: row.guarantee,
  };
}
