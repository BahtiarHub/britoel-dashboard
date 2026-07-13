import path from "path";
import fs from "fs/promises";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, depositRecords, loanRecords, uploadRecords } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import { upsertImportedBrimenCustomers } from "@/lib/brimen-db";
import { inferPeriod, mapBrimenRows, mapDepositRows, mapLoanRows, parseTabularFile } from "@/lib/import-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedExtensions: Record<string, string[]> = {
  "lw321-terbaru": [".csv"],
  "lw321-bulan-lalu": [".csv"],
  "lw321-tahun-lalu": [".csv"],
  "lw321-dua-bulan": [".csv"],
  brimen: [".csv", ".xlsx", ".xls"],
  "nominatif-rekening": [".csv"],
  di319: [".csv"],
  almafact: [".png", ".pdf"],
  "branch-pl": [".xlsx", ".xls"],
  "kpi-rka": [".xlsx", ".xls"],
};

export async function GET(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;
  const branchCode = authResult.session.user.branchCode ?? "8014";
  const rows = await db.select().from(uploadRecords).where(eq(uploadRecords.branchCode, branchCode)).orderBy(desc(uploadRecords.createdAt)).limit(100);
  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;
  const branchCode = authResult.session.user.branchCode ?? "8014";
  const formData = await request.formData();
  const file = formData.get("file");
  const sourceKey = String(formData.get("sourceKey") ?? "");
  const sourceName = String(formData.get("sourceName") ?? sourceKey);
  const reportedRowCount = Number(formData.get("rowCount") ?? 0) || 0;
  if (!(file instanceof File) || !allowedExtensions[sourceKey]) {
    return NextResponse.json({ ok: false, message: "File atau sumber upload tidak valid." }, { status: 400 });
  }
  const extension = path.extname(file.name).toLowerCase();
  if (!allowedExtensions[sourceKey].includes(extension)) {
    return NextResponse.json({ ok: false, message: `Format ${extension || "file"} tidak diizinkan untuk ${sourceName}.` }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ ok: false, message: "Ukuran file maksimal 25 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const isLoanSnapshot = sourceKey.startsWith("lw321-");
  let loanImport: ReturnType<typeof mapLoanRows> | undefined;
  let depositImport: ReturnType<typeof mapDepositRows> | undefined;
  let brimenImport: ReturnType<typeof mapBrimenRows> | undefined;
  let period: string | undefined;
  try {
    if (isLoanSnapshot) {
      const rawRows = parseTabularFile(file.name, buffer);
      period = inferPeriod(sourceKey, file.name, rawRows);
      loanImport = mapLoanRows(rawRows, period);
    } else if (sourceKey === "di319") {
      const rawRows = parseTabularFile(file.name, buffer);
      period = inferPeriod(sourceKey, file.name, rawRows);
      depositImport = mapDepositRows(rawRows, period);
    } else if (sourceKey === "brimen") {
      brimenImport = mapBrimenRows(parseTabularFile(file.name, buffer));
    }
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "File gagal diproses." }, { status: 400 });
  }

  const uploadRoot = path.join(process.cwd(), "data", "uploads", branchCode, sourceKey);
  await fs.mkdir(uploadRoot, { recursive: true });
  const safeBaseName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${Date.now()}-${safeBaseName}`;
  const temporaryPath = path.join(uploadRoot, `.pending-${storedName}`);
  await fs.writeFile(temporaryPath, buffer);

  const now = new Date();
  const imported = loanImport ?? depositImport ?? brimenImport;
  const record = {
    id: crypto.randomUUID(),
    sourceKey,
    sourceName,
    fileName: file.name,
    format: extension.slice(1).toUpperCase(),
    rowCount: imported?.rows.length ?? reportedRowCount,
    status: "Berhasil",
    branchCode,
    uploadedBy: authResult.session.user.id,
    createdAt: now,
  };
  try {
    if (brimenImport) upsertImportedBrimenCustomers(brimenImport.rows, branchCode);
    db.transaction((tx) => {
      tx.insert(uploadRecords).values(record).run();
      if (loanImport && period) {
        tx.delete(loanRecords).where(and(eq(loanRecords.branchCode, branchCode), eq(loanRecords.period, period))).run();
        for (let index = 0; index < loanImport.rows.length; index += 40) {
          tx.insert(loanRecords).values(loanImport.rows.slice(index, index + 40).map((row) => ({
            id: crypto.randomUUID(), uploadId: record.id, branchCode, sourceKey, period,
            cif: row.cif, accountNumber: row.accountNumber, debtorName: row.debtorName, nextPaymentDate: row.nextPaymentDate,
            outstanding: row.outstanding, plafond: row.plafond, collectibility: row.collectibility,
            restructureFlag: row.restructureFlag, mantri: row.mantri, pnPengelola: row.pnPengelola,
            description: row.description, realizedDate: row.realizedDate, realizedAmount: row.realizedAmount, createdAt: now,
          }))).run();
        }
      }
      if (depositImport && period) {
        tx.delete(depositRecords).where(and(eq(depositRecords.branchCode, branchCode), eq(depositRecords.period, period))).run();
        for (let index = 0; index < depositImport.rows.length; index += 40) {
          tx.insert(depositRecords).values(depositImport.rows.slice(index, index + 40).map((row) => ({
            id: crypto.randomUUID(), uploadId: record.id, branchCode, sourceKey, period,
            cif: row.cif, loanAccountNumber: row.loanAccountNumber, debtorName: row.debtorName, mantri: row.mantri,
            savingsAccount: row.savingsAccount, blockedAtStart: row.blockedAtStart, currentBlocked: row.currentBlocked,
            installmentFromBlocked: row.installmentFromBlocked, mutationDate: row.mutationDate, status: row.status, createdAt: now,
          }))).run();
        }
      }
      tx.insert(auditLogs).values({
        id: crypto.randomUUID(), actorId: authResult.session.user.id, action: "UPLOAD_DATA", entity: "upload_record", entityId: record.id,
        detail: imported ? `${sourceName} | ${file.name}${period ? ` | periode ${period}` : ""} | ${imported.rows.length} diterima | ${imported.rejected} ditolak` : `${sourceName} | ${file.name}`,
        branchCode, createdAt: now,
      }).run();
    });
  } catch (error) {
    await fs.unlink(temporaryPath).catch(() => undefined);
    return NextResponse.json({ ok: false, message: "Data gagal disimpan ke database.", detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }

  const previousFiles = (await fs.readdir(uploadRoot)).filter((item) => item !== `.pending-${storedName}`);
  await Promise.all(previousFiles.map((item) => fs.unlink(path.join(uploadRoot, item))));
  await fs.rename(temporaryPath, path.join(uploadRoot, storedName));
  return NextResponse.json({
    ok: true,
    data: record,
    import: imported ? { period, accepted: imported.rows.length, rejected: imported.rejected, duplicates: imported.duplicates, issues: imported.issues } : undefined,
  }, { status: 201 });
}
