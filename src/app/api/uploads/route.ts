import path from "path";
import fs from "fs/promises";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, branchProfiles, brimenCustomers, depositRecords, loanMantriAssignments, loanRecords, nominativeCkpnRecords, uploadRecords } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";
import { upsertImportedBrimenCustomers } from "@/lib/brimen-db";
import { extractBranchIdentity, inferPeriod, mapBrimenRows, mapDepositRows, mapLoanRows, mapNominativeCkpnRows, parseTabularFile } from "@/lib/import-data";
import { hasLoanMantri } from "@/lib/loan-mantri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedExtensions: Record<string, string[]> = {
  "lw321-terbaru": [".csv"],
  lw325: [".csv"],
  "lw321-bulan-lalu": [".csv"],
  "lw321-tahun-lalu": [".csv"],
  "lw321-dua-bulan": [".csv"],
  brimen: [".csv", ".xlsx", ".xls"],
  "nominatif-rekening": [".csv"],
  di319: [".csv", ".xlsx", ".xls"],
  almafact: [".png", ".pdf"],
  "branch-pl": [".csv", ".xlsx", ".xls"],
  "kpi-rka": [".xlsx", ".xls"],
};

export async function GET(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;
  if (authResult.session.user.role !== "Admin") {
    return NextResponse.json({ ok: false, message: "File upload hanya dapat dilihat oleh Admin unit kerja." }, { status: 403 });
  }
  const branchCode = authResult.session.user.branchCode ?? "8014";
  const rows = await db.select().from(uploadRecords).where(eq(uploadRecords.branchCode, branchCode)).orderBy(desc(uploadRecords.createdAt)).limit(100);
  return NextResponse.json({ ok: true, data: rows });
}

