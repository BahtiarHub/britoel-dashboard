import { NextResponse } from "next/server";
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
    const db = openBrimenDb(true);

    const branchScoped = guard.session.user.role !== "SuperAdmin";
    const rows = db
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

    const statusRows = db
      .prepare(`select status, count(*) as count from customers ${branchScoped ? "where branch_code = ?" : ""} group by status`)
      .all(...(branchScoped ? [guard.session.user.branchCode] : [])) as { status: string; count: number }[];

    db.close();

    const data = rows.map(normalizeCustomer);
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
      branch_code: guard.session.user.role === "SuperAdmin" ? body.branchCode ?? guard.session.user.branchCode : guard.session.user.branchCode,
      created_at: now,
      updated_at: now,
    };

    const db = openBrimenDb(false);
    db.prepare(
      `insert into customers (
        id, account_number, name, plafond, realization_date, address, mantri,
        brimen_berkas, brimen_jaminan, guarantee, status, branch_code, created_at, updated_at
      ) values (
        @id, @account_number, @name, @plafond, @realization_date, @address, @mantri,
        @brimen_berkas, @brimen_jaminan, @guarantee, @status, @branch_code, @created_at, @updated_at
      )`,
    ).run(row);
    db.close();

    return NextResponse.json({ ok: true, data: normalizeCustomer(row) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Gagal menambah data BRIMEN.", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
