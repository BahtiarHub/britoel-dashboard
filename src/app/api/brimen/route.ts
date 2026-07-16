import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db as appDb } from "@/db";
import { auditLogs, covenanceRecords, loanRecords } from "@/db/schema";
import {
  type BrimenCustomerRow,
  getBrimenDbPath,
  newId,
  normalizeCustomer,
  nowIso,
  openBrimenDb,
  parsePlafond,
} from "@/lib/brimen-db";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  try {
    const brimenDb = openBrimenDb(true);

    const branchScoped = guard.session.user.role !== "SuperAdmin";
    const activeBranchCode = guard.session.user.branchCode ?? "8014";
    const rows = brimenDb
      .prepare(
        `select
          id,
          account_number,
          name,
          plafond,
          realization_date,
          address,
          mantri,
          brimen_berkas,
          brimen_jaminan,
          guarantee,
          status,
          branch_code,
          updated_at
        from customers
        ${branchScoped ? "where branch_code = ?" : ""}
        order by updated_at desc`,
      )
      .all(...(branchScoped ? [activeBranchCode] : [])) as BrimenCustomerRow[];

    brimenDb.close();

    const creditRows = branchScoped
      ? await appDb.select().from(loanRecords).where(and(
          eq(loanRecords.branchCode, activeBranchCode),
          eq(loanRecords.sourceKey, "lw321-terbaru"),
        )).orderBy(desc(loanRecords.period))
      : await appDb.select().from(loanRecords).where(eq(loanRecords.sourceKey, "lw321-terbaru")).orderBy(desc(loanRecords.period));
    const latestPeriodByBranch = new Map<string, string>();
    creditRows.forEach((row) => {
      if (!latestPeriodByBranch.has(row.branchCode)) latestPeriodByBranch.set(row.branchCode, row.period);
    });
    const latestCreditRows = creditRows.filter((row) => row.period === latestPeriodByBranch.get(row.branchCode));
    const normalizedBrimenRows = rows.map(normalizeCustomer).map((customer) => ({
      ...customer,
      isLatestLw321: false,
      persistedInBrimen: true,
      dataSource: "BRIMEN" as const,
    }));
    const brimenByAccount = new Map<string, (typeof normalizedBrimenRows)[number]>();
    normalizedBrimenRows.forEach((customer) => {
      const key = `${customer.branchCode}:${customer.accountNumber.replace(/\D/g, "")}`;
      if (!brimenByAccount.has(key)) brimenByAccount.set(key, customer);
    });
    const brimenRows = [...brimenByAccount.values()];
    const matchedBrimenKeys = new Set<string>();
    let synchronizedCount = 0;
    const latestData = latestCreditRows.map((credit) => {
      const accountNumber = credit.accountNumber.replace(/\D/g, "");
      const key = `${credit.branchCode}:${accountNumber}`;
      const customer = brimenByAccount.get(key);
      if (customer) {
        matchedBrimenKeys.add(key);
        synchronizedCount += 1;
        return {
          ...customer,
          name: credit.debtorName || customer.name,
          plafond: credit.plafond || customer.plafond,
          realizationDate: credit.realizedDate || customer.realizationDate,
          mantri: credit.mantri || customer.mantri,
          isLatestLw321: true,
          persistedInBrimen: true,
          dataSource: "Gabungan" as const,
        };
      }
      return {
        id: `lw321:${credit.branchCode}:${accountNumber}`,
        accountNumber,
        name: credit.debtorName,
        plafond: credit.plafond,
        realizationDate: credit.realizedDate,
        address: "",
        mantri: credit.mantri,
        brimenBerkas: "",
        brimenJaminan: "",
        guarantee: "",
        status: "Disimpan" as const,
        branchCode: credit.branchCode,
        updatedAt: credit.createdAt.toISOString(),
        isLatestLw321: true,
        persistedInBrimen: false,
        dataSource: "LW321" as const,
      };
    });
    const brimenOnlyRows = brimenRows.filter((customer) => !matchedBrimenKeys.has(
      `${customer.branchCode}:${customer.accountNumber.replace(/\D/g, "")}`,
    ));
    const data = [...latestData, ...brimenOnlyRows];
    const withGuarantee = data.filter((row) => row.brimenJaminan || row.guarantee).length;
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
      summary: {
        total: data.length,
        brimenTotal: brimenRows.length,
        withGuarantee,
        withoutGuarantee: data.length - withGuarantee,
        withoutArchive,
        borrowed,
        synchronizedWithLw321: synchronizedCount,
        latestLw321: latestData.length,
        brimenOnly: brimenOnlyRows.length,
        byStatus: [...statusCounts].map(([status, count]) => ({ status, count })),
      },
      source: getBrimenDbPath(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Gagal membaca database BRIMEN.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  try {
    const body = await request.json();
    const accountNumber = String(body.accountNumber ?? "").replace(/\D/g, "");
    const name = String(body.name ?? "").trim();

    if (!/^\d{15}$/.test(accountNumber)) {
      return NextResponse.json({ ok: false, message: "No rekening wajib 15 angka." }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ ok: false, message: "Nama nasabah wajib diisi." }, { status: 400 });
    }

    const now = nowIso();
    const branchCode = String(
      (guard.session.user.role === "SuperAdmin" ? body.branchCode ?? guard.session.user.branchCode : guard.session.user.branchCode) ?? "8014",
    ).trim() || "8014";
    const row = {
      id: newId("cus"),
      account_number: accountNumber,
      name,
      plafond: parsePlafond(body.plafond),
      realization_date: body.realizationDate ?? "",
      address: body.address ?? "",
      mantri: body.mantri ?? "",
      brimen_berkas: body.brimenBerkas ?? "",
      brimen_jaminan: body.brimenJaminan ?? "",
      guarantee: body.guarantee ?? "",
      status: body.status ?? "Disimpan",
      branch_code: branchCode,
      created_at: now,
      updated_at: now,
    };

    const covenantFields = {
      sphNumber: String(body.sphNumber ?? "").trim(),
      creditApplicationNumber: String(body.creditApplicationNumber ?? "").trim(),
      ktpNumber: String(body.ktpNumber ?? "").replace(/\s/g, ""),
      kkNumber: String(body.kkNumber ?? "").replace(/\s/g, ""),
      skuNibNumber: String(body.skuNibNumber ?? "").trim(),
      slikOjk: String(body.slikOjk ?? "").replace(/\s/g, ""),
    };
    const hasCovenanceData = Object.values(covenantFields).some(Boolean);
    const realizedDate = String(row.realization_date ?? "");
    if (hasCovenanceData && !/^\d{4}-\d{2}-\d{2}$/.test(realizedDate)) {
      return NextResponse.json({ ok: false, message: "Tanggal realisasi wajib diisi untuk menyimpan dokumen Covenance Day." }, { status: 400 });
    }

    const brimenDb = openBrimenDb(false);
    try {
      brimenDb.prepare(
        `insert into customers (
          id, account_number, name, plafond, realization_date, address, mantri,
          brimen_berkas, brimen_jaminan, guarantee, status, branch_code, created_at, updated_at
        ) values (
          @id, @account_number, @name, @plafond, @realization_date, @address, @mantri,
          @brimen_berkas, @brimen_jaminan, @guarantee, @status, @branch_code, @created_at, @updated_at
        )`,
      ).run(row);

      if (hasCovenanceData) {
        const covenanceId = crypto.randomUUID();
        const updatedAt = new Date();
        appDb.transaction((tx) => {
          tx.insert(covenanceRecords).values({
            id: covenanceId,
            branchCode,
            period: realizedDate.slice(0, 7),
            accountNumber,
            debtorName: name,
            realizedDate,
            ...covenantFields,
            updatedBy: guard.session.user.id,
            updatedAt,
          }).onConflictDoUpdate({
            target: [covenanceRecords.branchCode, covenanceRecords.accountNumber, covenanceRecords.realizedDate],
            set: {
              debtorName: name,
              ...covenantFields,
              updatedBy: guard.session.user.id,
              updatedAt,
            },
          }).run();
          tx.insert(auditLogs).values({
            id: crypto.randomUUID(),
            actorId: guard.session.user.id,
            action: "ISI_COVENANCE_DARI_BRIMEN",
            entity: "covenance_record",
            entityId: `${branchCode}:${accountNumber}:${realizedDate}`,
            detail: `${accountNumber} | ${realizedDate}`,
            branchCode,
            createdAt: updatedAt,
          }).run();
        });
      }
    } catch (error) {
      brimenDb.prepare("delete from customers where id = ?").run(row.id);
      throw error;
    } finally {
      brimenDb.close();
    }

    return NextResponse.json({ ok: true, data: normalizeCustomer(row), covenanceSaved: hasCovenanceData }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Gagal menambah data BRIMEN.", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