export async function POST(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;
  if (authResult.session.user.role !== "Admin") {
    return NextResponse.json({ ok: false, message: "Upload dan penggantian data hanya dapat dilakukan oleh Admin unit kerja." }, { status: 403 });
  }
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
  let nominativeCkpnImport: ReturnType<typeof mapNominativeCkpnRows> | undefined;
  let genericCsvImport: { rows: Record<string, unknown>[]; rejected: number; duplicates: number; issues: string[] } | undefined;
  let uploadedBranch = { code: "", name: "" };
  let period: string | undefined;
  try {
    if (isLoanSnapshot) {
      const rawRows = parseTabularFile(file.name, buffer);
      uploadedBranch = extractBranchIdentity(rawRows);
      if (uploadedBranch.code && uploadedBranch.code !== branchCode) {
        throw new Error(`Kode uker pada file (${uploadedBranch.code}) tidak sesuai dengan branch login (${branchCode}).`);
      }
      period = inferPeriod(sourceKey, file.name, rawRows);
      loanImport = mapLoanRows(rawRows, period);
    } else if (sourceKey === "lw325") {
      const rawRows = parseTabularFile(file.name, buffer);
      uploadedBranch = extractBranchIdentity(rawRows);
      if (uploadedBranch.code && uploadedBranch.code !== branchCode) {
        throw new Error(`Kode uker pada file (${uploadedBranch.code}) tidak sesuai dengan branch login (${branchCode}).`);
      }
      genericCsvImport = { rows: rawRows, rejected: 0, duplicates: 0, issues: [] };
    } else if (sourceKey === "di319") {
      const rawRows = parseTabularFile(file.name, buffer);
      period = inferPeriod(sourceKey, file.name, rawRows);
      depositImport = mapDepositRows(rawRows, period);
    } else if (sourceKey === "brimen") {
      brimenImport = mapBrimenRows(parseTabularFile(file.name, buffer));
    } else if (sourceKey === "nominatif-rekening") {
      const rawRows = parseTabularFile(file.name, buffer);
      period = inferPeriod(sourceKey, file.name, rawRows);
      nominativeCkpnImport = mapNominativeCkpnRows(rawRows);
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
  const imported = loanImport ?? depositImport ?? brimenImport ?? nominativeCkpnImport ?? genericCsvImport;
  const existingBrimenRows = loanImport && sourceKey === "lw321-terbaru"
    ? await db.select().from(brimenCustomers).where(eq(brimenCustomers.branchCode, branchCode))
    : [];
  const latestLoanByAccount = new Map(
    (loanImport?.rows ?? []).map((row) => [row.accountNumber.replace(/\D/g, ""), row]),
  );
  const synchronizedBrimenRows = existingBrimenRows.flatMap((customer) => {
    const credit = latestLoanByAccount.get(customer.accountNumber.replace(/\D/g, ""));
    if (!credit) return [];
    return [{
      ...customer,
      name: credit.debtorName || customer.name,
      plafond: credit.plafond || customer.plafond,
      realizationDate: credit.realizedDate || customer.realizationDate,
      mantri: credit.mantri || credit.pnPengelola || customer.mantri,
      updatedAt: now,
    }];
  });
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
    if (brimenImport) await upsertImportedBrimenCustomers(brimenImport.rows, branchCode);
    await db.transaction(async (tx) => {
      await tx.insert(uploadRecords).values(record);
      if (isLoanSnapshot && uploadedBranch.name) {
        await tx.insert(branchProfiles).values({
          branchCode,
          branchName: uploadedBranch.name,
          sourceUploadId: record.id,
          updatedAt: now,
        }).onConflictDoUpdate({
          target: branchProfiles.branchCode,
          set: { branchName: uploadedBranch.name, sourceUploadId: record.id, updatedAt: now },
        });
      }
      if (loanImport && period) {
        await tx.delete(loanRecords).where(and(eq(loanRecords.branchCode, branchCode), eq(loanRecords.period, period)));
        for (let index = 0; index < loanImport.rows.length; index += 40) {
          await tx.insert(loanRecords).values(loanImport.rows.slice(index, index + 40).map((row) => ({
            id: crypto.randomUUID(), uploadId: record.id, branchCode, sourceKey, period,
            cif: row.cif, loanType: row.loanType, accountNumber: row.accountNumber, debtorName: row.debtorName, nextPaymentDate: row.nextPaymentDate,
            outstanding: row.outstanding, plafond: row.plafond, collectibility: row.collectibility,
            restructureFlag: row.restructureFlag, mantri: row.mantri, pnPengelola: row.pnPengelola,
            description: row.description, realizedDate: row.realizedDate, realizedAmount: row.realizedAmount,
            principalArrears: row.principalArrears, interestArrears: row.interestArrears, createdAt: now,
          })));
        }
        if (sourceKey === "lw321-terbaru") {
          const accountsWithUploadedMantri = loanImport.rows.filter((row) => hasLoanMantri(row.mantri)).map((row) => row.accountNumber.replace(/\D/g, ""));
          for (let index = 0; index < accountsWithUploadedMantri.length; index += 200) {
            const accountBatch = accountsWithUploadedMantri.slice(index, index + 200);
            if (!accountBatch.length) continue;
            await tx.delete(loanMantriAssignments).where(and(
              eq(loanMantriAssignments.branchCode, branchCode),
              inArray(loanMantriAssignments.accountNumber, accountBatch),
            ));
          }
        }
        if (sourceKey === "lw321-terbaru") {
          for (let index = 0; index < synchronizedBrimenRows.length; index += 200) {
            const batch = synchronizedBrimenRows.slice(index, index + 200);
            if (!batch.length) continue;
            await tx.insert(brimenCustomers).values(batch).onConflictDoUpdate({
              target: [brimenCustomers.branchCode, brimenCustomers.accountNumber],
              set: {
                name: sql`excluded.name`,
                plafond: sql`excluded.plafond`,
                realizationDate: sql`excluded.realization_date`,
                mantri: sql`excluded.mantri`,
                updatedAt: now,
              },
            });
          }
        }
      }
      if (depositImport && period) {
        await tx.delete(depositRecords).where(and(eq(depositRecords.branchCode, branchCode), eq(depositRecords.period, period)));
        for (let index = 0; index < depositImport.rows.length; index += 40) {
          await tx.insert(depositRecords).values(depositImport.rows.slice(index, index + 40).map((row) => ({
            id: crypto.randomUUID(), uploadId: record.id, branchCode, sourceKey, period,
            cif: row.cif, loanAccountNumber: row.loanAccountNumber, debtorName: row.debtorName, mantri: row.mantri,
            savingsAccount: row.savingsAccount, balance: row.balance, availableBalance: row.availableBalance,
            blockedAtStart: row.blockedAtStart, currentBlocked: row.currentBlocked,
            installmentFromBlocked: row.installmentFromBlocked, mutationDate: row.mutationDate, status: row.status, createdAt: now,
          })));
        }
      }
      if (nominativeCkpnImport && period) {
        await tx.delete(nominativeCkpnRecords).where(and(eq(nominativeCkpnRecords.branchCode, branchCode), eq(nominativeCkpnRecords.period, period)));
        for (let index = 0; index < nominativeCkpnImport.rows.length; index += 40) {
          await tx.insert(nominativeCkpnRecords).values(nominativeCkpnImport.rows.slice(index, index + 40).map((row) => ({
            id: crypto.randomUUID(), uploadId: record.id, branchCode, period,
            accountNumber: row.accountNumber, debtorName: row.debtorName, outstanding: row.outstanding,
            collectibility: row.collectibility, formedCkpn: row.formedCkpn, createdAt: now,
          })));
        }
      }
      await tx.insert(auditLogs).values({
        id: crypto.randomUUID(), actorId: authResult.session.user.id, action: "UPLOAD_DATA", entity: "upload_record", entityId: record.id,
        detail: imported ? `${sourceName} | ${file.name}${period ? ` | periode ${period}` : ""} | ${imported.rows.length} diterima | ${imported.rejected} ditolak${sourceKey === "lw321-terbaru" ? ` | ${synchronizedBrimenRows.length} data BRIMEN disinkronkan tanpa mengubah arsip` : ""}` : `${sourceName} | ${file.name}`,
        branchCode, createdAt: now,
      });
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
    import: imported ? { period, accepted: imported.rows.length, rejected: imported.rejected, duplicates: imported.duplicates, issues: imported.issues, brimenSynchronized: synchronizedBrimenRows.length } : undefined,
  }, { status: 201 });
}
