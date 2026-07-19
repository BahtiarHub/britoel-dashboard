import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, brimenCustomers, covenanceRecords, loanRecords } from "@/db/schema";
import { newId, normalizeCustomer, parsePlafond } from "@/lib/brimen-db";
import { hasBrimenGuarantee } from "@/lib/brimen-guarantee";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  try {
    const branchScoped = guard.session.user.role !== "SuperAdmin";
    const activeBranchCode = guard.session.user.branchCode ?? "8014";
    const [rows, creditRows] = await Promise.all([
      branchScoped
        ? db.select().from(brimenCustomers).where(eq(brimenCustomers.branchCode, activeBranchCode)).orderBy(desc(brimenCustomers.updatedAt))
        : db.select().from(brimenCustomers).orderBy(desc(brimenCustomers.updatedAt)),
      branchScoped
        ? db.select().from(loanRecords).where(and(eq(loanRecords.branchCode, activeBranchCode), eq(loanRecords.sourceKey, "lw321-terbaru"))).orderBy(desc(loanRecords.period))
        : db.select().from(loanRecords).where(eq(loanRecords.sourceKey, "lw321-terbaru")).orderBy(desc(loanRecords.period)),
    ]);
    const latestPeriodByBranch = new Map<string, string>();
    creditRows.forEach((row) => { if (!latestPeriodByBranch.has(row.branchCode)) latestPeriodByBranch.set(row.branchCode, row.period); });
    const latestCreditRows = creditRows.filter((row) => row.period === latestPeriodByBranch.get(row.branchCode));
    const normalizedBrimenRows = rows.map(normalizeCustomer).map((customer) => ({ ...customer, isLatestLw321: false, persistedInBrimen: true, dataSource: "BRIMEN" as const }));
    const brimenByAccount = new Map(normalizedBrimenRows.map((customer) => [`${customer.branchCode}:${customer.accountNumber.replace(/\D/g, "")}`, customer]));
    const matchedBrimenKeys = new Set<string>();
    let synchronizedCount = 0;
    const latestData = latestCreditRows.map((credit) => {
      const accountNumber = credit.accountNumber.replace(/\D/g, "");
      const key = `${credit.branchCode}:${accountNumber}`;
      const customer = brimenByAccount.get(key);
      if (customer) {
        matchedBrimenKeys.add(key);
        synchronizedCount += 1;
        return { ...customer, name: credit.debtorName || customer.name, plafond: credit.plafond || customer.plafond, realizationDate: credit.realizedDate || customer.realizationDate, mantri: credit.mantri || customer.mantri, isLatestLw321: true, persistedInBrimen: true, dataSource: "Gabungan" as const };
      }
      return {
        id: `lw321:${credit.branchCode}:${accountNumber}`, accountNumber, name: credit.debtorName, plafond: credit.plafond,
        realizationDate: credit.realizedDate, address: "", mantri: credit.mantri, brimenBerkas: "", brimenJaminan: "", guarantee: "",
        status: "Disimpan" as const, branchCode: credit.branchCode, createdAt: credit.createdAt.toISOString(), updatedAt: credit.createdAt.toISOString(),
        isLatestLw321: true, persistedInBrimen: false, dataSource: "LW321" as const,
      };
    });
    const brimenOnlyRows = normalizedBrimenRows.filter((customer) => !matchedBrimenKeys.has(`${customer.branchCode}:${customer.accountNumber.replace(/\D/g, "")}`));
    const data = [...latestData, ...brimenOnlyRows];
    const withGuarantee = data.filter(hasBrimenGuarantee).length;
    const withoutArchive = data.filter((row) => !row.brimenBerkas).length;
    const borrowed = data.filter((row) => row.status === "Dipinjam").length;
    const statusCounts = new Map<string, number>();
    data.forEach((row) => {
      const status = row.isLatestLw321 && !row.brimenBerkas ? "Belum Disimpan" : row.status;
      statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    });
    return NextResponse.json({
      ok: true,
      data,
      summary: { total: data.length, brimenTotal: normalizedBrimenRows.length, withGuarantee, withoutGuarantee: data.length - withGuarantee, withoutArchive, borrowed, synchronizedWithLw321: synchronizedCount, latestLw321: latestData.length, brimenOnly: brimenOnlyRows.length, byStatus: [...statusCounts].map(([status, count]) => ({ status, count })) },
      source: "PostgreSQL / brimen_customers",
    });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Gagal membaca data BRIMEN PostgreSQL.", detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  try {
    const body = await request.json();
    const accountNumber = String(body.accountNumber ?? "").replace(/\D/g, "");
    const name = String(body.name ?? "").trim();
    if (!/^\d{15}$/.test(accountNumber)) return NextResponse.json({ ok: false, message: "No rekening wajib 15 angka." }, { status: 400 });
    if (!name) return NextResponse.json({ ok: false, message: "Nama nasabah wajib diisi." }, { status: 400 });

    const now = new Date();
    const branchCode = guard.session.user.branchCode ?? "8014";
    const row = {
      id: newId("cus"), accountNumber, name, plafond: parsePlafond(body.plafond), realizationDate: String(body.realizationDate ?? ""),
      address: String(body.address ?? ""), mantri: String(body.mantri ?? ""), brimenBerkas: String(body.brimenBerkas ?? ""),
      brimenJaminan: String(body.brimenJaminan ?? ""), guarantee: String(body.guarantee ?? ""), status: String(body.status ?? "Disimpan"),
      branchCode, createdAt: now, updatedAt: now,
    };
    const covenantFields = {
      sphNumber: String(body.sphNumber ?? "").trim(), creditApplicationNumber: String(body.creditApplicationNumber ?? "").trim(),
      ktpNumber: String(body.ktpNumber ?? "").replace(/\s/g, ""), kkNumber: String(body.kkNumber ?? "").replace(/\s/g, ""),
      skuNibNumber: String(body.skuNibNumber ?? "").trim(), slikOjk: String(body.slikOjk ?? "").replace(/\s/g, ""),
    };
    const hasCovenanceData = Object.values(covenantFields).some(Boolean);
    if (hasCovenanceData && !/^\d{4}-\d{2}-\d{2}$/.test(row.realizationDate)) {
      return NextResponse.json({ ok: false, message: "Tanggal realisasi wajib diisi untuk menyimpan dokumen Covenance Day." }, { status: 400 });
    }
    await db.transaction(async (tx) => {
      await tx.insert(brimenCustomers).values(row);
      if (hasCovenanceData) {
        await tx.insert(covenanceRecords).values({
          id: crypto.randomUUID(), branchCode, period: row.realizationDate.slice(0, 7), accountNumber, debtorName: name,
          realizedDate: row.realizationDate, ...covenantFields, updatedBy: guard.session.user.id, updatedAt: now,
        }).onConflictDoUpdate({
          target: [covenanceRecords.branchCode, covenanceRecords.accountNumber, covenanceRecords.realizedDate],
          set: { debtorName: name, ...covenantFields, updatedBy: guard.session.user.id, updatedAt: now },
        });
        await tx.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: guard.session.user.id, action: "ISI_COVENANCE_DARI_BRIMEN", entity: "covenance_record", entityId: `${branchCode}:${accountNumber}:${row.realizationDate}`, detail: `${accountNumber} | ${row.realizationDate}`, branchCode, createdAt: now });
      }
    });
    return NextResponse.json({ ok: true, data: normalizeCustomer(row), covenanceSaved: hasCovenanceData }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Gagal menambah data BRIMEN.", detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
