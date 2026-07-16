import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
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
      .all(...(branchScoped ? [guard.session.user.branchCode] : [])) as BrimenCustomerRow[];

    const statusRows = brimenDb
      .prepare(`select status, count(*) as count from customers ${branchScoped ? "where branch_code = ?" : ""} group by status`)
      .all(...(branchScoped ? [guard.session.user.branchCode] : [])) as { status: string; count: number }[];

    brimenDb.close();

    const creditRows = branchScoped
      ? await appDb.select().from(loanRecords).where(eq(loanRecords.branchCode, guard.session.user.branchCode ?? "8014")).orderBy(desc(loanRecords.period))
      : await appDb.select().from(loanRecords).orderBy(desc(loanRecords.period));
    const latestCreditByAccount = new Map<string, (typeof creditRows)[number]>();
    creditRows.forEach((row) => {
      const key = `${row.branchCode}:${row.accountNumber.replace(/\D/g, "")}`;
      if (!latestCreditByAccount.has(key)) latestCreditByAccount.set(key, row);
    });
    let synchronizedCount = 0;
    const data = rows.map(normalizeCustomer).map((customer) => {
      const credit = latestCreditByAccount.get(`${customer.branchCode}:${customer.accountNumber.replace(/\D/g, "")}`);
      if (!credit) return customer;
      synchronizedCount += 1;
      return {
        ...customer,
        realizationDate: credit.realizedDate || customer.realizationDate,
        mantri: credit.mantri || customer.mantri,
      };
    });
    const withGuarantee = data.filter((row) => row.brimenJaminan || row.guarantee).length;
    const withoutArchive = data.filter((row) => !row.brimenBerkas).length;
    const borrowed = data.filter((row) => row.status === "Dipinjam").length;

    return NextResponse.json({
      ok: true,
      data,
      summary: {
        total: data.length,
        withGuarantee,
        withoutGuarantee: data.length - withGuarantee,
        withoutArchive,
        borrowed,
        synchronizedWithLw321: synchronizedCount,
        byStatus: statusRows,
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
