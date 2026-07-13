import { NextResponse } from "next/server";
import {
  type BrimenCustomerStatus,
  type BrimenCustomerRow,
  normalizeCustomer,
  nowIso,
  openBrimenDb,
  parsePlafond,
} from "@/lib/brimen-db";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  const { id } = await params;
  const db = openBrimenDb(true);
  const row = db.prepare("select * from customers where id = ?").get(id) as BrimenCustomerRow | undefined;
  db.close();
  if (!row || (guard.session.user.role !== "SuperAdmin" && row.branch_code !== guard.session.user.branchCode)) return NextResponse.json({ ok: false, message: "Data nasabah tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true, data: normalizeCustomer(row) });
}

export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  const { id } = await params;
  try {
    const body = await request.json();
    const accountNumber =
      body.accountNumber !== undefined ? String(body.accountNumber).replace(/\D/g, "") : undefined;
    if (accountNumber && !/^\d{15}$/.test(accountNumber)) {
      return NextResponse.json({ ok: false, message: "No rekening wajib 15 angka." }, { status: 400 });
    }

    const db = openBrimenDb(false);
    const existing = db.prepare("select * from customers where id = ?").get(id) as BrimenCustomerRow | undefined;
    if (!existing) {
      db.close();
      return NextResponse.json({ ok: false, message: "Data nasabah tidak ditemukan." }, { status: 404 });
    }
    if (guard.session.user.role !== "SuperAdmin" && existing.branch_code !== guard.session.user.branchCode) {
      db.close();
      return NextResponse.json({ ok: false, message: "Data berada di luar branch Anda." }, { status: 403 });
    }

    const next = {
      id,
      account_number: accountNumber ?? existing.account_number,
      name: body.name !== undefined ? String(body.name).trim() : existing.name,
      plafond: body.plafond !== undefined ? parsePlafond(body.plafond) : existing.plafond,
      realization_date: body.realizationDate ?? existing.realization_date,
      address: body.address ?? existing.address,
      mantri: body.mantri ?? existing.mantri,
      brimen_berkas: body.brimenBerkas ?? existing.brimen_berkas,
      brimen_jaminan: body.brimenJaminan ?? existing.brimen_jaminan,
      guarantee: body.guarantee ?? existing.guarantee,
      status: (body.status ?? existing.status) as BrimenCustomerStatus,
      branch_code: guard.session.user.role === "SuperAdmin" ? body.branchCode ?? existing.branch_code : existing.branch_code,
      updated_at: nowIso(),
    };

    db.prepare(
      `update customers set
        account_number = @account_number,
        name = @name,
        plafond = @plafond,
        realization_date = @realization_date,
        address = @address,
        mantri = @mantri,
        brimen_berkas = @brimen_berkas,
        brimen_jaminan = @brimen_jaminan,
        guarantee = @guarantee,
        status = @status,
        branch_code = @branch_code,
        updated_at = @updated_at
      where id = @id`,
    ).run(next);

    const updated = db.prepare("select * from customers where id = ?").get(id) as BrimenCustomerRow;
    db.close();
    return NextResponse.json({ ok: true, data: normalizeCustomer(updated) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Gagal memperbarui data BRIMEN.", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  if (!["Admin", "SuperAdmin"].includes(guard.session.user.role ?? "")) {
    return NextResponse.json({ ok: false, message: "Hanya Admin atau SuperAdmin yang dapat menghapus data." }, { status: 403 });
  }
  const { id } = await params;
  const db = openBrimenDb(false);
  const existing = db.prepare("select * from customers where id = ?").get(id) as BrimenCustomerRow | undefined;
  if (!existing) {
    db.close();
    return NextResponse.json({ ok: false, message: "Data nasabah tidak ditemukan." }, { status: 404 });
  }
  if (guard.session.user.role !== "SuperAdmin" && existing.branch_code !== guard.session.user.branchCode) {
    db.close();
    return NextResponse.json({ ok: false, message: "Data berada di luar branch Anda." }, { status: 403 });
  }
  db.prepare("delete from customers where id = ?").run(id);
  db.close();
  return NextResponse.json({ ok: true, data: normalizeCustomer(existing) });
}
