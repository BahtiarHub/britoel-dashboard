import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, brimenCustomers, covenanceRecords } from "@/db/schema";
import { type BrimenCustomerStatus, normalizeCustomer, parsePlafond } from "@/lib/brimen-db";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  const { id } = await params;
  const row = (await db.select().from(brimenCustomers).where(eq(brimenCustomers.id, id)).limit(1))[0];
  if (!row || (guard.session.user.role !== "SuperAdmin" && row.branchCode !== guard.session.user.branchCode)) return NextResponse.json({ ok: false, message: "Data nasabah tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true, data: normalizeCustomer(row) });
}

export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  const { id } = await params;
  try {
    const body = await request.json();
    const accountNumber = body.accountNumber !== undefined ? String(body.accountNumber).replace(/\D/g, "") : undefined;
    if (accountNumber && !/^\d{15}$/.test(accountNumber)) return NextResponse.json({ ok: false, message: "No rekening wajib 15 angka." }, { status: 400 });
    const existing = (await db.select().from(brimenCustomers).where(eq(brimenCustomers.id, id)).limit(1))[0];
    if (!existing) return NextResponse.json({ ok: false, message: "Data nasabah tidak ditemukan." }, { status: 404 });
    if (existing.branchCode !== guard.session.user.branchCode) return NextResponse.json({ ok: false, message: "Data berada di luar branch Anda." }, { status: 403 });
    const next = {
      accountNumber: accountNumber ?? existing.accountNumber,
      name: body.name !== undefined ? String(body.name).trim() : existing.name,
      plafond: body.plafond !== undefined ? parsePlafond(body.plafond) : existing.plafond,
      realizationDate: body.realizationDate ?? existing.realizationDate,
      address: body.address ?? existing.address,
      mantri: body.mantri ?? existing.mantri,
      brimenBerkas: body.brimenBerkas ?? existing.brimenBerkas,
      brimenJaminan: body.brimenJaminan ?? existing.brimenJaminan,
      guarantee: body.guarantee ?? existing.guarantee,
      status: (body.status ?? existing.status) as BrimenCustomerStatus,
      updatedAt: new Date(),
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
    if (hasCovenanceData && !/^\d{4}-\d{2}-\d{2}$/.test(next.realizationDate)) {
      return NextResponse.json({ ok: false, message: "Tanggal realisasi wajib diisi untuk menyimpan dokumen Covenance Day." }, { status: 400 });
    }

    const updated = await db.transaction(async (tx) => {
      const updatedCustomer = (await tx.update(brimenCustomers).set(next).where(eq(brimenCustomers.id, id)).returning())[0];
      if (hasCovenanceData) {
        const branchCode = existing.branchCode;
        await tx.insert(covenanceRecords).values({
          id: crypto.randomUUID(),
          branchCode,
          period: next.realizationDate.slice(0, 7),
          accountNumber: next.accountNumber,
          debtorName: next.name,
          realizedDate: next.realizationDate,
          ...covenantFields,
          updatedBy: guard.session.user.id,
          updatedAt: next.updatedAt,
        }).onConflictDoUpdate({
          target: [covenanceRecords.branchCode, covenanceRecords.accountNumber, covenanceRecords.realizedDate],
          set: {
            period: next.realizationDate.slice(0, 7),
            debtorName: next.name,
            ...covenantFields,
            updatedBy: guard.session.user.id,
            updatedAt: next.updatedAt,
          },
        });
        await tx.insert(auditLogs).values({
          id: crypto.randomUUID(),
          actorId: guard.session.user.id,
          action: "ISI_COVENANCE_DARI_SUPLESI",
          entity: "covenance_record",
          entityId: `${branchCode}:${next.accountNumber}:${next.realizationDate}`,
          detail: `${next.accountNumber} | ${next.realizationDate}`,
          branchCode,
          createdAt: next.updatedAt,
        });
      }
      return updatedCustomer;
    });
    return NextResponse.json({ ok: true, data: normalizeCustomer(updated), covenanceSaved: hasCovenanceData });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const duplicateAccount = detail.includes("brimen_customers_branch_account_unique");
    return NextResponse.json(
      { ok: false, message: duplicateAccount ? "No rekening sudah digunakan oleh data BRIMEN lain pada uker ini." : "Gagal memperbarui data BRIMEN.", detail },
      { status: duplicateAccount ? 409 : 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const guard = await requireApiSession(request);
  if (guard.response) return guard.response;
  if (guard.session.user.role !== "Admin") return NextResponse.json({ ok: false, message: "Hanya Admin uker yang dapat menghapus data." }, { status: 403 });
  const { id } = await params;
  const existing = (await db.select().from(brimenCustomers).where(eq(brimenCustomers.id, id)).limit(1))[0];
  if (!existing) return NextResponse.json({ ok: false, message: "Data nasabah tidak ditemukan." }, { status: 404 });
  if (existing.branchCode !== guard.session.user.branchCode) return NextResponse.json({ ok: false, message: "Data berada di luar branch Anda." }, { status: 403 });
  await db.delete(brimenCustomers).where(eq(brimenCustomers.id, id));
  return NextResponse.json({ ok: true, data: normalizeCustomer(existing) });
}
